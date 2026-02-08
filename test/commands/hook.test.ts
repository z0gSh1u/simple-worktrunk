import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/executor.js', () => ({
  execCommand: vi.fn(),
}));

describe('hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run pre-merge hooks', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Running pre-merge hooks');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.hook({ type: 'pre-merge' });

    expect(execCommand).toHaveBeenCalledWith(['hook', 'pre-merge'], expect.anything());
  });

  it('should run named hook', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Running test');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.hook({ type: 'pre-merge', name: 'test' });

    expect(execCommand).toHaveBeenCalledWith(['hook', 'pre-merge', 'test'], expect.anything());
  });

  it('should support yes flag for CI', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('Running with --yes');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    await wt.hook({ type: 'pre-merge', yes: true });

    expect(execCommand).toHaveBeenCalledWith(['hook', 'pre-merge', '--yes'], expect.anything());
  });

  it('should show configured hooks', async () => {
    const { execCommand } = await import('../../src/utils/executor.js');
    vi.mocked(execCommand).mockResolvedValue('[post-create]\ntest = "npm install"');

    const { worktrunk } = await import('../../src/index.js');
    const wt = worktrunk();
    const result = await wt.hookShow();

    expect(execCommand).toHaveBeenCalledWith(['hook', 'show'], expect.anything());
    expect(result.hooks['post-create']).toBeDefined();
  });
});
