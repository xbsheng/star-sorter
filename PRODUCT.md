# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
用户决定：React + TypeScript + Tailwind CSS v4 + Vite + pnpm，部署 GitHub Pages。数据更新由 GitHub Actions 内的 Node 脚本完成（无独立后端）。

## Users
仓库所有者本人（日常查看自己 star 过的项目、按分类检索）；以及任何访问该公开页面的人。

## Product Purpose
每天北京时间 05:00，用 DeepSeek 大模型把用户 GitHub star 的项目自动分类并生成中英双语一句话简介，更新数据文件；GitHub Pages 静态页面展示分类后的 star 列表。

## Positioning
AI 策展的个人 star 索引：每日自动更新、零人工维护、双语（中文默认 + 英文切换）、分类随内容演化而非固定死板。

## Operating Context
- GitHub Actions cron `0 21 * * *` UTC（= 北京时间 05:00），可手动 workflow_dispatch 触发
- 拉取仓库所有者本人的 star 列表（GITHUB_TOKEN 即可，无需额外 PAT）
- DeepSeek API（OpenAI 兼容协议，模型 deepseek-chat），Key 存于仓库 Secrets（DEEPSEEK_API_KEY）
- 仓库公开（GitHub Pages 免费版要求）
- 数据发布到 `output` 分支（仅 `stars.json`），部署时由 Actions 构建前注入；主分支仅保留源码，数据更新不污染 commit 记录

## Capabilities and Constraints
- 分类：AI 动态产出类别（类别名含中英文），不预设固定分类
- 每个 repo 产出：分类、中文一句话简介、英文一句话简介；保留原元数据（名称、URL、描述、语言、star 数、topics）
- 页面：中英文切换（默认中文）、分类筛选、搜索
- 首次运行前数据为空：仓库内置少量示例数据（标注为 synthetic）便于本地开发与预览
- star 数超过单次 API 上限时按批分块调用

## Brand Commitments
无既有品牌资产。页面语言中英双语、默认中文。视觉方向：用户经 impeccable 决策页选定「分类卡片网格」（category standard）——顶栏 + 分类标签 + 响应式卡片网格 + star/语言徽章，按该品类的最高工艺水准执行，不掺入刻意的艺术化噱头。

## Evidence on Hand
无真实 star 数据（新仓库）。示例数据为合成的占位内容，首次 Action 运行后由真实数据替换。

## Product Principles
1. 零维护：一切自动化，页面无需人工干预即保持新鲜
2. 诚实呈现：AI 生成内容如实标注由 DeepSeek 生成，不冒充人工撰写
3. 浏览优先：分类与搜索优先于展示排场，信息密度服务查找效率
4. 双语对等：中英文内容等质，切换即得完整体验
5. 轻量快速：静态页面，无重型依赖，首屏快速

## Accessibility & Inclusion
基础可访问性：语义化结构、键盘可达、足够的颜色对比度；中英双语均完整可用。
