# Worktree agent access helper

`Grant-WorktreeAgentAccess.ps1` grants the current Windows identity narrowly scoped NTFS `Modify` access to two paths associated with one Git worktree:

1. the exact worktree directory under this repository's `.worktrees` directory; and
2. the matching worktree metadata directory reported by Git under `.git/worktrees`.

The helper rejects the main repository, the `.worktrees` parent, nested paths, paths owned by another repository, and unregistered directories. Before changing ACLs it also verifies that Git's metadata `gitdir` backlink resolves to the candidate's exact `.git` file and that `git worktree list --porcelain` contains the candidate. A sibling directory with a copied `.git` pointer is therefore rejected. The helper does not place an inheritable ACL on `.worktrees` itself, so future worktrees do not receive access automatically.

This helper changes Windows NTFS ACLs only. It does **not** override or expand Codex filesystem-sandbox policy. In a managed Codex session, the worktree files can become writable while the main repository's `.git/worktrees/<name>` metadata remains sandbox read-only. Delegated agents may therefore still need an approved sandbox escalation for Git operations that update that metadata, including staging and committing. Treat a successful access probe as proof of OS-level access to the two exact paths, not as proof that every Codex operation is permitted.

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

Changing ACLs may itself require an approved Codex sandbox escalation or an elevated PowerShell window. The identity is intentionally not configurable: run the command as the exact account that needs delegated access. If Codex starts agents under different per-session identities, rerun the helper for that identity; the script deliberately does not grant the broad `CodexSandboxUsers` group or modify parent inheritance. If a later Git stage or commit is blocked by the Codex sandbox, request the narrowly scoped escalation for that Git operation; do not broaden this helper's ACL targets as a workaround.

Run the non-mutating contract tests from the worktree root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\tests\Grant-WorktreeAgentAccess.Tests.ps1
```
