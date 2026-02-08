import { beforeAll } from 'vitest';
import { TestRepo } from './fixtures/test-repo.js';

export let testRepo: TestRepo;

beforeAll(async () => {
  testRepo = await TestRepo.create();
});
