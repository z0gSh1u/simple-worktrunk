import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import { worktrunk } from '../../src/index.js';
import { TestRepo } from '../fixtures/test-repo.js';

describe('step (integration)', () => {
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

  it('evaluates a template expression', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    await wt.config.state.vars.set('env', 'staging');

    const result = await wt.step.eval('{{ vars.env }}');

    expect(result).toBe('staging');
  });
});
