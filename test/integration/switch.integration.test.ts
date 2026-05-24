import './version-guard.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo.js';
import { worktrunk } from '../../src/index.js';
import { rmSync } from 'node:fs';
import { existsSync } from 'node:fs';

describe('switch (integration)', () => {
  let repo: TestRepo;
  const switchActions = ['created', 'existing', 'switched', 'already_at'];

  beforeEach(async () => {
    repo = await TestRepo.create();
  });

  afterEach(async () => {
    const basePath = repo.path.replace(/\/main$/, '');
    if (existsSync(basePath)) {
      rmSync(basePath, { recursive: true, force: true });
    }
  });

  it('should switch to existing worktree', async () => {
    // Setup: Create a worktree via git first
    await repo.createWorktree('feature-a');

    // Test: Use our wrapper to switch
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.switch('feature-a');

    // Verify: Check actual git state
    expect(result.branch).toBe('feature-a');
    expect(result.path).toContain('feature-a');
    expect(switchActions).toContain(result.action);

    // Note: We can't check the current branch of the main worktree
    // because switch actually switches us to a different worktree directory
    // But we can verify the worktree exists
    const worktrees = await repo.getGitWorktrees();
    const featureWorktree = worktrees.find(wt => wt.branch === 'feature-a');
    expect(featureWorktree).toBeDefined();
  });

  it('should create new worktree with --create flag', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.switch({ branch: 'feature-b', create: true });

    expect(result.branch).toBe('feature-b');
    expect(result.path).toContain('feature-b');
    expect(switchActions).toContain(result.action);

    // Verify the worktree actually exists in git
    const worktrees = await repo.getGitWorktrees();
    const featureWorktree = worktrees.find(wt => wt.branch === 'feature-b');
    expect(featureWorktree).toBeDefined();
  });

  it('should create from specific base', async () => {
    // Create base branch first
    await repo.createWorktree('develop');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    await wt.switch({ branch: 'feature-from-develop', create: true, base: 'develop' });

    // Verify the worktree was created
    const worktrees = await repo.getGitWorktrees();
    const featureWorktree = worktrees.find(wt => wt.branch === 'feature-from-develop');
    expect(featureWorktree).toBeDefined();
  });

  it('should throw on non-existent branch without create flag', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });

    await expect(
      wt.switch('nonexistent-branch')
    ).rejects.toThrow();
  });

  it('should create worktree using create alias', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.create('feature-create-alias');

    expect(result.branch).toBe('feature-create-alias');
    expect(result.path).toContain('feature-create-alias');
    expect(switchActions).toContain(result.action);

    // Verify the worktree actually exists in git
    const worktrees = await repo.getGitWorktrees();
    const featureWorktree = worktrees.find(wt => wt.branch === 'feature-create-alias');
    expect(featureWorktree).toBeDefined();
  });

  it('should return path in result', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.switch({ branch: 'feature-with-path', create: true });

    expect(result.branch).toBe('feature-with-path');
    expect(result.path).toContain('feature-with-path');
    expect(switchActions).toContain(result.action);

    // Verify the worktree actually exists
    const worktrees = await repo.getGitWorktrees();
    const featureWorktree = worktrees.find(wt => wt.branch === 'feature-with-path');
    expect(featureWorktree).toBeDefined();
  });
});
