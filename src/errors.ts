export interface CommandFailedErrorOptions {
  command: string;
  args?: string[];
  exitCode: number | string | null;
  stdout?: string;
  stderr?: string;
}

export interface JsonParseErrorOptions {
  command: string;
  stdout?: string;
  stderr?: string;
}

function preview(value = ''): string {
  return value.length > 500 ? `${value.slice(0, 500)}...` : value;
}

export class WorktrunkError extends Error {
  code?: string;
  command?: string;

  constructor(message: string, code?: string, command?: string) {
    super(message);
    this.name = 'WorktrunkError';
    this.code = code;
    this.command = command;
  }
}

export class BinaryNotFoundError extends WorktrunkError {
  constructor(binaryPath: string) {
    super(`Worktrunk binary not found at: ${binaryPath}`);
    this.name = 'BinaryNotFoundError';
  }
}

export class CommandFailedError extends WorktrunkError {
  args?: string[];
  exitCode: number | string | null;
  stdout?: string;
  stderr?: string;

  constructor(options: CommandFailedErrorOptions);
  constructor(command: string, exitCode: number | string | null, stderr?: string);
  constructor(
    optionsOrCommand: CommandFailedErrorOptions | string,
    exitCode?: number | string | null,
    stderr?: string
  ) {
    const options =
      typeof optionsOrCommand === 'string'
        ? { command: optionsOrCommand, exitCode: exitCode ?? 'unknown', stderr }
        : optionsOrCommand;

    super(
      `Command '${options.command}' failed with exit code ${options.exitCode}${
        options.stderr ? ': ' + options.stderr : ''
      }`,
      String(options.exitCode),
      options.command
    );

    this.name = 'CommandFailedError';
    this.args = options.args;
    this.exitCode = options.exitCode;
    this.stdout = options.stdout;
    this.stderr = typeof optionsOrCommand === 'string' ? undefined : options.stderr;
  }
}

export class JsonParseError extends WorktrunkError {
  stdoutPreview: string;
  stderrPreview: string;

  constructor(options: JsonParseErrorOptions) {
    super(
      `Failed to parse JSON output from '${options.command}'`,
      'JSON_PARSE_ERROR',
      options.command
    );
    this.name = 'JsonParseError';
    this.stdoutPreview = preview(options.stdout);
    this.stderrPreview = preview(options.stderr);
  }
}
