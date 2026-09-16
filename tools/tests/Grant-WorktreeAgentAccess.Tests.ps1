[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$sourceScriptPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\Grant-WorktreeAgentAccess.ps1'))
$tempParent = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\')
$fixtureRoot = Join-Path $tempParent ('worktree-acl-tests-' + [guid]::NewGuid().ToString('N'))
$fixtureRepo = Join-Path $fixtureRoot 'repo'
$fixtureScriptPath = Join-Path $fixtureRepo 'tools\Grant-WorktreeAgentAccess.ps1'

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git -C $WorkingDirectory @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($exitCode -ne 0) {
        throw "git -C '$WorkingDirectory' $($Arguments -join ' ') failed: $($output -join [Environment]::NewLine)"
    }
    return ($output -join [Environment]::NewLine).Trim()
}

function Invoke-Helper {
    param([string[]]$Arguments)

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $allOutput = & powershell.exe @(
            '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
            '-File', $fixtureScriptPath
        ) @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }

    [pscustomobject]@{
        ExitCode = $exitCode
        Output = ($allOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    }
}

function Assert-Equal {
    param($Actual, $Expected, [string]$Because)
    if ($Actual -ne $Expected) {
        throw "$Because`nExpected: $Expected`nActual: $Actual"
    }
}

function Assert-Matches {
    param([string]$Actual, [string]$Pattern, [string]$Because)
    if ($Actual -notmatch $Pattern) {
        throw "$Because`nPattern: $Pattern`nActual: $Actual"
    }
}

try {
    [void][IO.Directory]::CreateDirectory((Split-Path $fixtureScriptPath -Parent))
    Copy-Item -LiteralPath $sourceScriptPath -Destination $fixtureScriptPath

    Invoke-Git $fixtureRepo @('init', '--initial-branch=main') | Out-Null
    Invoke-Git $fixtureRepo @('config', 'user.name', 'Worktree ACL Tests') | Out-Null
    Invoke-Git $fixtureRepo @('config', 'user.email', 'worktree-acl-tests@example.invalid') | Out-Null
    [IO.File]::WriteAllText((Join-Path $fixtureRepo 'seed.txt'), 'fixture')
    Invoke-Git $fixtureRepo @('add', 'seed.txt') | Out-Null
    Invoke-Git $fixtureRepo @('commit', '-m', 'fixture') | Out-Null

    $worktreesRoot = Join-Path $fixtureRepo '.worktrees'
    [void][IO.Directory]::CreateDirectory($worktreesRoot)
    $validWorktree = Join-Path $worktreesRoot 'valid'
    Invoke-Git $fixtureRepo @('worktree', 'add', '-b', 'fixture-worktree', $validWorktree) | Out-Null

    # Break caught: accepting a repo root or .worktrees parent could grant broad access.
    $parentResult = Invoke-Helper @('-WorktreePath', $worktreesRoot, '-InspectOnly', '-Json')
    Assert-Equal $parentResult.ExitCode 2 'The .worktrees parent must be rejected.'
    Assert-Matches $parentResult.Output 'direct child' 'The rejection should explain the boundary.'

    $repoResult = Invoke-Helper @('-WorktreePath', $fixtureRepo, '-InspectOnly', '-Json')
    Assert-Equal $repoResult.ExitCode 2 'The main repository must be rejected.'
    Assert-Matches $repoResult.Output 'direct child' 'The main-repository rejection should explain the boundary.'

    # Break caught: accepting nested descendants would allow callers to target arbitrary paths.
    $nestedPath = Join-Path $validWorktree 'books'
    [void][IO.Directory]::CreateDirectory($nestedPath)
    $nestedResult = Invoke-Helper @('-WorktreePath', $nestedPath, '-InspectOnly', '-Json')
    Assert-Equal $nestedResult.ExitCode 2 'A nested path must be rejected.'
    Assert-Matches $nestedResult.Output 'direct child' 'The nested-path rejection should explain the boundary.'

    # Break caught: deriving metadata from only the leaf name could target the wrong Git record.
    $validResult = Invoke-Helper @('-WorktreePath', $validWorktree, '-InspectOnly', '-Json')
    Assert-Equal $validResult.ExitCode 0 'The registered fixture worktree should validate without applying ACLs.'
    $details = $validResult.Output | ConvertFrom-Json
    $expectedMetadata = (Invoke-Git $validWorktree @('rev-parse', '--path-format=absolute', '--git-dir')) -replace '/', '\'
    Assert-Equal ([IO.Path]::GetFullPath($details.WorktreePath)) ([IO.Path]::GetFullPath($validWorktree)) 'The helper must resolve the exact worktree.'
    Assert-Equal ([IO.Path]::GetFullPath($details.MetadataPath)) ([IO.Path]::GetFullPath($expectedMetadata)) 'The helper must use Git-reported metadata.'
    Assert-Equal $details.Applied $false 'InspectOnly must not change ACLs.'

    # Break caught: metadata whose gitdir backlink targets another directory must be rejected.
    $metadataBacklinkPath = Join-Path $expectedMetadata 'gitdir'
    $originalBacklink = [IO.File]::ReadAllText($metadataBacklinkPath)
    try {
        [IO.File]::WriteAllText($metadataBacklinkPath, (Join-Path $worktreesRoot 'wrong-target\.git'))
        $wrongBacklinkResult = Invoke-Helper @('-WorktreePath', $validWorktree, '-InspectOnly', '-Json')
        Assert-Equal $wrongBacklinkResult.ExitCode 2 'A mismatched metadata gitdir backlink must be rejected.'
        Assert-Matches $wrongBacklinkResult.Output 'backlink' 'The backlink rejection should identify the mismatch.'
    }
    finally {
        [IO.File]::WriteAllText($metadataBacklinkPath, $originalBacklink)
    }

    # Break caught: a copied .git pointer must not turn an unregistered sibling into an ACL target.
    $aliasWorktree = Join-Path $worktreesRoot 'copied-git-alias'
    [void][IO.Directory]::CreateDirectory($aliasWorktree)
    Copy-Item -LiteralPath (Join-Path $validWorktree '.git') -Destination (Join-Path $aliasWorktree '.git')
    $aliasResult = Invoke-Helper @('-WorktreePath', $aliasWorktree, '-InspectOnly', '-Json')
    Assert-Equal $aliasResult.ExitCode 2 'A sibling with a copied .git pointer must be rejected.'
    Assert-Matches $aliasResult.Output 'backlink|registered' 'The alias rejection should identify the broken two-way registration.'

    Write-Output 'Grant-WorktreeAgentAccess tests passed.'
}
finally {
    $resolvedFixtureRoot = [IO.Path]::GetFullPath($fixtureRoot).TrimEnd('\')
    $resolvedFixtureParent = [IO.Path]::GetFullPath((Split-Path $resolvedFixtureRoot -Parent)).TrimEnd('\')
    if ([string]::Equals($resolvedFixtureParent, $tempParent, [StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path $resolvedFixtureRoot -Leaf) -like 'worktree-acl-tests-*' -and
        (Test-Path -LiteralPath $resolvedFixtureRoot)) {
        Remove-Item -LiteralPath $resolvedFixtureRoot -Recurse -Force
    }
}
