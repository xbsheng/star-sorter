# Star Sorter

每日自动把 GitHub star 项目分类整理，生成中英双语简介，用 GitHub Pages 展示。

## 功能

- 每天自动更新（GitHub Actions）
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
3. Settings → Pages → Source 选择 **GitHub Actions**
4. 手动运行 **Update stars** 工作流生成数据，页面随后自动部署

## 数据

`public/data/stars.json` 由工作流自动生成并提交，页面直接读取。首次运行前仓库内置示例数据（页面会显示提示），运行后自动替换为真实 Star。
