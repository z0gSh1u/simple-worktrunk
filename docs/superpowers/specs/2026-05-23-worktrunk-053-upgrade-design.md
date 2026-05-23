# worktrunk 0.53 Upgrade Design

Date: 2026-05-23

## Goal

Upgrade `simple-worktrunk` from a lightweight wrapper designed around worktrunk 0.23 behavior into a modern SDK-style wrapper for `worktrunk >= 0.53.0`.

This is a breaking upgrade. The package will prefer current worktrunk concepts, JSON output, and lifecycle names over backward compatibility with the 0.23-era API.

## Context

The current project exposes `switch`, `create`, `remove`, `list`, `merge`, `hook`, and `hookShow` on a `worktrunk()` instance. It spawns the `wt` binary and parses a mix of JSON and human-readable text.

After upgrading the local CLI to `wt 0.53.0`, most integration tests still pass, but hook tests that expected missing hook configuration to fail now fail because the CLI treats that case as a successful no-op. The newer CLI also supports structured JSON output for core commands, richer `wt list` data, new hook lifecycle names, `wt step`, and `wt config` subcommands.

## Scope

In scope:

- Require and document `worktrunk >= 0.53.0`.
- Replace legacy text parsing for core command results with JSON parsing.
- Redesign the public API around current worktrunk names and behavior.
- Add typed high-value wrappers for `step` and `config state`.
- Add raw escape hatches for long-tail or newly-added CLI commands.
- Update tests and documentation for the breaking API.

Out of scope:

- Supporting worktrunk 0.23 or other older versions.
- Mirroring every worktrunk subcommand and every option as a typed method.
- Implementing a bundled worktrunk binary installer.
- Fixing upstream worktrunk behavior such as the observed `wt list --help` panic in piped output.

## Public API

The entry point remains:

```ts
const wt = worktrunk({ baseDir, binary: 'wt', configPath })
```

The instance will expose:

```ts
await wt.switch({ branch: 'feature-x', create: true, base: '@', noHooks: true })
await wt.create({ branch: 'feature-x', base: 'pr:123' })
await wt.list({ full: true, branches: true, remotes: false })
await wt.merge({ target: 'main', squash: false, ff: false, stage: 'tracked' })
await wt.remove({ branches: ['old-a', 'old-b'], force: true, forceDelete: true })

await wt.hook.run({ type: 'post-start', names: ['dev'], foreground: true, dryRun: true })
await wt.hook.show()

await wt.step.commit()
await wt.step.diff({ target: 'main' })
await wt.step.prune({ dryRun: true })
await wt.step.tether({ command: ['npm', 'run', 'dev'] })
await wt.step.raw(['eval', '{{ branch | hash_port }}'])

await wt.config.show({ full: true, format: 'json' })
await wt.config.state.vars.list()
await wt.config.state.vars.get('port')
await wt.config.state.vars.set('port', '3000')
await wt.config.state.logs()
await wt.config.raw(['show', '--format=json'])

await wt.raw(['list', '--format=json'])
```

Breaking changes:

- Replace `name` with `branch` for switch/create inputs.
- Replace `exec?: string` with `execute?: string | string[]`.
- Remove `hookShow()` as a top-level method; use `wt.hook.show()`.
- Remove legacy hook type names from the primary type union. Expose current lifecycle names: `pre-switch`, `post-switch`, `pre-start`, `post-start`, `pre-commit`, `post-commit`, `pre-merge`, `post-merge`, `pre-remove`, and `post-remove`.
- Do not expose `pre-create` or `post-create` as typed names. Users can call aliases through `raw()` if necessary.
- Core result objects are based on CLI JSON output instead of inferred text.

## Command Execution

Create a unified execution layer:

```ts
execute(args, options?) => Promise<ExecResult>
executeJson<T>(args, options?) => Promise<T>
raw(args, options?) => Promise<ExecResult>
```

`ExecResult` includes `stdout`, `stderr`, and `exitCode`.

`CommandOptions` includes:

```ts
interface CommandOptions {
  allowNonZeroExit?: boolean
  env?: NodeJS.ProcessEnv
  signal?: AbortSignal
}
```

`baseDir` remains process `cwd`. `configPath` in `WorktrunkOptions` is translated into the global `--config <path>` argument for each `wt` invocation.

Core methods should use JSON mode:

- `switch`: `wt switch --format=json ...`
- `list`: `wt list --format=json ...`
- `merge`: `wt merge --format=json ...`
- `remove`: `wt remove --format=json --foreground ...`

JSON parsing reads from stdout. Because `wt switch --format=json` can print a JSON object followed by human-readable lines, the parser extracts the first complete JSON object or array from stdout. If parsing fails, it throws `JsonParseError` with command context and previews of stdout/stderr.

## Type Model

Types use camelCase for JavaScript consumers.

`switch()` returns:

```ts
type SwitchAction = 'created' | 'switched' | 'already_at' | string

interface SwitchResult {
  action: SwitchAction
  branch: string
  path: string
}
```

`list()` returns:

```ts
interface ListResult {
  worktrees: WorktreeInfo[]
  current: string
}

interface WorktreeInfo {
  branch: string
  path: string
  kind: 'worktree' | string
  isMain: boolean
  isCurrent: boolean
  isPrevious: boolean
  commit?: {
    sha: string
    shortSha: string
    message: string
    timestamp: number
  }
  workingTree?: {
    staged: boolean
    modified: boolean
    untracked: boolean
    renamed: boolean
    deleted: boolean
    diff?: { added: number; deleted: number }
  }
  mainState?: string
  integrationReason?: string
  remote?: { name: string; branch: string; ahead: number; behind: number }
  main?: { ahead: number; behind: number }
  ci?: unknown
  url?: string
  summary?: string
  vars?: Record<string, unknown>
  statusline?: string
  symbols?: string
}
```

`merge()` and `remove()` will use wide result types until their 0.53 JSON shapes are verified in integration tests:

```ts
interface MergeResult {
  target?: string
  source?: string
  branch?: string
  path?: string
  raw: Record<string, unknown>
}

interface RemoveResult {
  removed: Array<{ branch?: string; path?: string }>
  raw: Record<string, unknown>
}
```

The API does not include raw JSON in every typed result by default. Consumers who need exact CLI output can use `raw()`.

## Hook API

Expose a nested hook API:

```ts
wt.hook.run({
  type: 'post-start',
  names: ['dev'],
  foreground: true,
  dryRun: true,
  yes: true,
  vars: { port: '3000' },
})

wt.hook.show()
```

`hook.run()` maps names directly after the hook type. Source-qualified names such as `user:dev` and `project:dev` are allowed as plain strings in `names`.

No configured hooks is a successful empty operation in 0.53 and should not be tested as an error.

## Step API

Expose a typed subset plus raw escape hatch:

```ts
wt.step.commit({ stage?: 'all' | 'tracked' | 'none', noHooks?: boolean })
wt.step.squash({ target?: string, stage?: 'all' | 'tracked' | 'none', noHooks?: boolean })
wt.step.rebase({ target?: string })
wt.step.push({ target?: string })
wt.step.diff({ target?: string })
wt.step.prune({ dryRun?: boolean, minAge?: string, foreground?: boolean })
wt.step.tether({ command: string[] })
wt.step.forEach({ command: string[] })
wt.step.eval(expression, vars?)
wt.step.raw(args)
```

Typed methods cover stable, high-value automation paths. `step.raw()` handles the rest.

## Config API

Expose programmatic configuration methods where the CLI is useful as a data interface:

```ts
wt.config.show({ full?: boolean, format?: 'json' | 'text' })
wt.config.state.vars.list()
wt.config.state.vars.get(key)
wt.config.state.vars.set(key, value)
wt.config.state.vars.clear(key)
wt.config.state.vars.clearAll()
wt.config.state.logs()
wt.config.plugins.codex.install()
wt.config.plugins.codex.uninstall()
wt.config.raw(args)
```

These methods map to verified 0.53 command shapes: `vars list/get/set/clear`,
`logs --format=json`, and `plugins codex install/uninstall`. Plugin status is
read through `config.show({ full: true, format: 'json' })` instead of a typed
Codex status command, because 0.53 exposes no separate `status` subcommand.

## Error Handling

Keep existing errors:

- `WorktrunkError`
- `BinaryNotFoundError`
- `CommandFailedError`

Add:

- `JsonParseError`

`CommandFailedError` should include `stdout`, `stderr`, `exitCode`, and `args` to make failed CLI calls diagnosable.

Version checks are not performed on every command. Tests should detect `wt --version` and fail or skip clearly when the installed CLI is older than 0.53. Documentation states the minimum version.

## Testing

Unit tests:

- Command argument builders.
- JSON extraction from stdout with trailing human-readable lines.
- Snake_case to camelCase mapping for list data.
- Error construction for failed commands and JSON parse failures.

Integration tests:

- `switch` and `create` with `--format=json`.
- `list({ full, branches, remotes })`.
- `remove` with foreground JSON output.
- `merge` JSON output.
- `hook.run()` no-op success when no hooks are configured.
- `hook.show()` text parsing, because 0.53 exposes no JSON format for this command.
- `step.eval()` as a low-risk step command.
- `config.show({ format: 'json' })`.
- `config.state.vars.list/get/set/clear` using an isolated test repository.
- `config.state.logs()` with JSON output.

Integration tests should guard on `wt --version >= 0.53.0`.

## Documentation

Update both `README.md` and `README.zh-CN.md`:

- State that `worktrunk >= 0.53.0` is required.
- Update quick start examples to use `branch`, `execute`, `hook.run`, and current hook lifecycle names.
- Add sections for `raw()`, `step`, and `config`.
- Add migration notes from 0.1 to 0.2:
  - `name` becomes `branch`.
  - `exec` becomes `execute`.
  - `hookShow()` becomes `hook.show()`.
  - `post-create` becomes `post-start`.
  - Core result objects now come from JSON output.

## Implementation Order

1. Add execution primitives and JSON extraction.
2. Update types and public instance shape.
3. Migrate `switch`, `list`, `remove`, and `merge` to JSON output.
4. Replace hook API and update hook tests.
5. Add `raw()`, `step`, and `config` namespaces.
6. Update README files.
7. Run unit and integration tests against `wt 0.53.0`.

## Remaining Implementation Checks

No product decisions remain. Before coding each command, verify the exact 0.53
JSON shape locally and map the stable fields into the public type. Keep `raw`
on wide result types only where the CLI shape is too broad or still
experimental.
