import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  banner: {
    js: `/**
 * simple-worktrunk
 * @link https://github.com/z0gSh1u/simple-worktrunk
 * @license MIT
 */`,
  },
})
