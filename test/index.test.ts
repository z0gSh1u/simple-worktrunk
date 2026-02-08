import { describe, it, expect } from 'vitest';
import { worktrunk } from '../src/index.js';

describe('index', () => {
  it('should export worktrunk function', () => {
    expect(worktrunk).toBeDefined();
    expect(typeof worktrunk).toBe('function');
  });

  it('should create instance', () => {
    const wt = worktrunk();
    expect(wt).toHaveProperty('switch');
    expect(wt).toHaveProperty('create');
    expect(wt).toHaveProperty('remove');
    expect(wt).toHaveProperty('list');
    expect(wt).toHaveProperty('merge');
    expect(wt).toHaveProperty('hook');
    expect(wt).toHaveProperty('hookShow');
  });

  it('should accept custom binary path', () => {
    const wt = worktrunk('/custom/path/to/wt');
    expect(wt.options.binary).toBe('/custom/path/to/wt');
  });

  it('should accept options object', () => {
    const wt = worktrunk({ binary: '/usr/local/bin/wt', baseDir: '/tmp' });
    expect(wt.options.binary).toBe('/usr/local/bin/wt');
    expect(wt.options.baseDir).toBe('/tmp');
  });
});
