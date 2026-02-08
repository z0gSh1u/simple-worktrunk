export type {
  SwitchOptions,
  SwitchResult,
  CreateOptions,
  RemoveOptions,
  RemoveResult,
  ListResult,
  WorktreeInfo,
  MergeOptions,
  MergeResult,
  HookType,
  HookOptions,
  HookResult,
  HookExecution,
  HookShowResult,
  NamedHook,
  WorktrunkOptions,
} from './types.js';
export { WorktrunkError, BinaryNotFoundError, CommandFailedError } from './errors.js';

// Main factory function
import { createWorktrunkInstance } from './worktrunk.js';

export { createWorktrunkInstance };

export function worktrunk(options?: string | import('./types.js').WorktrunkOptions): import('./worktrunk.js').WorktrunkInstance {
  return createWorktrunkInstance(options);
}
