import { describe, expect, it } from 'vitest';
import { buildStepArgs } from '../../src/commands/step.js';

describe('buildStepArgs', () => {
  it('builds commit args', () => {
    expect(buildStepArgs('commit', {
      branch: 'feature',
      stage: 'tracked',
      dryRun: true,
      noHooks: true,
    })).toEqual([
      'step',
      'commit',
      '--branch',
      'feature',
      '--stage',
      'tracked',
      '--dry-run',
      '--no-hooks',
      '--format=json',
    ]);
  });

  it('builds prune args', () => {
    expect(buildStepArgs('prune', { dryRun: true, minAge: '0s', foreground: true })).toEqual([
      'step',
      'prune',
      '--dry-run',
      '--min-age',
      '0s',
      '--foreground',
      '--format=json',
    ]);
  });

  it('builds argv command args after delimiter', () => {
    expect(buildStepArgs('tether', { command: ['npm', 'run', 'dev'] })).toEqual([
      'step',
      'tether',
      '--',
      'npm',
      'run',
      'dev',
    ]);
  });
});
