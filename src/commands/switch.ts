import type { WorktrunkInstance } from '../worktrunk.js';
import type { SwitchOptions, SwitchResult, CreateOptions } from '../types.js';
import { execCommandWithStderr } from '../utils/executor.js';
import { parseSwitchOutput } from '../utils/parser.js';

export async function switchCommand(
  this: WorktrunkInstance,
  options: string | SwitchOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { branch: options } : options;
  const { options: config } = this;

  const args = ['switch'];

  if (opts.create) {
    args.push('--create');
  }

  if (opts.base) {
    args.push('--base', opts.base);
  }

  if (opts.execute) {
    const execute = Array.isArray(opts.execute) ? opts.execute : [opts.execute];
    args.push('--execute', ...execute);
  }

  if (opts.noCd) {
    args.push('--no-cd');
  }

  if (opts.branch) {
    args.push(opts.branch);
  }

  const result = await execCommandWithStderr(args, config);
  const { path } = parseSwitchOutput(result.stdout || result.stderr);

  return {
    action: opts.create ? 'created' : 'switched',
    branch: opts.branch || '',
    path: path,
  };
}

export async function createCommand(
  this: WorktrunkInstance,
  options: string | CreateOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { branch: options } : options;
  // Call switchCommand directly instead of this.switch to avoid circular dependency
  return switchCommand.call(this, { ...opts, create: true });
}
