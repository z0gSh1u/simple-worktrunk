# simple-worktrunk Design

## Overview

A TypeScript Node.js library that wraps the worktrunk CLI, providing a clean, chainable, promise-based API similar to simple-git. Uses pnpm for package management and allows users to specify a custom path to the `wt` binary.

## Core Design Principles

1. **Thin wrapper** - Delegates to worktrunk CLI, doesn't reimplement logic
2. **Chainable API** - Each method returns the instance for chaining, also a promise
3. **TypeScript-first** - Full type definitions for all parameters and return values
4. **Configurable binary path** - Users can specify custom `wt` binary location
5. **Parsed responses** - Returns structured objects, not raw CLI output
6. **Error handling** - Wraps CLI errors with meaningful messages

## API Architecture

### Instance Creation

```typescript
import { worktrunk } from 'simple-worktrunk';

// Default - uses 'wt' from PATH
const wt = worktrunk();

// Custom binary path
const wt = worktrunk('/custom/path/to/wt');

// With options object
const wt = worktrunk({
  binary: '/usr/local/bin/wt',
  baseDir: '/path/to/repo'  // optional: base repo directory
});
```

### Instance Methods

- `switch(options)` - Switch or create worktrees
- `create(options)` - Alias for `switch({ create: true })`
- `remove(options)` - Remove worktrees
- `list()` - List all worktrees
- `merge(options)` - Merge branch and cleanup
- `hook(options)` - Run hooks manually
- `hookShow()` - Show configured hooks

Each method returns both the instance (for chaining) and a promise:

```typescript
// Chainable
await wt.switch('feature').remove('old-branch');

// Or await individually
await wt.switch('feature');
await wt.remove('old-branch');
```

## Type Definitions

### SwitchOptions / SwitchResult

```typescript
interface SwitchOptions {
  name?: string;
  create?: boolean;
  base?: string;
  exec?: string;
  noCd?: boolean;
}

interface SwitchResult {
  worktree: string;
  path: string;
  branch: string;
  created: boolean;
}
```

### CreateOptions (alias)

```typescript
interface CreateOptions {
  name: string;
  base?: string;
  exec?: string;
  noCd?: boolean;
}
```

### RemoveOptions / RemoveResult

```typescript
interface RemoveOptions {
  name?: string;
  keepBranch?: boolean;
}

interface RemoveResult {
  removed: string;
  branchDeleted: boolean;
}
```

### ListResult

```typescript
interface ListResult {
  worktrees: Array<{
    name: string;
    path: string;
    branch: string;
    isMain: boolean;
  }>;
  current: string;
}
```

### MergeOptions / MergeResult

```typescript
interface MergeOptions {
  target?: string;
  keepWorktree?: boolean;
}

interface MergeResult {
  merged: string;
  target: string;
  worktreeRemoved: boolean;
}
```

### HookOptions / HookResult

```typescript
type HookType =
  | 'post-create'
  | 'post-switch'
  | 'pre-merge'
  | 'post-merge'
  | 'pre-remove'
  | 'post-remove';

interface HookOptions {
  type: HookType;
  name?: string;
  userOnly?: boolean;
  projectOnly?: boolean;
  yes?: boolean;
  vars?: Record<string, string>;
}

interface HookResult {
  hook: string;
  executed: Array<{
    name: string;
    source: 'user' | 'project';
    success: boolean;
    output?: string;
  }>;
}
```

### HookShowResult

```typescript
interface HookShowResult {
  hooks: {
    [key: string]: Array<{
      name?: string;
      command: string;
      source: 'user' | 'project';
    }>;
  };
}
```

## Error Handling

```typescript
class WorktrunkError extends Error {
  code?: string;
  command?: string;
}

class BinaryNotFoundError extends WorktrunkError {
  constructor(binaryPath: string) {
    super(`Worktrunk binary not found at: ${binaryPath}`);
  }
}

class CommandFailedError extends WorktrunkError {
  constructor(command: string, exitCode: number, stderr: string) {
    super(`Command '${command}' failed with exit code ${exitCode}`);
    this.code = exitCode.toString();
    this.command = command;
  }
}
```

## Project Structure

```
simple-worktrunk/
├── src/
│   ├── index.ts              # Main export
│   ├── worktrunk.ts          # Worktrunk class
│   ├── types.ts              # TypeScript interfaces
│   ├── commands/
│   │   ├── switch.ts
│   │   ├── remove.ts
│   │   ├── list.ts
│   │   ├── merge.ts
│   │   └── hook.ts
│   └── utils/
│       ├── executor.ts       # Spawn child processes
│       └── parser.ts         # Parse CLI output
├── test/
│   └── worktrunk.test.ts
├── package.json
├── tsconfig.json
└── pnpm-lock.yaml
```

## Dependencies

### Runtime
- None (pure Node.js)

### Dev
- `typescript` - Type checking
- `tsup` - Building
- `vitest` - Testing
- `tsx` - Test runner

## Usage Examples

```typescript
import { worktrunk } from 'simple-worktrunk';

const wt = worktrunk();

// Create - cleaner API with alias
await wt.create('feature-auth');
await wt.create({ name: 'hotfix', base: 'production' });

// Switch existing
await wt.switch('main');

// Chain operations
await wt.switch('feature-1').merge({ target: 'main' });

// List all worktrees
const { worktrees, current } = await wt.list();

// Run hooks manually
await wt.hook({ type: 'pre-merge', yes: true });

// Show configured hooks
const hooks = await wt.hookShow();

// Cleanup
await wt.remove('old-branch');
```

## Hook Integration

Hooks are **pass-through** - worktrunk CLI handles automatic hook execution. The library provides:
- `hookShow()` - View configured hooks
- `hook()` - Manually trigger hooks (useful for CI/testing)

No need to reimplement hook execution logic.
