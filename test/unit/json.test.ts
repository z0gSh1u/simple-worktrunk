import { describe, expect, it } from 'vitest';
import { extractFirstJsonValue } from '../../src/utils/json.js';

describe('extractFirstJsonValue', () => {
  it('extracts an object followed by human-readable output', () => {
    expect(
      extractFirstJsonValue('{"action":"already_at","branch":"main"}\n○ Already on main\n')
    ).toBe('{"action":"already_at","branch":"main"}');
  });

  it('extracts an array after leading text', () => {
    expect(
      extractFirstJsonValue('warning\n[{"branch":"main"},{"branch":"feature"}]\n')
    ).toBe('[{"branch":"main"},{"branch":"feature"}]');
  });

  it('handles strings containing braces', () => {
    expect(
      extractFirstJsonValue('{"message":"hello {branch}","ok":true}\ntrailing')
    ).toBe('{"message":"hello {branch}","ok":true}');
  });

  it('returns null when stdout contains no complete JSON value', () => {
    expect(extractFirstJsonValue('plain text only')).toBeNull();
    expect(extractFirstJsonValue('{"incomplete":true')).toBeNull();
  });
});
