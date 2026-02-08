import type { WorktrunkInstance } from '../worktrunk.js';
import type { SwitchOptions, SwitchResult, CreateOptions } from '../types.js';
import { execCommand } from '../utils/executor.js';

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

  const stdout = await execCommand(args, config);

  return {
    worktree: opts.name || '',
    path: stdout,
    branch: opts.name || '',
    created: opts.create || false,
  };
}

export async function createCommand(
  this: WorktrunkInstance,
  options: string | CreateOptions
): Promise<SwitchResult> {
  const opts = typeof options === 'string' ? { name: options } : options;
  return this.switch({ ...opts, create: true });
}
