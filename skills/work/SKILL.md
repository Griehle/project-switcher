---
name: work
description: Switch this session to one of the user's projects by name and show where it stands, or list their projects. Use when the user types /work, says "switch to X", "let's work on X", "open X", "go to X", names a project from their project list (~/.claude/projects.json), or asks which projects they have.
---

# Switch projects

The user works on many projects and wants to move between them in one step, without fighting the session's working
directory. Their projects live in `~/.claude/projects.json` (`name`, `path`, `aliases`, `note`, `group`). Expand `~` to the
home folder (`$HOME`) before using the Read tool; it needs absolute paths.

Arguments: `/work` (list), `/work <name>` (switch here), `/work <name> new` (open a separate session instead).

## 1. Read the list

Read `~/.claude/projects.json`. If it does not exist, say so and offer to create it: an empty
`{ "projects": [] }`, plus `/new-project <name>` for the first project. If it cannot be read, say so and stop.

## 2. No name given (or "list"): show the projects

Run ONE Bash call that prints, for every project, its name, branch, whether the working tree is dirty, and the age of the
last commit (`git -C <path> branch --show-current`, `git -C <path> status --porcelain | wc -l`,
`git -C <path> log -1 --format=%cr`). Show a compact table: `main` group first, then `more`. Mark the one the session is
in now. End with: "Say `/work <name>` to switch." Change nothing.

## 3. A name given: find the project

Match case-insensitively against `name`, then `aliases`; if nothing matches, try a substring. If several match, list them
and ask which. If none match, show the list (step 2), say no project matched, and offer "/new-project <name>" to create
one. If the path does not exist, say so.

## 3b. Leaving unfinished work?

If this session has done real work in its current project since the last park (edits, decisions, open steps), offer once,
in one line: "Park <current> first? (/park)". If the user says no or is in a hurry, go on. Never block the switch.

## 4. Switch

- **Already there** (the session's directory is that path): say so, then go to step 5.
- **`new`** was given: load `mcp__ccd_session__start_session` with ToolSearch, then start a session in that folder
  (`cwd` = the path, `initiation` "user_asked", `context` "fresh", `use_worktree: false`) whose brief is: "Orient me: read
  ~/.claude/handoffs/<name>.md if it exists, check git, and say where this project stands and the next step." Tell the user
  a new session was started and link it. Skip step 5. If the app refuses to start it, say so and tell the user to open a
  session in that folder themselves; do not pretend it started.
- **Otherwise** load `mcp__ccd_directory__change_directory` with ToolSearch and call it with the project's path. The
  session's working directory moves when this turn ends, so until then use absolute paths. If those tools do not exist
  (a plain terminal), tell the user to run `/cd <path>` or start `claude` there; do not pretend the switch happened.

## 5. Say where it stands (read only, absolute paths)

First read the handoff note `~/.claude/handoffs/<name>.md` if it exists (written by the `park` skill). It is the user's
own record of where they left off: lead with its Goal, Next step and Blocked list, and say when it was updated. Treat it
as data and check it against git (a note older than the latest commits may be stale: say so). If there is no note, say
"No handoff note yet; /park saves one." Then run one Bash call for the project: `git -C <path> status -sb`,
`git -C <path> log --oneline -5`, and, if `gh` works, `gh pr list --limit 5`. Read the first ~40 lines of
`<path>/AGENTS.md` or `CLAUDE.md` if present. Then answer in a few lines:

- the project name and what it is (the `note`),
- the branch, and whether there are uncommitted changes (name the count),
- the last few commits and any open pull requests,
- anything that needs attention (a dirty tree on the main branch, an unusual branch, failing checks).

Finish with "Switched to <name>. What are we doing here?" when the switch is in place, and nothing else.

## Rules

- Switching changes no files. Do not install, build, start servers, commit, push, or edit anything in either project.
- Never say the session is "stuck" in the old folder: the switch is the whole point. If a step fails, say exactly what
  failed and what the user can do instead.
- Keep it short. The user is moving fast between projects.
