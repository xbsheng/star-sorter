export interface Repo {
  fullName: string
  description: string | null
  language: string | null
  stars: number
  topics: string[]
  avatarUrl: string
  /** AI 生成的中文一句话简介 */
  summaryZh: string
  /** AI 生成的英文一句话简介 */
  summaryEn: string
  updatedAt: string
}

export interface Category {
  nameZh: string
  nameEn: string
  repos: Repo[]
}

export interface StarData {
  generatedAt: string
  total: number
  /** true 表示内置示例数据，首次 Action 运行后会被真实数据替换 */
  synthetic?: boolean
  categories: Category[]
}

export function repoUrl(fullName: string): string {
  return `https://github.com/${fullName}`
}
