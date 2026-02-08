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
    const mockOutput = 'main /repo/main [main]*\nfeature /repo/feature [feature]';
    vi.mocked(execCommand).mockResolvedValue(mockOutput);

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.list();

    expect(execCommand).toHaveBeenCalledWith(['list'], expect.anything());
    expect(result.worktrees).toHaveLength(2);
    expect(result.current).toBe('main');
  });

  it('should parse worktree info correctly', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('main /repo/main [main]*');

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
});
