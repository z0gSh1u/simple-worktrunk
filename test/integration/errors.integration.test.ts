import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestRepo } from '../fixtures/test-repo.js'
import { worktrunk, BinaryNotFoundError, CommandFailedError } from '../../src/index.js'
import { rmSync } from 'node:fs'
import { existsSync } from 'node:fs'

describe('error handling (integration)', () => {
  let repo: TestRepo

  beforeEach(async () => {
    repo = await TestRepo.create()
  })

  afterEach(async () => {
    const basePath = repo.path.replace(/\/main$/, '')
    if (existsSync(basePath)) {
      rmSync(basePath, { recursive: true, force: true })
    }
  })

  it('should throw BinaryNotFoundError when wt not found', async () => {
    const wt = worktrunk({
      baseDir: repo.path,
      binary: '/nonexistent/path/to/wt',
    })

    await expect(wt.list()).rejects.toThrow(BinaryNotFoundError)
  })

  it('should throw CommandFailedError on invalid branch', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' })

    await expect(wt.switch('definitely-nonexistent-branch-xyz-123')).rejects.toThrow(
      CommandFailedError,
    )
  })

  it('should include error details in CommandFailedError', async () => {
    const wt = worktrunk({ baseDir: repo.path, binary: 'wt' })

    try {
      await wt.switch('invalid-branch')
      expect.fail('Should have thrown')
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandFailedError)
      expect(error.code).not.toBe('0')
      expect(error.message).toBeTruthy()
      expect(error.message).toContain('failed')
    }
  })
})
