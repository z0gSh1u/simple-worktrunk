export type StageMode = 'all' | 'tracked' | 'none';
export type OutputFormat = 'text' | 'json';

export interface CommandOptions {
  allowNonZeroExit?: boolean;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}

export type HookType =
  | 'pre-switch'
  | 'post-switch'
  | 'pre-start'
  | 'post-start'
  | 'pre-commit'
  | 'post-commit'
  | 'pre-merge'
  | 'post-merge'
  | 'pre-remove'
  | 'post-remove';

export interface SwitchOptions {
  branch?: string;
  create?: boolean;
  base?: string;
  execute?: string | string[];
  executeArgs?: string[];
  branches?: boolean;
  remotes?: boolean;
  clobber?: boolean;
  noCd?: boolean;
  noHooks?: boolean;
  yes?: boolean;
}

export interface CreateOptions extends Omit<SwitchOptions, 'create'> {
  branch: string;
}

export type SwitchAction = 'created' | 'existing' | 'switched' | 'already_at' | string;

export interface SwitchResult {
  action: SwitchAction;
  branch: string;
  path: string;
}

export interface ListOptions {
  full?: boolean;
  branches?: boolean;
  remotes?: boolean;
}

export interface WorktreeInfo {
  branch: string;
  path: string;
  kind: 'worktree' | string;
  isMain: boolean;
  isCurrent: boolean;
  isPrevious: boolean;
  commit?: {
    sha: string;
    shortSha: string;
    message: string;
    timestamp: number;
  };
  workingTree?: {
    staged: boolean;
    modified: boolean;
    untracked: boolean;
    renamed: boolean;
    deleted: boolean;
    diff?: { added: number; deleted: number };
  };
  mainState?: string;
  integrationReason?: string;
  remote?: { name: string; branch: string; ahead: number; behind: number };
  main?: { ahead: number; behind: number };
  ci?: unknown;
  url?: string;
  summary?: string;
  vars?: Record<string, unknown>;
  statusline?: string;
  symbols?: string;
}

export interface ListResult {
  worktrees: WorktreeInfo[];
  current: string;
}

export interface RemoveOptions {
  branches?: string[];
  keepBranch?: boolean;
  force?: boolean;
  forceDelete?: boolean;
  noHooks?: boolean;
  yes?: boolean;
}

export interface RemoveResult {
  removed: Array<{ branch?: string; path?: string }>;
  raw: Record<string, unknown>;
}

export interface MergeOptions {
  target?: string;
  squash?: boolean;
  commit?: boolean;
  rebase?: boolean;
  remove?: boolean;
  ff?: boolean;
  stage?: StageMode;
  noHooks?: boolean;
  yes?: boolean;
}

export interface MergeResult {
  target?: string;
  source?: string;
  branch?: string;
  path?: string;
  raw: Record<string, unknown>;
}

export interface HookRunOptions {
  type: HookType;
  names?: string[];
  foreground?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  vars?: Record<string, string>;
}

export interface HookResult {
  hook: HookType;
  stdout: string;
  stderr: string;
}

export interface NamedHook {
  name?: string;
  command: string;
  source: 'user' | 'project';
}

export interface HookShowResult {
  hooks: Record<string, NamedHook[]>;
}

export interface StepCommitOptions {
  branch?: string;
  stage?: StageMode;
  dryRun?: boolean;
  noHooks?: boolean;
}

export interface StepSquashOptions {
  target?: string;
  stage?: StageMode;
  dryRun?: boolean;
  noHooks?: boolean;
}

export interface StepTargetOptions {
  target?: string;
}

export interface StepPruneOptions {
  dryRun?: boolean;
  minAge?: string;
  foreground?: boolean;
}

export interface StepCommandOptions {
  command: string[];
}

export interface ConfigShowOptions {
  full?: boolean;
  format?: OutputFormat;
}

export interface StateVarOptions {
  branch?: string;
}

export interface WorktrunkOptions {
  binary?: string;
  baseDir?: string;
  configPath?: string;
}

export interface NormalizedOptions {
  binary: string;
  baseDir?: string;
  configPath?: string;
}
