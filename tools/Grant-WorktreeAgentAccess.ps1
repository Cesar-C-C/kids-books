[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory = $true)]
    [string]$WorktreePath,

    [switch]$InspectOnly,

    [switch]$Json
)

$ErrorActionPreference = 'Stop'

function Get-NormalizedPath {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)

    $resolved = Resolve-Path -LiteralPath $LiteralPath -ErrorAction Stop
    return [IO.Path]::GetFullPath($resolved.ProviderPath).TrimEnd('\')
}

function Test-SamePath {
    param(
        [Parameter(Mandatory = $true)][string]$Left,
        [Parameter(Mandatory = $true)][string]$Right
    )

    return [string]::Equals(
        [IO.Path]::GetFullPath($Left).TrimEnd('\'),
        [IO.Path]::GetFullPath($Right).TrimEnd('\'),
        [StringComparison]::OrdinalIgnoreCase
    )
}

function Invoke-GitText {
    param(
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $output = & git -C $WorkingDirectory @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git -C '$WorkingDirectory' $($Arguments -join ' ') failed: $($output -join [Environment]::NewLine)"
    }
    return ($output -join [Environment]::NewLine).Trim()
}

function Resolve-AccessTargets {
    param([Parameter(Mandatory = $true)][string]$CandidatePath)

    $toolRepoRoot = Get-NormalizedPath (Join-Path $PSScriptRoot '..')
    $commonGitDir = Get-NormalizedPath (Invoke-GitText $toolRepoRoot @('rev-parse', '--path-format=absolute', '--git-common-dir'))
    $mainRepoRoot = Get-NormalizedPath (Split-Path $commonGitDir -Parent)
    $worktreesRoot = Join-Path $mainRepoRoot '.worktrees'
    if (-not (Test-Path -LiteralPath $worktreesRoot -PathType Container)) {
        throw "Expected repository worktree directory does not exist: $worktreesRoot"
    }
    $worktreesRoot = Get-NormalizedPath $worktreesRoot

    $candidate = Get-NormalizedPath $CandidatePath
    $candidateParent = Get-NormalizedPath (Split-Path $candidate -Parent)
    if (-not (Test-SamePath $candidateParent $worktreesRoot)) {
        throw "WorktreePath must be a direct child of '$worktreesRoot'. Resolved path: '$candidate'."
    }

    $reportedTopLevel = Get-NormalizedPath (Invoke-GitText $candidate @('rev-parse', '--show-toplevel'))
    if (-not (Test-SamePath $reportedTopLevel $candidate)) {
        throw "WorktreePath is not the root of a registered Git worktree: '$candidate'."
    }

    $reportedCommonGitDir = Get-NormalizedPath (Invoke-GitText $candidate @('rev-parse', '--path-format=absolute', '--git-common-dir'))
    if (-not (Test-SamePath $reportedCommonGitDir $commonGitDir)) {
        throw "WorktreePath belongs to a different Git repository: '$candidate'."
    }

    $metadataPath = Get-NormalizedPath (Invoke-GitText $candidate @('rev-parse', '--path-format=absolute', '--git-dir'))
    $metadataParent = Get-NormalizedPath (Split-Path $metadataPath -Parent)
    $expectedMetadataParent = Get-NormalizedPath (Join-Path $commonGitDir 'worktrees')
    if (-not (Test-SamePath $metadataParent $expectedMetadataParent)) {
        throw "Git metadata must be an exact child of '$expectedMetadataParent'. Resolved path: '$metadataPath'."
    }

    $backlinkFile = Join-Path $metadataPath 'gitdir'
    if (-not (Test-Path -LiteralPath $backlinkFile -PathType Leaf)) {
        throw "Git metadata backlink is missing: '$backlinkFile'."
    }
    $backlinkValue = [IO.File]::ReadAllText($backlinkFile).Trim()
    if (-not [IO.Path]::IsPathRooted($backlinkValue)) {
        $backlinkValue = Join-Path $metadataPath $backlinkValue
    }
    try {
        $resolvedBacklink = Get-NormalizedPath $backlinkValue
    }
    catch {
        throw "Git metadata backlink cannot be resolved: '$backlinkValue'."
    }
    $candidateGitFile = Get-NormalizedPath (Join-Path $candidate '.git')
    if (-not (Test-SamePath $resolvedBacklink $candidateGitFile)) {
        throw "Git metadata backlink does not resolve to the candidate .git file. Expected '$candidateGitFile'; found '$resolvedBacklink'."
    }

    $registeredWorktrees = @(
        (Invoke-GitText $mainRepoRoot @('-c', 'core.quotePath=false', 'worktree', 'list', '--porcelain')) -split '\r?\n' |
            Where-Object { $_.StartsWith('worktree ', [StringComparison]::Ordinal) } |
            ForEach-Object { $_.Substring('worktree '.Length) }
    )
    $isRegistered = $false
    foreach ($registeredWorktree in $registeredWorktrees) {
        if (Test-SamePath $registeredWorktree $candidate) {
            $isRegistered = $true
            break
        }
    }
    if (-not $isRegistered) {
        throw "WorktreePath is not present in this repository's registered worktree list: '$candidate'."
    }

    [pscustomobject]@{
        RepoRoot = $mainRepoRoot
        WorktreesRoot = $worktreesRoot
        WorktreePath = $candidate
        MetadataPath = $metadataPath
    }
}

function Grant-ModifyToTree {
    param(
        [Parameter(Mandatory = $true)][string]$LiteralPath,
        [Parameter(Mandatory = $true)][string]$Principal
    )

    $grant = "${Principal}:(OI)(CI)(M)"
    $output = & icacls.exe $LiteralPath '/grant' $grant '/T' '/C' '/Q' 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "icacls failed for '$LiteralPath' (exit $LASTEXITCODE): $($output -join [Environment]::NewLine)"
    }
}

function Test-EffectiveModify {
    param([Parameter(Mandatory = $true)][string]$LiteralPath)

    $probeDirectory = Join-Path $LiteralPath ('.codex-access-probe-' + [guid]::NewGuid().ToString('N'))
    $probeFile = Join-Path $probeDirectory 'write-delete.tmp'
    try {
        [void][IO.Directory]::CreateDirectory($probeDirectory)
        [IO.File]::WriteAllText($probeFile, 'access probe')
        [IO.File]::Delete($probeFile)
        [IO.Directory]::Delete($probeDirectory)
    }
    catch {
        throw "Effective Modify access probe failed for '$LiteralPath': $($_.Exception.Message)"
    }
    finally {
        if (Test-Path -LiteralPath $probeFile) {
            Remove-Item -LiteralPath $probeFile -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $probeDirectory) {
            Remove-Item -LiteralPath $probeDirectory -Force -Recurse -ErrorAction SilentlyContinue
        }
    }
}

try {
    $targets = Resolve-AccessTargets $WorktreePath
    $principal = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $applied = $false
    $verified = $false

    if (-not $InspectOnly -and $PSCmdlet.ShouldProcess(
        "$($targets.WorktreePath) and $($targets.MetadataPath)",
        "Grant Modify recursively to $principal"
    )) {
        Grant-ModifyToTree $targets.WorktreePath $principal
        Grant-ModifyToTree $targets.MetadataPath $principal
        Test-EffectiveModify $targets.WorktreePath
        Test-EffectiveModify $targets.MetadataPath
        $applied = $true
        $verified = $true
    }

    $result = [pscustomobject]@{
        RepoRoot = $targets.RepoRoot
        WorktreesRoot = $targets.WorktreesRoot
        WorktreePath = $targets.WorktreePath
        MetadataPath = $targets.MetadataPath
        Principal = $principal
        Applied = $applied
        Verified = $verified
    }

    if ($Json) {
        $result | ConvertTo-Json -Depth 3
    }
    else {
        $result | Format-List
    }
}
catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    if ($_.Exception.Message -match 'icacls failed|access probe') {
        exit 3
    }
    exit 2
}
