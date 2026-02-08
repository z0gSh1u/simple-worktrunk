import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    include: [
      'test/unit/**/*.test.ts',
      'test/integration/**/*.test.ts',
    ],
    // Don't parallelize integration tests (shared state)
    fileParallelism: {
      include: ['test/unit/**/*.test.ts'],
    },
    setupFiles: ['./test/setup.ts'],
    teardownFiles: ['./test/teardown.ts'],
  },
});
