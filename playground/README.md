# Simple Worktree Lifecycle Demo

An interactive demo that showcases the complete lifecycle of git worktrees using the simple-worktrunk library.

## Prerequisites

1. **Node.js >= 18** installed
2. **worktrunk CLI (`wt`)** installed - See [worktrunk installation guide](https://github.com/max-sixty/worktrunk#installation)
3. Build the simple-worktrunk library: `npm run build`

## Running the Demo

```bash
npm run demo
```

Or directly:
```bash
node playground/demo.js
```

## Demo Steps

The demo will walk you through 16 interactive steps:

1. **Initialize a git repository** - Sets up a test repository in `playground/repo/`
2. **Import simple-worktrunk** - Loads the library
3. **List current worktrees** - Shows the main worktree
4. **Create a new worktree** - Creates `feature-add-demo` worktree
5. **Make changes** - Adds and commits files in the new worktree
6. **List worktrees again** - Shows both worktrees
7. **Switch to main** - Returns to the main worktree
8. **Switch back** - Returns to the feature worktree
9. **Create from feature** - Creates `feature-hotfix` from the feature branch
10. **List all worktrees** - Shows all three worktrees
11. **Remove hotfix** - Removes the hotfix worktree
12. **Switch to main** - Returns to main
13. **List after cleanup** - Shows remaining worktrees
14. **Create from main** - Creates `bugfix` from main
15. **Remove with keep branch** - Removes worktree but keeps the branch
16. **Final listing** - Shows final state

At each step, press **Enter** to continue.

## Cleanup

To clean up the demo repository:
```bash
rm -rf playground/repo
```
