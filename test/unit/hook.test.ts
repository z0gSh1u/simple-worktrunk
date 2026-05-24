import { describe, expect, it } from 'vitest';
import { buildHookRunArgs } from '../../src/commands/hook.js';

describe('buildHookRunArgs', () => {
  it('builds hook run args', () => {
    expect(buildHookRunArgs({
      type: 'post-start',
      names: ['user:dev', 'project:watch'],
      foreground: true,
      dryRun: true,
      yes: true,
      vars: { port: '3000' },
    })).toEqual([
      'hook',
      'post-start',
      'user:dev',
      'project:watch',
      '--foreground',
      '--dry-run',
      '--yes',
      '--var',
      'port=3000',
    ]);
  });
});
