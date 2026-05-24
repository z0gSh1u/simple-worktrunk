import type { WorktrunkInstance } from '../worktrunk.js';
import type { MergeOptions, MergeResult } from '../types.js';
import { executeJson } from '../utils/executor.js';

export async function mergeCommand(
  this: WorktrunkInstance,
  options: MergeOptions = {}
): Promise<MergeResult> {
  const result = await executeJson<Record<string, unknown>>(buildMergeArgs(options), this.options);
  return mapMergeResult(result);
}

export function buildMergeArgs(options: MergeOptions = {}): string[] {
  const args = ['merge', '--format=json'];
  if (options.squash === false) args.push('--no-squash');
  if (options.commit === false) args.push('--no-commit');
  if (options.rebase === false) args.push('--no-rebase');
  if (options.remove === false) args.push('--no-remove');
  if (options.ff === false) args.push('--no-ff');
  if (options.stage) args.push('--stage', options.stage);
  if (options.noHooks) args.push('--no-hooks');
  if (options.yes) args.push('--yes');
  if (options.target) args.push(options.target);
  return args;
}

export function mapMergeResult(raw: Record<string, unknown>): MergeResult {
  return {
    target: raw.target as string | undefined,
    source: raw.source as string | undefined,
    branch: raw.branch as string | undefined,
    path: raw.path as string | undefined,
    raw,
  };
}
