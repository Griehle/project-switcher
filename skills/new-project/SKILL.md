---
name: new-project
description: Create a new project folder, register it so /work can find it, and switch into it. Use when the user types /new-project, says "create a new project", "start a new project called X", "set up a project for X", or asks for a way to make a project. Not for adding an existing folder (just edit ~/.claude/projects.json for that).
---

# Create a project

The user tracks their projects in `~/.claude/projects.json` (expand `~` to `$HOME` for the Read and Edit tools). This makes
a new one, registers it, and moves into it, so `/work` and `/park` know about it from the first minute.

Arguments: `/new-project <name> [--github] [--main] [--note "what it is"]`
- `<name>`: the project name. The folder is `<base>/<folder>`, where `<folder>` is the name lower-cased with spaces
  turned into hyphens (letters, digits and hyphens only).
- `<base>` is the optional `projectsRoot` field of `projects.json`; otherwise the parent folder most existing projects
  share; otherwise ask the user once where new projects should live, and offer to save the answer as `projectsRoot`.
- `--github`: also create a PRIVATE GitHub repository and push (see step 4).
- `--main`: put it in the `main` group of the project list (default `more`).
- `--note`: one line for the list. If missing, ask for one line only if the user's message did not already say what it is.

## 1. Check

- Read `~/.claude/projects.json`. If it does not exist, create it as `{ "projects": [] }`. If it is not valid JSON, say so
  and stop.
- If no name was given, ask for one in a single line and stop.
- Stop and say so if the folder already exists, or the name or folder already appears in the list (match `name`, `aliases`,
  `path`). Offer `/work <name>` instead. Never overwrite or reuse an existing folder.

## 2. Create (local only)

Run one Bash call:
- `mkdir` the folder, `git init -b main` in it.
- Write a short `README.md` (the name as a title plus the note) and a `.gitignore` containing `.DS_Store`, `.env`,
  `.env.local`, `node_modules/`.
- Make one commit: "Start <name>". End the commit message with the attribution line from the conversation's
  system-reminder, if one is present.

Do not install packages, scaffold a framework, or start servers. Tell the user they can ask for a scaffold (for example a
web app or a Claude mod) once they are inside the project.

## 3. Register it

Edit `~/.claude/projects.json` (keep valid JSON and the existing formatting): add an entry
`{ "name", "path", "aliases": [], "note", "group" }` at the end of `projects`. Read the file back and check it still parses.
Then write a starter handoff note `~/.claude/handoffs/<name>.md` in the `park` skill's format: Goal from the note, Done
"Project created.", Decisions empty, Blocked empty, Next step "Decide the first task."

## 4. GitHub (only with --github)

Creating a repository publishes something under the user's account. Confirm first in one line: "Create a private GitHub
repo <owner>/<folder> and push?" and wait for a clear yes. Then `gh repo create <folder> --private --source <path>
--remote origin --push`. Never create a public repository unless the user says "public" in words. If `gh` is not logged in,
say so and skip it; the local project is still created.

## 5. Switch

Load `mcp__ccd_directory__change_directory` with ToolSearch and call it with the new path (the working directory moves
when the turn ends; use absolute paths until then). If those tools do not exist, tell the user to run `/cd <path>`.
If the session has unfinished work in the project it is leaving, offer once: "Park <current> first? (/park)".

Finish with a few lines: the folder, whether GitHub was set up, and "Switched to <name>. What are we building?"

## Rules

- Create new projects only inside `<base>` unless the user gives a full path.
- Never delete or overwrite anything. Never commit secrets.
- Keep it short; the user is moving fast.
