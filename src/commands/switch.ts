import type { WorktrunkInstance } from '../worktrunk.js';
import type { SwitchOptions, SwitchResult, CreateOptions } from '../types.js';
import { execCommandWithStderr } from '../utils/executor.js';
import { parseSwitchOutput } from '../utils/parser.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    switch(options: string | SwitchOptions): Promise<SwitchResult>;
    create(options: string | CreateOptions): Promise<SwitchResult>;
  }
}

export async function switchCommand(
  this: WorktrunkInstance,
  options: string | SwitchOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  const { options: config } = this;

  const args = ['switch'];

  if (opts.create) {
    args.push('--create');
  }

  if (opts.base) {
    args.push('--base', opts.base);
  }

  if (opts.exec) {
    args.push('--exec', opts.exec);
  }

  if (opts.noCd) {
    args.push('--no-cd');
  }

  if (opts.name) {
    args.push(opts.name);
  }

  const result = await execCommandWithStderr(args, config);
  const { path } = parseSwitchOutput(result.stdout || result.stderr);

  return {
    worktree: opts.name || '',
    path: path,
    branch: opts.name || '',
    created: opts.create || false,
  };
}

export async function createCommand(
  this: WorktrunkInstance,
  options: string | CreateOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  // Call switchCommand directly instead of this.switch to avoid circular dependency
  return switchCommand.call(this, { ...opts, create: true });
}
