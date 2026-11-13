# project-switcher

Move between the projects you work on without fighting your session's working directory.

It is a Claude Code plugin with two parts:

- **A Projects pane** (a mod): a list of your projects. Click a name to switch this session to it, **+** to open it in
  a new session, **+ New project** to create one (a pop-up asks for a required name). Open it any time with `/projects`.
  The pane needs an app that draws panes, such as the Claude desktop app. Elsewhere `/projects` prints the list as text.
- **Three skills** that do the real work, so everything also works from the keyboard:
  - `/work <name>` switches to a project and tells you where it stands; `/work` alone lists them; `/work <name> new` opens
    a separate session.
  - `/park` saves a short "where we left off" note for the current project, so the next visit starts up to speed.
  - `/new-project <name>` creates a project folder, registers it, and switches into it.

Notes are saved outside your repos, in `~/.claude/handoffs/<project>.md`, so nothing lands in git.

## Install

```
/plugin install project-switcher --marketplace Griehle/project-switcher
```

Plugin skills are namespaced, so the commands may appear as `/project-switcher:work` and so on.

## Your project list

Create `~/.claude/projects.json` (the first `/new-project` does this for you). See `projects.example.json`:

```json
{
  "projects": [
    {
      "name": "my-site",
      "path": "/Users/you/code/my-site",
      "aliases": ["site"],
      "note": "Marketing site",
      "group": "main"
    }
  ]
}
```

- `group` is `main` (shown first) or `more`.
- `aliases` are other names you can type after `/work`.
- Optional top-level `"projectsRoot": "/Users/you/code"` tells `/new-project` where new projects go.

Click **Reload list** in the pane after you edit the file.

## Good to know

- Switching changes the session's working directory when the turn ends. Your old project's conversation stays in the same
  session; use `/work <name> new` for a clean session per project.
- `/new-project --github` creates a **private** repository, and only after you confirm.
- The pane is a mod, which is a newer, still-changing Claude Code feature. If a Claude Code update changes it, the skills
  keep working on their own.

## License

MIT. See `LICENSE`.
