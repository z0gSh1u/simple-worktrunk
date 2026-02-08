// Hook types
export type HookType =
  | 'post-create'
  | 'post-switch'
  | 'pre-merge'
  | 'post-merge'
  | 'pre-remove'
  | 'post-remove';

// Switch options and result
export interface SwitchOptions {
  name?: string;
  create?: boolean;
  base?: string;
  exec?: string;
  noCd?: boolean;
}

export interface SwitchResult {
  worktree: string;
  path: string;
  branch: string;
  created: boolean;
}

// Create options (alias for switch with create=true)
export interface CreateOptions {
  name: string;
  base?: string;
  exec?: string;
  noCd?: boolean;
}

// Remove options and result
export interface RemoveOptions {
  name?: string;
  keepBranch?: boolean;
}

export interface RemoveResult {
  removed: string;
  branchDeleted: boolean;
}

// List result
export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  isMain: boolean;
}

export interface ListResult {
  worktrees: WorktreeInfo[];
  current: string;
}

// Merge options and result
export interface MergeOptions {
  target?: string;
  keepWorktree?: boolean;
}

export interface MergeResult {
  merged: string;
  target: string;
  worktreeRemoved: boolean;
}

// Hook options and result
export interface HookOptions {
  type: HookType;
  name?: string;
  userOnly?: boolean;
  projectOnly?: boolean;
  yes?: boolean;
  vars?: Record<string, string>;
}

export interface HookExecution {
  name: string;
  source: 'user' | 'project';
  success: boolean;
  output?: string;
}

export interface HookResult {
  hook: string;
  executed: HookExecution[];
}

// Hook show result
export interface NamedHook {
  name?: string;
  command: string;
  source: 'user' | 'project';
}

export interface HookShowResult {
  hooks: Record<string, NamedHook[]>;
}

// Worktrunk instance options
export interface WorktrunkOptions {
  binary?: string;
  baseDir?: string;
}

// Normalized options (internal)
export interface NormalizedOptions {
  binary: string;
  baseDir?: string;
}
