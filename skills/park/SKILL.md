---
name: park
description: Save a short "where we left off" handoff note for the current project so a later session can pick up exactly here. Use when the user types /park, says "park this", "save where we are", "I'm switching to X", "stopping for now", or is about to leave a project with unfinished work. Optionally "park and switch to <name>".
---

# Park a project

Write a handoff note for the project this session is working on, so the next session (or a later visit) is up to speed
on that project alone. Notes live OUTSIDE the repos, in `~/.claude/handoffs/<name>.md` (expand `~` to `$HOME` for the Read
and Write tools), where `<name>` is the project's `name` in `~/.claude/projects.json` (match the working directory to a
`path`). If the folder is not in the list, use the folder's name. Create the `handoffs` folder if it is missing.

Arguments: `/park` (just save), `/park switch <name>` or "park and switch to <name>" (save, then run the `work` skill).

## 1. Gather (read only)

- What the session did and decided: use the conversation.
- `git -C <path> status -sb` and `git -C <path> log --oneline -5`, and `gh pr list --limit 5` if `gh` works.
- The existing note, if any, so you update it instead of starting over.

## 2. Write the note (replace the file, keep it under ~40 lines)

```markdown
# <name> — handoff
Updated: <YYYY-MM-DD> · Branch: <branch> · Uncommitted files: <n>

## Goal
One or two lines: what this project is and what we are trying to get done right now.

## Done
- Short bullets of what is finished and verified. Name PRs by number and link.

## Decisions
- Choices already made and why, so they are not argued again.

## Blocked / waiting on you
- Things only the user can do (accounts, approvals, secrets). Never write passwords, tokens or connection strings.

## Next step
The single next action, concrete enough to start without asking.
```

Rules for the note:
- Facts only. Mark anything not verified as "not verified".
- Never store secrets, keys, passwords, or connection strings. Say "set in the host's settings" instead of the value.
- Drop Done items that no longer matter; keep the note short, not a log.
- Do not write into the project's own repo. Do not commit anything.

## 3. Say it back

Show the Next step and the Blocked list in two or three lines, plus the note's path. If the user asked to switch, now
run the `work` skill for that project.
