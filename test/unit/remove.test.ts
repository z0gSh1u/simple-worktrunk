import { describe, expect, it } from 'vitest';
import { buildRemoveArgs, mapRemoveResult } from '../../src/commands/remove.js';

describe('buildRemoveArgs', () => {
  it('builds foreground json remove args', () => {
    expect(buildRemoveArgs({
      branches: ['old-a', 'old-b'],
      keepBranch: true,
      force: true,
      forceDelete: true,
      noHooks: true,
      yes: true,
    })).toEqual([
      'remove',
      '--format=json',
      '--foreground',
      '--no-delete-branch',
      '--force',
      '--force-delete',
      '--no-hooks',
      '--yes',
      'old-a',
      'old-b',
    ]);
  });
});

describe('mapRemoveResult', () => {
  it('normalizes common remove json shapes', () => {
    expect(mapRemoveResult({ branch: 'old-a', path: '/repo/old-a' })).toEqual({
      removed: [{ branch: 'old-a', path: '/repo/old-a' }],
      raw: { branch: 'old-a', path: '/repo/old-a' },
    });
  });

  it('normalizes nested array remove json shapes', () => {
    const raw = { removed: [{ branch: 'old-a', path: '/repo/old-a' }] };

    expect(mapRemoveResult(raw)).toEqual({
      removed: [{ branch: 'old-a', path: '/repo/old-a' }],
      raw,
    });
  });

  it('normalizes root array remove json shapes from worktrunk 0.53', () => {
    const raw = [{ branch: 'old-a', path: '/repo/old-a' }];

    expect(mapRemoveResult(raw)).toEqual({
      removed: [{ branch: 'old-a', path: '/repo/old-a' }],
      raw,
    });
  });
});
