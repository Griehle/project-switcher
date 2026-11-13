import { atom, read, update } from 'claude-code'
import type { Hook, Register } from 'claude-code'

import type { Project } from '../types'

// The engine handle every hook receives as its first argument.
type Dollar = Parameters<Hook<'session.start'>>[0]

const PANE = 'projects'
// The "New project" pop-up: a small pane that opens on top, asks for a name, and closes.
const FORM = 'new-project'
// The list of projects: ~/.claude/projects.json. Edit it to add or rename one; "Reload" in the pane picks it up.
// The home folder is read from the environment so the mod works on any computer.
const REGISTRY_FILE = '.claude/projects.json'

async function registryPath($: Dollar): Promise<string> {
  const home = (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE')) ?? ''
  return `${home}/${REGISTRY_FILE}`
}

// Change the tag when a project's fields change: it declines what an earlier version stored.
const projects = atom({ plugin: 'project-switcher', key: 'projects' } as const, [], {
  shape: 'projects-1',
})
const draftName = atom({ plugin: 'project-switcher', key: 'draftName' } as const, '', {
  shape: 'draft-name-1',
})
const formError = atom({ plugin: 'project-switcher', key: 'formError' } as const, '', {
  shape: 'form-error-1',
})

async function load($: Dollar): Promise<void> {
  try {
    const data = JSON.parse(await $.fs.read(await registryPath($))) as { projects?: Partial<Project>[] }
    const list: Project[] = (data.projects ?? []).flatMap(p =>
      p.name && p.path
        ? [{ name: p.name, path: p.path, note: p.note ?? '', group: p.group ?? 'more' }]
        : [],
    )
    await update($, projects, () => list)
  } catch {
    await update($, projects, () => [])
  }
}

// The folder a name would get: lower case, spaces as hyphens (the same rule /new-project uses).
const folderOf = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, '-')

// The message to show for a name that cannot be used, or '' when it is fine.
function problem(name: string, list: Project[]): string {
  const clean = name.trim()
  if (clean === '') return 'Name is required.'
  if (clean.length > 40) return 'Use 40 characters or fewer.'
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(clean)) return 'Use letters, numbers, spaces or hyphens only.'
  const folder = folderOf(clean)
  const taken = list.some(
    p => p.name.toLowerCase() === folder || p.path.split('/').pop()?.toLowerCase() === folder,
  )
  return taken ? `"${folder}" already exists. Pick another name.` : ''
}

async function openForm($: Dollar): Promise<void> {
  await load($)
  await update($, draftName, () => '')
  await update($, formError, () => '')
  await $.ui.open({ id: FORM, title: 'New project', focus: true, closeOnEscape: true })
}

// Check the name; on a good one, ask Claude to run /new-project and close the pop-up.
async function create($: Dollar, raw: string): Promise<void> {
  await load($)
  const list = await read($, projects)
  const message = problem(raw, list)
  await update($, formError, () => message)
  if (message !== '') return

  const name = raw.trim()
  await $.ui.close({ id: FORM })
  void $.prompt.submit({
    text: `Create a new project called "${name}" with the new-project skill.`,
    asUser: true,
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'projects',
      description: 'Show your projects in a pane, to switch between them',
    })
    await load($)
    void $.ui.open({ id: PANE, title: 'Projects' })

    return next(e)
  })

  on('command.run', { command: 'projects' }, async $ => {
    await load($)
    const opened = await $.ui.open({ id: PANE, title: 'Projects' })
    const list = await read($, projects)

    return {
      text: opened.isPlaced
        ? 'Projects pane opened.'
        : list.length === 0
          ? 'No projects found in ~/.claude/projects.json.'
          : 'Projects:\n' + list.map(p => `- ${p.name}`).join('\n') + '\nSay "/work <name>" to switch.',
    }
  })

  on('ui.render', { component: 'Pane', requestId: FORM }, async ($, e) => {
    const { Box, Button, Input, Text } = $.ui.resolve(e)
    const name = await read($, draftName)
    const error = await read($, formError)

    return (
      <Box flexDirection="column">
        <Text bold>New project</Text>
        <Input
          key="name"
          label="Name (required) "
          placeholder="e.g. my-new-app"
          value={name}
          autoFocus
          submitLabel="create"
          onInput={value => {
            void update($, draftName, () => value)
            if (error !== '') void update($, formError, () => '')
          }}
          onSubmit={value => {
            void create($, value)
          }}
        />
        {error !== '' && <Text color="red">{error}</Text>}
        <Box>
          <Button key="create" label=" Create " onPress={() => void create($, name)} />
          <Button key="cancel" label=" Cancel " onPress={() => void $.ui.close({ id: FORM })} />
        </Box>
        <Text dimColor>Creates the folder, registers it and switches to it. Esc closes.</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const list = await read($, projects)
    const root = await $.session.root()

    const row = (p: Project) => (
      <Box key={p.name} gap="md">
        <Button
          key={p.name}
          onPress={() => {
            void $.prompt.submit({ text: `Switch to my ${p.name} project.`, asUser: true })
          }}
        >
          {p.path === root ? '● ' : '  '}
          {p.name} <Text dimColor>{p.note}</Text>
        </Button>
        <Button
          key={`${p.name}-new`}
          label=" + "
          onPress={() => {
            void $.prompt.submit({
              text: `Open a new session in my ${p.name} project.`,
              asUser: true,
            })
          }}
        />
      </Box>
    )

    const main = list.filter(p => p.group === 'main')
    const more = list.filter(p => p.group !== 'main')

    return (
      <Box flexDirection="column" gap="md">
        <Box gap="md">
          <Text bold>Projects </Text>
          <Button key="new-project" label=" + New project " onPress={() => void openForm($)} />
        </Box>
        {list.length === 0 && (
          <Text dimColor>No projects found. Add them to ~/.claude/projects.json</Text>
        )}
        {main.map(row)}
        {more.length > 0 && <Text dimColor>More</Text>}
        {more.map(row)}
        <Text dimColor>Click a name to switch here, + for a new session.</Text>
        <Button key="reload" label="Reload list" onPress={() => load($)} />
      </Box>
    )
  })
}
