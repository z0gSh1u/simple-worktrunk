import type { WorktrunkInstance } from '../worktrunk.js';
import type {
  StepCommandOptions,
  StepCommitOptions,
  StepPruneOptions,
  StepSquashOptions,
  StepTargetOptions,
} from '../types.js';
import { execute, type ExecResult } from '../utils/executor.js';

type StepName = 'commit' | 'squash' | 'rebase' | 'push' | 'diff' | 'prune' | 'tether' | 'for-each';
type StepOptions =
  | StepCommitOptions
  | StepSquashOptions
  | StepTargetOptions
  | StepPruneOptions
  | StepCommandOptions;

export async function stepCommitCommand(
  this: WorktrunkInstance,
  options: StepCommitOptions = {}
): Promise<ExecResult> {
  return execute(buildStepArgs('commit', options), this.options);
}

export async function stepSquashCommand(
  this: WorktrunkInstance,
  options: StepSquashOptions = {}
): Promise<ExecResult> {
  return execute(buildStepArgs('squash', options), this.options);
}

export async function stepRebaseCommand(
  this: WorktrunkInstance,
  options: StepTargetOptions = {}
): Promise<ExecResult> {
  return execute(buildStepArgs('rebase', options), this.options);
}

export async function stepPushCommand(
  this: WorktrunkInstance,
  options: StepTargetOptions = {}
): Promise<ExecResult> {
  return execute(buildStepArgs('push', options), this.options);
}

export async function stepDiffCommand(
  this: WorktrunkInstance,
  options: StepTargetOptions = {}
): Promise<ExecResult> {
  return execute(buildStepArgs('diff', options), this.options);
}

export async function stepPruneCommand(
  this: WorktrunkInstance,
  options: StepPruneOptions = {}
): Promise<ExecResult> {
  return execute(buildStepArgs('prune', options), this.options);
}

export async function stepTetherCommand(
  this: WorktrunkInstance,
  options: StepCommandOptions
): Promise<ExecResult> {
  return execute(buildStepArgs('tether', options), this.options);
}

export async function stepForEachCommand(
  this: WorktrunkInstance,
  options: StepCommandOptions
): Promise<ExecResult> {
  return execute(buildStepArgs('for-each', options), this.options);
}

export async function stepEvalCommand(
  this: WorktrunkInstance,
  expression: string
): Promise<string> {
  const result = await execute(['step', 'eval', expression], this.options);
  return result.stdout.trim();
}

export function buildStepArgs(name: StepName, options: StepOptions = {}): string[] {
  const args = ['step', name];

  if (name === 'commit' && 'branch' in options && options.branch) {
    args.push('--branch', options.branch);
  }
  if ((name === 'commit' || name === 'squash') && 'stage' in options && options.stage) {
    args.push('--stage', options.stage);
  }
  if ((name === 'commit' || name === 'squash') && 'dryRun' in options && options.dryRun) {
    args.push('--dry-run');
  }
  if ((name === 'commit' || name === 'squash') && 'noHooks' in options && options.noHooks) {
    args.push('--no-hooks');
  }
  if (
    (name === 'squash' || name === 'rebase' || name === 'push' || name === 'diff')
    && 'target' in options
    && options.target
  ) {
    args.push(options.target);
  }

  if (name === 'prune') {
    if ('dryRun' in options && options.dryRun) args.push('--dry-run');
    if ('minAge' in options && options.minAge) args.push('--min-age', options.minAge);
    if ('foreground' in options && options.foreground) args.push('--foreground');
  }

  if (name === 'commit' || name === 'squash' || name === 'prune' || name === 'for-each') {
    args.push('--format=json');
  }

  if ((name === 'tether' || name === 'for-each') && 'command' in options && options.command.length) {
    args.push('--', ...options.command);
  }

  return args;
}
