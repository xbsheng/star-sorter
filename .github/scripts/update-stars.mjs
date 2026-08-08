#!/usr/bin/env node
// 每日更新 public/data/stars.json：
//   1. 拉取仓库所有者的 GitHub star 列表（GITHUB_TOKEN）
//   2. 分块调用 AI 分类 + 生成中英双语一句话简介
//   3. 合并写入数据文件（失败时保留旧数据，以非零码退出）
// 零依赖，Node 18+（原生 fetch）。

import fs from 'node:fs'
import path from 'node:path'

const TOKEN = process.env.GITHUB_TOKEN || ''
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || ''
// GitHub 用户名：--owner 优先，其次 OWNER 环境变量（工作流中传 github.repository_owner）
// 注：用公开端点 /users/{owner}/starred 而非 /user/starred——仓库级 GITHUB_TOKEN 无 user 权限，后者会 403
const OWNER = arg('--owner') || process.env.OWNER || ''
const MAX_REPOS = 3000
const CHUNK = 60
const OUT = path.join(process.cwd(), 'public', 'data', 'stars.json')

function arg(name) {
  const a = process.argv.find((x) => x.startsWith(`${name}=`))
  return a ? a.slice(name.length + 1) : undefined
}

async function gh(url) {
  const headers = {
    Accept: 'application/vnd.github.star+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'star-sorter',
  }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  const r = await fetch(url, { headers })
  if (!r.ok) {
    const body = (await r.text()).slice(0, 300)
    if (r.status === 404 && url.includes('/users/')) {
      throw new Error(`用户 ${OWNER} 不存在，或开启了「私有 star」（Settings → Profile → Private stars）`)
    }
    throw new Error(`GitHub API ${r.status}: ${url} — ${body}`)
  }
  return r.json()
}

async function classify(chunk) {
  const body = {
    model: 'deepseek-chat',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '你是 GitHub 项目分类助手。把给定仓库列表按用途分类，并为每个仓库写一句中文简介（≤60字）和一句英文简介（≤15词）。类别名中英双语。' +
          '只输出 JSON：{"categories":[{"nameZh":"类别中文名","nameEn":"类别英文名","repos":[{"fullName":"owner/name","summaryZh":"…","summaryEn":"…"}]}]}。' +
          '类别不超过 8 个，同类仓库必须合并；每个仓库都必须出现在结果中。',
      },
      {
        role: 'user',
        content: JSON.stringify(
          chunk.map((r) => ({
            fullName: r.fullName,
            description: r.description,
            language: r.language,
            topics: r.topics,
          })),
        ),
      },
    ],
  }
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`AI API ${res.status}: ${await res.text()}`)
      const j = await res.json()
      const content = String(j.choices?.[0]?.message?.content ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
      const out = JSON.parse(content)
      if (!Array.isArray(out.categories)) throw new Error('AI 返回格式异常')
      return out
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  throw lastErr
}

async function main() {
  if (!DEEPSEEK_KEY) throw new Error('缺少环境变量 DEEPSEEK_API_KEY')
  if (!OWNER) throw new Error('缺少 GitHub 用户名：传 --owner=<用户名> 或设置 OWNER 环境变量')
  const who = `/users/${encodeURIComponent(OWNER)}/starred`

  console.log('拉取 star 列表…')
  const repos = []
  for (let page = 1; ; page++) {
    const batch = await gh(`https://api.github.com${who}?per_page=100&page=${page}`)
    if (!batch.length) break
    for (const s of batch) repos.push(s.repo)
    if (repos.length >= MAX_REPOS) {
      console.warn(`达到上限 ${MAX_REPOS}，截断`)
      break
    }
  }
  if (!repos.length) throw new Error('没有拉取到任何 star')

  const recs = repos.map((repo) => ({
    fullName: repo.full_name,
    description: repo.description ?? null,
    language: repo.language ?? null,
    stars: repo.stargazers_count ?? 0,
    topics: repo.topics ?? [],
    avatarUrl: repo.owner?.avatar_url ?? '',
    updatedAt: repo.pushed_at ?? '',
  }))
  console.log(`共 ${recs.length} 个 star，开始分类…`)

  // ponytail: 按 nameZh 精确合并跨块类别；若分类碎片化，改为先汇总再统一分类
  const catMap = new Map()
  let aiCount = 0
  for (let i = 0; i < recs.length; i += CHUNK) {
    const out = await classify(recs.slice(i, i + CHUNK))
    for (const c of out.categories) {
      let slot = catMap.get(c.nameZh)
      if (!slot) {
        slot = { nameZh: c.nameZh, nameEn: c.nameEn, repos: [] }
        catMap.set(c.nameZh, slot)
      }
      for (const r of c.repos) {
        const rec = recs.find((x) => x.fullName === r.fullName)
        if (rec && r.summaryZh && r.summaryEn) {
          slot.repos.push({ ...rec, summaryZh: r.summaryZh, summaryEn: r.summaryEn })
          aiCount++
        }
      }
    }
    console.log(`  已处理 ${Math.min(i + CHUNK, recs.length)}/${recs.length}`)
  }
  const missing = recs.length - aiCount
  if (missing > 0) console.warn(`${missing} 个仓库缺少 AI 摘要（将被跳过）`)

  const categories = [...catMap.values()]
    .map((c) => ({ ...c, repos: c.repos.sort((a, b) => b.stars - a.stars) }))
    .sort((a, b) => b.repos.length - a.repos.length)
  if (!categories.length) throw new Error('分类结果为空')

  const data = {
    generatedAt: new Date().toISOString(),
    total: recs.length,
    categories,
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const tmp = OUT + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
  fs.renameSync(tmp, OUT)
  console.log(`已写入 ${OUT}：${recs.length} 个仓库 / ${categories.length} 个分类`)
}

main().catch((e) => {
  console.error(`[update-stars] 失败，保留旧数据：${e.message}`)
  process.exit(1)
})
