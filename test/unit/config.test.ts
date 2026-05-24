import { describe, expect, it } from 'vitest';
import {
  buildConfigShowArgs,
  buildStateVarsArgs,
  parseStateVarsListOutput,
} from '../../src/commands/config.js';

describe('buildConfigShowArgs', () => {
  it('builds json full config show args', () => {
    expect(buildConfigShowArgs({ full: true, format: 'json' })).toEqual([
      'config',
      'show',
      '--full',
      '--format=json',
    ]);
  });
});

describe('buildStateVarsArgs', () => {
  it('builds set args with branch', () => {
    expect(buildStateVarsArgs('set', { key: 'env', value: 'staging', branch: 'main' })).toEqual([
      'config',
      'state',
      'vars',
      'set',
      'env=staging',
      '--branch',
      'main',
    ]);
  });

  it('builds clear all args', () => {
    expect(buildStateVarsArgs('clearAll', {})).toEqual([
      'config',
      'state',
      'vars',
      'clear',
      '--all',
    ]);
  });
});

describe('parseStateVarsListOutput', () => {
  it('extracts keys from tabular list output', () => {
    expect(parseStateVarsListOutput('env\tstaging\nport\t3000\n')).toEqual(['env', 'port']);
  });
});
