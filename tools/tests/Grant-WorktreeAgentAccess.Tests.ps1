[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repoRoot = (git -C (Join-Path $PSScriptRoot '..\..') rev-parse --show-toplevel).Trim()
$scriptPath = Join-Path $repoRoot 'tools\Grant-WorktreeAgentAccess.ps1'
$currentWorktree = $repoRoot
$worktreesRoot = Split-Path $currentWorktree -Parent
$mainRepoRoot = Split-Path $worktreesRoot -Parent

function Invoke-Helper {
    param([string[]]$Arguments)

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $allOutput = & powershell.exe @(
            '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
            '-File', $scriptPath
        ) @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }

    [pscustomobject]@{
        ExitCode = $exitCode
        StdOut = ($allOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
        StdErr = ($allOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
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

# Break caught: accepting a repo root or .worktrees parent could grant broad access.
$parentResult = Invoke-Helper @('-WorktreePath', $worktreesRoot, '-InspectOnly', '-Json')
Assert-Equal $parentResult.ExitCode 2 'The .worktrees parent must be rejected.'
Assert-Matches $parentResult.StdErr 'direct child' 'The rejection should explain the boundary.'

$repoResult = Invoke-Helper @('-WorktreePath', $mainRepoRoot, '-InspectOnly', '-Json')
Assert-Equal $repoResult.ExitCode 2 'The main repository must be rejected.'
Assert-Matches $repoResult.StdErr 'direct child' 'The main-repository rejection should explain the boundary.'

# Break caught: accepting nested descendants would allow callers to target arbitrary paths.
$nestedResult = Invoke-Helper @('-WorktreePath', (Join-Path $currentWorktree 'books'), '-InspectOnly', '-Json')
Assert-Equal $nestedResult.ExitCode 2 'A nested path must be rejected.'
Assert-Matches $nestedResult.StdErr 'direct child' 'The nested-path rejection should explain the boundary.'

# Break caught: deriving metadata from only the leaf name could target the wrong Git record.
$validResult = Invoke-Helper @('-WorktreePath', $currentWorktree, '-InspectOnly', '-Json')
Assert-Equal $validResult.ExitCode 0 'The registered current worktree should validate without applying ACLs.'
$details = $validResult.StdOut | ConvertFrom-Json
$expectedMetadata = (git -C $currentWorktree rev-parse --path-format=absolute --git-dir).Trim() -replace '/', '\'
Assert-Equal ([IO.Path]::GetFullPath($details.WorktreePath)) ([IO.Path]::GetFullPath($currentWorktree)) 'The helper must resolve the exact worktree.'
Assert-Equal ([IO.Path]::GetFullPath($details.MetadataPath)) ([IO.Path]::GetFullPath($expectedMetadata)) 'The helper must use Git-reported metadata.'
Assert-Equal $details.Applied $false 'InspectOnly must not change ACLs.'

Write-Output 'Grant-WorktreeAgentAccess tests passed.'
