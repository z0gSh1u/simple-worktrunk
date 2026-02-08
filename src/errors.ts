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
  constructor(command: string, exitCode: number | string, stderr?: string) {
    super(
      `Command '${command}' failed with exit code ${exitCode}${stderr ? ': ' + stderr : ''}`,
      String(exitCode),
      command
    );
    this.name = 'CommandFailedError';
  }
}
