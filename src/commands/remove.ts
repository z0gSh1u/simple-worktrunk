import type { WorktrunkInstance } from '../worktrunk.js';
import type { RemoveOptions, RemoveResult } from '../types.js';
import { executeJson } from '../utils/executor.js';

export async function removeCommand(
  this: WorktrunkInstance,
  options?: RemoveOptions | string
): Promise<RemoveResult> {
  const opts = typeof options === 'string' ? { branches: [options] } : options ?? {};
  const result = await executeJson<unknown>(buildRemoveArgs(opts), this.options);
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

export function mapRemoveResult(raw: unknown): RemoveResult {
  const entries = getRemovedEntries(raw);
  const removed = entries.map((entry) => ({
    branch: entry.branch as string | undefined,
    path: entry.path as string | undefined,
  }));

  return { removed, raw };
}

function getRemovedEntries(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord);
  }

  if (!isRecord(raw)) {
    return [];
  }

  if (Array.isArray(raw.removed)) {
    return raw.removed.filter(isRecord);
  }

  return [raw];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
