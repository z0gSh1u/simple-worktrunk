import type { WorktrunkInstance } from '../worktrunk.js';
import type { RemoveOptions, RemoveResult } from '../types.js';
import { executeJson } from '../utils/executor.js';

export async function removeCommand(
  this: WorktrunkInstance,
  options?: RemoveOptions | string
): Promise<RemoveResult> {
  const opts = typeof options === 'string' ? { branches: [options] } : options ?? {};
  const result = await executeJson<Record<string, unknown>>(buildRemoveArgs(opts), this.options);
  return mapRemoveResult(result);
}

export function buildRemoveArgs(options: RemoveOptions = {}): string[] {
  const args = ['remove', '--format=json', '--foreground'];
  if (options.keepBranch) args.push('--no-delete-branch');
  if (options.force) args.push('--force');
  if (options.forceDelete) args.push('--force-delete');
  if (options.noHooks) args.push('--no-hooks');
  if (options.yes) args.push('--yes');
  if (options.branches?.length) args.push(...options.branches);
  return args;
}

export function mapRemoveResult(raw: Record<string, unknown>): RemoveResult {
  const removedValue = raw.removed;
  const removed = Array.isArray(removedValue)
    ? removedValue.map((item) => {
      const entry = isRecord(item) ? item : {};
      return {
        branch: entry.branch as string | undefined,
        path: entry.path as string | undefined,
      };
    })
    : [{ branch: raw.branch as string | undefined, path: raw.path as string | undefined }];

  return { removed, raw };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
