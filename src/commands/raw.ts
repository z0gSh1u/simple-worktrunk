import type { WorktrunkInstance } from '../worktrunk.js';
import type { CommandOptions } from '../types.js';
import { execute, type ExecResult } from '../utils/executor.js';

export async function rawCommand(
  this: WorktrunkInstance,
  args: string[],
  options?: CommandOptions
): Promise<ExecResult> {
  return execute(args, this.options, options);
}
