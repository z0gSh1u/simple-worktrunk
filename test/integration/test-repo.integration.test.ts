import './version-guard.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo';
import { rmSync } from 'node:fs';
import { existsSync } from 'node:fs';

describe('TestRepo fixture', () => {
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

  it('should create a test repository with initial commit', async () => {
    expect(repo.path).toContain('worktrunk-test-');
    expect(existsSync(repo.path)).toBe(true);

    const worktrees = await repo.getGitWorktrees();
    expect(worktrees.length).toBe(1);
    expect(worktrees[0].isMain).toBe(true);
  });

  it('should create commits with files', async () => {
    const commitHash = await repo.commit('Test commit', {
      'test.txt': 'Hello, World!'
    });

    expect(commitHash).toBeDefined();
    expect(typeof commitHash).toBe('string');
    expect(commitHash.length).toBe(40); // Git SHA length
  });

  it('should create worktrees', async () => {
    await repo.commit('First commit');
    const worktreePath = await repo.createWorktree('feature-branch');

    expect(worktreePath).toContain('feature-branch');

    const worktrees = await repo.getGitWorktrees();
    expect(worktrees.length).toBe(2);
    expect(worktrees.some(wt => wt.branch === 'feature-branch')).toBe(true);
  });

  it('should get current branch', async () => {
    const branch = await repo.getCurrentBranch();
    expect(branch).toMatch(/^(main|master)$/);
  });

  it('should reset state between tests', async () => {
    // Create some worktrees
    await repo.commit('First commit');
    await repo.createWorktree('feature-1');
    await repo.createWorktree('feature-2');

    let worktrees = await repo.getGitWorktrees();
    expect(worktrees.length).toBe(3);

    // Reset
    await repo.reset();

    // Should be back to just main
    worktrees = await repo.getGitWorktrees();
    expect(worktrees.length).toBe(1);
    expect(worktrees[0].isMain).toBe(true);
  });
});
