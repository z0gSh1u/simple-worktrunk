import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    include: [
      'test/unit/**/*.test.ts',
      'test/integration/**/*.test.ts',
    ],
    // Integration tests share TestRepo state, so disable file parallelism
    fileParallelism: false,
    setupFiles: ['./test/setup.ts'],
    teardownFiles: ['./test/teardown.ts'],
  },
});
