import type { WorktrunkInstance } from '../worktrunk.js';
import type { RemoveOptions, RemoveResult } from '../types.js';
import { execCommandWithStderr } from '../utils/executor.js';

export async function removeCommand(
  this: WorktrunkInstance,
  options?: RemoveOptions | string
): Promise<RemoveResult> {
  const opts = typeof options === 'string' ? { branches: [options] } : options;
  const { options: config } = this;

  const args = ['remove', '--foreground', '-y', '-f'];

  if (opts?.keepBranch) {
    args.push('--no-delete-branch');
  }

  if (opts?.branches?.length) {
    args.push(...opts.branches);
  }

  const result = await execCommandWithStderr(args, config);

  return {
    removed: (opts?.branches || ['current']).map((branch) => ({ branch })),
    raw: { stdout: result.stdout, stderr: result.stderr },
  };
}
