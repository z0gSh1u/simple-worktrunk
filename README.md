# simple-worktrunk

A lightweight Node.js wrapper for the [worktrunk](https://github.com/max-sixty/worktrunk) CLI, providing a clean, chainable, promise-based API.

## Installation

```bash
pnpm add simple-worktrunk
```

**Requires worktrunk CLI to be installed.** See [worktrunk installation](https://github.com/max-sixty/worktrunk#installation).

## Usage

```typescript
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
```

## API

### `worktrunk(options?)`

Creates a new worktrunk instance.

```typescript
// Default - uses 'wt' from PATH
const wt = worktrunk();

// Custom binary path
const wt = worktrunk('/custom/path/to/wt');

// With options
const wt = worktrunk({ binary: '/usr/local/bin/wt', baseDir: '/path/to/repo' });
```

### Instance Methods

- `switch(options)` - Switch or create worktrees
- `create(options)` - Create new worktree (alias for `switch({ create: true })`)
- `remove(options)` - Remove worktrees
- `list()` - List all worktrees
- `merge(options)` - Merge branch and cleanup
- `hook(options)` - Run hooks manually
- `hookShow()` - Show configured hooks

All methods return promises and are chainable.

## TypeScript

Full TypeScript support with exported types:

```typescript
import type { SwitchResult, ListResult, WorktreeOptions } from 'simple-worktrunk';
```

## License

MIT
