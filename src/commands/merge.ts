import type { WorktrunkInstance } from '../worktrunk.js';
import type { MergeOptions, MergeResult } from '../types.js';
import { execCommandWithStderr } from '../utils/executor.js';

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

  const args = ['merge', '-y'];

  if (opts.keepWorktree) {
    args.push('--no-remove');
  }

  if (opts.target) {
    args.push(opts.target);
  }

  const result = await execCommandWithStderr(args, config);

  return {
    merged: 'current',
    target: opts.target || 'main',
    worktreeRemoved: !opts.keepWorktree,
  };
}
