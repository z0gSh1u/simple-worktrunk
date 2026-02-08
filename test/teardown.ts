import { afterAll } from 'vitest';
import { testRepo } from './setup.js';

afterAll(async () => {
  if (testRepo) {
    await testRepo.cleanup();
  }
});
