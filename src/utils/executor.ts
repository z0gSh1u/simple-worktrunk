import { spawn } from 'node:child_process';
import { BinaryNotFoundError, CommandFailedError } from '../errors.js';
import type { NormalizedOptions } from '../types.js';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function execCommand(
  args: string[],
  options: NormalizedOptions
): Promise<string> {
  const { binary, baseDir } = options;

  const result = await spawnCommand(binary, args, baseDir);

  if (result.exitCode !== 0) {
    throw new CommandFailedError(
      `${binary} ${args.join(' ')}`,
      result.exitCode || 'unknown',
      result.stderr
    );
  }

  return result.stdout.trim();
}

export async function execCommandWithStderr(
  args: string[],
  options: NormalizedOptions
): Promise<ExecResult> {
  const { binary, baseDir } = options;

  const result = await spawnCommand(binary, args, baseDir);

  if (result.exitCode !== 0) {
    throw new CommandFailedError(
      `${binary} ${args.join(' ')}`,
      result.exitCode || 'unknown',
      result.stderr
    );
  }

  return result;
}

async function spawnCommand(
  binary: string,
  args: string[],
  cwd?: string
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(binary, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new BinaryNotFoundError(binary));
      }
      reject(err);
    });
  });
}
