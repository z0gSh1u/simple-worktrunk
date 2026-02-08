import type { WorktrunkInstance } from '../worktrunk.js';
import type { MergeOptions, MergeResult } from '../types.js';
import { execCommand } from '../utils/executor.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    merge(options?: MergeOptions): Promise<MergeResult>;
  }
}

export async function mergeCommand(
  this: WorktrunkInstance,
  options?: MergeOptions
): Promise<MergeResult> {
  const opts = options || {};
  const { options: config } = this;

  const args = ['merge'];

  if (opts.target) {
    args.push('--target', opts.target);
  }

  if (opts.keepWorktree) {
    args.push('--keep-worktree');
  }

  const stdout = await execCommand(args, config);

  return {
    merged: 'current',
    target: opts.target || 'main',
    worktreeRemoved: !opts.keepWorktree,
  };
}
