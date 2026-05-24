import './version-guard.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo.js';
import { worktrunk } from '../../src/index.js';
import { rmSync } from 'node:fs';
import { existsSync } from 'node:fs';

describe('merge (integration)', () => {
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

  it('should merge current branch to main', async () => {
    // Create and modify a feature branch
    await repo.createWorktree('feature-to-merge');
    await repo.commit('Feature commit', { 'feature.txt': 'content' });

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.merge();

    expect(result.raw).toBeDefined();
  });

  it('should merge to custom target', async () => {
    // Setup develop branch
    await repo.createWorktree('develop');

    await repo.createWorktree('feature');
    await repo.commit('Feature for develop');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.merge({ target: 'develop' });

    expect(result.raw).toBeDefined();
    expect(result.target).toBe('develop');
  });

  it('should keep worktree when requested', async () => {
    await repo.createWorktree('keep-worktree');
    await repo.commit('Commit');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.merge({ remove: false });

    expect(result.raw).toBeDefined();

    // Verify worktree still exists
    const worktrees = await repo.getGitWorktrees();
    const kept = worktrees.find(w => w.branch === 'keep-worktree');
    expect(kept).toBeDefined();
  });
});
