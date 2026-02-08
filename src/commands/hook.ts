import type { WorktrunkInstance } from '../worktrunk.js';
import type { HookOptions, HookResult, HookShowResult } from '../types.js';
import { execCommand } from '../utils/executor.js';
import { parseHookShowOutput } from '../utils/parser.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    hook(options: HookOptions): Promise<HookResult>;
    hookShow(): Promise<HookShowResult>;
  }
}

export async function hookCommand(
  this: WorktrunkInstance,
  options: HookOptions
): Promise<HookResult> {
  const { options: config } = this;

  const args = ['hook', options.type];

  if (options.name) {
    args.push(options.name);
  }

  if (options.userOnly) {
    args.push('user:');
  }

  if (options.projectOnly) {
    args.push('project:');
  }

  if (options.yes) {
    args.push('--yes');
  }

  if (options.vars) {
    for (const [key, value] of Object.entries(options.vars)) {
      args.push('--var', `${key}=${value}`);
    }
  }

  await execCommand(args, config);

  return {
    hook: options.type,
    executed: [],
  };
}

export async function hookShowCommand(
  this: WorktrunkInstance
): Promise<HookShowResult> {
  const { options: config } = this;

  const stdout = await execCommand(['hook', 'show'], config);

  return parseHookShowOutput(stdout);
}
