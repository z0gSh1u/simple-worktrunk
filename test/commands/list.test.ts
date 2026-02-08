import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all worktrees', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    const mockOutput = JSON.stringify([
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
    vi.mocked(execCommand).mockResolvedValue(mockOutput);

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(execCommand).toHaveBeenCalledWith(['list', '--format', 'json'], expect.anything());
    expect(result.worktrees).toHaveLength(2);
    expect(result.current).toBe('main');
  });

  it('should parse worktree info correctly', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    const mockOutput = JSON.stringify([
      {
        branch: 'main',
        path: '/repo/main',
        kind: 'worktree',
        is_main: true,
        is_current: true,
      },
    ]);
    vi.mocked(execCommand).mockResolvedValue(mockOutput);

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(result.worktrees[0]).toEqual({
      name: 'main',
      path: '/repo/main',
      branch: 'main',
      isMain: true,
    });
  });

  it('should filter out non-worktree items', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    const mockOutput = JSON.stringify([
      {
        branch: 'main',
        path: '/repo/main',
        kind: 'worktree',
        is_main: true,
        is_current: true,
      },
      {
        branch: 'bare',
        path: '/repo/bare',
        kind: 'bare',
        is_main: false,
        is_current: false,
      },
    ]);
    vi.mocked(execCommand).mockResolvedValue(mockOutput);

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(result.worktrees).toHaveLength(1);
    expect(result.worktrees[0].branch).toBe('main');
  });

  it('should handle empty output', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(result.worktrees).toHaveLength(0);
    expect(result.current).toBe('');
  });
});
