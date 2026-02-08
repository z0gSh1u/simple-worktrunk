#!/bin/bash
set -euo pipefail

echo "🧹 simple-worktrunk Playground Cleanup"
echo "======================================"
echo ""

# Check if wt is installed
if ! command -v wt &> /dev/null; then
    echo "❌ worktrunk CLI is not installed"
    echo "No cleanup needed."
    exit 0
fi

# Show current worktrees
echo "Current worktrees:"
wt list
echo ""

# Ask for confirmation
read -p "Remove all feature worktrees (except main)? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Removing feature worktrees..."

# Get list of worktrees (excluding main/bare)
worktrees=$(wt list 2>/dev/null | grep -v '\[main\]' | grep -v '\[bare\]' | grep -v '\[master\]' || true)

if [ -z "$worktrees" ]; then
    echo "No feature worktrees to remove."
    exit 0
fi

# Remove each worktree
echo "$worktrees" | while read -r line; do
    # Extract worktree name/path from the line
    # Format: name /path/to/worktree [branch]
    worktree_path=$(echo "$line" | awk '{print $2}')

    if [ -n "$worktree_path" ] && [ "$worktree_path" != "." ]; then
        echo "  Removing: $worktree_path"
        wt remove "$worktree_path" 2>/dev/null || true
    fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""

# Show final state
echo "Remaining worktrees:"
wt list
