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
