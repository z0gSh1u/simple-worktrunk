import type { SwitchResult, WorktreeInfo } from '../types.js';

export function mapSwitchResult(input: any): SwitchResult {
  return {
    action: input.action ?? '',
    branch: input.branch ?? '',
    path: input.path ?? '',
  };
}

export function mapListItem(item: any): WorktreeInfo {
  return {
    branch: item.branch ?? '',
    path: item.path ?? '',
    kind: item.kind ?? 'worktree',
    isMain: Boolean(item.is_main),
    isCurrent: Boolean(item.is_current),
    isPrevious: Boolean(item.is_previous),
    commit: item.commit
      ? {
          sha: item.commit.sha,
          shortSha: item.commit.short_sha,
          message: item.commit.message,
          timestamp: item.commit.timestamp,
        }
      : undefined,
    workingTree: item.working_tree
      ? {
          staged: Boolean(item.working_tree.staged),
          modified: Boolean(item.working_tree.modified),
          untracked: Boolean(item.working_tree.untracked),
          renamed: Boolean(item.working_tree.renamed),
          deleted: Boolean(item.working_tree.deleted),
          diff: item.working_tree.diff,
        }
      : undefined,
    mainState: item.main_state,
    integrationReason: item.integration_reason,
    remote: item.remote,
    main: item.main,
    ci: item.ci,
    url: item.url,
    summary: item.summary,
    vars: item.vars,
    statusline: item.statusline,
    symbols: item.symbols,
  };
}
