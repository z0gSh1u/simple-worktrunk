import type { WorktrunkInstance } from '../worktrunk.js';
import type { ListOptions, ListResult } from '../types.js';
import { executeJson } from '../utils/executor.js';
import { mapListItem } from '../utils/mapper.js';

export async function listCommand(
  this: WorktrunkInstance,
  options: ListOptions = {}
): Promise<ListResult> {
  const data = await executeJson<any[]>(buildListArgs(options), this.options);
  const worktrees = data
    .filter((item) => item.kind === 'worktree')
    .map(mapListItem);
  const current = worktrees.find((worktree) => worktree.isCurrent)?.branch ?? '';

  return { worktrees, current };
}

export function buildListArgs(options: ListOptions = {}): string[] {
  const args = ['list', '--format=json'];
  if (options.full) args.push('--full');
  if (options.branches) args.push('--branches');
  if (options.remotes) args.push('--remotes');
  return args;
}
