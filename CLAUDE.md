# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm build` - Build the project using tsup (outputs to `dist/`)
- `pnpm test` - Run tests in watch mode with vitest
- `pnpm test:run` - Run tests once without watch mode
- `pnpm dev` - Build in watch mode with tsup
- `pnpm lint` - Type check with TypeScript (tsc)

To run a single test file: `pnpm test path/to/test.ts`

## Architecture

This is a lightweight TypeScript wrapper around the [worktrunk](https://github.com/max-sixty/worktrunk) CLI tool. The architecture follows a command pattern:

### Core Components

- **`src/index.ts`** - Main entry point, exports the `worktrunk()` factory function and all public types/errors
- **`src/worktrunk.ts`** - Contains `WorktrunkInstance` interface and `createWorktrunkInstance()` factory. Uses `.call()` pattern to bind instance context to command methods
- **`src/commands/*.ts`** - Individual command implementations (switch, create, remove, list, merge, hook). Each exports functions designed to be called with `this: WorktrunkInstance` context
- **`src/utils/executor.ts`** - Spawns the `wt` binary using `node:child_process`, throws custom errors on failure
- **`src/utils/parser.ts`** - Parses CLI stdout into structured types (list output, hook show output, switch output)
- **`src/types.ts`** - All TypeScript types for options, results, and interfaces
- **`src/errors.ts`** - Custom error classes: `WorktrunkError`, `BinaryNotFoundError`, `CommandFailedError`

### Key Patterns

1. **Instance Binding**: Commands use `function` declarations and are called with `.call(baseInstance, ...)` to access `this.options`. This allows commands to be shared across instances.

2. **Option Normalization**: The `worktrunk()` factory accepts either a string (binary path) or `WorktrunkOptions` object, which gets normalized to `NormalizedOptions`.

3. **Command Aliases**: `create()` is an alias for `switch({ create: true })` - the create command internally calls switch.

### Build Configuration

- **tsup** (`tsup.config.ts`) - Bundles to ESM format with declarations and sourcemaps
- **TypeScript** - ES2022 target, ESNext modules, bundler resolution
- **Vitest** - Test framework with globals enabled

## External Dependency

Requires the `wt` (worktrunk) CLI to be installed and available in PATH or specified via `binary` option. The wrapper spawns this binary and parses its output.
