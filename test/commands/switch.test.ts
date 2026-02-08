import { describe, it, expect, vi, beforeEach } from 'vitest';
import { worktrunk } from '../../src/index.js';

// Mock the executor
vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('switch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch to existing worktree', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Switched to feature');

    const wt = worktrunk();
    const result = await wt.switch('feature');

    expect(execCommand).toHaveBeenCalledWith(['switch', 'feature'], expect.anything());
    expect(result.worktree).toBe('feature');
  });

  it('should create new worktree with switch', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Created /path/to/feature');

    const wt = worktrunk();
    const result = await wt.switch({ name: 'feature', create: true });

    expect(execCommand).toHaveBeenCalledWith(['switch', '--create', 'feature'], expect.anything());
    expect(result.created).toBe(true);
  });

  it('should support base option', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Created');

    const wt = worktrunk();
    await wt.switch({ name: 'hotfix', create: true, base: 'production' });

    expect(execCommand).toHaveBeenCalledWith(['switch', '--create', '--base', 'production', 'hotfix'], expect.anything());
  });
});
