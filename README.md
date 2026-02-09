# simple-worktrunk

A lightweight Node.js wrapper for the [worktrunk](https://github.com/max-sixty/worktrunk) CLI, providing a clean, promise-based API for managing Git worktrees.

## Features

- **Promise-based API** - Modern async/await interface
- **TypeScript-first** - Full type definitions included
- **Lightweight** - Thin wrapper with zero dependencies
- **Chainable** - Methods return promises for easy composition
- **Error handling** - Custom error types for better debugging

## Installation

```bash
# pnpm
pnpm add simple-worktrunk

# npm
npm install simple-worktrunk

# yarn
yarn add simple-worktrunk
```

### Prerequisites

**Requires the worktrunk CLI (`wt`) to be installed.** See the [official worktrunk installation guide](https://github.com/max-sixty/worktrunk#installation) for details.

```bash
# Install worktrunk CLI (example)
cargo install worktrunk
```

## Quick Start

```typescript
import { worktrunk } from 'simple-worktrunk'

const wt = worktrunk()

// Create a new worktree
await wt.create('feature-auth')

// List all worktrees
const { worktrees, current } = await wt.list()
console.log(current) // 'feature-auth'

// Switch to another worktree
await wt.switch('main')

// When done, merge and cleanup
await wt.merge()

// Remove a worktree
await wt.remove('old-branch')
```

## API Reference

### `worktrunk(options?)`

Creates a new worktrunk instance for interacting with the worktrunk CLI.

```typescript
const wt = worktrunk()
```

**Parameters:**

- `options` (`string | WorktrunkOptions`, optional) - Either a path to the `wt` binary, or an options object

**Options object:**

| Property  | Type     | Default     | Description                  |
| --------- | -------- | ----------- | ---------------------------- |
| `binary`  | `string` | `'wt'`      | Path to the worktrunk binary |
| `baseDir` | `string` | `undefined` | Base directory for commands  |

**Examples:**

```typescript
// Use default 'wt' from PATH
const wt = worktrunk()

// Custom binary path
const wt = worktrunk('/usr/local/bin/wt')

// Full options
const wt = worktrunk({
  binary: '/home/user/.cargo/bin/wt',
  baseDir: '/path/to/repo',
})
```

### `wt.switch(options)`

Switch to an existing worktree or create a new one.

```typescript
const result = await wt.switch('my-feature')
```

**Parameters:**

- `options` (`string | SwitchOptions`) - Either a branch name, or options object

**Options object:**

| Property | Type      | Default     | Description                         |
| -------- | --------- | ----------- | ----------------------------------- |
| `name`   | `string`  | `undefined` | Worktree/branch name                |
| `create` | `boolean` | `false`     | Create worktree if it doesn't exist |
| `base`   | `string`  | `undefined` | Base branch for new worktree        |
| `exec`   | `string`  | `undefined` | Command to execute after switching  |
| `noCd`   | `boolean` | `false`     | Don't change directory              |

**Returns:** `Promise<SwitchResult>`

```typescript
interface SwitchResult {
  worktree: string // Name of the worktree
  path: string // Path to the worktree
  branch: string // Branch name
  created: boolean // Whether a new worktree was created
}
```

**Examples:**

```typescript
// Switch to existing worktree
await wt.switch('main')

// Create and switch in one command
const result = await wt.switch({ name: 'feature', create: true })

// Create from specific base
await wt.switch({ name: 'hotfix', create: true, base: 'production' })

// Switch and execute command
await wt.switch({ name: 'dev', exec: 'npm run dev' })
```

### `wt.create(options)`

Create a new worktree (alias for `switch({ create: true })`).

```typescript
const result = await wt.create('feature-auth')
```

**Parameters:**

- `options` (`string | CreateOptions`) - Either a branch name, or options object

**Options object:**

| Property | Type      | Default     | Description                       |
| -------- | --------- | ----------- | --------------------------------- |
| `name`   | `string`  | (required)  | Worktree/branch name              |
| `base`   | `string`  | `undefined` | Base branch for new worktree      |
| `exec`   | `string`  | `undefined` | Command to execute after creating |
| `noCd`   | `boolean` | `false`     | Don't change directory            |

**Returns:** `Promise<SwitchResult>`

**Examples:**

```typescript
// Simple creation
await wt.create('feature-auth')

// Create from specific base
await wt.create({ name: 'hotfix', base: 'v1.0.0' })

// Create and run command
await wt.create({ name: 'dev', exec: 'npm install' })
```

### `wt.remove(options)`

Remove a worktree.

```typescript
const result = await wt.remove('old-branch')
```

**Parameters:**

- `options` (`string | RemoveOptions`, optional) - Either a branch name, or options object. If omitted, removes current worktree.

**Options object:**

| Property     | Type      | Default     | Description                             |
| ------------ | --------- | ----------- | --------------------------------------- |
| `name`       | `string`  | `undefined` | Worktree name to remove                 |
| `keepBranch` | `boolean` | `false`     | Keep the branch after removing worktree |

**Returns:** `Promise<RemoveResult>`

```typescript
interface RemoveResult {
  removed: string // Name of removed worktree
  branchDeleted: boolean // Whether the branch was deleted
}
```

**Examples:**

```typescript
// Remove specific worktree and its branch
await wt.remove('feature-old')

// Remove worktree but keep the branch
await wt.remove({ name: 'feature-old', keepBranch: true })

// Remove current worktree
await wt.remove()
```

### `wt.list()`

List all worktrees.

```typescript
const { worktrees, current } = await wt.list()
```

**Returns:** `Promise<ListResult>`

```typescript
interface ListResult {
  worktrees: WorktreeInfo[] // Array of all worktrees
  current: string // Name of current worktree
}

interface WorktreeInfo {
  name: string // Worktree name
  path: string // Absolute path to worktree
  branch: string // Branch name
  isMain: boolean // Whether this is the main worktree
}
```

**Examples:**

```typescript
const { worktrees, current } = await wt.list()

console.log(`Current worktree: ${current}`)

for (const wt of worktrees) {
  console.log(`${wt.name} (${wt.branch}) - ${wt.path}`)
}

// Filter for feature branches
const features = worktrees.filter((w) => !w.isMain)
```

### `wt.merge(options)`

Merge current branch to target and optionally remove worktree.

```typescript
const result = await wt.merge()
```

**Parameters:**

- `options` (`MergeOptions`, optional)

**Options object:**

| Property       | Type      | Default  | Description                     |
| -------------- | --------- | -------- | ------------------------------- |
| `target`       | `string`  | `'main'` | Target branch to merge into     |
| `keepWorktree` | `boolean` | `false`  | Keep the worktree after merging |

**Returns:** `Promise<MergeResult>`

```typescript
interface MergeResult {
  merged: string // Branch that was merged
  target: string // Target branch
  worktreeRemoved: boolean // Whether worktree was removed
}
```

**Examples:**

```typescript
// Merge to main (default) and remove worktree
await wt.merge()

// Merge to custom target
await wt.merge({ target: 'develop' })

// Merge but keep worktree
await wt.merge({ keepWorktree: true })
```

### `wt.hook(options)`

Manually run a hook.

```typescript
const result = await wt.hook({ type: 'post-create' })
```

**Parameters:**

- `options` (`HookOptions`)

**Options object:**

| Property      | Type                     | Default     | Description                |
| ------------- | ------------------------ | ----------- | -------------------------- |
| `type`        | `HookType`               | (required)  | Hook type to run           |
| `name`        | `string`                 | `undefined` | Named hook to run          |
| `userOnly`    | `boolean`                | `false`     | Run only user hooks        |
| `projectOnly` | `boolean`                | `false`     | Run only project hooks     |
| `yes`         | `boolean`                | `false`     | Skip confirmation          |
| `vars`        | `Record<string, string>` | `{}`        | Variables to pass to hooks |

**Hook types:** `'post-create' | 'post-switch' | 'pre-merge' | 'post-merge' | 'pre-remove' | 'post-remove'`

**Returns:** `Promise<HookResult>`

```typescript
interface HookResult {
  hook: string // Hook type that was run
  executed: HookExecution[] // Execution results
}

interface HookExecution {
  name: string // Hook name
  source: 'user' | 'project' // Hook source
  success: boolean // Whether hook succeeded
  output?: string // Hook output
}
```

**Examples:**

```typescript
// Run post-create hook
await wt.hook({ type: 'post-create' })

// Run specific named hook
await wt.hook({ type: 'post-create', name: 'install-deps' })

// Run with variables
await wt.hook({
  type: 'post-create',
  vars: { PROJECT_NAME: 'my-project' },
})

// Run only user hooks
await wt.hook({ type: 'pre-merge', userOnly: true })
```

### `wt.hookShow()`

Show configured hooks.

```typescript
const result = await wt.hookShow()
```

**Returns:** `Promise<HookShowResult>`

```typescript
interface HookShowResult {
  hooks: Record<string, NamedHook[]> // Hooks by type
}

interface NamedHook {
  name?: string // Hook name (optional)
  command: string // Command to run
  source: 'user' | 'project' // Hook source
}
```

**Examples:**

```typescript
const { hooks } = await wt.hookShow()

// List all post-create hooks
for (const hook of hooks['post-create'] || []) {
  console.log(`${hook.name || '(unnamed)'}: ${hook.command} (${hook.source})`)
}
```

## Error Handling

The library exports custom error types for better error handling:

```typescript
import {
  worktrunk,
  WorktrunkError,
  BinaryNotFoundError,
  CommandFailedError,
} from 'simple-worktrunk'

try {
  await wt.create('my-feature')
} catch (error) {
  if (error instanceof BinaryNotFoundError) {
    console.error('worktrunk CLI not found!')
  } else if (error instanceof CommandFailedError) {
    console.error(`Command failed: ${error.command}`)
    console.error(`Exit code: ${error.code}`)
    console.error(`Error: ${error.message}`)
  } else if (error instanceof WorktrunkError) {
    console.error(`Worktrunk error: ${error.message}`)
  }
}
```

## Testing

The project uses a hybrid testing strategy:

- **Unit tests** (`pnpm test:unit`) - Fast tests for pure functions (parsers, errors)
- **Integration tests** (`pnpm test:integration`) - Real `wt` CLI tests against test git repository
- **All tests** (`pnpm test`) - Run both unit and integration tests

**Note:** Integration tests require the `wt` binary to be installed. If `wt` is not available, integration tests will be skipped.

## License

MIT
