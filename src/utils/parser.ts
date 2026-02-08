import type {
  ListResult,
  WorktreeInfo,
  HookShowResult,
  NamedHook,
} from '../types.js';

/**
 * Parse `wt list` output into structured data
 * Input format from CLI: lines with worktree info
 */
export function parseListOutput(stdout: string): ListResult {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const worktrees: WorktreeInfo[] = [];
  let current = '';

  for (const line of lines) {
    // Parse worktree line
    // Format: "worktree-name /path/to/worktree [branch]"
    const match = line.match(/^([^\s]+)\s+([^\s]+)\s+\[([^\]]+)\](\s+\*)?$/);
    if (match) {
      const [, name, path, branch, isCurrent] = match;
      worktrees.push({
        name,
        path,
        branch,
        isMain: name === 'bare' || branch === 'main' || branch === 'master',
      });
      if (isCurrent) {
        current = name;
      }
    }
  }

  return { worktrees, current };
}

/**
 * Parse `wt hook show` output into structured data
 * Input format: TOML-like sections
 */
export function parseHookShowOutput(stdout: string): HookShowResult {
  const hooks: Record<string, NamedHook[]> = {};
  const lines = stdout.trim().split('\n');

  let currentSection = '';
  for (const line of lines) {
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      hooks[currentSection] = [];
      continue;
    }

    const namedHookMatch = line.match(/^(\w+)\s*=\s*"(.+)"$/);
    if (namedHookMatch && currentSection) {
      const [, name, command] = namedHookMatch;
      hooks[currentSection].push({ name, command, source: 'project' });
    }

    const simpleHookMatch = line.match(/^(\w+)\s*=\s*"(.+)"$/);
    if (simpleHookMatch && currentSection) {
      const [, hookType, command] = simpleHookMatch;
      if (!hooks[hookType]) hooks[hookType] = [];
      hooks[hookType].push({ command, source: 'project' });
    }
  }

  return { hooks };
}

/**
 * Parse switch/create output to extract path
 */
export function parseSwitchOutput(stdout: string): { path: string } {
  // Look for path in output
  const pathMatch = stdout.match(/\/[^\s]+/);
  if (pathMatch) {
    return { path: pathMatch[0] };
  }
  return { path: '' };
}
