import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge current branch to main', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Merged feature into main');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.merge();

    expect(execCommand).toHaveBeenCalledWith(['merge'], expect.anything());
    expect(result.target).toBe('main');
  });

  it('should merge to custom target', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Merged into develop');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.merge({ target: 'develop' });

    expect(execCommand).toHaveBeenCalledWith(['merge', '--target', 'develop'], expect.anything());
  });

  it('should keep worktree when requested', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Merged, worktree kept');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.merge({ keepWorktree: true });

    expect(execCommand).toHaveBeenCalledWith(['merge', '--keep-worktree'], expect.anything());
  });
});
