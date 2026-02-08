# Worktree Lifecycle Walkthrough

Learn how to use `simple-worktrunk` by working through a complete feature lifecycle.

**Scenario:** You're adding a new user authentication feature to your project. This walkthrough guides you from creating the feature branch to merging it back to main.

## Prerequisites

Before starting, ensure you have the `wt` CLI installed:

```bash
# Install via Cargo
cargo install worktrunk

# Verify installation
wt --version
```

**Note:** This walkthrough uses real git worktree operations. Make sure you're in a git repository.

---

## Step 1: Create a Feature Branch

Create a new worktree for your feature:

```bash
wt switch --create feature-user-auth
```

**What happens:**
- A new git worktree is created at `../my-project-feature-user-auth/`
- Your shell's working directory changes to the new worktree
- A new branch `feature-user-auth` is created
- The worktree is linked to your main repository

**Expected output:**
```
Switched to feature-user-auth
Now working in: /path/to/my-project-feature-user-auth
```

**Why this matters:** You now have an isolated environment to work on your feature. Your main repository remains untouched.

---

## Step 2: Verify Your Environment

Check where you are and what's active:

```bash
# Check current worktrees
wt list
```

**Expected output:**
```
main /path/to/main [main]
feature-user-auth /path/to/feature-user-auth [feature-user-auth]*
```

The `*` indicates which worktree you're currently in.

**Check your current directory:**
```bash
pwd
```

You should see something like:
```
/path/to/my-project-feature-user-auth
```

---

## Step 3: Work in Isolation

Now you're in your feature worktree, you can:

```bash
# Install dependencies (isolated from main)
npm install

# Make your changes
# ... edit files, write code ...

# Run tests
npm test

# Commit your work
git add .
git commit -m "feat: add user authentication"
```

**Key benefit:** Your main repository's `node_modules/` and working directory remain completely clean.

---

## Step 4: Context Switching (Optional)

Need to handle something urgent? Hotfix a bug? Review a PR?

```bash
# Switch to hotfix branch
wt switch hotfix-critical-bug

# Work on the hotfix...
# ... make changes, test, commit ...

# Switch back to your feature
wt switch feature-user-auth
```

**What happens:**
- Your shell's working directory changes automatically
- Your context is preserved (uncommitted changes stay in place)
- No manual `cd` commands needed

---

## Step 5: Ready to Merge

When your feature is complete, merge it back to main:

```bash
wt merge
```

**What happens:**
1. Your `feature-user-auth` branch is merged into `main`
2. You're switched back to the `main` worktree
3. The `feature-user-auth` worktree is removed
4. The `feature-user-auth` branch is deleted

**Expected output:**
```
Merged feature-user-auth into main
Switched to main
Removed worktree: feature-user-auth
```

**That's it!** One command handles the entire merge workflow.

---

## Step 6: Verify Cleanup

Check that your worktree was cleaned up:

```bash
wt list
```

**Expected output:**
```
main /path/to/main [main]*
```

Only your main worktree remains. The feature worktree has been removed.

---

## Advanced: Parallel Feature Development

One of the most powerful features of worktrunk is working on multiple features simultaneously:

```bash
# Create multiple feature branches
wt switch --create feature-auth
wt switch --create feature-payments
wt switch --create feature-ui-refresh

# List all your active worktrees
wt list
```

**Expected output:**
```
main /path/to/main [main]
feature-auth /path/to/feature-auth [feature-auth]
feature-payments /path/to/feature-payments [feature-payments]
feature-ui-refresh /path/to/feature-ui-refresh [feature-ui-refresh]*
```

Now you can:
- Switch between features instantly with `wt switch <feature-name>`
- Keep each feature isolated
- Test integration between features by switching to their worktrees
- Merge them independently when ready: `wt merge` (from each feature)

---

## Comparison: Before vs After

### Traditional Git Workflow (Messy)

```bash
# Create worktree manually
git worktree add ../my-project-feature feature
cd ../my-project-feature
npm install
# ... work ...
cd ..
git worktree remove ../my-project-feature
# If you forget cleanup, clutter accumulates
```

### With simple-worktrunk (Clean)

```typescript
import { worktrunk } from 'simple-worktrunk'

const wt = worktrunk()

// Create, work, merge
await wt.create('feature')
// ... work ...
await wt.merge()           // Handles cleanup automatically
```

---

## Troubleshooting

**Problem:** `wt: command not found`

**Solution:** Install the worktrunk CLI:
```bash
cargo install worktrunk
```

---

**Problem:** "fatal: worktree already exists"

**Solution:** Use `wt list` to see existing worktrees, then `wt switch <name>` to switch to it instead of creating a new one.

---

**Problem:** "Uncommitted changes would be overwritten"

**Solution:** Commit or stash your changes before switching:
```bash
git add .
git commit -m "WIP: my changes"
wt switch other-feature
```

---

## Next Steps

Now that you've completed the walkthrough:

1. **Try it in your own project:** Install `wt` and `simple-worktrunk`
2. **Read the [API documentation](../../README.md)** for all available commands
3. **Explore hooks:** Automate common tasks with post-create/post-switch hooks
4. **Contribute:** Star the repository and report issues!

---

## Want More Examples?

Check out the `examples/` directory for:
- OSS maintainer workflows
- Team collaboration patterns
- Advanced hook configurations
- Migration guides

Happy coding with clean, isolated worktrees! 🌳
