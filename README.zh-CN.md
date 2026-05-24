# simple-worktrunk

[English](./README.md) | 简体中文

`simple-worktrunk` 是 [worktrunk](https://github.com/max-sixty/worktrunk) CLI 的 TypeScript SDK wrapper，提供 Promise 风格 API，用来管理 Git worktree、hooks、状态变量，以及部分底层 worktrunk step 命令。

## 安装

```bash
npm install simple-worktrunk # npm
pnpm add simple-worktrunk    # pnpm
```

## 环境要求

- Node.js >= 18
- worktrunk CLI >= 0.53.0

```bash
brew install worktrunk
wt --version
```

## 快速开始

```typescript
import { worktrunk } from 'simple-worktrunk'

const wt = worktrunk()

await wt.create({ branch: 'feature-auth' })

const { worktrees, current } = await wt.list({ full: true })
console.log(current)

await wt.switch({ branch: 'main' })

await wt.hook.run({ type: 'post-start', names: ['dev'], dryRun: true })

await wt.step.eval('{{ branch | hash_port }}')

await wt.merge({ target: 'main', remove: true })

await wt.remove({ branches: ['old-branch'] })
```

## API

### `worktrunk(options?)`

创建 worktrunk 实例。

```typescript
const wt = worktrunk({
  binary: 'wt',
  baseDir: '/path/to/repo',
  configPath: '/path/to/config.toml',
})
```

### `wt.switch(options)` / `wt.create(options)`

切换到已有 worktree，或通过 `create: true` 创建。`wt.create()` 是 `switch({ create: true })` 的便捷封装。

```typescript
await wt.switch('main')
await wt.switch({ branch: 'feature', create: true, base: 'main' })
await wt.switch({ branch: 'dev', execute: 'pnpm install' })
await wt.create({ branch: 'hotfix', base: 'v1.0.0' })
```

### `wt.list(options?)`

基于 worktrunk JSON 输出列出 worktrees。

```typescript
const { worktrees, current } = await wt.list({ full: true })

for (const worktree of worktrees) {
  console.log(`${worktree.branch} ${worktree.path}`)
}
```

### `wt.remove(options?)`

删除 worktree。

```typescript
await wt.remove('feature-old')
await wt.remove({ branches: ['feature-old'], keepBranch: true })
await wt.remove()
```

### `wt.merge(options?)`

把当前分支合并到目标分支。

```typescript
await wt.merge()
await wt.merge({ target: 'develop' })
await wt.merge({ remove: false })
```

### `wt.hook`

运行和查看 worktrunk hooks。

```typescript
await wt.hook.run({ type: 'post-start', names: ['dev'], dryRun: true })
await wt.hook.run({ type: 'pre-merge', vars: { env: 'staging' }, yes: true })

const { hooks } = await wt.hook.show()
```

### `wt.step`

封装部分 `wt step` 命令。

```typescript
await wt.step.commit({ stage: 'tracked', dryRun: true })
await wt.step.squash({ target: 'main', noHooks: true })
await wt.step.prune({ dryRun: true, minAge: '7d' })

const port = await wt.step.eval('{{ branch | hash_port }}')
```

### `wt.config`

读取配置并管理 worktrunk 状态变量。

```typescript
const config = await wt.config.show({ format: 'json' })

await wt.config.state.vars.set('env', 'staging')
const env = await wt.config.state.vars.get('env')
const keys = await wt.config.state.vars.list()
await wt.config.state.vars.clear('env')

const logs = await wt.config.state.logs()
```

### `wt.raw(args, options?)`

运行尚未封装的 worktrunk 命令。

```typescript
const result = await wt.raw(['config', 'show', '--format=json'])
```

## 从 0.1 迁移到 0.2

`simple-worktrunk` 0.2 面向 worktrunk 0.53+，并且有意清理了 0.1 API。

| 0.1 API | 0.2 API |
| --- | --- |
| `name` | `branch` |
| `exec` | `execute` |
| `hookShow()` | `hook.show()` |
| `hook({ type: 'post-create' })` | `hook.run({ type: 'post-start' })` |
| 从文本推断结果 | 基于 JSON 的结果 |

尚未封装的 worktrunk CLI 功能可以通过 `wt.raw(args)` 调用。

## 错误处理

该库导出自定义错误类型：

```typescript
import {
  worktrunk,
  WorktrunkError,
  BinaryNotFoundError,
  CommandFailedError,
  JsonParseError,
} from 'simple-worktrunk'

try {
  await wt.create({ branch: 'my-feature' })
} catch (error) {
  if (error instanceof BinaryNotFoundError) {
    console.error('找不到 worktrunk CLI')
  } else if (error instanceof CommandFailedError) {
    console.error(`命令失败: ${error.command}`)
  } else if (error instanceof JsonParseError) {
    console.error(`无法解析 JSON: ${error.command}`)
  } else if (error instanceof WorktrunkError) {
    console.error(error.message)
  }
}
```

## 测试

- `pnpm test:run` 单次运行单元测试和集成测试。
- `pnpm lint` 运行 TypeScript 检查。
- `pnpm build` 构建 ESM 和类型声明。

集成测试需要 `wt >= 0.53.0`。

## 许可证

MIT
