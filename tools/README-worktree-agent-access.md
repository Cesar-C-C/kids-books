# Worktree agent access helper

`Grant-WorktreeAgentAccess.ps1` fixes the two narrow Windows ACL surfaces a delegated agent needs for one Git worktree:

1. the exact worktree directory under this repository's `.worktrees` directory; and
2. the matching worktree metadata directory reported by Git under `.git/worktrees`.

The helper rejects the main repository, the `.worktrees` parent, nested paths, paths owned by another repository, and unregistered directories. It does not place an inheritable ACL on `.worktrees` itself, so future worktrees do not receive access automatically.

Inspect a worktree without changing ACLs:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\Grant-WorktreeAgentAccess.ps1 `
  -WorktreePath 'C:\absolute\repo\.worktrees\feature-name' `
  -InspectOnly
```

Grant the Windows identity running the command `Modify` on only the validated worktree tree and its Git metadata tree:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\Grant-WorktreeAgentAccess.ps1 `
  -WorktreePath 'C:\absolute\repo\.worktrees\feature-name'
```

Use `-WhatIf` to preview the grant. A real run performs create/write/delete probes in both directories and removes the probes immediately. Exit code `2` means validation failed; exit code `3` means ACL application or effective-access verification failed.

Changing ACLs may require a Codex sandbox escalation or an elevated PowerShell window. The identity is intentionally not configurable: run the command as the exact account that needs delegated access. If Codex starts agents under different per-session identities, rerun the helper for that identity; the script deliberately does not grant the broad `CodexSandboxUsers` group or modify parent inheritance.

Run the non-mutating contract tests from the worktree root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\tests\Grant-WorktreeAgentAccess.Tests.ps1
```
