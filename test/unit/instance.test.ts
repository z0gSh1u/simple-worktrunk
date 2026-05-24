import { describe, expect, it } from 'vitest';
import { worktrunk } from '../../src/index.js';

describe('worktrunk instance shape', () => {
  it('exposes nested hook step config and raw APIs', () => {
    const wt = worktrunk({ binary: 'wt', baseDir: '/repo', configPath: '/tmp/wt.toml' });

    expect(wt.options).toEqual({
      binary: 'wt',
      baseDir: '/repo',
      configPath: '/tmp/wt.toml',
    });
    expect(typeof wt.raw).toBe('function');
    expect(typeof wt.hook.run).toBe('function');
    expect(typeof wt.hook.show).toBe('function');
    expect(typeof wt.step.raw).toBe('function');
    expect(typeof wt.config.raw).toBe('function');
  });
});
