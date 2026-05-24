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
 * Parse `wt list` output into structured data.
 * Input format from CLI: JSON array of worktree, branch, and remote objects.
 */
export function parseListOutput(stdout: string): ListResult {
  const json = extractFirstJsonValue(stdout);
  if (!json) return { worktrees: [], current: '' };

  try {
    const data = JSON.parse(json);
    const worktrees: WorktreeInfo[] = [];
    let current = '';

    for (const item of data) {
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
 * Parse `wt hook show` output into structured data.
 */
export function parseHookShowOutput(stdout: string): HookShowResult {
  const hooks: Record<string, NamedHook[]> = {};
  const lines = stdout.trim().split('\n');

  let currentSection = '';
  let source: NamedHook['source'] = 'project';
  let pendingHook: NamedHook | undefined;
  for (const line of lines) {
    if (line.startsWith('USER HOOKS')) {
      source = 'user';
      pendingHook = undefined;
      continue;
    }

    if (line.startsWith('PROJECT HOOKS')) {
      source = 'project';
      pendingHook = undefined;
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      hooks[currentSection] = [];
      pendingHook = undefined;
      continue;
    }

    const realHookMatch = line.match(/^[❯○]\s+(\S+)\s+([^:]+):/);
    if (realHookMatch) {
      const [, hookType, name] = realHookMatch;
      if (!hooks[hookType]) hooks[hookType] = [];
      pendingHook = { name: name.trim(), command: '', source };
      hooks[hookType].push(pendingHook);
      continue;
    }

    if (pendingHook && /^\s+\S/.test(line)) {
      pendingHook.command = line.trim();
      pendingHook = undefined;
      continue;
    }

    const namedHookMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*"(.+)"$/);
    if (namedHookMatch && currentSection) {
      const [, name, command] = namedHookMatch;
      hooks[currentSection].push({ name, command, source: 'project' });
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
