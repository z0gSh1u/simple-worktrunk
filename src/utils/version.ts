export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export function parseWorktrunkVersion(output: string): Version | null {
  const match = output.match(/\bwt\s+(\d+)\.(\d+)\.(\d+)\b/);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isAtLeastVersion(version: Version, minimum: Version): boolean {
  if (version.major !== minimum.major) {
    return version.major > minimum.major;
  }

  if (version.minor !== minimum.minor) {
    return version.minor > minimum.minor;
  }

  return version.patch >= minimum.patch;
}
