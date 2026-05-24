# worktrunk 0.53 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `simple-worktrunk` into a breaking `worktrunk >= 0.53.0` SDK wrapper with JSON-based core commands, typed hook/step/config namespaces, raw escape hatches, and updated documentation.

**Architecture:** Keep the existing command-module pattern, but move all spawning and JSON handling into focused utilities. Public APIs become thin typed builders that produce `wt` argv arrays and parse either JSON results or documented text output.

**Tech Stack:** TypeScript, Node.js child_process, Vitest, tsup, worktrunk CLI 0.53+.

---

## File Structure

- `src/utils/executor.ts`: process spawning, global `--config` argument insertion, raw execution, JSON execution.
- `src/utils/json.ts`: first JSON value extraction from stdout.
- `src/utils/mapper.ts`: snake_case to camelCase mapping for worktrunk JSON shapes.
- `src/utils/version.ts`: parse and compare `wt --version` output for integration guards.
- `src/errors.ts`: richer command errors and new `JsonParseError`.
- `src/types.ts`: new public option/result types and nested namespace interfaces.
- `src/worktrunk.ts`: construct the public instance and nested `hook`, `step`, and `config` namespaces.
- `src/commands/switch.ts`: `switch` and `create` argv builders plus JSON result mapping.
- `src/commands/list.ts`: `list` argv builder plus rich worktree mapping.
- `src/commands/remove.ts`: `remove` argv builder plus wide JSON result mapping.
- `src/commands/merge.ts`: `merge` argv builder plus wide JSON result mapping.
- `src/commands/hook.ts`: `hook.run()` and `hook.show()`.
- `src/commands/step.ts`: typed step methods plus `step.raw()`.
- `src/commands/config.ts`: typed config methods plus `config.raw()`.
- `src/commands/raw.ts`: top-level `wt.raw()`.
- `test/unit/*.test.ts`: utility, builder, mapper, and error tests.
- `test/integration/*.integration.test.ts`: 0.53 integration behavior.
- `README.md` and `README.zh-CN.md`: breaking API documentation and migration notes.

## Task 1: Executor, JSON, Version, And Errors Foundation

**Files:**
- Modify: `src/errors.ts`
- Modify: `src/utils/executor.ts`
- Create: `src/utils/json.ts`
- Create: `src/utils/version.ts`
- Test: `test/unit/errors.test.ts`
- Test: `test/unit/json.test.ts`
- Test: `test/unit/version.test.ts`

- [ ] **Step 1: Write failing JSON extraction tests**

Add `test/unit/json.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractFirstJsonValue } from '../../src/utils/json.js';

describe('extractFirstJsonValue', () => {
  it('extracts an object followed by human-readable output', () => {
    expect(
      extractFirstJsonValue('{"action":"already_at","branch":"main"}\n○ Already on main\n')
    ).toBe('{"action":"already_at","branch":"main"}');
  });

  it('extracts an array after leading text', () => {
    expect(
      extractFirstJsonValue('warning\n[{"branch":"main"},{"branch":"feature"}]\n')
    ).toBe('[{"branch":"main"},{"branch":"feature"}]');
  });

  it('handles strings containing braces', () => {
    expect(
      extractFirstJsonValue('{"message":"hello {branch}","ok":true}\ntrailing')
    ).toBe('{"message":"hello {branch}","ok":true}');
  });

  it('returns null when stdout contains no complete JSON value', () => {
    expect(extractFirstJsonValue('plain text only')).toBeNull();
    expect(extractFirstJsonValue('{"incomplete":true')).toBeNull();
  });
});
```

- [ ] **Step 2: Write failing version parsing tests**

Add `test/unit/version.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isAtLeastVersion, parseWorktrunkVersion } from '../../src/utils/version.js';

describe('parseWorktrunkVersion', () => {
  it('parses wt version output', () => {
    expect(parseWorktrunkVersion('wt 0.53.0')).toEqual({ major: 0, minor: 53, patch: 0 });
  });

  it('returns null for unrecognized output', () => {
    expect(parseWorktrunkVersion('not worktrunk')).toBeNull();
  });
});

describe('isAtLeastVersion', () => {
  it('compares semantic versions', () => {
    expect(isAtLeastVersion({ major: 0, minor: 53, patch: 0 }, { major: 0, minor: 53, patch: 0 })).toBe(true);
    expect(isAtLeastVersion({ major: 0, minor: 54, patch: 0 }, { major: 0, minor: 53, patch: 0 })).toBe(true);
    expect(isAtLeastVersion({ major: 0, minor: 52, patch: 9 }, { major: 0, minor: 53, patch: 0 })).toBe(false);
  });
});
```

- [ ] **Step 3: Extend error tests for richer command and JSON errors**

Update `test/unit/errors.test.ts` with these cases:

```ts
import { CommandFailedError, JsonParseError } from '../../src/errors.js';

it('CommandFailedError exposes command diagnostics', () => {
  const error = new CommandFailedError({
    command: 'wt list --format=json',
    args: ['list', '--format=json'],
    exitCode: 2,
    stdout: 'partial stdout',
    stderr: 'fatal error',
  });

  expect(error.command).toBe('wt list --format=json');
  expect(error.args).toEqual(['list', '--format=json']);
  expect(error.code).toBe('2');
  expect(error.exitCode).toBe(2);
  expect(error.stdout).toBe('partial stdout');
  expect(error.stderr).toBe('fatal error');
});

it('JsonParseError includes output previews', () => {
  const error = new JsonParseError({
    command: 'wt switch --format=json @',
    stdout: 'not json',
    stderr: 'warning',
  });

  expect(error.command).toBe('wt switch --format=json @');
  expect(error.stdoutPreview).toBe('not json');
  expect(error.stderrPreview).toBe('warning');
});
```

- [ ] **Step 4: Run foundation tests and confirm they fail**

Run:

```bash
pnpm vitest run test/unit/json.test.ts test/unit/version.test.ts test/unit/errors.test.ts
```

Expected: fails because `src/utils/json.ts`, `src/utils/version.ts`, and the new error signatures do not exist yet.

- [ ] **Step 5: Implement `JsonParseError` and richer `CommandFailedError`**

Replace `src/errors.ts` with:

```ts
export class WorktrunkError extends Error {
  code?: string;
  command?: string;

  constructor(message: string, code?: string, command?: string) {
    super(message);
    this.name = 'WorktrunkError';
    this.code = code;
    this.command = command;
  }
}

export class BinaryNotFoundError extends WorktrunkError {
  constructor(binaryPath: string) {
    super(`Worktrunk binary not found at: ${binaryPath}`);
    this.name = 'BinaryNotFoundError';
  }
}

export interface CommandFailedErrorOptions {
  command: string;
  args: string[];
  exitCode: number | string;
  stdout?: string;
  stderr?: string;
}

export class CommandFailedError extends WorktrunkError {
  args: string[];
  exitCode: number | string;
  stdout: string;
  stderr: string;

  constructor(options: CommandFailedErrorOptions);
  constructor(command: string, exitCode: number | string, stderr?: string);
  constructor(
    commandOrOptions: string | CommandFailedErrorOptions,
    exitCode?: number | string,
    stderr = ''
  ) {
    const options = typeof commandOrOptions === 'string'
      ? {
          command: commandOrOptions,
          args: commandOrOptions.split(' ').slice(1),
          exitCode: exitCode ?? 'unknown',
          stdout: '',
          stderr,
        }
      : commandOrOptions;

    super(
      `Command '${options.command}' failed with exit code ${options.exitCode}${options.stderr ? ': ' + options.stderr : ''}`,
      String(options.exitCode),
      options.command
    );

    this.name = 'CommandFailedError';
    this.args = options.args;
    this.exitCode = options.exitCode;
    this.stdout = options.stdout ?? '';
    this.stderr = options.stderr ?? '';
  }
}

export interface JsonParseErrorOptions {
  command: string;
  stdout: string;
  stderr?: string;
}

export class JsonParseError extends WorktrunkError {
  stdoutPreview: string;
  stderrPreview: string;

  constructor(options: JsonParseErrorOptions) {
    super(`Failed to parse JSON output from '${options.command}'`, 'JSON_PARSE_ERROR', options.command);
    this.name = 'JsonParseError';
    this.stdoutPreview = preview(options.stdout);
    this.stderrPreview = preview(options.stderr ?? '');
  }
}

function preview(value: string): string {
  return value.length > 500 ? value.slice(0, 500) + '...' : value;
}
```

- [ ] **Step 6: Implement JSON extraction**

Add `src/utils/json.ts`:

```ts
export function extractFirstJsonValue(stdout: string): string | null {
  const start = findJsonStart(stdout);
  if (start === -1) return null;

  const opening = stdout[start];
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < stdout.length; index++) {
    const char = stdout[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === opening) {
      depth += 1;
    } else if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return stdout.slice(start, index + 1);
      }
    }
  }

  return null;
}

function findJsonStart(stdout: string): number {
  const objectStart = stdout.indexOf('{');
  const arrayStart = stdout.indexOf('[');

  if (objectStart === -1) return arrayStart;
  if (arrayStart === -1) return objectStart;
  return Math.min(objectStart, arrayStart);
}
```

- [ ] **Step 7: Implement version helpers**

Add `src/utils/version.ts`:

```ts
export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export function parseWorktrunkVersion(output: string): Version | null {
  const match = output.match(/\b(\d+)\.(\d+)\.(\d+)\b/);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isAtLeastVersion(actual: Version, minimum: Version): boolean {
  if (actual.major !== minimum.major) return actual.major > minimum.major;
  if (actual.minor !== minimum.minor) return actual.minor > minimum.minor;
  return actual.patch >= minimum.patch;
}
```

- [ ] **Step 8: Update executor with raw and JSON primitives**

Replace `src/utils/executor.ts` with:

```ts
import { spawn } from 'node:child_process';
import { BinaryNotFoundError, CommandFailedError, JsonParseError } from '../errors.js';
import type { NormalizedOptions, CommandOptions } from '../types.js';
import { extractFirstJsonValue } from './json.js';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function execCommand(args: string[], options: NormalizedOptions): Promise<string> {
  const result = await execute(args, options);
  return result.stdout.trim();
}

export async function execCommandWithStderr(args: string[], options: NormalizedOptions): Promise<ExecResult> {
  return execute(args, options);
}

export async function execute(
  args: string[],
  options: NormalizedOptions,
  commandOptions: CommandOptions = {}
): Promise<ExecResult> {
  const fullArgs = withGlobalArgs(args, options);
  const result = await spawnCommand(options.binary, fullArgs, options.baseDir, commandOptions);

  if (result.exitCode !== 0 && !commandOptions.allowNonZeroExit) {
    throw new CommandFailedError({
      command: `${options.binary} ${fullArgs.join(' ')}`,
      args: fullArgs,
      exitCode: result.exitCode ?? 'unknown',
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  return result;
}

export async function executeJson<T>(
  args: string[],
  options: NormalizedOptions,
  commandOptions: CommandOptions = {}
): Promise<T> {
  const result = await execute(args, options, commandOptions);
  const json = extractFirstJsonValue(result.stdout);
  const fullArgs = withGlobalArgs(args, options);
  const command = `${options.binary} ${fullArgs.join(' ')}`;

  if (!json) {
    throw new JsonParseError({ command, stdout: result.stdout, stderr: result.stderr });
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    throw new JsonParseError({ command, stdout: result.stdout, stderr: result.stderr });
  }
}

function withGlobalArgs(args: string[], options: NormalizedOptions): string[] {
  if (!options.configPath) return args;
  return ['--config', options.configPath, ...args];
}

async function spawnCommand(
  binary: string,
  args: string[],
  cwd: string | undefined,
  commandOptions: CommandOptions
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(binary, args, {
      cwd,
      env: commandOptions.env ? { ...process.env, ...commandOptions.env } : process.env,
      signal: commandOptions.signal,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new BinaryNotFoundError(binary));
        return;
      }
      reject(err);
    });
  });
}
```

- [ ] **Step 9: Add temporary `CommandOptions` and `configPath` types**

Update `src/types.ts` near the options definitions:

```ts
export interface CommandOptions {
  allowNonZeroExit?: boolean;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}

export interface WorktrunkOptions {
  binary?: string;
  baseDir?: string;
  configPath?: string;
}

export interface NormalizedOptions {
  binary: string;
  baseDir?: string;
  configPath?: string;
}
```

- [ ] **Step 10: Run foundation tests and typecheck**

Run:

```bash
pnpm vitest run test/unit/json.test.ts test/unit/version.test.ts test/unit/errors.test.ts
pnpm lint
```

Expected: all listed unit tests pass and `pnpm lint` exits with code 0.

- [ ] **Step 11: Commit foundation**

Run:

```bash
git add src/errors.ts src/utils/executor.ts src/utils/json.ts src/utils/version.ts src/types.ts test/unit/errors.test.ts test/unit/json.test.ts test/unit/version.test.ts
git commit -m "feat: add 0.53 execution foundation"
```

## Task 2: Public Types And Instance Shape

**Files:**
- Modify: `src/types.ts`
- Modify: `src/worktrunk.ts`
- Modify: `src/index.ts`
- Create: `src/commands/raw.ts`
- Test: `test/index.test.ts`
- Test: `test/unit/instance.test.ts`

- [ ] **Step 1: Write failing instance shape tests**

Add `test/unit/instance.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { worktrunk } from '../../src/index.js';

describe('worktrunk instance shape', () => {
  it('exposes nested hook step config and raw APIs', () => {
    const wt = worktrunk({ binary: 'wt', baseDir: '/repo', configPath: '/tmp/wt.toml' });

    expect(wt.options).toEqual({
      binary: 'wt',
      baseDir: '/repo',
      configPath: '/tmp/wt.toml',
    });
    expect(typeof wt.raw).toBe('function');
    expect(typeof wt.hook.run).toBe('function');
    expect(typeof wt.hook.show).toBe('function');
    expect(typeof wt.step.raw).toBe('function');
    expect(typeof wt.config.raw).toBe('function');
  });
});
```

Update `test/index.test.ts` so the instance assertion expects new namespaces and no `hookShow`:

```ts
it('should create instance', () => {
  const wt = worktrunk();
  expect(wt).toHaveProperty('switch');
  expect(wt).toHaveProperty('create');
  expect(wt).toHaveProperty('remove');
  expect(wt).toHaveProperty('list');
  expect(wt).toHaveProperty('merge');
  expect(wt).toHaveProperty('hook');
  expect(wt.hook).toHaveProperty('run');
  expect(wt.hook).toHaveProperty('show');
  expect(wt).toHaveProperty('step');
  expect(wt).toHaveProperty('config');
  expect(wt).toHaveProperty('raw');
  expect(wt).not.toHaveProperty('hookShow');
});
```

- [ ] **Step 2: Run instance tests and confirm failure**

Run:

```bash
pnpm vitest run test/index.test.ts test/unit/instance.test.ts
```

Expected: fails because nested APIs and top-level `raw` do not exist.

- [ ] **Step 3: Replace public types with 0.53 API types**

Update `src/types.ts` with these public types. Keep exported names grouped by command:

```ts
export type StageMode = 'all' | 'tracked' | 'none';
export type OutputFormat = 'text' | 'json';

export interface CommandOptions {
  allowNonZeroExit?: boolean;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}

export type HookType =
  | 'pre-switch'
  | 'post-switch'
  | 'pre-start'
  | 'post-start'
  | 'pre-commit'
  | 'post-commit'
  | 'pre-merge'
  | 'post-merge'
  | 'pre-remove'
  | 'post-remove';

export interface SwitchOptions {
  branch?: string;
  create?: boolean;
  base?: string;
  execute?: string | string[];
  executeArgs?: string[];
  branches?: boolean;
  remotes?: boolean;
  clobber?: boolean;
  noCd?: boolean;
  noHooks?: boolean;
  yes?: boolean;
}

export interface CreateOptions extends Omit<SwitchOptions, 'create'> {
  branch: string;
}

export type SwitchAction = 'created' | 'switched' | 'already_at' | string;

export interface SwitchResult {
  action: SwitchAction;
  branch: string;
  path: string;
}

export interface ListOptions {
  full?: boolean;
  branches?: boolean;
  remotes?: boolean;
}

export interface WorktreeInfo {
  branch: string;
  path: string;
  kind: 'worktree' | string;
  isMain: boolean;
  isCurrent: boolean;
  isPrevious: boolean;
  commit?: {
    sha: string;
    shortSha: string;
    message: string;
    timestamp: number;
  };
  workingTree?: {
    staged: boolean;
    modified: boolean;
    untracked: boolean;
    renamed: boolean;
    deleted: boolean;
    diff?: { added: number; deleted: number };
  };
  mainState?: string;
  integrationReason?: string;
  remote?: { name: string; branch: string; ahead: number; behind: number };
  main?: { ahead: number; behind: number };
  ci?: unknown;
  url?: string;
  summary?: string;
  vars?: Record<string, unknown>;
  statusline?: string;
  symbols?: string;
}

export interface ListResult {
  worktrees: WorktreeInfo[];
  current: string;
}

export interface RemoveOptions {
  branches?: string[];
  keepBranch?: boolean;
  force?: boolean;
  forceDelete?: boolean;
  noHooks?: boolean;
  yes?: boolean;
}

export interface RemoveResult {
  removed: Array<{ branch?: string; path?: string }>;
  raw: Record<string, unknown>;
}

export interface MergeOptions {
  target?: string;
  squash?: boolean;
  commit?: boolean;
  rebase?: boolean;
  remove?: boolean;
  ff?: boolean;
  stage?: StageMode;
  noHooks?: boolean;
  yes?: boolean;
}

export interface MergeResult {
  target?: string;
  source?: string;
  branch?: string;
  path?: string;
  raw: Record<string, unknown>;
}

export interface HookRunOptions {
  type: HookType;
  names?: string[];
  foreground?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  vars?: Record<string, string>;
}

export interface HookResult {
  hook: HookType;
  stdout: string;
  stderr: string;
}

export interface NamedHook {
  name?: string;
  command: string;
  source: 'user' | 'project';
}

export interface HookShowResult {
  hooks: Record<string, NamedHook[]>;
}

export interface StepCommitOptions {
  branch?: string;
  stage?: StageMode;
  dryRun?: boolean;
  noHooks?: boolean;
}

export interface StepSquashOptions {
  target?: string;
  stage?: StageMode;
  dryRun?: boolean;
  noHooks?: boolean;
}

export interface StepTargetOptions {
  target?: string;
}

export interface StepPruneOptions {
  dryRun?: boolean;
  minAge?: string;
  foreground?: boolean;
}

export interface StepCommandOptions {
  command: string[];
}

export interface ConfigShowOptions {
  full?: boolean;
  format?: OutputFormat;
}

export interface StateVarOptions {
  branch?: string;
}

export interface WorktrunkOptions {
  binary?: string;
  baseDir?: string;
  configPath?: string;
}

export interface NormalizedOptions {
  binary: string;
  baseDir?: string;
  configPath?: string;
}
```

- [ ] **Step 4: Add raw command helper**

Create `src/commands/raw.ts`:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { CommandOptions } from '../types.js';
import { execute, type ExecResult } from '../utils/executor.js';

export async function rawCommand(
  this: WorktrunkInstance,
  args: string[],
  options?: CommandOptions
): Promise<ExecResult> {
  return execute(args, this.options, options);
}
```

- [ ] **Step 5: Update `WorktrunkInstance` and factory shape**

Update `src/worktrunk.ts` imports and interface so it includes nested namespaces. Use placeholder implementations that call `rawCommand`; later tasks replace command-specific modules:

```ts
import type {
  CommandOptions,
  ConfigShowOptions,
  CreateOptions,
  HookRunOptions,
  HookShowResult,
  HookResult,
  ListOptions,
  ListResult,
  MergeOptions,
  MergeResult,
  NormalizedOptions,
  RemoveOptions,
  RemoveResult,
  StateVarOptions,
  StepCommitOptions,
  StepCommandOptions,
  StepPruneOptions,
  StepSquashOptions,
  StepTargetOptions,
  SwitchOptions,
  SwitchResult,
  WorktrunkOptions,
} from './types.js';
import type { ExecResult } from './utils/executor.js';
import { rawCommand } from './commands/raw.js';
```

Define namespace interfaces in `src/worktrunk.ts`:

```ts
export interface HookNamespace {
  run(options: HookRunOptions): Promise<HookResult>;
  show(): Promise<HookShowResult>;
}

export interface StepNamespace {
  commit(options?: StepCommitOptions): Promise<ExecResult>;
  squash(options?: StepSquashOptions): Promise<ExecResult>;
  rebase(options?: StepTargetOptions): Promise<ExecResult>;
  push(options?: StepTargetOptions): Promise<ExecResult>;
  diff(options?: StepTargetOptions): Promise<ExecResult>;
  prune(options?: StepPruneOptions): Promise<ExecResult>;
  tether(options: StepCommandOptions): Promise<ExecResult>;
  forEach(options: StepCommandOptions): Promise<ExecResult>;
  eval(expression: string): Promise<string>;
  raw(args: string[], options?: CommandOptions): Promise<ExecResult>;
}

export interface ConfigNamespace {
  show(options?: ConfigShowOptions): Promise<unknown>;
  state: {
    vars: {
      list(options?: StateVarOptions): Promise<string[]>;
      get(key: string, options?: StateVarOptions): Promise<string>;
      set(key: string, value: string, options?: StateVarOptions): Promise<ExecResult>;
      clear(key: string, options?: StateVarOptions): Promise<ExecResult>;
      clearAll(options?: StateVarOptions): Promise<ExecResult>;
    };
    logs(): Promise<unknown>;
  };
  plugins: {
    codex: {
      install(): Promise<ExecResult>;
      uninstall(): Promise<ExecResult>;
    };
  };
  raw(args: string[], options?: CommandOptions): Promise<ExecResult>;
}

export interface WorktrunkInstance {
  switch(options?: string | SwitchOptions): Promise<SwitchResult>;
  create(options: string | CreateOptions): Promise<SwitchResult>;
  remove(options?: string | RemoveOptions): Promise<RemoveResult>;
  list(options?: ListOptions): Promise<ListResult>;
  merge(options?: MergeOptions): Promise<MergeResult>;
  hook: HookNamespace;
  step: StepNamespace;
  config: ConfigNamespace;
  raw(args: string[], options?: CommandOptions): Promise<ExecResult>;
  options: NormalizedOptions;
}
```

Update `normalizeOptions`:

```ts
function normalizeOptions(options: WorktrunkOptions | string = {}): NormalizedOptions {
  if (typeof options === 'string') {
    return { binary: options };
  }
  return {
    binary: options.binary || 'wt',
    baseDir: options.baseDir,
    configPath: options.configPath,
  };
}
```

In `createWorktrunkInstance`, create a `baseInstance` typed as `WorktrunkInstance` through a partial object and wire placeholders:

```ts
const baseInstance = { options: normalized } as WorktrunkInstance;

const notImplemented = async (): Promise<any> => {
  throw new Error('Command not implemented yet');
};

return {
  options: normalized,
  switch: notImplemented,
  create: notImplemented,
  remove: notImplemented,
  list: notImplemented,
  merge: notImplemented,
  hook: {
    run: notImplemented,
    show: notImplemented,
  },
  step: {
    commit: notImplemented,
    squash: notImplemented,
    rebase: notImplemented,
    push: notImplemented,
    diff: notImplemented,
    prune: notImplemented,
    tether: notImplemented,
    forEach: notImplemented,
    eval: notImplemented,
    raw: (args, opts) => rawCommand.call(baseInstance, ['step', ...args], opts),
  },
  config: {
    show: notImplemented,
    state: {
      vars: {
        list: notImplemented,
        get: notImplemented,
        set: notImplemented,
        clear: notImplemented,
        clearAll: notImplemented,
      },
      logs: notImplemented,
    },
    plugins: {
      codex: {
        install: notImplemented,
        uninstall: notImplemented,
      },
    },
    raw: (args, opts) => rawCommand.call(baseInstance, ['config', ...args], opts),
  },
  raw: (args, opts) => rawCommand.call(baseInstance, args, opts),
};
```

- [ ] **Step 6: Update exports**

Update `src/index.ts` so it exports `JsonParseError` and new public types:

```ts
export { WorktrunkError, BinaryNotFoundError, CommandFailedError, JsonParseError } from './errors.js';
export type {
  CommandOptions,
  ConfigShowOptions,
  CreateOptions,
  HookRunOptions,
  HookShowResult,
  HookType,
  ListOptions,
  ListResult,
  MergeOptions,
  MergeResult,
  NamedHook,
  RemoveOptions,
  RemoveResult,
  StageMode,
  StateVarOptions,
  StepCommandOptions,
  StepCommitOptions,
  StepPruneOptions,
  StepSquashOptions,
  StepTargetOptions,
  SwitchAction,
  SwitchOptions,
  SwitchResult,
  WorktreeInfo,
  WorktrunkOptions,
} from './types.js';
```

- [ ] **Step 7: Run instance tests and typecheck**

Run:

```bash
pnpm vitest run test/index.test.ts test/unit/instance.test.ts
pnpm lint
```

Expected: tests pass and `pnpm lint` exits with code 0. Integration tests may fail until later tasks replace placeholder command implementations.

- [ ] **Step 8: Commit public shape**

Run:

```bash
git add src/types.ts src/worktrunk.ts src/index.ts src/commands/raw.ts test/index.test.ts test/unit/instance.test.ts
git commit -m "feat: update public 0.53 API shape"
```

## Task 3: Switch, Create, And List JSON Commands

**Files:**
- Modify: `src/commands/switch.ts`
- Modify: `src/commands/list.ts`
- Modify: `src/utils/parser.ts`
- Create: `src/utils/mapper.ts`
- Modify: `src/worktrunk.ts`
- Test: `test/unit/parser.test.ts`
- Test: `test/unit/mapper.test.ts`
- Test: `test/integration/switch.integration.test.ts`
- Test: `test/integration/list.integration.test.ts`

- [ ] **Step 1: Write mapper tests**

Add `test/unit/mapper.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mapListItem, mapSwitchResult } from '../../src/utils/mapper.js';

describe('mapSwitchResult', () => {
  it('maps switch JSON directly', () => {
    expect(mapSwitchResult({
      action: 'already_at',
      branch: 'main',
      path: '/repo/main',
    })).toEqual({
      action: 'already_at',
      branch: 'main',
      path: '/repo/main',
    });
  });
});

describe('mapListItem', () => {
  it('maps snake_case list item fields to camelCase', () => {
    expect(mapListItem({
      branch: 'feature',
      path: '/repo/feature',
      kind: 'worktree',
      is_main: false,
      is_current: true,
      is_previous: false,
      commit: {
        sha: 'abcdef',
        short_sha: 'abc',
        message: 'feat: test',
        timestamp: 123,
      },
      working_tree: {
        staged: true,
        modified: false,
        untracked: true,
        renamed: false,
        deleted: false,
        diff: { added: 2, deleted: 1 },
      },
      main_state: 'integrated',
      integration_reason: 'ancestor',
      remote: { name: 'origin', branch: 'feature', ahead: 1, behind: 2 },
      main: { ahead: 3, behind: 4 },
      statusline: 'feature',
      symbols: '⊂',
    })).toEqual({
      branch: 'feature',
      path: '/repo/feature',
      kind: 'worktree',
      isMain: false,
      isCurrent: true,
      isPrevious: false,
      commit: {
        sha: 'abcdef',
        shortSha: 'abc',
        message: 'feat: test',
        timestamp: 123,
      },
      workingTree: {
        staged: true,
        modified: false,
        untracked: true,
        renamed: false,
        deleted: false,
        diff: { added: 2, deleted: 1 },
      },
      mainState: 'integrated',
      integrationReason: 'ancestor',
      remote: { name: 'origin', branch: 'feature', ahead: 1, behind: 2 },
      main: { ahead: 3, behind: 4 },
      statusline: 'feature',
      symbols: '⊂',
    });
  });
});
```

- [ ] **Step 2: Update parser tests for JSON extraction and rich list mapping**

In `test/unit/parser.test.ts`, replace old `parseSwitchOutput` tests with:

```ts
describe('parseSwitchOutput', () => {
  it('parses JSON switch output with trailing human text', () => {
    const result = parseSwitchOutput('{"action":"already_at","branch":"main","path":"/repo/main"}\n○ Already on main');

    expect(result).toEqual({
      action: 'already_at',
      branch: 'main',
      path: '/repo/main',
    });
  });
});
```

Update the first list test expected item to include `isCurrent` and `isPrevious`:

```ts
expect(result.worktrees[0]).toEqual({
  path: '/repo/main',
  branch: 'main',
  kind: 'worktree',
  isMain: true,
  isCurrent: true,
  isPrevious: false,
});
```

- [ ] **Step 3: Run switch/list unit tests and confirm failure**

Run:

```bash
pnpm vitest run test/unit/mapper.test.ts test/unit/parser.test.ts
```

Expected: fails because `src/utils/mapper.ts` does not exist and parser output is still old.

- [ ] **Step 4: Implement mapper utilities**

Create `src/utils/mapper.ts`:

```ts
import type { SwitchResult, WorktreeInfo } from '../types.js';

export function mapSwitchResult(input: any): SwitchResult {
  return {
    action: input.action ?? '',
    branch: input.branch ?? '',
    path: input.path ?? '',
  };
}

export function mapListItem(item: any): WorktreeInfo {
  return {
    branch: item.branch ?? '',
    path: item.path ?? '',
    kind: item.kind ?? 'worktree',
    isMain: Boolean(item.is_main),
    isCurrent: Boolean(item.is_current),
    isPrevious: Boolean(item.is_previous),
    commit: item.commit
      ? {
          sha: item.commit.sha,
          shortSha: item.commit.short_sha,
          message: item.commit.message,
          timestamp: item.commit.timestamp,
        }
      : undefined,
    workingTree: item.working_tree
      ? {
          staged: Boolean(item.working_tree.staged),
          modified: Boolean(item.working_tree.modified),
          untracked: Boolean(item.working_tree.untracked),
          renamed: Boolean(item.working_tree.renamed),
          deleted: Boolean(item.working_tree.deleted),
          diff: item.working_tree.diff,
        }
      : undefined,
    mainState: item.main_state,
    integrationReason: item.integration_reason,
    remote: item.remote,
    main: item.main,
    ci: item.ci,
    url: item.url,
    summary: item.summary,
    vars: item.vars,
    statusline: item.statusline,
    symbols: item.symbols,
  };
}
```

- [ ] **Step 5: Update parser for JSON-based switch/list**

Modify `src/utils/parser.ts` so `parseSwitchOutput` returns `SwitchResult` and `parseListOutput` uses `mapListItem`:

```ts
import type {
  ListResult,
  WorktreeInfo,
  HookShowResult,
  NamedHook,
  SwitchResult,
} from '../types.js';
import { extractFirstJsonValue } from './json.js';
import { mapListItem, mapSwitchResult } from './mapper.js';
```

Replace `parseListOutput` body with:

```ts
export function parseListOutput(stdout: string): ListResult {
  const json = extractFirstJsonValue(stdout);
  if (!json) return { worktrees: [], current: '' };

  try {
    const data = JSON.parse(json);
    const worktrees: WorktreeInfo[] = [];
    let current = '';

    for (const item of data) {
      if (item.kind !== 'worktree') continue;
      const worktree = mapListItem(item);
      worktrees.push(worktree);
      if (worktree.isCurrent) current = worktree.branch;
    }

    return { worktrees, current };
  } catch {
    return { worktrees: [], current: '' };
  }
}
```

Replace `parseSwitchOutput` with:

```ts
export function parseSwitchOutput(output: string): SwitchResult {
  const json = extractFirstJsonValue(output);
  if (!json) return { action: '', branch: '', path: '' };

  try {
    return mapSwitchResult(JSON.parse(json));
  } catch {
    return { action: '', branch: '', path: '' };
  }
}
```

- [ ] **Step 6: Implement switch/create JSON command**

Replace `src/commands/switch.ts` with:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { CreateOptions, SwitchOptions, SwitchResult } from '../types.js';
import { executeJson } from '../utils/executor.js';
import { mapSwitchResult } from '../utils/mapper.js';

export async function switchCommand(
  this: WorktrunkInstance,
  options: string | SwitchOptions = {}
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { branch: options } : options;
  const args = buildSwitchArgs(opts);
  const result = await executeJson<Record<string, unknown>>(args, this.options);
  return mapSwitchResult(result);
}

export async function createCommand(
  this: WorktrunkInstance,
  options: string | CreateOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { branch: options } : options;
  return switchCommand.call(this, { ...opts, create: true });
}

export function buildSwitchArgs(options: SwitchOptions): string[] {
  const args = ['switch', '--format=json'];

  if (options.create) args.push('--create');
  if (options.branches) args.push('--branches');
  if (options.remotes) args.push('--remotes');
  if (options.base) args.push('--base', options.base);
  if (options.clobber) args.push('--clobber');
  if (options.noCd) args.push('--no-cd');
  if (options.noHooks) args.push('--no-hooks');
  if (options.yes) args.push('--yes');

  if (options.execute) {
    const execute = Array.isArray(options.execute) ? options.execute : [options.execute];
    const [program] = execute;
    args.push('--execute', program);
  }

  if (options.branch) args.push(options.branch);

  const executeArgs = [
    ...(Array.isArray(options.execute) ? options.execute.slice(1) : []),
    ...(options.executeArgs ?? []),
  ];
  if (executeArgs.length > 0) args.push('--', ...executeArgs);

  return args;
}
```

- [ ] **Step 7: Implement list JSON command**

Replace `src/commands/list.ts` with:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { ListOptions, ListResult } from '../types.js';
import { executeJson } from '../utils/executor.js';
import { mapListItem } from '../utils/mapper.js';

export async function listCommand(
  this: WorktrunkInstance,
  options: ListOptions = {}
): Promise<ListResult> {
  const data = await executeJson<any[]>(buildListArgs(options), this.options);
  const worktrees = data
    .filter((item) => item.kind === 'worktree')
    .map(mapListItem);
  const current = worktrees.find((worktree) => worktree.isCurrent)?.branch ?? '';

  return { worktrees, current };
}

export function buildListArgs(options: ListOptions = {}): string[] {
  const args = ['list', '--format=json'];
  if (options.full) args.push('--full');
  if (options.branches) args.push('--branches');
  if (options.remotes) args.push('--remotes');
  return args;
}
```

- [ ] **Step 8: Wire switch/create/list into the instance**

In `src/worktrunk.ts`, import commands:

```ts
import { switchCommand, createCommand } from './commands/switch.js';
import { listCommand } from './commands/list.js';
```

Replace placeholder methods:

```ts
switch: (opts) => switchCommand.call(baseInstance, opts ?? {}),
create: (opts) => createCommand.call(baseInstance, opts),
list: (opts) => listCommand.call(baseInstance, opts ?? {}),
```

- [ ] **Step 9: Update integration tests for branch API and JSON results**

In `test/integration/switch.integration.test.ts`, replace `name` option usage:

```ts
await wt.switch({ branch: 'feature-b', create: true });
await wt.switch({ branch: 'feature-from-develop', create: true, base: 'develop' });
```

Assert JSON result fields:

```ts
expect(result.branch).toBe('feature-b');
expect(result.path).toContain('feature-b');
expect(['created', 'switched', 'already_at']).toContain(result.action);
```

In `test/integration/list.integration.test.ts`, call:

```ts
const result = await wt.list({ full: true });
```

And assert:

```ts
expect(result.worktrees[0]).toHaveProperty('isCurrent');
expect(result.worktrees[0]).toHaveProperty('kind');
```

- [ ] **Step 10: Run switch/list tests**

Run:

```bash
pnpm vitest run test/unit/mapper.test.ts test/unit/parser.test.ts test/integration/switch.integration.test.ts test/integration/list.integration.test.ts
pnpm lint
```

Expected: all listed tests pass and `pnpm lint` exits with code 0.

- [ ] **Step 11: Commit switch/list migration**

Run:

```bash
git add src/commands/switch.ts src/commands/list.ts src/utils/parser.ts src/utils/mapper.ts src/worktrunk.ts test/unit/parser.test.ts test/unit/mapper.test.ts test/integration/switch.integration.test.ts test/integration/list.integration.test.ts
git commit -m "feat: migrate switch and list to 0.53 json"
```

## Task 4: Remove And Merge JSON Commands

**Files:**
- Modify: `src/commands/remove.ts`
- Modify: `src/commands/merge.ts`
- Modify: `src/worktrunk.ts`
- Test: `test/unit/remove.test.ts`
- Test: `test/unit/merge.test.ts`
- Test: `test/integration/remove.integration.test.ts`
- Test: `test/integration/merge.integration.test.ts`

- [ ] **Step 1: Write remove builder tests**

Add `test/unit/remove.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildRemoveArgs, mapRemoveResult } from '../../src/commands/remove.js';

describe('buildRemoveArgs', () => {
  it('builds foreground json remove args', () => {
    expect(buildRemoveArgs({
      branches: ['old-a', 'old-b'],
      keepBranch: true,
      force: true,
      forceDelete: true,
      noHooks: true,
      yes: true,
    })).toEqual([
      'remove',
      '--format=json',
      '--foreground',
      '--no-delete-branch',
      '--force',
      '--force-delete',
      '--no-hooks',
      '--yes',
      'old-a',
      'old-b',
    ]);
  });
});

describe('mapRemoveResult', () => {
  it('normalizes common remove json shapes', () => {
    expect(mapRemoveResult({ branch: 'old-a', path: '/repo/old-a' })).toEqual({
      removed: [{ branch: 'old-a', path: '/repo/old-a' }],
      raw: { branch: 'old-a', path: '/repo/old-a' },
    });
  });
});
```

- [ ] **Step 2: Write merge builder tests**

Add `test/unit/merge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildMergeArgs, mapMergeResult } from '../../src/commands/merge.js';

describe('buildMergeArgs', () => {
  it('builds json merge args with disabled defaults', () => {
    expect(buildMergeArgs({
      target: 'develop',
      squash: false,
      commit: false,
      rebase: false,
      remove: false,
      ff: false,
      stage: 'tracked',
      noHooks: true,
      yes: true,
    })).toEqual([
      'merge',
      '--format=json',
      '--no-squash',
      '--no-commit',
      '--no-rebase',
      '--no-remove',
      '--no-ff',
      '--stage',
      'tracked',
      '--no-hooks',
      '--yes',
      'develop',
    ]);
  });
});

describe('mapMergeResult', () => {
  it('preserves raw json and maps common fields', () => {
    expect(mapMergeResult({ target: 'main', source: 'feature', path: '/repo/main' })).toEqual({
      target: 'main',
      source: 'feature',
      branch: undefined,
      path: '/repo/main',
      raw: { target: 'main', source: 'feature', path: '/repo/main' },
    });
  });
});
```

- [ ] **Step 3: Run remove/merge unit tests and confirm failure**

Run:

```bash
pnpm vitest run test/unit/remove.test.ts test/unit/merge.test.ts
```

Expected: fails because exported builders and mappers do not exist.

- [ ] **Step 4: Implement remove JSON command**

Replace `src/commands/remove.ts` with:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { RemoveOptions, RemoveResult } from '../types.js';
import { executeJson } from '../utils/executor.js';

export async function removeCommand(
  this: WorktrunkInstance,
  options?: RemoveOptions | string
): Promise<RemoveResult> {
  const opts = typeof options === 'string' ? { branches: [options] } : options ?? {};
  const result = await executeJson<Record<string, unknown>>(buildRemoveArgs(opts), this.options);
  return mapRemoveResult(result);
}

export function buildRemoveArgs(options: RemoveOptions = {}): string[] {
  const args = ['remove', '--format=json', '--foreground'];
  if (options.keepBranch) args.push('--no-delete-branch');
  if (options.force) args.push('--force');
  if (options.forceDelete) args.push('--force-delete');
  if (options.noHooks) args.push('--no-hooks');
  if (options.yes) args.push('--yes');
  if (options.branches?.length) args.push(...options.branches);
  return args;
}

export function mapRemoveResult(raw: Record<string, unknown>): RemoveResult {
  const removedValue = raw.removed;
  const removed = Array.isArray(removedValue)
    ? removedValue.map((item: any) => ({ branch: item.branch, path: item.path }))
    : [{ branch: raw.branch as string | undefined, path: raw.path as string | undefined }];

  return { removed, raw };
}
```

- [ ] **Step 5: Implement merge JSON command**

Replace `src/commands/merge.ts` with:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { MergeOptions, MergeResult } from '../types.js';
import { executeJson } from '../utils/executor.js';

export async function mergeCommand(
  this: WorktrunkInstance,
  options: MergeOptions = {}
): Promise<MergeResult> {
  const result = await executeJson<Record<string, unknown>>(buildMergeArgs(options), this.options);
  return mapMergeResult(result);
}

export function buildMergeArgs(options: MergeOptions = {}): string[] {
  const args = ['merge', '--format=json'];
  if (options.squash === false) args.push('--no-squash');
  if (options.commit === false) args.push('--no-commit');
  if (options.rebase === false) args.push('--no-rebase');
  if (options.remove === false) args.push('--no-remove');
  if (options.ff === false) args.push('--no-ff');
  if (options.stage) args.push('--stage', options.stage);
  if (options.noHooks) args.push('--no-hooks');
  if (options.yes) args.push('--yes');
  if (options.target) args.push(options.target);
  return args;
}

export function mapMergeResult(raw: Record<string, unknown>): MergeResult {
  return {
    target: raw.target as string | undefined,
    source: raw.source as string | undefined,
    branch: raw.branch as string | undefined,
    path: raw.path as string | undefined,
    raw,
  };
}
```

- [ ] **Step 6: Wire remove/merge into the instance**

In `src/worktrunk.ts`, import:

```ts
import { removeCommand } from './commands/remove.js';
import { mergeCommand } from './commands/merge.js';
```

Replace placeholder methods:

```ts
remove: (opts) => removeCommand.call(baseInstance, opts ?? {}),
merge: (opts) => mergeCommand.call(baseInstance, opts ?? {}),
```

- [ ] **Step 7: Update integration tests for new remove/merge options**

In `test/integration/remove.integration.test.ts`, change calls:

```ts
await wt.remove({ branches: ['to-remove'] });
await wt.remove({ branches: ['temp-branch'] });
const result = await wt.remove({ branches: ['keep-branch'], keepBranch: true });
```

Assert:

```ts
expect(result.raw).toBeDefined();
expect(result.removed.length).toBeGreaterThanOrEqual(1);
```

In `test/integration/merge.integration.test.ts`, replace `keepWorktree` with:

```ts
await wt.merge({ remove: false });
```

Assert:

```ts
expect(result.raw).toBeDefined();
```

- [ ] **Step 8: Run remove/merge tests**

Run:

```bash
pnpm vitest run test/unit/remove.test.ts test/unit/merge.test.ts test/integration/remove.integration.test.ts test/integration/merge.integration.test.ts
pnpm lint
```

Expected: all listed tests pass and `pnpm lint` exits with code 0.

- [ ] **Step 9: Commit remove/merge migration**

Run:

```bash
git add src/commands/remove.ts src/commands/merge.ts src/worktrunk.ts test/unit/remove.test.ts test/unit/merge.test.ts test/integration/remove.integration.test.ts test/integration/merge.integration.test.ts
git commit -m "feat: migrate remove and merge to 0.53 json"
```

## Task 5: Hook Namespace

**Files:**
- Modify: `src/commands/hook.ts`
- Modify: `src/worktrunk.ts`
- Modify: `test/integration/hook.integration.test.ts`
- Test: `test/unit/hook.test.ts`

- [ ] **Step 1: Write hook builder tests**

Add `test/unit/hook.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildHookRunArgs } from '../../src/commands/hook.js';

describe('buildHookRunArgs', () => {
  it('builds hook run args', () => {
    expect(buildHookRunArgs({
      type: 'post-start',
      names: ['user:dev', 'project:watch'],
      foreground: true,
      dryRun: true,
      yes: true,
      vars: { port: '3000' },
    })).toEqual([
      'hook',
      'post-start',
      'user:dev',
      'project:watch',
      '--foreground',
      '--dry-run',
      '--yes',
      '--var',
      'port=3000',
    ]);
  });
});
```

- [ ] **Step 2: Run hook unit test and confirm failure**

Run:

```bash
pnpm vitest run test/unit/hook.test.ts
```

Expected: fails because `buildHookRunArgs` does not exist.

- [ ] **Step 3: Replace hook command implementation**

Replace `src/commands/hook.ts` with:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { HookRunOptions, HookResult, HookShowResult } from '../types.js';
import { execute } from '../utils/executor.js';
import { parseHookShowOutput } from '../utils/parser.js';

export async function hookRunCommand(
  this: WorktrunkInstance,
  options: HookRunOptions
): Promise<HookResult> {
  const result = await execute(buildHookRunArgs(options), this.options);
  return {
    hook: options.type,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function hookShowCommand(this: WorktrunkInstance): Promise<HookShowResult> {
  const result = await execute(['hook', 'show'], this.options);
  return parseHookShowOutput(result.stdout);
}

export function buildHookRunArgs(options: HookRunOptions): string[] {
  const args = ['hook', options.type];
  if (options.names?.length) args.push(...options.names);
  if (options.foreground) args.push('--foreground');
  if (options.dryRun) args.push('--dry-run');
  if (options.yes) args.push('--yes');
  if (options.vars) {
    for (const [key, value] of Object.entries(options.vars)) {
      args.push('--var', `${key}=${value}`);
    }
  }
  return args;
}
```

- [ ] **Step 4: Wire hook namespace**

In `src/worktrunk.ts`, import:

```ts
import { hookRunCommand, hookShowCommand } from './commands/hook.js';
```

Replace hook namespace placeholder:

```ts
hook: {
  run: (opts) => hookRunCommand.call(baseInstance, opts),
  show: () => hookShowCommand.call(baseInstance),
},
```

- [ ] **Step 5: Update integration hook tests for 0.53 no-op success**

Replace `test/integration/hook.integration.test.ts` with:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo.js';
import { worktrunk } from '../../src/index.js';
import { rmSync, existsSync } from 'node:fs';

describe('hook (integration)', () => {
  let repo: TestRepo;

  beforeEach(async () => {
    repo = await TestRepo.create();
  });

  afterEach(async () => {
    const basePath = repo.path.replace(/\/main$/, '');
    if (existsSync(basePath)) {
      rmSync(basePath, { recursive: true, force: true });
    }
  });

  it('shows configured hooks', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.hook.show();

    expect(result.hooks).toBeDefined();
    expect(typeof result.hooks).toBe('object');
  });

  it('treats missing hook configuration as a no-op success', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.hook.run({ type: 'post-start', yes: true });

    expect(result.hook).toBe('post-start');
    expect(result.stdout).toBeDefined();
    expect(result.stderr).toBeDefined();
  });

  it('supports dry-run for named hook filters', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.hook.run({
      type: 'post-start',
      names: ['test'],
      dryRun: true,
      yes: true,
    });

    expect(result.hook).toBe('post-start');
  });
});
```

- [ ] **Step 6: Run hook tests**

Run:

```bash
pnpm vitest run test/unit/hook.test.ts test/integration/hook.integration.test.ts
pnpm lint
```

Expected: tests pass and `pnpm lint` exits with code 0.

- [ ] **Step 7: Commit hook namespace**

Run:

```bash
git add src/commands/hook.ts src/worktrunk.ts test/unit/hook.test.ts test/integration/hook.integration.test.ts
git commit -m "feat: add 0.53 hook namespace"
```

## Task 6: Step Namespace

**Files:**
- Create: `src/commands/step.ts`
- Modify: `src/worktrunk.ts`
- Test: `test/unit/step.test.ts`
- Test: `test/integration/step.integration.test.ts`

- [ ] **Step 1: Write step builder tests**

Add `test/unit/step.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildStepArgs } from '../../src/commands/step.js';

describe('buildStepArgs', () => {
  it('builds commit args', () => {
    expect(buildStepArgs('commit', { branch: 'feature', stage: 'tracked', dryRun: true, noHooks: true })).toEqual([
      'step',
      'commit',
      '--branch',
      'feature',
      '--stage',
      'tracked',
      '--dry-run',
      '--no-hooks',
      '--format=json',
    ]);
  });

  it('builds prune args', () => {
    expect(buildStepArgs('prune', { dryRun: true, minAge: '0s', foreground: true })).toEqual([
      'step',
      'prune',
      '--dry-run',
      '--min-age',
      '0s',
      '--foreground',
      '--format=json',
    ]);
  });

  it('builds argv command args after delimiter', () => {
    expect(buildStepArgs('tether', { command: ['npm', 'run', 'dev'] })).toEqual([
      'step',
      'tether',
      '--',
      'npm',
      'run',
      'dev',
    ]);
  });
});
```

- [ ] **Step 2: Write step integration test**

Add `test/integration/step.integration.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import { worktrunk } from '../../src/index.js';
import { TestRepo } from '../fixtures/test-repo.js';

describe('step (integration)', () => {
  let repo: TestRepo;

  beforeEach(async () => {
    repo = await TestRepo.create();
  });

  afterEach(async () => {
    const basePath = repo.path.replace(/\/main$/, '');
    if (existsSync(basePath)) {
      rmSync(basePath, { recursive: true, force: true });
    }
  });

  it('evaluates a template expression', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    await wt.config.state.vars.set('env', 'staging');

    const result = await wt.step.eval('{{ vars.env }}');

    expect(result).toBe('staging');
  });
});
```

- [ ] **Step 3: Run step tests and confirm failure**

Run:

```bash
pnpm vitest run test/unit/step.test.ts test/integration/step.integration.test.ts
```

Expected: fails because `src/commands/step.ts` and config vars implementation do not exist yet.

- [ ] **Step 4: Implement step namespace commands**

Create `src/commands/step.ts`:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type {
  StepCommandOptions,
  StepCommitOptions,
  StepPruneOptions,
  StepSquashOptions,
  StepTargetOptions,
} from '../types.js';
import { execute, type ExecResult } from '../utils/executor.js';

type StepName = 'commit' | 'squash' | 'rebase' | 'push' | 'diff' | 'prune' | 'tether' | 'for-each';

export async function stepCommitCommand(this: WorktrunkInstance, options: StepCommitOptions = {}): Promise<ExecResult> {
  return execute(buildStepArgs('commit', options), this.options);
}

export async function stepSquashCommand(this: WorktrunkInstance, options: StepSquashOptions = {}): Promise<ExecResult> {
  return execute(buildStepArgs('squash', options), this.options);
}

export async function stepRebaseCommand(this: WorktrunkInstance, options: StepTargetOptions = {}): Promise<ExecResult> {
  return execute(buildStepArgs('rebase', options), this.options);
}

export async function stepPushCommand(this: WorktrunkInstance, options: StepTargetOptions = {}): Promise<ExecResult> {
  return execute(buildStepArgs('push', options), this.options);
}

export async function stepDiffCommand(this: WorktrunkInstance, options: StepTargetOptions = {}): Promise<ExecResult> {
  return execute(buildStepArgs('diff', options), this.options);
}

export async function stepPruneCommand(this: WorktrunkInstance, options: StepPruneOptions = {}): Promise<ExecResult> {
  return execute(buildStepArgs('prune', options), this.options);
}

export async function stepTetherCommand(this: WorktrunkInstance, options: StepCommandOptions): Promise<ExecResult> {
  return execute(buildStepArgs('tether', options), this.options);
}

export async function stepForEachCommand(this: WorktrunkInstance, options: StepCommandOptions): Promise<ExecResult> {
  return execute(buildStepArgs('for-each', options), this.options);
}

export async function stepEvalCommand(
  this: WorktrunkInstance,
  expression: string
): Promise<string> {
  const args = ['step', 'eval'];
  args.push(expression);
  const result = await execute(args, this.options);
  return result.stdout.trim();
}

export function buildStepArgs(name: StepName, options: any = {}): string[] {
  const args = ['step', name];

  if (name === 'commit' && options.branch) args.push('--branch', options.branch);
  if ((name === 'commit' || name === 'squash') && options.stage) args.push('--stage', options.stage);
  if ((name === 'commit' || name === 'squash') && options.dryRun) args.push('--dry-run');
  if ((name === 'commit' || name === 'squash') && options.noHooks) args.push('--no-hooks');
  if ((name === 'squash' || name === 'rebase' || name === 'push' || name === 'diff') && options.target) args.push(options.target);

  if (name === 'prune') {
    if (options.dryRun) args.push('--dry-run');
    if (options.minAge) args.push('--min-age', options.minAge);
    if (options.foreground) args.push('--foreground');
  }

  if (name === 'commit' || name === 'squash' || name === 'prune' || name === 'for-each') {
    args.push('--format=json');
  }

  if ((name === 'tether' || name === 'for-each') && options.command?.length) {
    args.push('--', ...options.command);
  }

  return args;
}
```

- [ ] **Step 5: Wire step namespace**

In `src/worktrunk.ts`, import:

```ts
import {
  stepCommitCommand,
  stepDiffCommand,
  stepEvalCommand,
  stepForEachCommand,
  stepPruneCommand,
  stepPushCommand,
  stepRebaseCommand,
  stepSquashCommand,
  stepTetherCommand,
} from './commands/step.js';
```

Replace step namespace placeholders:

```ts
step: {
  commit: (opts) => stepCommitCommand.call(baseInstance, opts ?? {}),
  squash: (opts) => stepSquashCommand.call(baseInstance, opts ?? {}),
  rebase: (opts) => stepRebaseCommand.call(baseInstance, opts ?? {}),
  push: (opts) => stepPushCommand.call(baseInstance, opts ?? {}),
  diff: (opts) => stepDiffCommand.call(baseInstance, opts ?? {}),
  prune: (opts) => stepPruneCommand.call(baseInstance, opts ?? {}),
  tether: (opts) => stepTetherCommand.call(baseInstance, opts),
  forEach: (opts) => stepForEachCommand.call(baseInstance, opts),
  eval: (expr) => stepEvalCommand.call(baseInstance, expr),
  raw: (args, opts) => rawCommand.call(baseInstance, ['step', ...args], opts),
},
```

- [ ] **Step 6: Run step unit tests**

Run:

```bash
pnpm vitest run test/unit/step.test.ts
pnpm lint
```

Expected: unit tests pass and `pnpm lint` exits with code 0. Integration test still fails until config vars exists in Task 7.

- [ ] **Step 7: Commit step namespace**

Run:

```bash
git add src/commands/step.ts src/worktrunk.ts test/unit/step.test.ts test/integration/step.integration.test.ts
git commit -m "feat: add step namespace"
```

## Task 7: Config Namespace

**Files:**
- Create: `src/commands/config.ts`
- Modify: `src/worktrunk.ts`
- Test: `test/unit/config.test.ts`
- Test: `test/integration/config.integration.test.ts`
- Test: `test/integration/step.integration.test.ts`

- [ ] **Step 1: Write config builder tests**

Add `test/unit/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildConfigShowArgs, buildStateVarsArgs } from '../../src/commands/config.js';

describe('buildConfigShowArgs', () => {
  it('builds json full config show args', () => {
    expect(buildConfigShowArgs({ full: true, format: 'json' })).toEqual([
      'config',
      'show',
      '--full',
      '--format=json',
    ]);
  });
});

describe('buildStateVarsArgs', () => {
  it('builds set args with branch', () => {
    expect(buildStateVarsArgs('set', { key: 'env', value: 'staging', branch: 'main' })).toEqual([
      'config',
      'state',
      'vars',
      'set',
      'env=staging',
      '--branch',
      'main',
    ]);
  });

  it('builds clear all args', () => {
    expect(buildStateVarsArgs('clearAll', {})).toEqual([
      'config',
      'state',
      'vars',
      'clear',
      '--all',
    ]);
  });
});
```

- [ ] **Step 2: Write config integration tests**

Add `test/integration/config.integration.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import { worktrunk } from '../../src/index.js';
import { TestRepo } from '../fixtures/test-repo.js';

describe('config (integration)', () => {
  let repo: TestRepo;

  beforeEach(async () => {
    repo = await TestRepo.create();
  });

  afterEach(async () => {
    const basePath = repo.path.replace(/\/main$/, '');
    if (existsSync(basePath)) {
      rmSync(basePath, { recursive: true, force: true });
    }
  });

  it('reads config show json', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.config.show({ format: 'json' });

    expect(result).toHaveProperty('project');
    expect(result).toHaveProperty('user');
  });

  it('sets lists gets and clears state vars', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });

    await wt.config.state.vars.set('env', 'staging');
    expect(await wt.config.state.vars.get('env')).toBe('staging');
    expect(await wt.config.state.vars.list()).toContain('env');
    await wt.config.state.vars.clear('env');
    expect(await wt.config.state.vars.list()).not.toContain('env');
  });

  it('reads logs json', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.config.state.logs();

    expect(result).toHaveProperty('command_log');
    expect(result).toHaveProperty('hook_output');
    expect(result).toHaveProperty('diagnostic');
  });
});
```

- [ ] **Step 3: Run config tests and confirm failure**

Run:

```bash
pnpm vitest run test/unit/config.test.ts test/integration/config.integration.test.ts test/integration/step.integration.test.ts
```

Expected: fails because `src/commands/config.ts` does not exist and config namespace placeholders throw.

- [ ] **Step 4: Implement config commands**

Create `src/commands/config.ts`:

```ts
import type { WorktrunkInstance } from '../worktrunk.js';
import type { ConfigShowOptions, StateVarOptions } from '../types.js';
import { execute, executeJson, type ExecResult } from '../utils/executor.js';

type VarsAction = 'list' | 'get' | 'set' | 'clear' | 'clearAll';

interface VarsArgs {
  key?: string;
  value?: string;
  branch?: string;
}

export async function configShowCommand(this: WorktrunkInstance, options: ConfigShowOptions = {}): Promise<unknown> {
  const args = buildConfigShowArgs(options);
  if (options.format === 'json') return executeJson(args, this.options);
  return execute(args, this.options);
}

export async function stateVarsListCommand(this: WorktrunkInstance, options: StateVarOptions = {}): Promise<string[]> {
  const result = await execute(buildStateVarsArgs('list', options), this.options);
  return result.stdout.trim().split(/\r?\n/).filter(Boolean);
}

export async function stateVarsGetCommand(this: WorktrunkInstance, key: string, options: StateVarOptions = {}): Promise<string> {
  const result = await execute(buildStateVarsArgs('get', { ...options, key }), this.options);
  return result.stdout.trim();
}

export async function stateVarsSetCommand(this: WorktrunkInstance, key: string, value: string, options: StateVarOptions = {}): Promise<ExecResult> {
  return execute(buildStateVarsArgs('set', { ...options, key, value }), this.options);
}

export async function stateVarsClearCommand(this: WorktrunkInstance, key: string, options: StateVarOptions = {}): Promise<ExecResult> {
  return execute(buildStateVarsArgs('clear', { ...options, key }), this.options);
}

export async function stateVarsClearAllCommand(this: WorktrunkInstance, options: StateVarOptions = {}): Promise<ExecResult> {
  return execute(buildStateVarsArgs('clearAll', options), this.options);
}

export async function stateLogsCommand(this: WorktrunkInstance): Promise<unknown> {
  return executeJson(['config', 'state', 'logs', '--format=json'], this.options);
}

export async function codexInstallCommand(this: WorktrunkInstance): Promise<ExecResult> {
  return execute(['config', 'plugins', 'codex', 'install'], this.options);
}

export async function codexUninstallCommand(this: WorktrunkInstance): Promise<ExecResult> {
  return execute(['config', 'plugins', 'codex', 'uninstall'], this.options);
}

export function buildConfigShowArgs(options: ConfigShowOptions = {}): string[] {
  const args = ['config', 'show'];
  if (options.full) args.push('--full');
  if (options.format) args.push(`--format=${options.format}`);
  return args;
}

export function buildStateVarsArgs(action: VarsAction, options: VarsArgs): string[] {
  const args = ['config', 'state', 'vars'];
  if (action === 'clearAll') {
    args.push('clear', '--all');
  } else {
    args.push(action);
    if (action === 'set') args.push(`${options.key}=${options.value ?? ''}`);
    if (action === 'get' || action === 'clear') args.push(options.key ?? '');
  }
  if (options.branch) args.push('--branch', options.branch);
  return args;
}
```

- [ ] **Step 5: Wire config namespace**

In `src/worktrunk.ts`, import:

```ts
import {
  codexInstallCommand,
  codexUninstallCommand,
  configShowCommand,
  stateLogsCommand,
  stateVarsClearAllCommand,
  stateVarsClearCommand,
  stateVarsGetCommand,
  stateVarsListCommand,
  stateVarsSetCommand,
} from './commands/config.js';
```

Replace config namespace placeholders:

```ts
config: {
  show: (opts) => configShowCommand.call(baseInstance, opts ?? {}),
  state: {
    vars: {
      list: (opts) => stateVarsListCommand.call(baseInstance, opts ?? {}),
      get: (key, opts) => stateVarsGetCommand.call(baseInstance, key, opts ?? {}),
      set: (key, value, opts) => stateVarsSetCommand.call(baseInstance, key, value, opts ?? {}),
      clear: (key, opts) => stateVarsClearCommand.call(baseInstance, key, opts ?? {}),
      clearAll: (opts) => stateVarsClearAllCommand.call(baseInstance, opts ?? {}),
    },
    logs: () => stateLogsCommand.call(baseInstance),
  },
  plugins: {
    codex: {
      install: () => codexInstallCommand.call(baseInstance),
      uninstall: () => codexUninstallCommand.call(baseInstance),
    },
  },
  raw: (args, opts) => rawCommand.call(baseInstance, ['config', ...args], opts),
},
```

- [ ] **Step 6: Run config and step integration tests**

Run:

```bash
pnpm vitest run test/unit/config.test.ts test/integration/config.integration.test.ts test/integration/step.integration.test.ts
pnpm lint
```

Expected: tests pass and `pnpm lint` exits with code 0.

- [ ] **Step 7: Commit config namespace**

Run:

```bash
git add src/commands/config.ts src/worktrunk.ts test/unit/config.test.ts test/integration/config.integration.test.ts test/integration/step.integration.test.ts
git commit -m "feat: add config namespace"
```

## Task 8: Integration Version Guard And Full Test Repair

**Files:**
- Create: `test/integration/version-guard.ts`
- Modify: `test/integration/*.integration.test.ts`

- [ ] **Step 1: Add integration-only version guard helper**

Create `test/integration/version-guard.ts`:

```ts
import { beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { isAtLeastVersion, parseWorktrunkVersion } from '../../src/utils/version.js';

beforeAll(() => {
  const output = execFileSync('wt', ['--version'], { encoding: 'utf8' });
  const version = parseWorktrunkVersion(output);

  if (!version || !isAtLeastVersion(version, { major: 0, minor: 53, patch: 0 })) {
    throw new Error(`Integration tests require worktrunk >= 0.53.0; found ${output.trim()}`);
  }
});
```

- [ ] **Step 2: Import the guard from each integration test file**

Add this import as the first import in every `test/integration/*.integration.test.ts` file:

```ts
import './version-guard.js';
```

- [ ] **Step 3: Run full test suite and collect failures**

Run:

```bash
pnpm test:run
```

Expected: remaining failures are old API call sites or assertions in integration tests.

- [ ] **Step 4: Update remaining old API call sites**

Search:

```bash
rg -n "hookShow|post-create|name:|exec:|keepWorktree|target:" test src README.md README.zh-CN.md
```

For test files, make these replacements:

```ts
// Old
await wt.switch({ name: 'feature', create: true });
await wt.create({ name: 'feature' });
await wt.merge({ keepWorktree: true });
await wt.hookShow();

// New
await wt.switch({ branch: 'feature', create: true });
await wt.create({ branch: 'feature' });
await wt.merge({ remove: false });
await wt.hook.show();
```

- [ ] **Step 5: Run full tests and typecheck**

Run:

```bash
pnpm test:run
pnpm lint
pnpm build
```

Expected: all tests pass, typecheck passes, build succeeds.

- [ ] **Step 6: Commit test repair**

Run:

```bash
git add test src
git commit -m "test: require worktrunk 0.53"
```

## Task 9: Documentation And Package Metadata

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `package.json`

- [ ] **Step 1: Update package metadata**

In `package.json`, update description:

```json
"description": "A TypeScript SDK wrapper for worktrunk 0.53+"
```

Update version to `0.2.0`:

```json
"version": "0.2.0"
```

- [ ] **Step 2: Rewrite README quick start**

In `README.md`, replace the quick start block with:

~~~md
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
~~~

- [ ] **Step 3: Add README migration notes**

Add this section to `README.md`:

```md
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
```

- [ ] **Step 4: Mirror English documentation changes in Chinese README**

In `README.zh-CN.md`, add:

```md
## 环境要求

- Node.js >= 18
- worktrunk CLI >= 0.53.0
```

Add migration table:

```md
## 从 0.1 迁移到 0.2

`simple-worktrunk` 0.2 面向 worktrunk 0.53+，并且有意清理了 0.1 API。

| 0.1 API | 0.2 API |
| --- | --- |
| `name` | `branch` |
| `exec` | `execute` |
| `hookShow()` | `hook.show()` |
| `hook({ type: 'post-create' })` | `hook.run({ type: 'post-start' })` |
| 从文本推断结果 | 基于 JSON 的结果 |

尚未封装的 worktrunk CLI 功能可以通过 `wt.raw(args)` 调用。
```

- [ ] **Step 5: Run documentation sanity checks**

Run:

```bash
rg -n "post-create|hookShow\\(|exec:|name:" README.md README.zh-CN.md src test
pnpm lint
pnpm build
```

Expected: `rg` returns no old API references except migration tables, `pnpm lint` exits with code 0, and `pnpm build` succeeds.

- [ ] **Step 6: Commit docs**

Run:

```bash
git add README.md README.zh-CN.md package.json
git commit -m "docs: document worktrunk 0.53 api"
```

## Task 10: Final Verification

**Files:**
- Verify: whole repository

- [ ] **Step 1: Run all verification commands**

Run:

```bash
pnpm test:run
pnpm lint
pnpm build
git status --short
```

Expected:

- `pnpm test:run` passes.
- `pnpm lint` exits with code 0.
- `pnpm build` succeeds.
- `git status --short` prints no tracked file changes.

- [ ] **Step 2: Inspect public declarations**

Run:

```bash
sed -n '1,260p' dist/index.d.ts
```

Expected: declarations include `hook.run`, `hook.show`, `step`, `config`, `raw`, `JsonParseError`, `branch`, and `execute`. They do not expose `hookShow`, `post-create`, or `exec`.

- [ ] **Step 3: Commit final generated build output if tracked**

Run:

```bash
git status --short dist
```

If `dist` has tracked changes, run:

```bash
git add dist
git commit -m "build: update generated declarations"
```

If `dist` has no tracked changes, do not create a commit.

- [ ] **Step 4: Report completion**

Summarize:

- New public API shape.
- Verification commands and results.
- Any upstream worktrunk issues observed during testing.
