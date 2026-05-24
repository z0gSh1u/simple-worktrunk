import type { WorktrunkInstance } from '../worktrunk.js';
import type { ConfigShowOptions, StateVarOptions } from '../types.js';
import { execute, executeJson, type ExecResult } from '../utils/executor.js';

type VarsAction = 'list' | 'get' | 'set' | 'clear' | 'clearAll';

interface VarsArgs {
  key?: string;
  value?: string;
  branch?: string;
}

export async function configShowCommand(
  this: WorktrunkInstance,
  options: ConfigShowOptions = {}
): Promise<unknown> {
  const args = buildConfigShowArgs(options);
  if (options.format === 'json') return executeJson(args, this.options);
  return execute(args, this.options);
}

export async function stateVarsListCommand(
  this: WorktrunkInstance,
  options: StateVarOptions = {}
): Promise<string[]> {
  const result = await execute(buildStateVarsArgs('list', options), this.options);
  return parseStateVarsListOutput(result.stdout);
}

export async function stateVarsGetCommand(
  this: WorktrunkInstance,
  key: string,
  options: StateVarOptions = {}
): Promise<string> {
  const result = await execute(buildStateVarsArgs('get', { ...options, key }), this.options);
  return result.stdout.trim();
}

export async function stateVarsSetCommand(
  this: WorktrunkInstance,
  key: string,
  value: string,
  options: StateVarOptions = {}
): Promise<ExecResult> {
  return execute(buildStateVarsArgs('set', { ...options, key, value }), this.options);
}

export async function stateVarsClearCommand(
  this: WorktrunkInstance,
  key: string,
  options: StateVarOptions = {}
): Promise<ExecResult> {
  return execute(buildStateVarsArgs('clear', { ...options, key }), this.options);
}

export async function stateVarsClearAllCommand(
  this: WorktrunkInstance,
  options: StateVarOptions = {}
): Promise<ExecResult> {
  return execute(buildStateVarsArgs('clearAll', options), this.options);
}

export async function stateLogsCommand(this: WorktrunkInstance): Promise<unknown> {
  return executeJson(['config', 'state', 'logs', '--format=json'], this.options);
}

export async function codexInstallCommand(this: WorktrunkInstance): Promise<ExecResult> {
  return execute(['config', 'plugins', 'codex', 'install'], this.options);
}

export async function codexUninstallCommand(this: WorktrunkInstance): Promise<ExecResult> {
  return execute(['config', 'plugins', 'codex', 'uninstall'], this.options);
}

export function buildConfigShowArgs(options: ConfigShowOptions = {}): string[] {
  const args = ['config', 'show'];
  if (options.full) args.push('--full');
  if (options.format) args.push(`--format=${options.format}`);
  return args;
}

export function buildStateVarsArgs(action: VarsAction, options: VarsArgs): string[] {
  const args = ['config', 'state', 'vars'];
  if (action === 'clearAll') {
    args.push('clear', '--all');
  } else {
    args.push(action);
    if (action === 'set') args.push(`${options.key}=${options.value ?? ''}`);
    if (action === 'get' || action === 'clear') args.push(options.key ?? '');
  }
  if (options.branch) args.push('--branch', options.branch);
  return args;
}

export function parseStateVarsListOutput(output: string): string[] {
  return output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(/\s+/, 1)[0]);
}
