import type { WorktrunkInstance } from '../worktrunk.js';
import type { RemoveOptions, RemoveResult } from '../types.js';
import { execCommand } from '../utils/executor.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    remove(options?: RemoveOptions | string): Promise<RemoveResult>;
  }
}

export async function removeCommand(
  this: WorktrunkInstance,
  options?: RemoveOptions | string
): Promise<RemoveResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  const { options: config } = this;

  const args = ['remove', '--foreground', '-y', '-f'];

  if (opts?.keepBranch) {
    args.push('--no-delete-branch');
  }

  if (opts?.name) {
    args.push(opts.name);
  }

  const stdout = await execCommand(args, config);

  return {
    removed: opts?.name || 'current',
    branchDeleted: !opts?.keepBranch,
  };
}
