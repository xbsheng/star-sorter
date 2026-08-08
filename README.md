# Star Sorter

每日自动把 GitHub star 项目分类整理，生成中英双语简介，用 GitHub Pages 展示。

## 功能

- 每天北京时间 05:00 自动更新（GitHub Actions）
- AI 自动分类 + 中英双语一句话简介
- 中英文切换（默认中文）、分类筛选、搜索、排序

## 本地开发

```bash
pnpm install
pnpm dev
```

## 部署

1. 仓库设为公开，推送代码
2. Settings → Secrets → 添加 `DEEPSEEK_API_KEY`（AI 平台 API Key）
3. 运行 **Update stars** 工作流（或等首次定时触发），生成 `output` 分支
4. Settings → Pages → Source 选择 **Deploy from a branch**，分支选 `output`，目录 `/ (root)`
5. 之后每天自动更新，也可手动 **Run workflow** 立即更新

## 分支结构

- `main`：仅源码，数据更新不会污染 commit 记录
- `output`：构建产物（含 `stars.json`），GitHub Pages 直接从此分支部署

## 数据

`output` 分支中的 `data/stars.json` 由工作流自动生成（GitHub API 拉取 star → AI 分类 + 双语简介 → 构建）。本地开发时 `main` 上内置少量示例数据，运行后自动替换为真实 Star。
