import { spawn } from 'node:child_process';
import { BinaryNotFoundError, CommandFailedError, JsonParseError } from '../errors.js';
import type { CommandOptions, NormalizedOptions } from '../types.js';
import { extractFirstJsonValue } from './json.js';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface ExecuteOptions extends CommandOptions {
  includeConfig?: boolean;
}

export async function execCommand(
  args: string[],
  options: NormalizedOptions,
  commandOptions: CommandOptions = {}
): Promise<string> {
  const result = await execute(args, options, commandOptions);

  return result.stdout.trim();
}

export async function execCommandWithStderr(
  args: string[],
  options: NormalizedOptions,
  commandOptions: CommandOptions = {}
): Promise<ExecResult> {
  return execute(args, options, commandOptions);
}

export async function execute(
  args: string[],
  options: NormalizedOptions,
  commandOptions: ExecuteOptions = {}
): Promise<ExecResult> {
  const { binary, baseDir } = options;
  const fullArgs = buildArgs(args, options, commandOptions);
  const result = await spawnCommand(binary, fullArgs, {
    cwd: commandOptions.cwd ?? baseDir,
    env: commandOptions.env,
    signal: commandOptions.signal,
  });
  const command = formatCommand(binary, fullArgs);

  if (result.exitCode !== 0 && !commandOptions.allowNonZeroExit) {
    throw new CommandFailedError({
      command,
      args: fullArgs,
      exitCode: result.exitCode ?? 'unknown',
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  return result;
}

export async function executeJson<T>(
  args: string[],
  options: NormalizedOptions,
  commandOptions: ExecuteOptions = {}
): Promise<T> {
  const result = await execute(args, options, commandOptions);
  const command = formatCommand(options.binary, buildArgs(args, options, commandOptions));
  const json = extractFirstJsonValue(result.stdout);

  if (!json) {
    throw new JsonParseError({
      command,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    throw new JsonParseError({
      command,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }
}

function buildArgs(
  args: string[],
  options: NormalizedOptions,
  commandOptions: ExecuteOptions
): string[] {
  if (commandOptions.includeConfig === false || !options.configPath) {
    return [...args];
  }

  return ['--config', options.configPath, ...args];
}

function formatCommand(binary: string, args: string[]): string {
  return [binary, ...args].join(' ');
}

async function spawnCommand(
  binary: string,
  args: string[],
  options: CommandOptions
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const proc = spawn(binary, args, {
      cwd: options.cwd,
      env: options.env ? { ...process.env, ...options.env } : process.env,
      signal: options.signal,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on('error', (err) => {
      if (settled) {
        return;
      }
      settled = true;

      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new BinaryNotFoundError(binary));
        return;
      }

      reject(err);
    });
  });
}
