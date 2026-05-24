# simple-worktrunk

English | [简体中文](./README.zh-CN.md)

`simple-worktrunk` is a TypeScript SDK wrapper for the [worktrunk](https://github.com/max-sixty/worktrunk) CLI. It exposes a promise-based API for managing Git worktrees, hooks, state variables, and selected low-level worktrunk steps.

## Installation

```bash
npm install simple-worktrunk # npm
pnpm add simple-worktrunk    # pnpm
```

## Requirements

- Node.js >= 18
- worktrunk CLI >= 0.53.0

```bash
brew install worktrunk
wt --version
```

## Quick Start

```typescript
import { worktrunk } from 'simple-worktrunk'

const wt = worktrunk()

await wt.create({ branch: 'feature-auth' })

const { worktrees, current } = await wt.list({ full: true })
console.log(current)

await wt.switch({ branch: 'main' })

await wt.hook.run({ type: 'post-start', names: ['dev'], dryRun: true })

await wt.step.eval('{{ branch | hash_port }}')

await wt.merge({ target: 'main', remove: true })

await wt.remove({ branches: ['old-branch'] })
```

## API

### `worktrunk(options?)`

Creates a worktrunk instance.

```typescript
const wt = worktrunk({
  binary: 'wt',
  baseDir: '/path/to/repo',
  configPath: '/path/to/config.toml',
})
```

### `wt.switch(options)` / `wt.create(options)`

Switch to a worktree, or create one with `create: true`. `wt.create()` is a convenience wrapper over `switch({ create: true })`.

```typescript
await wt.switch('main')
await wt.switch({ branch: 'feature', create: true, base: 'main' })
await wt.switch({ branch: 'dev', execute: 'pnpm install' })
await wt.create({ branch: 'hotfix', base: 'v1.0.0' })
```

### `wt.list(options?)`

Lists worktrees using worktrunk JSON output.

```typescript
const { worktrees, current } = await wt.list({ full: true })

for (const worktree of worktrees) {
  console.log(`${worktree.branch} ${worktree.path}`)
}
```

### `wt.remove(options?)`

Removes worktrees.

```typescript
await wt.remove('feature-old')
await wt.remove({ branches: ['feature-old'], keepBranch: true })
await wt.remove()
```

### `wt.merge(options?)`

Merges the current branch into a target branch.

```typescript
await wt.merge()
await wt.merge({ target: 'develop' })
await wt.merge({ remove: false })
```

### `wt.hook`

Runs and inspects worktrunk hooks.

```typescript
await wt.hook.run({ type: 'post-start', names: ['dev'], dryRun: true })
await wt.hook.run({ type: 'pre-merge', vars: { env: 'staging' }, yes: true })

const { hooks } = await wt.hook.show()
```

### `wt.step`

Wraps selected `wt step` commands.

```typescript
await wt.step.commit({ stage: 'tracked', dryRun: true })
await wt.step.squash({ target: 'main', noHooks: true })
await wt.step.prune({ dryRun: true, minAge: '7d' })

const port = await wt.step.eval('{{ branch | hash_port }}')
```

### `wt.config`

Reads config and manages worktrunk state variables.

```typescript
const config = await wt.config.show({ format: 'json' })

await wt.config.state.vars.set('env', 'staging')
const env = await wt.config.state.vars.get('env')
const keys = await wt.config.state.vars.list()
await wt.config.state.vars.clear('env')

const logs = await wt.config.state.logs()
```

### `wt.raw(args, options?)`

Runs a worktrunk command that is not wrapped yet.

```typescript
const result = await wt.raw(['config', 'show', '--format=json'])
```

## Migrating from 0.1 to 0.2

`simple-worktrunk` 0.2 targets worktrunk 0.53+ and intentionally breaks the 0.1 API.

| 0.1 API | 0.2 API |
| --- | --- |
| `name` | `branch` |
| `exec` | `execute` |
| `hookShow()` | `hook.show()` |
| `hook({ type: 'post-create' })` | `hook.run({ type: 'post-start' })` |
| inferred text results | JSON-based results |

Use `wt.raw(args)` for worktrunk CLI features that are not wrapped yet.

## Error Handling

The library exports custom error types:

```typescript
import {
  worktrunk,
  WorktrunkError,
  BinaryNotFoundError,
  CommandFailedError,
  JsonParseError,
} from 'simple-worktrunk'

try {
  await wt.create({ branch: 'my-feature' })
} catch (error) {
  if (error instanceof BinaryNotFoundError) {
    console.error('worktrunk CLI not found')
  } else if (error instanceof CommandFailedError) {
    console.error(`Command failed: ${error.command}`)
  } else if (error instanceof JsonParseError) {
    console.error(`Could not parse JSON from: ${error.command}`)
  } else if (error instanceof WorktrunkError) {
    console.error(error.message)
  }
}
```

## Testing

- `pnpm test:run` runs unit and integration tests once.
- `pnpm lint` runs TypeScript checks.
- `pnpm build` builds ESM and declarations.

Integration tests require `wt >= 0.53.0`.

## License

MIT
