import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, StarData } from './types'
import { dict, formatDate, type Lang } from './i18n'
import RepoCard from './components/RepoCard'
import { GitHubIcon, GlobeIcon, SearchIcon, StarIcon } from './icons'

// 数据来自 output 分支（raw.githubusercontent 允许跨域）；仓库改名时同步修改
const DATA_URL = 'https://raw.githubusercontent.com/xbsheng/star-sorter/output/stars.json'
const FALLBACK_URL = './data/stars.json' // 本地开发示例 / 远端不可用的降级
const LANG_KEY = 'star-sorter-lang'

async function loadData(): Promise<StarData> {
  for (const url of [DATA_URL, FALLBACK_URL]) {
    try {
      const r = await fetch(url)
      if (r.ok) return (await r.json()) as StarData
    } catch {
      // 尝试下一个数据源
    }
  }
  throw new Error('数据加载失败')
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY)
    return saved === 'en' ? 'en' : 'zh'
  })
  const [data, setData] = useState<StarData | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [sortRecent, setSortRecent] = useState(false)

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    localStorage.setItem(LANG_KEY, lang)
  }, [lang])

  // 切换分类/搜索/排序后滚回列表顶部
  const interacted = useRef(false)
  useEffect(() => {
    if (!data) return
    if (!interacted.current) {
      interacted.current = true // 首次加载不滚动，保留 hero 首屏
      return
    }
    const main = document.getElementById('top')
    if (!main) return
    const y = main.getBoundingClientRect().top + window.scrollY - 56
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = query.length > 0 || reduced ? 'auto' : 'smooth' // 搜索瞬时，分类/排序平滑
    window.scrollTo({ top: Math.max(0, y), behavior })
  }, [activeCat, query, sortRecent, data])

  useEffect(() => {
    loadData()
      .then(setData)
      .catch(() => setError(true))
  }, [])

  const t = dict[lang]

  const visible = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    const cats: Category[] =
      activeCat === 'all' ? data.categories : data.categories.filter((c) => c.nameZh === activeCat)
    const repos = cats.flatMap((c) => c.repos)
    const filtered = q
      ? repos.filter((r) =>
          [r.fullName, r.description, r.language, r.summaryZh, r.summaryEn, ...r.topics]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q)),
        )
      : repos
    return filtered.sort((a, b) =>
      sortRecent
        ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        : b.stars - a.stars,
    )
  }, [data, query, activeCat, sortRecent])

  const total = data?.total ?? 0
  const catCount = data?.categories.length ?? 0

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-neutral-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-950 text-white">
              <StarIcon className="h-3.5 w-3.5" />
            </span>
            {t.brand}
          </a>
          <div className="flex items-center gap-1.5">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              <GitHubIcon className="h-4.5 w-4.5" />
            </a>
            <button
              type="button"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              aria-label={t.languageLabel}
              className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              <GlobeIcon className="h-4 w-4" />
              {t.switchLang}
            </button>
          </div>
        </div>
      </header>

      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t.headline}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-400">{t.subline}</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-300">
            {!data && !error ? (
              <>
                <span className="h-4 w-44 animate-pulse rounded bg-neutral-800" aria-hidden="true" />
                <span className="h-4 w-36 animate-pulse rounded bg-neutral-800" aria-hidden="true" />
              </>
            ) : (
              <>
                <span className="font-medium text-white tabular-nums">
                  {t.countLine(total, catCount)}
                </span>
                <span className="text-neutral-600">·</span>
                <span>
                  {t.updatedAt} {data ? formatDate(data.generatedAt, lang) : '—'}
                </span>
              </>
            )}
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">{t.aiNote}</span>
          </p>
          {data?.synthetic && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {t.syntheticNote}
            </p>
          )}
        </div>
      </section>

      <main id="top" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 pt-8 md:flex-row md:items-start md:gap-8">
          {/* 桌面端侧栏 */}
          <aside className="sidebar-scroll hidden w-52 shrink-0 md:sticky md:top-14 md:block md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto md:overscroll-contain md:pr-1.5 md:pb-4">
            <nav aria-label="Categories" className="flex flex-col gap-1">
              <SidebarChip
                active={activeCat === 'all'}
                onClick={() => setActiveCat('all')}
                label={t.all}
                count={total}
              />
              {data?.categories.map((c) => (
                <SidebarChip
                  key={c.nameZh}
                  active={activeCat === c.nameZh}
                  onClick={() => setActiveCat(c.nameZh)}
                  label={lang === 'zh' ? c.nameZh : c.nameEn}
                  count={c.repos.length}
                />
              ))}
              {!data && !error && (
                <div className="flex flex-col gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="h-8 animate-pulse rounded-md bg-neutral-200/70" />
                  ))}
                </div>
              )}
            </nav>
          </aside>

          {/* 主列表区 */}
          <div className="min-w-0 flex-1">
            <div className="sticky top-14 z-10 border-b border-neutral-200 bg-neutral-50/90 py-3 backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex-1 sm:max-w-sm">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-md border border-neutral-300 bg-white py-2 pr-3 pl-9 text-sm placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
                  />
                </label>
                <div className="flex items-center gap-1 self-start sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => setSortRecent(false)}
                    aria-pressed={!sortRecent}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      !sortRecent
                        ? 'bg-neutral-950 text-white'
                        : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950'
                    }`}
                  >
                    {t.sortStars}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortRecent(true)}
                    aria-pressed={sortRecent}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      sortRecent
                        ? 'bg-neutral-950 text-white'
                        : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950'
                    }`}
                  >
                    {t.sortRecent}
                  </button>
                </div>
              </div>

              {/* 移动端分类 chips */}
              <nav
                aria-label="Categories"
                className="mt-3 flex gap-1.5 overflow-x-auto pb-1 md:hidden [-webkit-overflow-scrolling:touch]"
              >
                <Chip
                  active={activeCat === 'all'}
                  onClick={() => setActiveCat('all')}
                  label={t.all}
                  count={total}
                />
                {data?.categories.map((c) => (
                  <Chip
                    key={c.nameZh}
                    active={activeCat === c.nameZh}
                    onClick={() => setActiveCat(c.nameZh)}
                    label={lang === 'zh' ? c.nameZh : c.nameEn}
                    count={c.repos.length}
                  />
                ))}
                {!data && !error && (
                  <div className="flex gap-1.5" aria-hidden="true">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-7 w-16 animate-pulse rounded-full bg-neutral-200/70"
                      />
                    ))}
                  </div>
                )}
              </nav>
            </div>

            {error ? (
              <EmptyState
                title={t.loadError}
                hint={t.loadErrorHint}
                onRetry={() => {
                  setError(false)
                  setData(null)
                  loadData()
                    .then(setData)
                    .catch(() => setError(true))
                }}
                retryLabel={t.retry}
              />
            ) : !data ? (
              <LoadingGrid />
            ) : visible.length === 0 ? (
              <EmptyState title={t.noResults} hint={t.noResultsHint} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((r) => (
                  <RepoCard key={r.fullName} repo={r} lang={lang} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-neutral-500 sm:px-6">
          <p>{t.footerNote}</p>
          <p>
            {t.brand} ·{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-950"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

interface ChipProps {
  active: boolean
  onClick: () => void
  label: string
  count: number
}

/** 桌面端侧栏分类项 */
function SidebarChip({ active, onClick, label, count }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
        active
          ? 'bg-neutral-950 font-medium text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`shrink-0 text-xs tabular-nums ${active ? 'text-neutral-400' : 'text-neutral-500'}`}
      >
        {count}
      </span>
    </button>
  )
}

/** 骨架屏 */
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="animate-pulse overflow-hidden rounded-lg border border-neutral-200 bg-white"
        >
          <div className="relative h-24 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100">
            <div className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-neutral-200/70" />
          </div>
          <div className="p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div className="h-3.5 w-28 rounded bg-neutral-200/80" />
              <div className="h-3 w-10 rounded bg-neutral-200/60" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-neutral-100" />
              <div className="h-3 w-3/4 rounded bg-neutral-100" />
            </div>
            <div className="mt-2.5 h-2.5 w-1/2 rounded bg-neutral-100" />
            <div className="mt-4 flex items-center gap-1.5 border-t border-neutral-100 pt-3">
              <div className="h-2 w-2 rounded-full bg-neutral-200/70" />
              <div className="h-2.5 w-14 rounded bg-neutral-200/60" />
              <div className="ml-auto h-2.5 w-12 rounded bg-neutral-200/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Chip({ active, onClick, label, count }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${
        active
          ? 'border-neutral-950 bg-neutral-950 text-white'
          : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'
      }`}
    >
      {label}
      <span className={`tabular-nums ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
        {count}
      </span>
    </button>
  )
}

function EmptyState({
  title,
  hint,
  onRetry,
  retryLabel,
}: {
  title: string
  hint: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-32 text-center">
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      <p className="text-sm text-neutral-500">{hint}</p>
      {onRetry && retryLabel && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
