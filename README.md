# Star Sorter

每日自动把 GitHub star 项目分类整理，生成中英双语简介，用 GitHub Pages 展示。

## 功能

- 每天北京时间 05:00 自动更新（GitHub Actions）
- AI 自动分类 + 中英双语一句话简介
- **增量更新**：只对新增 star 调用 AI，已有项目复用摘要并刷新元数据，类别保持稳定
- 中英文切换（默认中文）、分类筛选、搜索、排序

## 本地开发

```bash
pnpm install
pnpm dev
```

## 部署

1. 仓库设为公开，推送代码
2. Settings → Secrets → 添加 `DEEPSEEK_API_KEY`（AI 平台 API Key）
3. （可选）Settings → Variables → 添加 `AI_MODEL` 覆盖默认模型（默认 `deepseek-v4-flash`）
4. 运行 **Update stars** 工作流（或等首次定时触发），生成 `output` 分支数据
5. Settings → Pages → Source 选择 **GitHub Actions**
6. 之后每天自动更新数据并重新部署，也可手动 **Run workflow** 立即更新

## 分支结构

- `main`：仅源码，数据更新不会污染 commit 记录
- `output`：仅 `stars.json` 数据文件

## 数据

`output` 分支的 `stars.json` 由工作流自动生成（GitHub API 拉取 star → 对比上次数据，仅新增项目调用 AI 分类 + 双语简介）。部署时由 Actions 在构建前从 `output` 分支注入数据；本地开发用 `main` 上内置的少量示例数据。
