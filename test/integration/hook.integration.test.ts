import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRepo } from '../fixtures/test-repo.js';
import { worktrunk } from '../../src/index.js';
import { rmSync } from 'node:fs';
import { existsSync } from 'node:fs';

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

  it('should show configured hooks', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.hookShow();

    // Should return hooks object even if empty
    expect(result.hooks).toBeDefined();
    expect(typeof result.hooks).toBe('object');
  });

  it('should throw error when running hook without configuration', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });

    // When no hooks are configured, wt hook returns exit code 1
    await expect(
      wt.hook({ type: 'post-create', yes: true })
    ).rejects.toThrow();
  });

  it('should throw error when running named hook without configuration', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });

    // Test with yes flag for non-interactive
    await expect(
      wt.hook({ type: 'post-create', name: 'test', yes: true })
    ).rejects.toThrow();
  });
});
