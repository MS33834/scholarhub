import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useT } from '@/i18n/useLang'

interface BreadcrumbItem {
  label: string
  path?: string
}

export function Breadcrumb() {
  const { t } = useT()
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) {
    return null
  }

  const labelMap: Record<string, string> = {
    resources: t('nav.resources'),
    favorites: t('nav.favorites'),
    settings: t('nav.settings'),
    about: t('nav.about'),
    search: t('search.title'),
    discipline: t('discipline.subdisciplines'),
    resource: t('nav.resources'),
    history: t('nav.history'),
    lists: t('nav.lists'),
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('nav.home'), path: '/' },
  ]

  // Build breadcrumb items based on current path
  let currentPath = ''
  pathnames.forEach((pathname, index) => {
    currentPath += `/${pathname}`

    const label = labelMap[pathname] || pathname
    const isResourceDetail = pathnames[index - 1] === 'resource' && pathname !== 'resource'
    const isDisciplineDetail = pathnames[index - 1] === 'discipline' && pathname !== 'discipline'

    if (pathname === 'resource') {
      breadcrumbs.push({ label, path: '/resources' })
    } else if (isResourceDetail) {
      breadcrumbs.push({ label: t('detail.related.title') })
    } else if (isDisciplineDetail) {
      breadcrumbs.push({ label })
    } else {
      breadcrumbs.push({ label, path: currentPath })
    }
  })

  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-ink-soft">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              {index === 0 && <Home size={14} className="text-ink-mute" />}

              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="hover:text-moss transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-ink font-medium' : 'text-ink-mute'}>
                  {item.label}
                </span>
              )}

              {!isLast && <ChevronRight size={14} className="text-ink-mute" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
