#!/bin/bash
set -euo pipefail

echo "🌳 simple-worktrunk Playground Setup"
echo "=================================="
echo ""
echo "This script ensures you have the worktrunk CLI installed."
echo ""

# Check if wt is installed
if command -v wt &> /dev/null; then
    echo "✅ worktrunk CLI is already installed!"
    wt --version
    echo ""
    echo "You're ready to start the walkthrough!"
    echo ""
    echo "Begin at: https://github.com/z0gSh1u/simple-worktrunk#readme"
    exit 0
fi

echo "📦 worktrunk CLI not found. Installing..."
echo ""

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: Cargo is not installed."
    echo ""
    echo "Please install Rust and Cargo first:"
    echo "  https://www.rust-lang.org/tools/install"
    exit 1
fi

# Install worktrunk via cargo
echo "Installing worktrunk CLI via Cargo..."
cargo install worktrunk

echo ""
echo "✅ Installation complete!"
echo ""
echo "Verify installation:"
wt --version
echo ""
echo "You're ready to start the walkthrough!"
echo ""
echo "Begin at: https://github.com/z0gSh1u/simple-worktrunk#readme"
