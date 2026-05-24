import type {
  ListResult,
  WorktreeInfo,
  HookShowResult,
  NamedHook,
  SwitchResult,
} from '../types.js';
import { extractFirstJsonValue } from './json.js';
import { mapListItem, mapSwitchResult } from './mapper.js';

/**
 * Parse `wt list` output into structured data
 * Input format from CLI: JSON array of worktree objects
 */
export function parseListOutput(stdout: string): ListResult {
  const json = extractFirstJsonValue(stdout);
  if (!json) return { worktrees: [], current: '' };

  try {
    const data = JSON.parse(json);
    const worktrees: WorktreeInfo[] = [];
    let current = '';

    for (const item of data) {
      if (item.kind !== 'worktree') continue;
      const worktree = mapListItem(item);
      worktrees.push(worktree);
      if (worktree.isCurrent) current = worktree.branch;
    }

    return { worktrees, current };
  } catch {
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

export function parseSwitchOutput(output: string): SwitchResult {
  const json = extractFirstJsonValue(output);
  if (!json) return { action: '', branch: '', path: '' };

  try {
    return mapSwitchResult(JSON.parse(json));
  } catch {
    return { action: '', branch: '', path: '' };
  }
}
