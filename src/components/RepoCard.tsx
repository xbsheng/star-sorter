import type { Repo } from '../types'
import { repoUrl } from '../types'
import { formatDate, formatStars, languageColor, type Lang } from '../i18n'
import { SparkleIcon, StarIcon } from '../icons'

interface Props {
  repo: Repo
  lang: Lang
}

export default function RepoCard({ repo, lang }: Props) {
  const name = repo.fullName.split('/')[1] ?? repo.fullName
  const summary = lang === 'zh' ? repo.summaryZh : repo.summaryEn
  const original = repo.description

  return (
    <a
      href={repoUrl(repo.fullName)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
    >
      <div className="relative h-24 shrink-0 overflow-hidden bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100">
        <img
          src={repo.avatarUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 m-auto h-12 w-12 rounded-full border border-neutral-200 bg-white object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-sm font-semibold" title={repo.fullName}>
            {name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500 tabular-nums">
            <StarIcon className="h-3.5 w-3.5 text-neutral-400" />
            {formatStars(repo.stars, lang)}
          </span>
        </div>

        {summary && (
          <p className="mt-2 flex gap-1.5 text-sm leading-relaxed text-neutral-700 line-clamp-2">
            <SparkleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300" />
            <span>{summary}</span>
          </p>
        )}

        {original && original !== summary && (
          <p className="mt-1.5 line-clamp-1 text-xs text-neutral-500">{original}</p>
        )}

        <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          {repo.language && (
            <>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: languageColor(repo.language) }}
              />
              <span className="truncate">{repo.language}</span>
            </>
          )}
          <span className="ml-auto shrink-0 tabular-nums">
            {formatDate(repo.updatedAt, lang, true)}
          </span>
        </div>
      </div>
    </a>
  )
}

