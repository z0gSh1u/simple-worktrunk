import './version-guard.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo.js';
import { worktrunk } from '../../src/index.js';
import { rmSync } from 'node:fs';
import { existsSync } from 'node:fs';

describe('remove (integration)', () => {
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

  it('should remove named worktree', async () => {
    await repo.createWorktree('to-remove');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.remove({ branches: ['to-remove'] });

    expect(result.raw).toBeDefined();
    expect(result.removed).toContainEqual(expect.objectContaining({
      branch: 'to-remove',
      path: expect.stringContaining('to-remove'),
    }));

    // Verify worktree is gone
    const worktrees = await repo.getGitWorktrees();
    const removed = worktrees.find(w => w.branch === 'to-remove');
    expect(removed).toBeUndefined();
  });

  it('should remove worktree and delete branch by default', async () => {
    await repo.createWorktree('temp-branch');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    await wt.remove({ branches: ['temp-branch'] });

    // Verify branch is deleted
    const branches = await repo.git.branch();
    expect(branches.all).not.toContain('temp-branch');
  });

  it('should keep branch when requested', async () => {
    await repo.createWorktree('keep-branch');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.remove({ branches: ['keep-branch'], keepBranch: true });

    expect(result.raw).toBeDefined();
    expect(result.removed).toContainEqual(expect.objectContaining({
      branch: 'keep-branch',
      path: expect.stringContaining('keep-branch'),
    }));

    // Verify branch still exists
    const branches = await repo.git.branch();
    expect(branches.all).toContain('keep-branch');
  });
});
