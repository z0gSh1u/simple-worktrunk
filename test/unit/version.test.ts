import { describe, expect, it } from 'vitest';
import { isAtLeastVersion, parseWorktrunkVersion } from '../../src/utils/version.js';

describe('parseWorktrunkVersion', () => {
  it('parses wt version output', () => {
    expect(parseWorktrunkVersion('wt 0.53.0')).toEqual({ major: 0, minor: 53, patch: 0 });
  });

  it('returns null for unrecognized output', () => {
    expect(parseWorktrunkVersion('not worktrunk')).toBeNull();
  });
});

describe('isAtLeastVersion', () => {
  it('compares semantic versions', () => {
    expect(isAtLeastVersion({ major: 0, minor: 53, patch: 0 }, { major: 0, minor: 53, patch: 0 })).toBe(true);
    expect(isAtLeastVersion({ major: 0, minor: 54, patch: 0 }, { major: 0, minor: 53, patch: 0 })).toBe(true);
    expect(isAtLeastVersion({ major: 0, minor: 52, patch: 9 }, { major: 0, minor: 53, patch: 0 })).toBe(false);
  });
});
