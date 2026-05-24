import type {
  NormalizedOptions,
  WorktrunkOptions,
  SwitchOptions,
  SwitchResult,
  CreateOptions,
  RemoveOptions,
  RemoveResult,
  ListResult,
  MergeOptions,
  MergeResult,
  HookOptions,
  HookResult,
  HookShowResult
} from './types.js';

// Direct imports to avoid circular dependency
import { switchCommand, createCommand } from './commands/switch.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { mergeCommand } from './commands/merge.js';
import { hookCommand, hookShowCommand } from './commands/hook.js';

// Define the instance interface with explicit method signatures
export interface WorktrunkInstance {
  switch(options?: string | SwitchOptions): Promise<SwitchResult>;
  create(options: string | CreateOptions): Promise<SwitchResult>;
  remove(options?: string | RemoveOptions): Promise<RemoveResult>;
  list(): Promise<ListResult>;
  merge(options?: MergeOptions): Promise<MergeResult>;
  hook(options: HookOptions): Promise<HookResult>;
  hookShow(): Promise<HookShowResult>;
  options: NormalizedOptions;
}

function normalizeOptions(options: WorktrunkOptions | string = {}): NormalizedOptions {
  if (typeof options === 'string') {
    return { binary: options };
  }
  return {
    binary: options.binary || 'wt',
    baseDir: options.baseDir,
    configPath: options.configPath,
  };
}

export function createWorktrunkInstance(options: WorktrunkOptions | string = {}): WorktrunkInstance {
  const normalized = normalizeOptions(options);

  // Create a base instance to serve as the 'this' context
  const baseInstance = {
    options: normalized,
  };

  return {
    options: normalized,
    switch: function(opts?: string | SwitchOptions) {
      return switchCommand.call(baseInstance as any, opts || {});
    },
    create: function(opts: string | CreateOptions) {
      return createCommand.call(baseInstance as any, opts);
    },
    remove: function(opts?: string | RemoveOptions) {
      return removeCommand.call(baseInstance as any, opts || {});
    },
    list: function() {
      return listCommand.call(baseInstance as any);
    },
    merge: function(opts?: MergeOptions) {
      return mergeCommand.call(baseInstance as any, opts || {});
    },
    hook: function(opts: HookOptions) {
      return hookCommand.call(baseInstance as any, opts);
    },
    hookShow: function() {
      return hookShowCommand.call(baseInstance as any);
    },
  };
}
