import type { NormalizedOptions, WorktrunkOptions } from './types.js';
import { switchCommand, createCommand } from './commands/switch.js';
import { removeCommand } from './commands/remove.js';
import { listCommand } from './commands/list.js';
import { mergeCommand } from './commands/merge.js';
import { hookCommand, hookShowCommand } from './commands/hook.js';

export interface WorktrunkInstance {
  switch: typeof switchCommand;
  create: typeof createCommand;
  remove: typeof removeCommand;
  list: typeof listCommand;
  merge: typeof mergeCommand;
  hook: typeof hookCommand;
  hookShow: typeof hookShowCommand;
  options: NormalizedOptions;
}

function normalizeOptions(options: WorktrunkOptions | string = {}): NormalizedOptions {
  if (typeof options === 'string') {
    return { binary: options };
  }
  return {
    binary: options.binary || 'wt',
    baseDir: options.baseDir,
  };
}

export function createWorktrunkInstance(options: WorktrunkOptions | string = {}): WorktrunkInstance {
  const normalized = normalizeOptions(options);

  const instance: Partial<WorktrunkInstance> = {
    options: normalized,
  };

  // Bind methods to instance
  instance.switch = switchCommand.bind(instance);
  instance.create = createCommand.bind(instance);
  instance.remove = removeCommand.bind(instance);
  instance.list = listCommand.bind(instance);
  instance.merge = mergeCommand.bind(instance);
  instance.hook = hookCommand.bind(instance);
  instance.hookShow = hookShowCommand.bind(instance);

  return instance as WorktrunkInstance;
}
