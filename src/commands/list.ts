import type { WorktrunkInstance } from '../worktrunk.js';
import type { ListResult } from '../types.js';
import { execCommand } from '../utils/executor.js';
import { parseListOutput } from '../utils/parser.js';

declare module '../worktrunk.js' {
  interface WorktrunkInstance {
    list(): Promise<ListResult>;
  }
}

export async function listCommand(
  this: WorktrunkInstance
): Promise<ListResult> {
  const { options: config } = this;

  const stdout = await execCommand(['list'], config);

  return parseListOutput(stdout);
}
