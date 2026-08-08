#!/usr/bin/env node
// 增量更新 public/data/stars.json：
//   1. 拉取仓库所有者的全部 GitHub star（GITHUB_TOKEN 仅用于提升速率限额）
//   2. 对比上次数据（PREV_FILE）：已有仓库复用 AI 摘要、仅刷新元数据；
//      仅对【新增】star 调用 AI 分类 + 生成中英双语一句话简介（归入已有类别）
//   3. 合并写回（失败时保留旧数据，非零码退出）
// 零依赖，Node 18+（原生 fetch）。

import fs from 'node:fs'
import path from 'node:path'

const TOKEN = process.env.GITHUB_TOKEN || ''
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || ''
// GitHub 用户名：--owner 优先，其次 OWNER 环境变量（工作流中传 github.repository_owner）
// 注：用公开端点 /users/{owner}/starred 而非 /user/starred——仓库级 GITHUB_TOKEN 无 user 权限，后者会 403
const OWNER = arg('--owner') || process.env.OWNER || ''
const AI_MODEL = process.env.AI_MODEL || 'deepseek-v4-flash'
const PREV_FILE = process.env.PREV_FILE || arg('--prev') || ''
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

// chunk 为新增仓库列表；existingCats 为当前类别（AI 应优先复用）
async function classify(chunk, existingCats) {
  const catList = existingCats.map((c) => ({ nameZh: c.nameZh, nameEn: c.nameEn }))
  const body = {
    model: AI_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '你是 GitHub 项目分类助手。为给定仓库分类并写中英双语一句话简介。' +
          `已有类别（优先把仓库归入这些类别，类别名保持原样）：${JSON.stringify(catList)}` +
          '。确实不适合任何已有类别时才新建类别（最多 2 个，需中英双语名）。' +
          '每个仓库写一句中文简介（≤60字）和一句英文简介（≤15词）。' +
          '只输出 JSON：{"categories":[{"nameZh":"类别中文名","nameEn":"类别英文名","repos":[{"fullName":"owner/name","summaryZh":"…","summaryEn":"…"}]}]}。每个仓库都必须出现。',
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

  // 上次数据（增量基线）；不存在或解析失败 → 首次运行，全量分类
  let prev = null
  if (PREV_FILE && fs.existsSync(PREV_FILE)) {
    try {
      prev = JSON.parse(fs.readFileSync(PREV_FILE, 'utf8'))
      if (!Array.isArray(prev.categories)) throw new Error('categories 缺失')
    } catch (e) {
      console.warn(`PREV_FILE 解析失败（${e.message}），按首次运行全量处理`)
      prev = null
    }
  }
  const prevRepo = new Map() // fullName -> {cat, summaryZh, summaryEn}
  for (const c of prev?.categories ?? []) {
    for (const r of c.repos) {
      if (r?.fullName) prevRepo.set(r.fullName, { cat: c.nameZh, summaryZh: r.summaryZh, summaryEn: r.summaryEn })
    }
  }

  console.log('拉取 star 列表…')
  const repos = []
  for (let page = 1; ; page++) {
    const batch = await gh(`https://api.github.com/users/${encodeURIComponent(OWNER)}/starred?per_page=100&page=${page}`)
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

  const newRecs = recs.filter((r) => !prevRepo.has(r.fullName))
  console.log(`共 ${recs.length} 个 star：新增 ${newRecs.length} 个需 AI 处理，${recs.length - newRecs.length} 个复用已有摘要（仅刷新元数据）`)

  // 新增仓库 → AI（按批，附已有类别列表）
  const existingCats = (prev?.categories ?? []).map((c) => ({ nameZh: c.nameZh, nameEn: c.nameEn }))
  const newByCat = new Map() // nameZh -> {nameZh, nameEn, repos:[]}
  for (let i = 0; i < newRecs.length; i += CHUNK) {
    const out = await classify(newRecs.slice(i, i + CHUNK), existingCats)
    for (const c of out.categories ?? []) {
      let slot = newByCat.get(c.nameZh)
      if (!slot) {
        slot = { nameZh: c.nameZh, nameEn: c.nameEn, repos: [] }
        newByCat.set(c.nameZh, slot)
      }
      for (const r of c.repos ?? []) {
        const rec = newRecs.find((x) => x.fullName === r.fullName)
        if (rec && r.summaryZh && r.summaryEn) {
          slot.repos.push({ ...rec, summaryZh: r.summaryZh, summaryEn: r.summaryEn })
        }
      }
    }
    console.log(`  AI 已处理 ${Math.min(i + CHUNK, newRecs.length)}/${newRecs.length} 个新增仓库`)
  }

  // 组装：已有类别保持原顺序（刷新元数据、剔除已取消 star 的仓库）
  const cats = []
  for (const pc of prev?.categories ?? []) {
    const repos = pc.repos
      .map((pr) => {
        const rec = recs.find((r) => r.fullName === pr.fullName)
        return rec ? { ...rec, summaryZh: pr.summaryZh, summaryEn: pr.summaryEn } : null
      })
      .filter(Boolean)
    if (repos.length) cats.push({ nameZh: pc.nameZh, nameEn: pc.nameEn, repos })
  }
  // 新增类别（AI 新建）追加；与已有类别重名则并入
  for (const c of newByCat.values()) {
    if (!c.repos.length) continue
    const exist = cats.find((x) => x.nameZh === c.nameZh)
    if (exist) exist.repos.push(...c.repos)
    else cats.push(c)
  }

  for (const c of cats) c.repos.sort((a, b) => b.stars - a.stars)
  const missing = newRecs.length - [...newByCat.values()].reduce((n, c) => n + c.repos.length, 0)
  if (missing > 0) console.warn(`${missing} 个新增仓库缺少 AI 摘要（将被跳过）`)
  if (!cats.length) throw new Error('分类结果为空')

  const data = {
    generatedAt: new Date().toISOString(),
    total: recs.length,
    categories: cats,
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const tmp = OUT + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
  fs.renameSync(tmp, OUT)
  console.log(`已写入 ${OUT}：${recs.length} 个仓库 / ${cats.length} 个分类（AI 调用 ${Math.ceil(newRecs.length / CHUNK)} 批）`)
}

main().catch((e) => {
  console.error(`[update-stars] 失败，保留旧数据：${e.message}`)
  process.exit(1)
})
