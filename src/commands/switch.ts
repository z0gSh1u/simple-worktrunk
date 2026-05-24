import type { WorktrunkInstance } from '../worktrunk.js';
import type { CreateOptions, SwitchOptions, SwitchResult } from '../types.js';
import { executeJson } from '../utils/executor.js';
import { mapSwitchResult } from '../utils/mapper.js';

export async function switchCommand(
  this: WorktrunkInstance,
  options: string | SwitchOptions = {}
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { branch: options } : options;
  const result = await executeJson<Record<string, unknown>>(buildSwitchArgs(opts), this.options);
  return mapSwitchResult(result);
}

export async function createCommand(
  this: WorktrunkInstance,
  options: string | CreateOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { branch: options } : options;
  return switchCommand.call(this, { ...opts, create: true });
}

export function buildSwitchArgs(options: SwitchOptions): string[] {
  const args = ['switch', '--format=json'];

  if (options.create) args.push('--create');
  if (options.branches) args.push('--branches');
  if (options.remotes) args.push('--remotes');
  if (options.base) args.push('--base', options.base);
  if (options.clobber) args.push('--clobber');
  if (options.noCd) args.push('--no-cd');
  if (options.noHooks) args.push('--no-hooks');
  if (options.yes) args.push('--yes');

  if (options.execute) {
    const execute = Array.isArray(options.execute) ? options.execute : [options.execute];
    const [program] = execute;
    args.push('--execute', program);
  }

  if (options.branch) args.push(options.branch);

  const executeArgs = [
    ...(Array.isArray(options.execute) ? options.execute.slice(1) : []),
    ...(options.executeArgs ?? []),
  ];
  if (executeArgs.length > 0) args.push('--', ...executeArgs);

  return args;
}
