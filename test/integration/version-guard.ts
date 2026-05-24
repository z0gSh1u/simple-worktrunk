import { beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { isAtLeastVersion, parseWorktrunkVersion } from '../../src/utils/version.js';

beforeAll(() => {
  const output = execFileSync('wt', ['--version'], { encoding: 'utf8' });
  const version = parseWorktrunkVersion(output);

  if (!version || !isAtLeastVersion(version, { major: 0, minor: 53, patch: 0 })) {
    throw new Error(`Integration tests require worktrunk >= 0.53.0; found ${output.trim()}`);
  }
});
