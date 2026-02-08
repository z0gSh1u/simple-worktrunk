# simple-worktrunk Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a TypeScript Node.js library that wraps the worktrunk CLI with a clean, chainable, promise-based API similar to simple-git.

**Architecture:** Thin wrapper around `wt` CLI binary using Node.js child_process spawn. Each command returns a chainable promise that resolves to parsed structured output. TypeScript provides full type safety.

**Tech Stack:** TypeScript, Node.js (no runtime deps), pnpm, vitest, tsup

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.npmrc`

**Step 1: Create package.json**

```json
{
  "name": "simple-worktrunk",
  "version": "0.0.1",
  "description": "A lightweight wrapper for worktrunk CLI",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "test:run": "vitest run",
    "dev": "tsup --watch",
    "lint": "tsc"
  },
  "devDependencies": {
    "@types/node": "^20",
    "tsup": "^8",
    "typescript": "^5",
    "vitest": "^2"
  },
  "engines": {
    "node": ">=18"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
*.log
.DS_Store
coverage/
.npmrc
```

**Step 4: Create .npmrc**

```
package-manager-strict=false
```

**Step 5: Install dependencies**

Run: `pnpm install`
Expected: All devDependencies installed successfully

**Step 6: Create vitest config**

Create: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

**Step 7: Commit**

```bash
git add package.json tsconfig.json .gitignore .npmrc vitest.config.ts pnpm-lock.yaml
git commit -m "chore: project setup with pnpm, typescript, and vitest"
```

---

## Task 2: Core Type Definitions

**Files:**
- Create: `src/types.ts`

**Step 1: Write type definitions**

```typescript
// Hook types
export type HookType =
  | 'post-create'
  | 'post-switch'
  | 'pre-merge'
  | 'post-merge'
  | 'pre-remove'
  | 'post-remove';

// Switch options and result
export interface SwitchOptions {
  name?: string;
  create?: boolean;
  base?: string;
  exec?: string;
  noCd?: boolean;
}

export interface SwitchResult {
  worktree: string;
  path: string;
  branch: string;
  created: boolean;
}

// Create options (alias for switch with create=true)
export interface CreateOptions {
  name: string;
  base?: string;
  exec?: string;
  noCd?: boolean;
}

// Remove options and result
export interface RemoveOptions {
  name?: string;
  keepBranch?: boolean;
}

export interface RemoveResult {
  removed: string;
  branchDeleted: boolean;
}

// List result
export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  isMain: boolean;
}

export interface ListResult {
  worktrees: WorktreeInfo[];
  current: string;
}

// Merge options and result
export interface MergeOptions {
  target?: string;
  keepWorktree?: boolean;
}

export interface MergeResult {
  merged: string;
  target: string;
  worktreeRemoved: boolean;
}

// Hook options and result
export interface HookOptions {
  type: HookType;
  name?: string;
  userOnly?: boolean;
  projectOnly?: boolean;
  yes?: boolean;
  vars?: Record<string, string>;
}

export interface HookExecution {
  name: string;
  source: 'user' | 'project';
  success: boolean;
  output?: string;
}

export interface HookResult {
  hook: string;
  executed: HookExecution[];
}

// Hook show result
export interface NamedHook {
  name?: string;
  command: string;
  source: 'user' | 'project';
}

export interface HookShowResult {
  hooks: Record<string, NamedHook[]>;
}

// Worktrunk instance options
export interface WorktrunkOptions {
  binary?: string;
  baseDir?: string;
}

// Normalized options (internal)
export interface NormalizedOptions {
  binary: string;
  baseDir?: string;
}
```

**Step 2: Run TypeScript check**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add core type definitions"
```

---

## Task 3: Error Classes

**Files:**
- Create: `src/errors.ts`

**Step 1: Write error classes**

```typescript
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

export class CommandFailedError extends WorktrunkError {
  constructor(command: string, exitCode: number | string, stderr?: string) {
    super(
      `Command '${command}' failed with exit code ${exitCode}${stderr ? ': ' + stderr : ''}`,
      String(exitCode),
      command
    );
    this.name = 'CommandFailedError';
  }
}
```

**Step 4: Commit**

```bash
git add src/errors.ts
git commit -m "feat: add error classes"
```

---

## Task 4: Command Executor

**Files:**
- Create: `src/utils/executor.ts`

**Step 1: Write executor utility**

```typescript
import { spawn } from 'node:child_process';
import { BinaryNotFoundError, CommandFailedError } from '../errors.js';
import type { NormalizedOptions } from '../types.js';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function execCommand(
  args: string[],
  options: NormalizedOptions
): Promise<string> {
  const { binary, baseDir } = options;

  const result = await spawnCommand(binary, args, baseDir);

  if (result.exitCode !== 0) {
    throw new CommandFailedError(
      `${binary} ${args.join(' ')}`,
      result.exitCode || 'unknown',
      result.stderr
    );
  }

  return result.stdout.trim();
}

async function spawnCommand(
  binary: string,
  args: string[],
  cwd?: string
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(binary, args, {
      cwd,
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
      }
      reject(err);
    });
  });
}
```

**Step 2: Run TypeScript check**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/executor.ts
git commit -m "feat: add command executor utility"
```

---

## Task 5: Output Parser

**Files:**
- Create: `src/utils/parser.ts`

**Step 1: Write parser utility**

```typescript
import type {
  ListResult,
  WorktreeInfo,
  HookShowResult,
  NamedHook,
} from '../types.js';

/**
 * Parse `wt list` output into structured data
 * Input format from CLI: lines with worktree info
 */
export function parseListOutput(stdout: string): ListResult {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const worktrees: WorktreeInfo[] = [];
  let current = '';

  for (const line of lines) {
    // Parse worktree line
    // Format: "worktree-name /path/to/worktree [branch]"
    const match = line.match(/^([^\s]+)\s+([^\s]+)\s+\[([^\]]+)\](\s+\*)?$/);
    if (match) {
      const [, name, path, branch, isCurrent] = match;
      worktrees.push({
        name,
        path,
        branch,
        isMain: name === 'bare' || branch === 'main' || branch === 'master',
      });
      if (isCurrent) {
        current = name;
      }
    }
  }

  return { worktrees, current };
}

/**
 * Parse `wt hook show` output into structured data
 * Input format: TOML-like sections
 */
export function parseHookShowOutput(stdout: string): HookShowResult {
  const hooks: Record<string, NamedHook[]> = {};
  const lines = stdout.trim().split('\n');

  let currentSection = '';
  for (const line of lines) {
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      hooks[currentSection] = [];
      continue;
    }

    const namedHookMatch = line.match(/^(\w+)\s*=\s*"(.+)"$/);
    if (namedHookMatch && currentSection) {
      const [, name, command] = namedHookMatch;
      hooks[currentSection].push({ name, command, source: 'project' });
    }

    const simpleHookMatch = line.match(/^(\w+)\s*=\s*"(.+)"$/);
    if (simpleHookMatch && currentSection) {
      const [, hookType, command] = simpleHookMatch;
      if (!hooks[hookType]) hooks[hookType] = [];
      hooks[hookType].push({ command, source: 'project' });
    }
  }

  return { hooks };
}

/**
 * Parse switch/create output to extract path
 */
export function parseSwitchOutput(stdout: string): { path: string } {
  // Look for path in output
  const pathMatch = stdout.match(/\/[^\s]+/);
  if (pathMatch) {
    return { path: pathMatch[0] };
  }
  return { path: '' };
}
```

**Step 2: Run TypeScript check**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/parser.ts
git commit -m "feat: add output parser utilities"
```

---

## Task 6: Switch Command

**Files:**
- Create: `src/commands/switch.ts`
- Test: `test/commands/switch.test.ts`

**Step 1: Write the failing test**

Create: `test/commands/switch.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { worktrunk } from '../../src/index.js';

// Mock the executor
vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('switch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch to existing worktree', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Switched to feature');

    const wt = worktrunk();
    const result = await wt.switch('feature');

    expect(execCommand).toHaveBeenCalledWith(['switch', 'feature'], expect.anything());
    expect(result.worktree).toBe('feature');
  });

  it('should create new worktree with switch', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Created /path/to/feature');

    const wt = worktrunk();
    const result = await wt.switch({ name: 'feature', create: true });

    expect(execCommand).toHaveBeenCalledWith(['switch', '--create', 'feature'], expect.anything());
    expect(result.created).toBe(true);
  });

  it('should support base option', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Created');

    const wt = worktrunk();
    await wt.switch({ name: 'hotfix', create: true, base: 'production' });

    expect(execCommand).toHaveBeenCalledWith(['switch', '--create', '--base', 'production', 'hotfix'], expect.anything());
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL - switch method doesn't exist yet

**Step 3: Write minimal implementation**

Create: `src/commands/switch.ts`

```typescript
import type { WorktrunkInstance } from '../worktrunk.js';
import type { SwitchOptions, SwitchResult, CreateOptions } from '../types.js';
import { execCommand } from '../utils/executor.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    switch(options: string | SwitchOptions): Promise<SwitchResult>;
    create(options: string | CreateOptions): Promise<SwitchResult>;
  }
}

export async function switchCommand(
  this: WorktrunkInstance,
  options: string | SwitchOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  const { options: config } = this;

  const args = ['switch'];

  if (opts.create) {
    args.push('--create');
  }

  if (opts.base) {
    args.push('--base', opts.base);
  }

  if (opts.exec) {
    args.push('--exec', opts.exec);
  }

  if (opts.noCd) {
    args.push('--no-cd');
  }

  if (opts.name) {
    args.push(opts.name);
  }

  const stdout = await execCommand(args, config);

  return {
    worktree: opts.name || '',
    path: stdout,
    branch: opts.name || '',
    created: opts.create || false,
  };
}

export async function createCommand(
  this: WorktrunkInstance,
  options: string | CreateOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  return this.switch({ ...opts, create: true });
}
```

**Step 4: Implement in worktrunk class**

Modify: `src/worktrunk.ts` (will be created in next task, but update accordingly)

The switch and create methods will be attached to the prototype.

**Step 5: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/commands/switch.ts test/commands/switch.test.ts
git commit -m "feat: implement switch and create commands"
```

---

## Task 7: Remove Command

**Files:**
- Create: `src/commands/remove.ts`
- Test: `test/commands/remove.test.ts`

**Step 1: Write the failing test**

Create: `test/commands/remove.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove current worktree', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Removed feature');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.remove();

    expect(execCommand).toHaveBeenCalledWith(['remove'], expect.anything());
    expect(result.removed).toBeTruthy();
  });

  it('should remove named worktree', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Removed old-feature');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.remove({ name: 'old-feature' });

    expect(execCommand).toHaveBeenCalledWith(['remove', 'old-feature'], expect.anything());
  });

  it('should keep branch when requested', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Removed worktree, branch kept');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.remove({ name: 'test', keepBranch: true });

    expect(execCommand).toHaveBeenCalledWith(['remove', '--keep-branch', 'test'], expect.anything());
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL - remove method doesn't exist

**Step 3: Write minimal implementation**

Create: `src/commands/remove.ts`

```typescript
import type { WorktrunkInstance } from '../worktrunk.js';
import type { RemoveOptions, RemoveResult } from '../types.js';
import { execCommand } from '../utils/executor.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    remove(options?: RemoveOptions | string): Promise<RemoveResult>;
  }
}

export async function removeCommand(
  this: WorktrunkInstance,
  options?: RemoveOptions | string
): Promise<RemoveResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  const { options: config } = this;

  const args = ['remove'];

  if (opts?.keepBranch) {
    args.push('--keep-branch');
  }

  if (opts?.name) {
    args.push(opts.name);
  }

  const stdout = await execCommand(args, config);

  return {
    removed: opts?.name || 'current',
    branchDeleted: !opts?.keepBranch,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/remove.ts test/commands/remove.test.ts
git commit -m "feat: implement remove command"
```

---

## Task 8: List Command

**Files:**
- Create: `src/commands/list.ts`
- Test: `test/commands/list.test.ts`

**Step 1: Write the failing test**

Create: `test/commands/list.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all worktrees', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    const mockOutput = 'main /repo/main [main]*\nfeature /repo/feature [feature]';
    vi.mocked(execCommand).mockResolvedValue(mockOutput);

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(execCommand).toHaveBeenCalledWith(['list'], expect.anything());
    expect(result.worktrees).toHaveLength(2);
    expect(result.current).toBe('main');
  });

  it('should parse worktree info correctly', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('main /repo/main [main]*');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(result.worktrees[0]).toEqual({
      name: 'main',
      path: '/repo/main',
      branch: 'main',
      isMain: true,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL - list method doesn't exist

**Step 3: Write minimal implementation**

Create: `src/commands/list.ts`

```typescript
import type { WorktrunkInstance } from '../worktrunk.js';
import type { ListResult } from '../types.js';
import { execCommand } from '../utils/executor.js';
import { parseListOutput } from '../utils/parser.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    list(): Promise<ListResult>;
  }
}

export async function listCommand(
  this: WorktrunkInstance
): Promise<ListResult> {
  const { options: config } = this;

  const stdout = await execCommand(['list'], config);

  return parseListOutput(stdout);
}
```

**Step 4: Update parser to handle actual CLI output**

Modify: `src/utils/parser.ts`

Update the `parseListOutput` function to handle the actual worktrunk list output format correctly based on CLI testing.

**Step 5: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/commands/list.ts test/commands/list.test.ts src/utils/parser.ts
git commit -m "feat: implement list command"
```

---

## Task 9: Merge Command

**Files:**
- Create: `src/commands/merge.ts`
- Test: `test/commands/merge.test.ts`

**Step 1: Write the failing test**

Create: `test/commands/merge.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge current branch to main', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Merged feature into main');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.merge();

    expect(execCommand).toHaveBeenCalledWith(['merge'], expect.anything());
    expect(result.target).toBe('main');
  });

  it('should merge to custom target', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Merged into develop');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.merge({ target: 'develop' });

    expect(execCommand).toHaveBeenCalledWith(['merge', '--target', 'develop'], expect.anything());
  });

  it('should keep worktree when requested', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Merged, worktree kept');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.merge({ keepWorktree: true });

    expect(execCommand).toHaveBeenCalledWith(['merge', '--keep-worktree'], expect.anything());
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL - merge method doesn't exist

**Step 3: Write minimal implementation**

Create: `src/commands/merge.ts`

```typescript
import type { WorktrunkInstance } from '../worktrunk.js';
import type { MergeOptions, MergeResult } from '../types.js';
import { execCommand } from '../utils/executor.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    merge(options?: MergeOptions): Promise<MergeResult>;
  }
}

export async function mergeCommand(
  this: WorktrunkInstance,
  options?: MergeOptions
): Promise<MergeResult> {
  const opts = options || {};
  const { options: config } = this;

  const args = ['merge'];

  if (opts.target) {
    args.push('--target', opts.target);
  }

  if (opts.keepWorktree) {
    args.push('--keep-worktree');
  }

  const stdout = await execCommand(args, config);

  return {
    merged: 'current',
    target: opts.target || 'main',
    worktreeRemoved: !opts.keepWorktree,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/merge.ts test/commands/merge.test.ts
git commit -m "feat: implement merge command"
```

---

## Task 10: Hook Commands

**Files:**
- Create: `src/commands/hook.ts`
- Test: `test/commands/hook.test.ts`

**Step 1: Write the failing test**

Create: `test/commands/hook.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run pre-merge hooks', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Running pre-merge hooks');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.hook({ type: 'pre-merge' });

    expect(execCommand).toHaveBeenCalledWith(['hook', 'pre-merge'], expect.anything());
  });

  it('should run named hook', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Running test');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.hook({ type: 'pre-merge', name: 'test' });

    expect(execCommand).toHaveBeenCalledWith(['hook', 'pre-merge', 'test'], expect.anything());
  });

  it('should support yes flag for CI', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Running with --yes');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.hook({ type: 'pre-merge', yes: true });

    expect(execCommand).toHaveBeenCalledWith(['hook', 'pre-merge', '--yes'], expect.anything());
  });

  it('should show configured hooks', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('[post-create]\ntest = "npm install"');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.hookShow();

    expect(execCommand).toHaveBeenCalledWith(['hook', 'show'], expect.anything());
    expect(result.hooks['post-create']).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL - hook methods don't exist

**Step 3: Write minimal implementation**

Create: `src/commands/hook.ts`

```typescript
import type { WorktrunkInstance } from '../worktrunk.js';
import type { HookOptions, HookResult, HookShowResult } from '../types.js';
import { execCommand } from '../utils/executor.js';
import { parseHookShowOutput } from '../utils/parser.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    hook(options: HookOptions): Promise<HookResult>;
    hookShow(): Promise<HookShowResult>;
  }
}

export async function hookCommand(
  this: WorktrunkInstance,
  options: HookOptions
): Promise<HookResult> {
  const { options: config } = this;

  const args = ['hook', options.type];

  if (options.name) {
    args.push(options.name);
  }

  if (options.userOnly) {
    args.push('user:');
  }

  if (options.projectOnly) {
    args.push('project:');
  }

  if (options.yes) {
    args.push('--yes');
  }

  if (options.vars) {
    for (const [key, value] of Object.entries(options.vars)) {
      args.push('--var', `${key}=${value}`);
    }
  }

  await execCommand(args, config);

  return {
    hook: options.type,
    executed: [],
  };
}

export async function hookShowCommand(
  this: WorktrunkInstance
): Promise<HookShowResult> {
  const { options: config } = this;

  const stdout = await execCommand(['hook', 'show'], config);

  return parseHookShowOutput(stdout);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/hook.ts test/commands/hook.test.ts
git commit -m "feat: implement hook commands"
```

---

## Task 11: Main Worktrunk Class

**Files:**
- Create: `src/worktrunk.ts`

**Step 1: Write the Worktrunk class**

```typescript
import type { NormalizedOptions, WorktrunkOptions } from './types.js';
import { switchCommand, createCommand } from './commands/switch.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { mergeCommand } from './commands/merge.js';
import { hookCommand, hookShowCommand } from './commands/hook.js';

export interface WorktrunkInstance {
  switch: typeof switchCommand;
  create: typeof createCommand;
  remove: typeof removeCommand;
  list: typeof listCommand;
  merge: typeof mergeCommand;
  hook: typeof hookCommand;
  hookShow: typeof hookShowCommand;
  options: NormalizedOptions;
}

function normalizeOptions(options: WorktrunkOptions | string = {}): NormalizedOptions {
  if (typeof options === 'string') {
    return { binary: options };
  }
  return {
    binary: options.binary || 'wt',
    baseDir: options.baseDir,
  };
}

export function createWorktrunkInstance(options: WorktrunkOptions | string = {}): WorktrunkInstance {
  const normalized = normalizeOptions(options);

  const instance: Partial<WorktrunkInstance> = {
    options: normalized,
  };

  // Bind methods to instance
  instance.switch = switchCommand.bind(instance);
  instance.create = createCommand.bind(instance);
  instance.remove = removeCommand.bind(instance);
  instance.list = listCommand.bind(instance);
  instance.merge = mergeCommand.bind(instance);
  instance.hook = hookCommand.bind(instance);
  instance.hookShow = hookShowCommand.bind(instance);

  return instance as WorktrunkInstance;
}
```

**Step 2: Run TypeScript check**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/worktrunk.ts
git commit -m "feat: add main Worktrunk class"
```

---

## Task 12: Main Export

**Files:**
- Create: `src/index.ts`

**Step 1: Write main export**

```typescript
export { worktrunk, createWorktrunkInstance } from './worktrunk.js';
export type {
  SwitchOptions,
  SwitchResult,
  CreateOptions,
  RemoveOptions,
  RemoveResult,
  ListResult,
  WorktreeInfo,
  MergeOptions,
  MergeResult,
  HookType,
  HookOptions,
  HookResult,
  HookExecution,
  HookShowResult,
  NamedHook,
  WorktrunkOptions,
} from './types.js';
export { WorktrunkError, BinaryNotFoundError, CommandFailedError } from './errors.js';

// Main factory function
import { createWorktrunkInstance } from './worktrunk.js';

export function worktrunk(options?: string | import('./types.js').WorktrunkOptions): import('./worktrunk.js').WorktrunkInstance {
  return createWorktrunkInstance(options);
}
```

**Step 2: Run TypeScript check**

Run: `pnpm lint`
Expected: No errors

**Step 3: Test basic import**

Create: `test/index.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { worktrunk } from '../src/index.js';

describe('index', () => {
  it('should export worktrunk function', () => {
    expect(worktrunk).toBeDefined();
    expect(typeof worktrunk).toBe('function');
  });

  it('should create instance', () => {
    const wt = worktrunk();
    expect(wt).toHaveProperty('switch');
    expect(wt).toHaveProperty('create');
    expect(wt).toHaveProperty('remove');
    expect(wt).toHaveProperty('list');
    expect(wt).toHaveProperty('merge');
    expect(wt).toHaveProperty('hook');
    expect(wt).toHaveProperty('hookShow');
  });

  it('should accept custom binary path', () => {
    const wt = worktrunk('/custom/path/to/wt');
    expect(wt.options.binary).toBe('/custom/path/to/wt');
  });

  it('should accept options object', () => {
    const wt = worktrunk({ binary: '/usr/local/bin/wt', baseDir: '/tmp' });
    expect(wt.options.binary).toBe('/usr/local/bin/wt');
    expect(wt.options.baseDir).toBe('/tmp');
  });
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/index.ts test/index.test.ts
git commit -m "feat: add main export and index tests"
```

---

## Task 13: Build Configuration

**Files:**
- Create: `tsup.config.ts`

**Step 1: Create build config**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  splitting: false,
});
```

**Step 2: Test build**

Run: `pnpm build`
Expected: Successfully builds to `dist/`

**Step 3: Verify build output**

Run: `ls -la dist/`
Expected: `index.js`, `index.d.ts`, `index.js.map`

**Step 4: Commit**

```bash
git add tsup.config.ts
git commit -m "chore: add build configuration with tsup"
```

---

## Task 14: README Documentation

**Files:**
- Create: `README.md`

**Step 1: Write README**

```markdown
# simple-worktrunk

A lightweight Node.js wrapper for the [worktrunk](https://github.com/max-sixty/worktrunk) CLI, providing a clean, chainable, promise-based API.

## Installation

\`\`\`bash
pnpm add simple-worktrunk
\`\`\`

**Requires worktrunk CLI to be installed.** See [worktrunk installation](https://github.com/max-sixty/worktrunk#installation).

## Usage

\`\`\`typescript
import { worktrunk } from 'simple-worktrunk';

const wt = worktrunk();

// Create new worktree
await wt.create('feature-auth');

// Switch to existing worktree
await wt.switch('main');

// Create with base branch
await wt.create({ name: 'hotfix', base: 'production' });

// List all worktrees
const { worktrees, current } = await wt.list();

// Merge to main
await wt.merge();

// Remove worktree
await wt.remove('old-branch');
\`\`\`

## API

### \`worktrunk(options?)\`

Creates a new worktrunk instance.

\`\`\`typescript
// Default - uses 'wt' from PATH
const wt = worktrunk();

// Custom binary path
const wt = worktrunk('/custom/path/to/wt');

// With options
const wt = worktrunk({ binary: '/usr/local/bin/wt', baseDir: '/path/to/repo' });
\`\`\`

### Instance Methods

- \`switch(options)\` - Switch or create worktrees
- \`create(options)\` - Create new worktree (alias for \`switch({ create: true })\`)
- \`remove(options)\` - Remove worktrees
- \`list()\` - List all worktrees
- \`merge(options)\` - Merge branch and cleanup
- \`hook(options)\` - Run hooks manually
- \`hookShow()\` - Show configured hooks

All methods return promises and are chainable.

## TypeScript

Full TypeScript support with exported types:

\`\`\`typescript
import type { SwitchResult, ListResult, WorktreeOptions } from 'simple-worktrunk';
\`\`\`

## License

MIT
\`\`\`

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Task 15: Integration Test (Optional)

**Files:**
- Create: `test/integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { worktrunk, BinaryNotFoundError } from '../src/index.js';

describe.runIf(process.env.CI === 'true')('integration', () => {
  it('should fail with meaningful error when wt not found', async () => {
    const wt = worktrunk('/nonexistent/path/to/wt');

    await expect(wt.list()).rejects.toThrow(BinaryNotFoundError);
  });
});
```

**Step 2: Commit**

```bash
git add test/integration.test.ts
git commit -m "test: add integration test"
```

---

## Final Steps

### Update package.json

Add files, keywords, repository, etc.

### Create npmignore

\`\`\`
src/
test/
*.test.ts
vitest.config.ts
tsconfig.json
tsup.config.ts
\`\`\`

### Final commit

```bash
git add package.json .npmignore
git commit -m "chore: finalize package configuration"
```

---

## Summary

This implementation plan builds simple-worktrunk incrementally using TDD:

1. Project setup with TypeScript, pnpm, vitest
2. Type definitions
3. Error classes
4. Command executor utility
5. Output parser utility
6. Individual command implementations (switch, remove, list, merge, hook)
7. Main Worktrunk class
8. Export and build configuration
9. Documentation

Each task follows TDD: write failing test, implement, verify passing, commit.
