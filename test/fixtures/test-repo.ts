import { simpleGit, SimpleGit } from 'simple-git';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface GitWorktree {
  branch: string;
  path: string;
  isMain: boolean;
}

export class TestRepo {
  readonly path: string;
  private git: SimpleGit;

  private constructor(path: string) {
    this.path = path;
    this.git = simpleGit(path);
  }

  static async create(): Promise<TestRepo> {
    const timestamp = Date.now();
    // Use fixtures directory within the project
    const fixturesBase = join(__dirname, '.repos');
    const basePath = join(fixturesBase, `worktrunk-test-${timestamp}`);
    const bareDir = join(basePath, 'bare');
    const mainDir = join(basePath, 'main');

    // Create directories
    await mkdir(bareDir, { recursive: true });
    await mkdir(mainDir, { recursive: true });

    // Initialize bare repo
    const bareGit = simpleGit(bareDir);
    await bareGit.init(true);

    // Clone to main worktree
    await simpleGit().clone(bareDir, mainDir);

    const repo = new TestRepo(mainDir);
    await repo.git.addConfig('user.email', 'test@example.com');
    await repo.git.addConfig('user.name', 'Test User');

    // Create initial commit
    await repo.commit('Initial commit', { 'README.md': '# Test Repo' });

    return repo;
  }

  async reset(): Promise<void> {
    // Get the main branch name first
    const mainBranch = await this.getCurrentBranch();

    // Remove all worktrees except main (based on path, not branch name)
    const worktrees = await this.getGitWorktrees();
    for (const wt of worktrees) {
      // Skip the main worktree (our current path) and bare repo
      if (wt.path !== this.path && !wt.path.includes('/bare')) {
        await this.git.raw(['worktree', 'remove', '-f', wt.path]);
      }
    }

    // Get all branches except the current main branch
    const branches = await this.git.branch();
    const nonMainBranches = branches.all.filter(
      branch => branch !== mainBranch
    );

    // Delete non-main branches
    for (const branch of nonMainBranches) {
      await this.git.deleteLocalBranch(branch, true);
    }

    // Reset main to initial commit
    await this.git.reset(['--hard', 'HEAD']);

    // Clean untracked files using raw command
    await this.git.raw(['clean', '-f', '-d']);
  }

  async cleanup(): Promise<void> {
    // Extract the base path (remove '/main' suffix if present)
    let basePath = this.path;
    if (basePath.endsWith('/main') || basePath.endsWith('\\main')) {
      basePath = basePath.substring(0, basePath.lastIndexOf('/main')) ||
                 basePath.substring(0, basePath.lastIndexOf('\\main'));
    }
    // Remove entire test directory using fs.rm
    await rm(basePath, { recursive: true, force: true });
  }

  async commit(message: string, files?: Record<string, string>): Promise<string> {
    if (files) {
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = join(this.path, filePath);
        const dirPath = dirname(fullPath);
        await mkdir(dirPath, { recursive: true });
        await writeFile(fullPath, content, 'utf8');
      }
    }

    await this.git.add('.');
    const result = await this.git.commit(message);
    return result.commit as string;
  }

  async getGitWorktrees(): Promise<GitWorktree[]> {
    const result = await this.git.raw(['worktree', 'list']);
    const lines = result.trim().split('\n');

    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      const path = parts[0];

      // The branch name is in brackets, extract it
      // Format: path commit_hash [branch_name]
      const branchMatch = parts[2]?.match(/\[([^\]]+)\]/);
      const branch = branchMatch ? branchMatch[1] : parts[1]?.replace(/^\[|\]$/g, '') || '';

      // Check if this is the main worktree
      const isMain = path === this.path;

      return {
        branch,
        path,
        isMain
      };
    });
  }

  async createWorktree(branch: string): Promise<string> {
    const worktreePath = join(dirname(this.path), branch);
    await this.git.raw(['worktree', 'add', worktreePath, '-b', branch]);
    return worktreePath;
  }

  async getCurrentBranch(): Promise<string> {
    const result = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    return result.trim();
  }
}
