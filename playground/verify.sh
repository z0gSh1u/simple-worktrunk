#!/bin/bash
set -euo pipefail

echo "🔍 simple-worktrunk Playground Verification"
echo "========================================"
echo ""

# Check if wt is installed
if ! command -v wt &> /dev/null; then
    echo "❌ worktrunk CLI is NOT installed"
    echo ""
    echo "To install:"
    echo "  cargo install worktrunk"
    echo ""
    echo "Or run:"
    echo "  ./setup.sh"
    exit 1
fi

echo "✅ worktrunk CLI is installed"
echo ""

# Show version
echo "Version:"
wt --version
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Warning: Not in a git repository"
    echo ""
    echo "The walkthrough assumes you're in a git repository."
    echo "You can still follow along, but some commands will fail."
    echo ""
    echo "To practice, create a test repo:"
    echo "  mkdir test-project && cd test-project && git init"
    echo ""
else
    echo "✅ Git repository detected"
    echo ""
    echo "Current branch:"
    git branch --show-current
    echo ""

    # Show current worktrees if any exist
    echo "Current worktrees:"
    if command -v wt &> /dev/null; then
        wt list 2>/dev/null || echo "  (No worktrees yet)"
    fi
fi

echo ""
echo "✅ You're ready to start the walkthrough!"
echo ""
echo "Begin at: examples/playground/README.md"
