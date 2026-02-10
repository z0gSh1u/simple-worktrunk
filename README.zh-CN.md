# simple-worktrunk

[English](./README.md) | 简体中文

Git Worktree 已是当前并行化的 Coding Agent 执行过程中，避免代码仓库修改冲突的共识解决方案。simple-worktrunk 提供一个轻量的 [worktrunk](https://github.com/max-sixty/worktrunk) CLI 的 Node.js Wrapper，用简洁的 Promise 风格 API 来管理 Git Worktrees。

## 安装

```bash
npm install simple-worktrunk # npm
pnpm add simple-worktrunk    # pnpm
```

前置需要安装 worktrunk CLI (`wt`)，详情请参阅[官方 worktrunk 安装指南](https://github.com/max-sixty/worktrunk#installation)。

```bash
cargo install worktrunk
```

## 快速开始

```typescript
import { worktrunk } from 'simple-worktrunk'
const wt = worktrunk()

// 创建新的 worktree
await wt.create('feature-auth')

// 列出所有 worktree
const { worktrees, current } = await wt.list()
console.log(current) // 'feature-auth'

// 切换到另一个 worktree
await wt.switch('main')

// 完成后，合并并清理
await wt.merge()

// 删除 worktree
await wt.remove('old-branch')
```

## API

### `worktrunk(options?)`

创建一个新的 worktrunk 实例，用于与 worktrunk CLI 交互。

```typescript
const wt = worktrunk()
```

**参数：**

- `options` (`string | WorktrunkOptions`，可选) - `wt` 二进制文件的路径，或选项对象

**选项对象：**

| 属性      | 类型     | 默认值      | 描述                     |
| --------- | -------- | ----------- | ------------------------ |
| `binary`  | `string` | `'wt'`      | worktrunk 二进制文件路径 |
| `baseDir` | `string` | `undefined` | 命令的基础目录           |

**示例：**

```typescript
// 使用 PATH 中的默认 'wt'
const wt = worktrunk()
// 自定义二进制文件路径
const wt = worktrunk('/usr/local/bin/wt')
// 完整选项
const wt = worktrunk({
  binary: '/home/user/.cargo/bin/wt',
  baseDir: '/path/to/repo',
})
```

### `wt.switch(options)`

切换到现有 worktree 或创建新的 worktree。

```typescript
const result = await wt.switch('my-feature')
```

**参数：**

- `options` (`string | SwitchOptions`) - 分支名称，或选项对象

**选项对象：**

| 属性     | 类型      | 默认值      | 描述                  |
| -------- | --------- | ----------- | --------------------- |
| `name`   | `string`  | `undefined` | worktree/分支名称     |
| `create` | `boolean` | `false`     | 不存在时创建 worktree |
| `base`   | `string`  | `undefined` | 新 worktree 的基分支  |
| `exec`   | `string`  | `undefined` | 切换后执行的命令      |
| `noCd`   | `boolean` | `false`     | 不更改目录            |

**返回：** `Promise<SwitchResult>`

```typescript
interface SwitchResult {
  worktree: string // worktree 名称
  path: string // worktree 路径
  branch: string // 分支名称
  created: boolean // 是否创建了新 worktree
}
```

**示例：**

```typescript
// 切换到现有 worktree
await wt.switch('main')
// 一条命令创建并切换
const result = await wt.switch({ name: 'feature', create: true })
// 从指定基分支创建
await wt.switch({ name: 'hotfix', create: true, base: 'production' })
// 切换并执行命令
await wt.switch({ name: 'dev', exec: 'pnpm install' })
```

### `wt.create(options)`

创建新 worktree（`switch({ create: true })` 的别名）。

```typescript
const result = await wt.create('feature-auth')
```

**参数：**

- `options` (`string | CreateOptions`) - 分支名称，或选项对象

**选项对象：**

| 属性   | 类型      | 默认值      | 描述                   |
| ------ | --------- | ----------- | ---------------------- |
| `name` | `string`  | （必需）    | worktree/分支名称      |
| `base` | `string`  | `undefined` | 新 worktree 的基础分支 |
| `exec` | `string`  | `undefined` | 创建后执行的命令       |
| `noCd` | `boolean` | `false`     | 不更改目录             |

**返回：** `Promise<SwitchResult>`

**示例：**

```typescript
// 简单创建
await wt.create('feature-auth')
// 从指定基分支创建
await wt.create({ name: 'hotfix', base: 'v1.0.0' })
// 创建并运行命令
await wt.create({ name: 'dev', exec: 'pnpm install' })
```

### `wt.remove(options)`

删除 worktree。

```typescript
const result = await wt.remove('old-branch')
```

**参数：**

- `options` (`string | RemoveOptions`，可选) - 分支名称，或选项对象。如果省略，则删除当前 worktree。

**选项对象：**

| 属性         | 类型      | 默认值      | 描述                     |
| ------------ | --------- | ----------- | ------------------------ |
| `name`       | `string`  | `undefined` | 要删除的 worktree 名称   |
| `keepBranch` | `boolean` | `false`     | 删除 worktree 后保留分支 |

**返回：** `Promise<RemoveResult>`

```typescript
interface RemoveResult {
  removed: string // 已删除的 worktree 名称
  branchDeleted: boolean // 分支是否已删除
}
```

**示例：**

```typescript
// 删除指定 worktree 及其分支
await wt.remove('feature-old')
// 删除 worktree 但保留分支
await wt.remove({ name: 'feature-old', keepBranch: true })
// 删除当前 worktree
await wt.remove()
```

### `wt.list()`

列出所有 worktree。

```typescript
const { worktrees, current } = await wt.list()
```

**返回：** `Promise<ListResult>`

```typescript
interface ListResult {
  worktrees: WorktreeInfo[] // 所有 worktree 的数组
  current: string // 当前 worktree 的名称
}

interface WorktreeInfo {
  name: string // worktree 名称
  path: string // worktree 的绝对路径
  branch: string // 分支名称
  isMain: boolean // 是否为主 worktree
}
```

**示例：**

```typescript
const { worktrees, current } = await wt.list()
// 获取当前 worktree
console.log(`当前 worktree: ${current}`)
// 列出所有 worktree
for (const wt of worktrees) {
  console.log(`${wt.name} (${wt.branch}) - ${wt.path}`)
}
// 排除 [Main] worktree
const features = worktrees.filter((w) => !w.isMain)
```

### `wt.merge(options)`

将当前分支合并到目标分支，并可选择删除 worktree。

```typescript
const result = await wt.merge()
```

**参数：**

- `options` (`MergeOptions`，可选)

**选项对象：**

| 属性           | 类型      | 默认值   | 描述                |
| -------------- | --------- | -------- | ------------------- |
| `target`       | `string`  | `'main'` | 要合并到的目标分支  |
| `keepWorktree` | `boolean` | `false`  | 合并后保留 worktree |

**返回：** `Promise<MergeResult>`

```typescript
interface MergeResult {
  merged: string // 已合并的分支
  target: string // 目标分支
  worktreeRemoved: boolean // worktree 是否已删除
}
```

**示例：**

```typescript
// 合并到 main（默认）并删除 worktree
await wt.merge()
// 合并到自定义目标
await wt.merge({ target: 'develop' })
// 合并但保留 worktree
await wt.merge({ keepWorktree: true })
```

### `wt.hook(options)`

手动运行钩子。

```typescript
const result = await wt.hook({ type: 'post-create' })
```

**参数：**

- `options` (`HookOptions`)

**选项对象：**

| 属性          | 类型                     | 默认值      | 描述             |
| ------------- | ------------------------ | ----------- | ---------------- |
| `type`        | `HookType`               | （必需）    | 要运行的钩子类型 |
| `name`        | `string`                 | `undefined` | 要运行的命名钩子 |
| `userOnly`    | `boolean`                | `false`     | 仅运行用户钩子   |
| `projectOnly` | `boolean`                | `false`     | 仅运行项目钩子   |
| `yes`         | `boolean`                | `false`     | 跳过确认         |
| `vars`        | `Record<string, string>` | `{}`        | 传递给钩子的变量 |

**钩子类型：** `'post-create' | 'post-switch' | 'pre-merge' | 'post-merge' | 'pre-remove' | 'post-remove'`

**返回：** `Promise<HookResult>`

```typescript
interface HookResult {
  hook: string // 已运行的钩子类型
  executed: HookExecution[] // 执行结果
}

interface HookExecution {
  name: string // 钩子名称
  source: 'user' | 'project' // 钩子来源
  success: boolean // 钩子是否成功
  output?: string // 钩子输出
}
```

**示例：**

```typescript
// 运行 post-create 钩子
await wt.hook({ type: 'post-create' })
// 运行特定命名钩子
await wt.hook({ type: 'post-create', name: 'install-deps' })
// 带变量运行
await wt.hook({
  type: 'post-create',
  vars: { PROJECT_NAME: 'my-project' },
})
// 仅运行用户钩子
await wt.hook({ type: 'pre-merge', userOnly: true })
```

### `wt.hookShow()`

显示已配置的钩子。

```typescript
const result = await wt.hookShow()
```

**返回：** `Promise<HookShowResult>`

```typescript
interface HookShowResult {
  hooks: Record<string, NamedHook[]> // 按类型分组的钩子
}

interface NamedHook {
  name?: string // 钩子名称（可选）
  command: string // 要运行的命令
  source: 'user' | 'project' // 钩子来源
}
```

**示例：**

```typescript
const { hooks } = await wt.hookShow()

// 列出所有 post-create 钩子
for (const hook of hooks['post-create'] || []) {
  console.log(`${hook.name || '(未命名)'}: ${hook.command} (${hook.source})`)
}
```

## 错误处理

该库导出自定义错误类型以更好地处理错误：

```typescript
import {
  worktrunk,
  WorktrunkError,
  BinaryNotFoundError,
  CommandFailedError,
} from 'simple-worktrunk'

try {
  await wt.create('my-feature')
} catch (error) {
  if (error instanceof BinaryNotFoundError) {
    console.error('找不到 worktrunk CLI！')
  } else if (error instanceof CommandFailedError) {
    console.error(`命令失败: ${error.command}`)
    console.error(`退出码: ${error.code}`)
    console.error(`错误: ${error.message}`)
  } else if (error instanceof WorktrunkError) {
    console.error(`Worktrunk 错误: ${error.message}`)
  }
}
```

## 测试

项目采用混合测试策略：

- **单元测试** (`pnpm test:unit`) - 纯函数的快速测试（解析器、错误处理）
- **集成测试** (`pnpm test:integration`) - 在测试 git 仓库上运行的真实 `wt` CLI 测试

## 演示

`playground/` 目录包含一个交互式演示，展示使用 simple-worktrunk 库管理 Git Worktree 的完整生命周期。

```bash
pnpm build
node playground/demo.js
```

该演示将交互式地展示创建、切换和删除 worktree 的过程。

## 许可证

MIT
