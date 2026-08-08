import { useEffect, useMemo, useState } from 'react'
import type { Category, StarData } from './types'
import { dict, formatDate, type Lang } from './i18n'
import RepoCard from './components/RepoCard'
import { GitHubIcon, GlobeIcon, SearchIcon, StarIcon } from './icons'

const DATA_URL = './data/stars.json'
const LANG_KEY = 'star-sorter-lang'

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

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((j: StarData) => setData(j))
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
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
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
            <span className="font-medium text-white tabular-nums">{t.countLine(total, catCount)}</span>
            <span className="text-neutral-600">·</span>
            <span>
              {t.updatedAt} {data ? formatDate(data.generatedAt, lang) : '—'}
            </span>
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

      <main id="top" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="sticky top-14 z-10 -mx-4 border-b border-neutral-200 bg-neutral-50/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
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
          <nav
            aria-label="Categories"
            className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
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
          </nav>
        </div>

        {error ? (
          <EmptyState
            title={t.loadError}
            hint={t.loadErrorHint}
            onRetry={() => {
              setError(false)
              setData(null)
              fetch(DATA_URL)
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((j: StarData) => setData(j))
                .catch(() => setError(true))
            }}
            retryLabel={t.retry}
          />
        ) : !data ? (
          <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-lg border border-neutral-200 bg-white"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title={t.noResults} hint={t.noResultsHint} />
        ) : (
          <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((r) => (
              <RepoCard key={r.fullName} repo={r} lang={lang} />
            ))}
          </div>
        )}
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

function EmptyState({ title, hint, onRetry, retryLabel }: { title: string; hint: string; onRetry?: () => void; retryLabel?: string }) {
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
