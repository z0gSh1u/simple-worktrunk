import { describe, it, expect } from 'vitest';
import { parseListOutput, parseHookShowOutput, parseSwitchOutput } from '../../src/utils/parser.js';

describe('parseListOutput', () => {
  it('should parse JSON worktree format', () => {
    const output = JSON.stringify([
      {
        branch: 'main',
        path: '/repo/main',
        kind: 'worktree',
        is_main: true,
        is_current: true,
      },
      {
        branch: 'feature',
        path: '/repo/feature',
        kind: 'worktree',
        is_main: false,
        is_current: false,
      },
    ]);

    const result = parseListOutput(output);

    expect(result.worktrees).toHaveLength(2);
    expect(result.current).toBe('main');
    expect(result.worktrees[0]).toEqual({
      path: '/repo/main',
      branch: 'main',
      kind: 'worktree',
      isMain: true,
      isCurrent: true,
      isPrevious: false,
    });
  });

  it('should handle empty output', () => {
    const result = parseListOutput('');

    expect(result.worktrees).toEqual([]);
    expect(result.current).toBe('');
  });

  it('should handle worktree names with special characters', () => {
    const output = JSON.stringify([
      {
        branch: 'feature/abc-123',
        path: '/repo/feature/abc-123',
        kind: 'worktree',
        is_main: false,
        is_current: true,
      },
    ]);
    const result = parseListOutput(output);

    expect(result.worktrees[0].branch).toBe('feature/abc-123');
  });

  it('should handle unicode characters in paths', () => {
    const output = JSON.stringify([
      {
        branch: 'feature',
        path: '/路径/feature',
        kind: 'worktree',
        is_main: false,
        is_current: true,
      },
    ]);
    const result = parseListOutput(output);

    expect(result.worktrees[0].path).toBe('/路径/feature');
  });

  it('should filter out non-worktree items', () => {
    const output = JSON.stringify([
      {
        branch: 'main',
        path: '/repo/main',
        kind: 'worktree',
        is_main: true,
        is_current: true,
      },
      {
        branch: 'bare',
        path: '/repo/.git/worktrees/bare',
        kind: 'bare',
        is_main: false,
        is_current: false,
      },
    ]);
    const result = parseListOutput(output);

    expect(result.worktrees).toHaveLength(1);
    expect(result.worktrees[0].branch).toBe('main');
  });

  it('should identify main worktree', () => {
    const output = JSON.stringify([
      {
        branch: 'main',
        path: '/repo/main',
        kind: 'worktree',
        is_main: true,
        is_current: true,
      },
    ]);
    const result = parseListOutput(output);

    expect(result.worktrees[0].isMain).toBe(true);
  });

  it('should handle worktree without current marker', () => {
    const output = JSON.stringify([
      {
        branch: 'feature',
        path: '/repo/feature',
        kind: 'worktree',
        is_main: false,
        is_current: false,
      },
    ]);
    const result = parseListOutput(output);

    expect(result.current).toBe('');
  });

  it('should handle JSON with warnings', () => {
    const output = '▲ Some warning\n' + JSON.stringify([
      {
        branch: 'main',
        path: '/repo/main',
        kind: 'worktree',
        is_main: true,
        is_current: true,
      },
    ]);
    const result = parseListOutput(output);

    expect(result.worktrees).toHaveLength(1);
    expect(result.worktrees[0].branch).toBe('main');
  });
});

describe('parseHookShowOutput', () => {
  it('should parse hook sections', () => {
    const output = '[post-create]\ntest = "npm install"\n[post-switch]\ncleanup = "rm -rf node_modules"';

    const result = parseHookShowOutput(output);

    expect(result.hooks['post-create']).toHaveLength(1);
    expect(result.hooks['post-create'][0]).toEqual({
      name: 'test',
      command: 'npm install',
      source: 'project',
    });
    expect(result.hooks['post-switch']).toHaveLength(1);
    expect(result.hooks['post-switch'][0]).toEqual({
      name: 'cleanup',
      command: 'rm -rf node_modules',
      source: 'project',
    });
  });

  it('should handle empty output', () => {
    const result = parseHookShowOutput('');

    expect(result.hooks).toEqual({});
  });

  it('should handle sections without hooks', () => {
    const output = '[post-create]\n[post-switch]';
    const result = parseHookShowOutput(output);

    expect(result.hooks['post-create']).toEqual([]);
    expect(result.hooks['post-switch']).toEqual([]);
  });

  it('should handle multiple hooks in same section', () => {
    const output = '[post-create]\ninstall = "npm install"\nbuild = "npm run build"';
    const result = parseHookShowOutput(output);

    expect(result.hooks['post-create']).toHaveLength(2);
    expect(result.hooks['post-create'][0]).toEqual({
      name: 'install',
      command: 'npm install',
      source: 'project',
    });
    expect(result.hooks['post-create'][1]).toEqual({
      name: 'build',
      command: 'npm run build',
      source: 'project',
    });
  });

  it('should handle hook commands with special characters', () => {
    const output = '[post-create]\ntest = "echo \\"hello world\\""';
    const result = parseHookShowOutput(output);

    // The parser captures the literal content between quotes, including escaped quotes
    expect(result.hooks['post-create'][0].command).toBe('echo \\"hello world\\"');
  });
});

describe('parseSwitchOutput', () => {
  it('parses JSON switch output with trailing human text', () => {
    const output = '{"action":"already_at","branch":"main","path":"/repo/main"}\n○ Already on main';
    const result = parseSwitchOutput(output);

    expect(result).toEqual({
      action: 'already_at',
      branch: 'main',
      path: '/repo/main',
    });
  });
});
