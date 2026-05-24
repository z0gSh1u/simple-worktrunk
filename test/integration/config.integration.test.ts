import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import { worktrunk } from '../../src/index.js';
import { TestRepo } from '../fixtures/test-repo.js';

describe('config (integration)', () => {
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

  it('reads config show json', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.config.show({ format: 'json' });

    expect(result).toHaveProperty('project');
    expect(result).toHaveProperty('user');
  });

  it('sets lists gets and clears state vars', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });

    await wt.config.state.vars.set('env', 'staging');
    expect(await wt.config.state.vars.get('env')).toBe('staging');
    expect(await wt.config.state.vars.list()).toContain('env');
    await wt.config.state.vars.clear('env');
    expect(await wt.config.state.vars.list()).not.toContain('env');
  });

  it('reads logs json', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' });
    const result = await wt.config.state.logs();

    expect(result).toHaveProperty('command_log');
    expect(result).toHaveProperty('hook_output');
    expect(result).toHaveProperty('diagnostic');
  });
});
