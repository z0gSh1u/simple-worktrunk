export {
  WorktrunkError,
  BinaryNotFoundError,
  CommandFailedError,
  JsonParseError,
} from './errors.js';

export type {
  CommandOptions,
  ConfigShowOptions,
  CreateOptions,
  HookRunOptions,
  HookShowResult,
  HookType,
  ListOptions,
  ListResult,
  MergeOptions,
  MergeResult,
  NamedHook,
  RemoveOptions,
  RemoveResult,
  StageMode,
  StateVarOptions,
  StepCommandOptions,
  StepCommitOptions,
  StepPruneOptions,
  StepSquashOptions,
  StepTargetOptions,
  SwitchAction,
  SwitchOptions,
  SwitchResult,
  WorktreeInfo,
  WorktrunkOptions,
} from './types.js';

import { createWorktrunkInstance } from './worktrunk.js';

export { createWorktrunkInstance };

export function worktrunk(
  options?: string | import('./types.js').WorktrunkOptions
): import('./worktrunk.js').WorktrunkInstance {
  return createWorktrunkInstance(options);
}
