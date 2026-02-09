import type {
  ListResult,
  WorktreeInfo,
  HookShowResult,
  NamedHook,
} from '../types.js';

/**
 * Parse `wt list` output into structured data
 * Input format from CLI: JSON array of worktree objects
 */
export function parseListOutput(stdout: string): ListResult {
  // Parse JSON output from wt list --format json
  // The output may contain warnings in stderr, so we need to find the JSON part
  // JSON starts with '[' and ends with ']'
  const jsonStart = stdout.indexOf('[');
  const jsonEnd = stdout.lastIndexOf(']');

  if (jsonStart === -1 || jsonEnd === -1) {
    return { worktrees: [], current: '' };
  }

  const jsonString = stdout.substring(jsonStart, jsonEnd + 1);

  try {
    const data = JSON.parse(jsonString);
    const worktrees: WorktreeInfo[] = [];
    let current = '';

    for (const item of data) {
      // Only process worktrees, not bare repos or other kinds
      if (item.kind !== 'worktree') continue;

      worktrees.push({
        name: item.branch,
        path: item.path,
        branch: item.branch,
        isMain: item.is_main || false,
      });

      if (item.is_current) {
        current = item.branch;
      }
    }

    return { worktrees, current };
  } catch (error) {
    // Fallback to empty result if JSON parsing fails
    return { worktrees: [], current: '' };
  }
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
 * wt outputs worktree path to stderr in format: "worktree @ /path/to/worktree"
 */
export function parseSwitchOutput(output: string): { path: string } {
  if (!output) {
    return { path: '' };
  }

  // Match path after @ symbol
  const pathMatch = output.match(/@\s+([^\s\n]+)/);
  if (pathMatch) {
    return { path: pathMatch[1] };
  }

  // Fallback: look for any path-like pattern
  const fallbackMatch = output.match(/[~]?[\/]?[^\s\n]+\/[^\s\n]+/);
  if (fallbackMatch) {
    return { path: fallbackMatch[0] };
  }

  return { path: '' };
}
