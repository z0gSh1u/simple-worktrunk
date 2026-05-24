import { describe, expect, it } from 'vitest';
import { buildMergeArgs, mapMergeResult } from '../../src/commands/merge.js';

describe('buildMergeArgs', () => {
  it('builds json merge args with disabled defaults', () => {
    expect(buildMergeArgs({
      target: 'develop',
      squash: false,
      commit: false,
      rebase: false,
      remove: false,
      ff: false,
      stage: 'tracked',
      noHooks: true,
      yes: true,
    })).toEqual([
      'merge',
      '--format=json',
      '--no-squash',
      '--no-commit',
      '--no-rebase',
      '--no-remove',
      '--no-ff',
      '--stage',
      'tracked',
      '--no-hooks',
      '--yes',
      'develop',
    ]);
  });
});

describe('mapMergeResult', () => {
  it('preserves raw json and maps common fields', () => {
    expect(mapMergeResult({ target: 'main', source: 'feature', path: '/repo/main' })).toEqual({
      target: 'main',
      source: 'feature',
      branch: undefined,
      path: '/repo/main',
      raw: { target: 'main', source: 'feature', path: '/repo/main' },
    });
  });
});
