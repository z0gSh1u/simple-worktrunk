import type { WorktrunkInstance } from '../worktrunk.js';
import type { HookRunOptions, HookResult, HookShowResult } from '../types.js';
import { execute } from '../utils/executor.js';
import { parseHookShowOutput } from '../utils/parser.js';

export async function hookRunCommand(
  this: WorktrunkInstance,
  options: HookRunOptions
): Promise<HookResult> {
  const result = await execute(buildHookRunArgs(options), this.options);

  return {
    hook: options.type,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function hookShowCommand(this: WorktrunkInstance): Promise<HookShowResult> {
  const result = await execute(['hook', 'show'], this.options);
  return parseHookShowOutput(result.stdout);
}

export function buildHookRunArgs(options: HookRunOptions): string[] {
  const args = ['hook', options.type];
  if (options.names?.length) args.push(...options.names);
  if (options.foreground) args.push('--foreground');
  if (options.dryRun) args.push('--dry-run');
  if (options.yes) args.push('--yes');
  if (options.vars) {
    for (const [key, value] of Object.entries(options.vars)) {
      args.push('--var', `${key}=${value}`);
    }
  }
  return args;
}
