import './version-guard.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo.js';
import { worktrunk } from '../../src/index.js';
import { rmSync } from 'node:fs';
import { existsSync } from 'node:fs';

describe('list (integration)', () => {
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

  it('should list all worktrees', async () => {
    await repo.createWorktree('feature-a');
    await repo.createWorktree('feature-b');

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.list({ full: true });

    expect(result.worktrees.length).toBeGreaterThanOrEqual(3); // master + 2 features
    expect(result.worktrees[0]).toHaveProperty('isCurrent');
    expect(result.worktrees[0]).toHaveProperty('kind');
    const branches = result.worktrees.map(w => w.branch);
    expect(branches).toContain('master');
    expect(branches).toContain('feature-a');
    expect(branches).toContain('feature-b');
  });

  it('should identify current worktree', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    await wt.switch({ branch: 'current-feature', create: true });
    const result = await wt.list();

    // The worktree should exist in the list
    const currentFeatureWorktree = result.worktrees.find(w => w.branch === 'current-feature');
    expect(currentFeatureWorktree).toBeDefined();
    expect(currentFeatureWorktree?.path).toContain('current-feature');
  });

  it('should parse worktree paths correctly', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.list();

    const mainWorktree = result.worktrees.find(w => w.branch === 'master');
    expect(mainWorktree).toBeDefined();
    expect(mainWorktree?.path).toContain('/main');
  });

  it('should include branch entries when branches option is enabled', async () => {
    await repo.git.branch(['branch-only']);

    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.list({ branches: true });

    expect(result.worktrees).toContainEqual(expect.objectContaining({
      branch: 'branch-only',
      kind: 'branch',
    }));
  });
});
