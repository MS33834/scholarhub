import { Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { disciplines } from '@/data/disciplines'
import { useUI } from '@/store'
import { DisciplineList } from '@/components/DisciplineCard'
import { ResourceCard } from '@/components/ResourceCard'
import { Skeleton } from '@/components/Skeleton'
import { useT } from '@/i18n/useLang'
import { useReadingHistory } from '@/store/readingHistory'
import { useResources } from '@/hooks/useResources'

const featuredIds = [
  'attention-is-all-you-need-2017',
  'deep-learning-goodfellow-2016',
  'gravitational-waves-ligo-2016',
  'linear-algebra-done-right-axler-2015',
  'molecular-biology-of-the-cell-2014',
]

export function HomePage() {
  const navigate = useNavigate()
  const showToast = useUI((s) => s.showToast)
  const { t } = useT()
  const [q, setQ] = useState('')
  const { history } = useReadingHistory()
  const { resources: allResources, loading } = useResources({ filters: { limit: 200 } })

  const featured = useMemo(
    () =>
      featuredIds
        .map((id) => allResources.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [allResources]
  )

  // 基于阅读历史生成推荐
  const recommendations = useMemo(() => {
    if (history.length === 0 || allResources.length === 0) return []

    // 获取最近阅读的资源
    const recentResources = history
      .slice(0, 5)
      .map((h) => allResources.find((r) => r.id === h.resourceId))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))

    // 收集标签和学科
    const tagCount: Record<string, number> = {}
    const disciplineCount: Record<string, number> = {}

    recentResources.forEach((r) => {
      r.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
      disciplineCount[r.discipline] = (disciplineCount[r.discipline] || 0) + 1
    })

    // 计算资源匹配分数
    const scored = allResources
      .filter((r) => !recentResources.some((recent) => recent.id === r.id))
      .map((r) => {
        let score = 0
        r.tags.forEach((tag) => {
          score += tagCount[tag] || 0
        })
        score += (disciplineCount[r.discipline] || 0) * 2
        return { resource: r, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    return scored.map((item) => item.resource)
  }, [history, allResources])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) {
      showToast(t('search.empty'))
      return
    }
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="page-fade">
      {/* 顶部 publication 风格横线 + 刊号 */}
      <div className="mx-auto max-w-column px-6 sm:px-8 pt-10">
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
            ScholarHUB · {t('brand.tagline')}
          </span>
          <span className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
            {t('brand.volume')}
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-column px-6 sm:px-8 pt-24 pb-32">
        <div className="max-w-3xl">
          <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-4">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-ink whitespace-pre-line leading-[1.1]">
            {t('home.hero.title')}
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-ink-soft max-w-2xl">
            {t('home.hero.subtitle')}
          </p>

          <form
            onSubmit={onSearch}
            className="mt-10 flex items-center gap-4 border-b border-rule pb-3 focus-within:border-moss transition-colors group"
          >
            <Search size={22} className="text-ink-mute group-focus-within:text-moss transition-colors" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('home.hero.search.placeholder')}
              className="flex-1 bg-transparent text-lg placeholder:text-ink-mute focus:outline-none"
              aria-label={t('search.aria')}
            />
            <button
              type="submit"
              className="text-sm text-ink-soft hover:text-moss transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {t('home.hero.search.submit')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-mono text-[12px] uppercase tracking-wider2 text-ink-mute">
            {loading
              ? t('home.hero.meta', { n: '…', d: disciplines.length })
              : t('home.hero.meta', { n: allResources.length, d: disciplines.length })}
          </p>
        </div>
      </section>

      {/* 学科导航 */}
      <section className="mx-auto max-w-column px-6 sm:px-8">
        <div className="flex items-baseline justify-between mb-4 border-b border-rule pb-3">
          <h2 className="font-display text-2xl text-ink">{t('home.disciplines.title')}</h2>
          <span className="text-mono text-[11px] uppercase tracking-wider2 text-ink-mute">
            {t('home.disciplines.hint')}
          </span>
        </div>
        <DisciplineList />
      </section>

      {/* 精选资源 - 横向滚动列 */}
      <section className="mx-auto max-w-column px-6 sm:px-8 mt-24">
        <div className="flex items-baseline justify-between mb-6 border-b border-rule pb-3">
          <h2 className="font-display text-2xl text-ink">{t('home.recommendations.title')}</h2>
          <Link
            to="/resources"
            className="text-mono text-[11px] uppercase tracking-wider2 text-ink-soft hover:text-moss transition-colors flex items-center gap-1"
          >
            {t('home.featured.viewAll')} <ArrowRight size={12} />
          </Link>
        </div>

        <div className="-mx-6 sm:-mx-8 overflow-x-auto pb-2">
          <div className="flex gap-5 px-6 sm:px-8 snap-x snap-mandatory">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[300px] sm:w-[340px] shrink-0 snap-start">
                    <Skeleton className="h-80" />
                  </div>
                ))
              : featured.map((r) => (
                  <div key={r.id} className="w-[300px] sm:w-[340px] shrink-0 snap-start">
                    <ResourceCard resource={r} showSummary />
                  </div>
                ))}
          </div>
        </div>
        <p className="mt-3 text-mono text-[10px] uppercase tracking-wider2 text-ink-mute text-right">
          {t('home.featured.scrollHint')}
        </p>
      </section>

      {/* 个性化推荐 */}
      {recommendations.length > 0 && (
        <section className="mx-auto max-w-column px-6 sm:px-8 mt-24">
          <div className="flex items-baseline justify-between mb-6 border-b border-rule pb-3">
            <div>
              <h2 className="font-display text-2xl text-ink">{t('home.recommendations.title')}</h2>
              <p className="mt-1 text-[14px] text-ink-soft">{t('home.recommendations.subtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((r) => (
              <ResourceCard key={r.id} resource={r} showSummary />
            ))}
          </div>
        </section>
      )}

      {/* 项目理念 */}
      <section className="mx-auto max-w-column px-6 sm:px-8 mt-32">
        <div className="border-t border-rule pt-12">
          <div className="mb-10">
            <p className="text-mono text-[11px] uppercase tracking-wider2 text-moss mb-2">
              {t('home.hero.eyebrow')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink">
              {t('home.intro.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <p className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute mb-3">
                I
              </p>
              <h3 className="font-display text-xl text-ink mb-3">
                {t('home.intro.what.title')}
              </h3>
              <p className="text-[16px] leading-7 text-ink-soft">
                {t('home.intro.what.body')}
              </p>
            </div>
            <div>
              <p className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute mb-3">
                II
              </p>
              <h3 className="font-display text-xl text-ink mb-3">
                {t('home.intro.cite.title')}
              </h3>
              <p className="text-[16px] leading-7 text-ink-soft">
                {t('home.intro.cite.body')}
              </p>
            </div>
            <div>
              <p className="text-mono text-[12px] uppercase tracking-wider2 text-ink-mute mb-3">
                III
              </p>
              <h3 className="font-display text-xl text-ink mb-3">
                {t('home.intro.contrib.title')}
              </h3>
              <p className="text-[16px] leading-7 text-ink-soft">
                {t('home.intro.contrib.body')}{' '}
                <a
                  className="text-moss hover:text-ink transition-colors underline decoration-1 underline-offset-4"
                  href="https://github.com/MS33834/scholarhub/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('footer.link.contributing')}
                </a>
                {'.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
