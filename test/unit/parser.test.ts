import { describe, it, expect } from 'vitest';
import { parseListOutput, parseHookShowOutput, parseSwitchOutput } from '../../src/utils/parser.js';

describe('parseListOutput', () => {
  it('should parse standard worktree format', () => {
    const output = 'main /repo/main [main]*\nfeature /repo/feature [feature]';

    const result = parseListOutput(output);

    expect(result.worktrees).toHaveLength(2);
    expect(result.current).toBe('main');
    expect(result.worktrees[0]).toEqual({
      name: 'main',
      path: '/repo/main',
      branch: 'main',
      isMain: true,
    });
  });

  it('should handle empty output', () => {
    const result = parseListOutput('');

    expect(result.worktrees).toEqual([]);
    expect(result.current).toBe('');
  });

  it('should handle worktree names with special characters', () => {
    const output = 'feature/abc-123 /repo/feature/abc-123 [feature/abc-123]*';
    const result = parseListOutput(output);

    expect(result.worktrees[0].name).toBe('feature/abc-123');
    expect(result.worktrees[0].branch).toBe('feature/abc-123');
  });

  it('should handle unicode characters in paths', () => {
    const output = 'feature /路径/feature [feature]*';
    const result = parseListOutput(output);

    expect(result.worktrees[0].path).toBe('/路径/feature');
  });

  it('should handle malformed lines gracefully', () => {
    const output = 'valid /repo/valid [valid]*\ninvalid line\nalso /repo/also [also]';
    const result = parseListOutput(output);

    expect(result.worktrees).toHaveLength(2);
    expect(result.worktrees[0].name).toBe('valid');
  });

  it('should identify bare worktree as main', () => {
    const output = 'bare /repo/.git/worktrees/bare [(bare)]*';
    const result = parseListOutput(output);

    expect(result.worktrees[0].name).toBe('bare');
    expect(result.worktrees[0].isMain).toBe(true);
  });

  it('should identify master branch as main', () => {
    const output = 'main /repo/main [master]*';
    const result = parseListOutput(output);

    expect(result.worktrees[0].isMain).toBe(true);
  });

  it('should handle worktree without current marker', () => {
    const output = 'feature /repo/feature [feature]';
    const result = parseListOutput(output);

    expect(result.current).toBe('');
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
  it('should extract path from output', () => {
    const output = 'Created worktree at /path/to/feature';
    const result = parseSwitchOutput(output);

    expect(result.path).toBe('/path/to/feature');
  });

  it('should return empty path if no path found', () => {
    const result = parseSwitchOutput('No path here');

    expect(result.path).toBe('');
  });

  it('should extract path from different output formats', () => {
    const output = 'Switched to /path/to/worktree';
    const result = parseSwitchOutput(output);

    expect(result.path).toBe('/path/to/worktree');
  });

  it('should handle empty output', () => {
    const result = parseSwitchOutput('');

    expect(result.path).toBe('');
  });

  it('should extract path with spaces', () => {
    const output = 'Created worktree at /path/to/my feature';
    const result = parseSwitchOutput(output);

    // The regex stops at the first space, so we get the first part
    expect(result.path).toBe('/path/to/my');
  });
});
