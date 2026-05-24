import type { WorktrunkInstance } from '../worktrunk.js';
import type { MergeOptions, MergeResult } from '../types.js';
import { execCommandWithStderr } from '../utils/executor.js';

export async function mergeCommand(
  this: WorktrunkInstance,
  options?: MergeOptions
): Promise<MergeResult> {
  const opts = options || {};
  const { options: config } = this;

  const args = ['merge', '-y'];

  if (opts.remove === false) {
    args.push('--no-remove');
  }

  if (opts.target) {
    args.push(opts.target);
  }

  const result = await execCommandWithStderr(args, config);

  return {
    target: opts.target || 'main',
    raw: { stdout: result.stdout, stderr: result.stderr },
  };
}
