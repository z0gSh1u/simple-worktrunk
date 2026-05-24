import { describe, expect, it } from 'vitest';
import { mapListItem, mapSwitchResult } from '../../src/utils/mapper.js';

describe('mapSwitchResult', () => {
  it('maps switch JSON directly', () => {
    expect(mapSwitchResult({
      action: 'already_at',
      branch: 'main',
      path: '/repo/main',
    })).toEqual({
      action: 'already_at',
      branch: 'main',
      path: '/repo/main',
    });
  });
});

describe('mapListItem', () => {
  it('maps snake_case list item fields to camelCase', () => {
    expect(mapListItem({
      branch: 'feature',
      path: '/repo/feature',
      kind: 'worktree',
      is_main: false,
      is_current: true,
      is_previous: false,
      commit: {
        sha: 'abcdef',
        short_sha: 'abc',
        message: 'feat: test',
        timestamp: 123,
      },
      working_tree: {
        staged: true,
        modified: false,
        untracked: true,
        renamed: false,
        deleted: false,
        diff: { added: 2, deleted: 1 },
      },
      main_state: 'integrated',
      integration_reason: 'ancestor',
      remote: { name: 'origin', branch: 'feature', ahead: 1, behind: 2 },
      main: { ahead: 3, behind: 4 },
      statusline: 'feature',
      symbols: '⊂',
    })).toEqual({
      branch: 'feature',
      path: '/repo/feature',
      kind: 'worktree',
      isMain: false,
      isCurrent: true,
      isPrevious: false,
      commit: {
        sha: 'abcdef',
        shortSha: 'abc',
        message: 'feat: test',
        timestamp: 123,
      },
      workingTree: {
        staged: true,
        modified: false,
        untracked: true,
        renamed: false,
        deleted: false,
        diff: { added: 2, deleted: 1 },
      },
      mainState: 'integrated',
      integrationReason: 'ancestor',
      remote: { name: 'origin', branch: 'feature', ahead: 1, behind: 2 },
      main: { ahead: 3, behind: 4 },
      statusline: 'feature',
      symbols: '⊂',
    });
  });
});
