# Testing Improvements Design

**Date:** 2026-02-08
**Status:** Draft

## Problem Statement

Current tests mock the `execCommand` function, which only verifies that correct arguments are passed to the `wt` CLI. They do not validate that:
1. The wrapper actually works with the real `wt` binary
2. Git worktree operations behave as expected
3. Error handling works in real scenarios
4. Parser logic handles actual CLI output

## Proposed Solution

Implement a **hybrid testing strategy** combining fast unit tests with real integration tests.

## Architecture

### Test Structure

```
test/
├── unit/              # Pure function tests (no mocks needed)
│   ├── parser.test.ts
│   └── errors.test.ts
├── integration/       # Real wt CLI tests
│   ├── switch.integration.test.ts
│   ├── create.integration.test.ts
│   ├── remove.integration.test.ts
│   ├── list.integration.test.ts
│   ├── merge.integration.test.ts
│   └── errors.integration.test.ts
├── fixtures/          # Shared test infrastructure
│   └── test-repo.ts   # TestRepo class
├── setup.ts           # Global test setup
└── teardown.ts        # Global test teardown
```

### Test Categories

**Unit Tests** (`test/unit/`)
- Parser functions (`parseListOutput`, `parseHookShowOutput`, `parseSwitchOutput`)
- Error class instantiation and inheritance
- Type validation and normalization

**Integration Tests** (`test/integration/`)
- Command execution against real `wt` binary
- Error handling with actual git failures
- Edge cases (concurrent operations, malformed responses)

**Fixtures** (`test/fixtures/`)
- `TestRepo` class for managing test git repository
- Helper functions for git operations using `simple-git`

## Shared Fixture System

### TestRepo Class

```typescript
class TestRepo {
  readonly path: string

  // Create a new test git repository
  static async create(): Promise<TestRepo>

  // Reset to clean state between tests
  async reset(): Promise<void>

  // Clean up temporary directory
  async cleanup(): Promise<void>

  // Helper: Create a test commit
  async commit(message: string, files?: Record<string, string>): Promise<string>

  // Helper: Get actual git worktree state
  async getGitWorktrees(): Promise<GitWorktree[]>

  // Helper: Create a worktree via git
  async createWorktree(branch: string): Promise<string>
}
```

### Lifecycle

```typescript
// tests/setup.ts - Runs once before all tests
let testRepo: TestRepo
beforeAll(async () => {
  testRepo = await TestRepo.create()
})

// Each test file
beforeEach(async () => {
  await testRepo.reset()
})

// tests/teardown.ts - Runs after all tests
afterAll(async () => {
  await testRepo.cleanup()
})
```

The `reset()` method uses `git worktree prune` and branch deletion to quickly restore clean state, which is much faster than recreating the repository for each test.

## Integration Test Pattern

```typescript
// test/integration/switch.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { testRepo } from '../fixtures/test-repo.js'
import { worktrunk } from '../../src/index.js'

describe('switch (integration)', () => {
  beforeEach(async () => {
    await testRepo.reset()
  })

  it('should switch to existing worktree', async () => {
    // Setup: Create a worktree via git first
    await testRepo.createWorktree('feature-a')

    // Test: Use our wrapper to switch
    const wt = worktrunk({ baseDir: testRepo.path })
    const result = await wt.switch('feature-a')

    // Verify: Check actual git state
    expect(result.worktree).toBe('feature-a')
    const currentWorktree = await testRepo.getCurrentWorktree()
    expect(currentWorktree).toContain('feature-a')
  })

  it('should create new worktree with --create flag', async () => {
    const wt = worktrunk({ baseDir: testRepo.path })
    const result = await wt.switch({ name: 'feature-b', create: true })

    expect(result.created).toBe(true)

    // Verify the worktree actually exists in git
    const worktrees = await testRepo.getGitWorktrees()
    expect(worktrees).toContainEqual(
      expect.objectContaining({ branch: 'feature-b' })
    )
  })
})
```

## Unit Test Enhancements

Unit tests will focus on pure functions with comprehensive edge case coverage:

```typescript
// test/unit/parser.test.ts
import { parseListOutput, parseHookShowOutput } from '../../src/utils/parser.js'

describe('parseListOutput', () => {
  it('should parse standard worktree format')
  it('should handle empty output')
  it('should handle worktree names with special characters')
  it('should handle unicode characters in paths')
  it('should handle malformed lines gracefully')
})
```

## Error Handling Tests

### Unit Tests
Verify error instantiation and classification:

```typescript
describe('BinaryNotFoundError', () => {
  it('should create error with binary path')
  it('should be instanceof WorktrunkError')
})

describe('CommandFailedError', () => {
  it('should include command, code, and stderr in message')
})
```

### Integration Tests
Verify real error scenarios:

```typescript
describe('error handling (integration)', () => {
  it('should throw BinaryNotFoundError when wt not found')
  it('should throw CommandFailedError on invalid branch')
  it('should properly escape error messages')
})
```

## Dependencies

### Production
No changes - remains dependency-free.

### Test Only
- **simple-git** - For controlling git in test fixtures
  - Fluent API makes tests more readable
  - Handles git edge cases
  - Test-only dependency, doesn't affect bundle size

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    include: [
      'test/unit/**/*.test.ts',
      'test/integration/**/*.test.ts',
    ],
    // Don't parallelize integration tests (shared state)
    fileParallelism: {
      include: ['test/unit/**/*.test.ts'],
    },
    setupFiles: ['./test/setup.ts'],
    teardownFiles: ['./test/teardown.ts'],
  },
})
```

### npm Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest test/unit",
    "test:integration": "vitest test/integration",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## CI Considerations

The CI environment must have:
1. `wt` binary installed (or integration tests will be skipped)
2. Git configured (user.name, user.email)

Optionally add a GitHub Action that installs `wt` via cargo before running tests.

## Benefits

1. **Confidence** - Tests verify actual git worktree behavior, not just argument passing
2. **Fast feedback** - Unit tests run quickly during development
3. **Real validation** - Integration tests catch CLI output format changes
4. **Maintainable** - Clear separation between pure logic and external integration

## Migration Strategy

1. Add `simple-git` as dev dependency
2. Create `test/fixtures/test-repo.ts` with TestRepo class
3. Create `test/setup.ts` and `test/teardown.ts`
4. Write integration tests for each command
5. Remove mock-based command tests
6. Enhance unit tests for parsers and errors
7. Update vitest config and npm scripts
