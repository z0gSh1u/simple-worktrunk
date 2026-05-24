import type { WorktrunkInstance } from '../worktrunk.js';
import type { HookRunOptions, HookResult, HookShowResult } from '../types.js';
import { execCommand } from '../utils/executor.js';
import { parseHookShowOutput } from '../utils/parser.js';

export async function hookCommand(
  this: WorktrunkInstance,
  options: HookRunOptions
): Promise<HookResult> {
  const { options: config } = this;

  const args = ['hook', options.type];

  if (options.names?.length) {
    args.push(...options.names);
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
    stdout: '',
    stderr: '',
  };
}

export async function hookShowCommand(
  this: WorktrunkInstance
): Promise<HookShowResult> {
  const { options: config } = this;

  const stdout = await execCommand(['hook', 'show'], config);

  return parseHookShowOutput(stdout);
}
