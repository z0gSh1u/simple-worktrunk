import { describe, it, expect } from 'vitest';
import {
  WorktrunkError,
  BinaryNotFoundError,
  CommandFailedError,
  JsonParseError,
} from '../../src/errors.js';

describe('WorktrunkError', () => {
  it('should create base error', () => {
    const error = new WorktrunkError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('WorktrunkError');
  });

  it('should accept code and command parameters', () => {
    const error = new WorktrunkError('Test error', '1', 'wt switch');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('1');
    expect(error.command).toBe('wt switch');
  });
});

describe('BinaryNotFoundError', () => {
  it('should create error with binary path', () => {
    const error = new BinaryNotFoundError('/usr/local/bin/wt');

    expect(error.message).toContain('/usr/local/bin/wt');
    expect(error.name).toBe('BinaryNotFoundError');
  });

  it('should be instanceof WorktrunkError', () => {
    const error = new BinaryNotFoundError('wt');

    expect(error).toBeInstanceOf(WorktrunkError);
  });
});

describe('CommandFailedError', () => {
  it('should include command, code, and stderr in message', () => {
    const error = new CommandFailedError(
      'wt switch feature',
      1,
      'fatal: invalid reference'
    );

    expect(error.message).toContain('wt switch feature');
    expect(error.message).toContain('1');
    expect(error.message).toContain('fatal: invalid reference');
    expect(error.code).toBe('1');
    expect(error.stderr).toBeUndefined(); // stderr is not stored as a property
    expect(error.command).toBe('wt switch feature');
    expect(error.name).toBe('CommandFailedError');
  });

  it('should handle string exit code', () => {
    const error = new CommandFailedError('wt list', 'error', 'error output');

    expect(error.code).toBe('error');
    expect(error.message).toContain('error');
  });

  it('should be instanceof WorktrunkError', () => {
    const error = new CommandFailedError('wt', 1, '');

    expect(error).toBeInstanceOf(WorktrunkError);
  });

  it('should work without stderr', () => {
    const error = new CommandFailedError('wt', 1);

    expect(error.message).toContain('wt');
    expect(error.message).toContain('1');
    expect(error.code).toBe('1');
  });

  it('CommandFailedError exposes command diagnostics', () => {
    const error = new CommandFailedError({
      command: 'wt list --format=json',
      args: ['list', '--format=json'],
      exitCode: 2,
      stdout: 'partial stdout',
      stderr: 'fatal error',
    });

    expect(error.command).toBe('wt list --format=json');
    expect(error.args).toEqual(['list', '--format=json']);
    expect(error.code).toBe('2');
    expect(error.exitCode).toBe(2);
    expect(error.stdout).toBe('partial stdout');
    expect(error.stderr).toBe('fatal error');
  });
});

describe('JsonParseError', () => {
  it('JsonParseError includes output previews', () => {
    const error = new JsonParseError({
      command: 'wt switch --format=json @',
      stdout: 'not json',
      stderr: 'warning',
    });

    expect(error.command).toBe('wt switch --format=json @');
    expect(error.stdoutPreview).toBe('not json');
    expect(error.stderrPreview).toBe('warning');
  });
});
