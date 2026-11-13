export type Project = { name: string; path: string; note: string; group: string }

declare module 'claude-code' {
  interface PluginState {
    'project-switcher': {
      projects: Shaped<Project[]>
      // What is typed in the "New project" pop-up, and the message shown under it.
      draftName: Shaped<string>
      formError: Shaped<string>
    }
  }
}
