import type {
  CommandOptions,
  ConfigShowOptions,
  CreateOptions,
  HookResult,
  HookRunOptions,
  HookShowResult,
  ListOptions,
  ListResult,
  MergeOptions,
  MergeResult,
  NormalizedOptions,
  RemoveOptions,
  RemoveResult,
  StateVarOptions,
  StepCommandOptions,
  StepCommitOptions,
  StepPruneOptions,
  StepSquashOptions,
  StepTargetOptions,
  SwitchOptions,
  SwitchResult,
  WorktrunkOptions,
} from './types.js';
import { rawCommand } from './commands/raw.js';
import type { ExecResult } from './utils/executor.js';
import { switchCommand, createCommand } from './commands/switch.js';
import { listCommand } from './commands/list.js';

export interface HookNamespace {
  run(options: HookRunOptions): Promise<HookResult>;
  show(): Promise<HookShowResult>;
}

export interface StepNamespace {
  commit(options?: StepCommitOptions): Promise<ExecResult>;
  squash(options?: StepSquashOptions): Promise<ExecResult>;
  rebase(options?: StepTargetOptions): Promise<ExecResult>;
  push(options?: StepTargetOptions): Promise<ExecResult>;
  diff(options?: StepTargetOptions): Promise<ExecResult>;
  prune(options?: StepPruneOptions): Promise<ExecResult>;
  tether(options: StepCommandOptions): Promise<ExecResult>;
  forEach(options: StepCommandOptions): Promise<ExecResult>;
  eval(expression: string): Promise<string>;
  raw(args: string[], options?: CommandOptions): Promise<ExecResult>;
}

export interface ConfigNamespace {
  show(options?: ConfigShowOptions): Promise<unknown>;
  state: {
    vars: {
      list(options?: StateVarOptions): Promise<string[]>;
      get(key: string, options?: StateVarOptions): Promise<string>;
      set(key: string, value: string, options?: StateVarOptions): Promise<ExecResult>;
      clear(key: string, options?: StateVarOptions): Promise<ExecResult>;
      clearAll(options?: StateVarOptions): Promise<ExecResult>;
    };
    logs(): Promise<unknown>;
  };
  plugins: {
    codex: {
      install(): Promise<ExecResult>;
      uninstall(): Promise<ExecResult>;
    };
  };
  raw(args: string[], options?: CommandOptions): Promise<ExecResult>;
}

export interface WorktrunkInstance {
  switch(options?: string | SwitchOptions): Promise<SwitchResult>;
  create(options: string | CreateOptions): Promise<SwitchResult>;
  remove(options?: string | RemoveOptions): Promise<RemoveResult>;
  list(options?: ListOptions): Promise<ListResult>;
  merge(options?: MergeOptions): Promise<MergeResult>;
  hook: HookNamespace;
  step: StepNamespace;
  config: ConfigNamespace;
  raw(args: string[], options?: CommandOptions): Promise<ExecResult>;
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
  const baseInstance = { options: normalized } as WorktrunkInstance;

  const notImplemented = async (): Promise<any> => {
    throw new Error('Command not implemented yet');
  };

  return {
    options: normalized,
    switch: (opts) => switchCommand.call(baseInstance, opts ?? {}),
    create: (opts) => createCommand.call(baseInstance, opts),
    remove: notImplemented,
    list: (opts) => listCommand.call(baseInstance, opts ?? {}),
    merge: notImplemented,
    hook: {
      run: notImplemented,
      show: notImplemented,
    },
    step: {
      commit: notImplemented,
      squash: notImplemented,
      rebase: notImplemented,
      push: notImplemented,
      diff: notImplemented,
      prune: notImplemented,
      tether: notImplemented,
      forEach: notImplemented,
      eval: notImplemented,
      raw: (args, opts) => rawCommand.call(baseInstance, ['step', ...args], opts),
    },
    config: {
      show: notImplemented,
      state: {
        vars: {
          list: notImplemented,
          get: notImplemented,
          set: notImplemented,
          clear: notImplemented,
          clearAll: notImplemented,
        },
        logs: notImplemented,
      },
      plugins: {
        codex: {
          install: notImplemented,
          uninstall: notImplemented,
        },
      },
      raw: (args, opts) => rawCommand.call(baseInstance, ['config', ...args], opts),
    },
    raw: (args, opts) => rawCommand.call(baseInstance, args, opts),
  };
}
