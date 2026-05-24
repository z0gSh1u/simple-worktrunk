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
import { removeCommand } from './commands/remove.js';
import { mergeCommand } from './commands/merge.js';
import { hookRunCommand, hookShowCommand } from './commands/hook.js';
import {
  stepCommitCommand,
  stepDiffCommand,
  stepEvalCommand,
  stepForEachCommand,
  stepPruneCommand,
  stepPushCommand,
  stepRebaseCommand,
  stepSquashCommand,
  stepTetherCommand,
} from './commands/step.js';
import {
  codexInstallCommand,
  codexUninstallCommand,
  configShowCommand,
  stateLogsCommand,
  stateVarsClearAllCommand,
  stateVarsClearCommand,
  stateVarsGetCommand,
  stateVarsListCommand,
  stateVarsSetCommand,
} from './commands/config.js';

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

  return {
    options: normalized,
    switch: (opts) => switchCommand.call(baseInstance, opts ?? {}),
    create: (opts) => createCommand.call(baseInstance, opts),
    remove: (opts) => removeCommand.call(baseInstance, opts ?? {}),
    list: (opts) => listCommand.call(baseInstance, opts ?? {}),
    merge: (opts) => mergeCommand.call(baseInstance, opts ?? {}),
    hook: {
      run: (opts) => hookRunCommand.call(baseInstance, opts),
      show: () => hookShowCommand.call(baseInstance),
    },
    step: {
      commit: (opts) => stepCommitCommand.call(baseInstance, opts ?? {}),
      squash: (opts) => stepSquashCommand.call(baseInstance, opts ?? {}),
      rebase: (opts) => stepRebaseCommand.call(baseInstance, opts ?? {}),
      push: (opts) => stepPushCommand.call(baseInstance, opts ?? {}),
      diff: (opts) => stepDiffCommand.call(baseInstance, opts ?? {}),
      prune: (opts) => stepPruneCommand.call(baseInstance, opts ?? {}),
      tether: (opts) => stepTetherCommand.call(baseInstance, opts),
      forEach: (opts) => stepForEachCommand.call(baseInstance, opts),
      eval: (expr) => stepEvalCommand.call(baseInstance, expr),
      raw: (args, opts) => rawCommand.call(baseInstance, ['step', ...args], opts),
    },
    config: {
      show: (opts) => configShowCommand.call(baseInstance, opts ?? {}),
      state: {
        vars: {
          list: (opts) => stateVarsListCommand.call(baseInstance, opts ?? {}),
          get: (key, opts) => stateVarsGetCommand.call(baseInstance, key, opts ?? {}),
          set: (key, value, opts) => stateVarsSetCommand.call(baseInstance, key, value, opts ?? {}),
          clear: (key, opts) => stateVarsClearCommand.call(baseInstance, key, opts ?? {}),
          clearAll: (opts) => stateVarsClearAllCommand.call(baseInstance, opts ?? {}),
        },
        logs: () => stateLogsCommand.call(baseInstance),
      },
      plugins: {
        codex: {
          install: () => codexInstallCommand.call(baseInstance),
          uninstall: () => codexUninstallCommand.call(baseInstance),
        },
      },
      raw: (args, opts) => rawCommand.call(baseInstance, ['config', ...args], opts),
    },
    raw: (args, opts) => rawCommand.call(baseInstance, args, opts),
  };
}
