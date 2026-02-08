import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove current worktree', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Removed feature');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.remove();

    expect(execCommand).toHaveBeenCalledWith(['remove'], expect.anything());
    expect(result.removed).toBeTruthy();
  });

  it('should remove named worktree', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Removed old-feature');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.remove({ name: 'old-feature' });

    expect(execCommand).toHaveBeenCalledWith(['remove', 'old-feature'], expect.anything());
  });

  it('should keep branch when requested', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Removed worktree, branch kept');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.remove({ name: 'test', keepBranch: true });

    expect(execCommand).toHaveBeenCalledWith(['remove', '--keep-branch', 'test'], expect.anything());
  });
});
