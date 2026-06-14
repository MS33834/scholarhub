import { NavLink, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, Languages } from 'lucide-react'
import { useUI } from '@/store'
import { useT } from '@/i18n/LangProvider'

export function SiteHeader() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const showToast = useUI((s) => s.showToast)
  const { t, lang, toggleLang } = useT()
  const [q, setQ] = useState('')

  // Sync search box with ?q= from any page
  useEffect(() => {
    const v = searchParams.get('q')
    setQ(v ?? '')
  }, [searchParams])

  const navItems: { to: string; key: 'nav.home' | 'nav.resources' | 'nav.favorites' | 'nav.history' | 'nav.lists' | 'nav.settings' | 'nav.about' }[] = [
    { to: '/', key: 'nav.home' },
    { to: '/resources', key: 'nav.resources' },
    { to: '/favorites', key: 'nav.favorites' },
    { to: '/history', key: 'nav.history' },
    { to: '/lists', key: 'nav.lists' },
    { to: '/settings', key: 'nav.settings' },
    { to: '/about', key: 'nav.about' },
  ]

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) {
      showToast(t('search.empty'))
      return
    }
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <header className="border-b border-rule sticky top-0 bg-paper/95 backdrop-blur-md z-50">
      <div className="mx-auto max-w-column px-6 sm:px-8">
        <div className="flex items-center justify-between gap-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl font-bold text-ink tracking-tight">ScholarHUB</span>
            <span className="text-xs font-medium text-ink-mute bg-ink-soft/10 px-2 py-1 rounded-md">
              {t('brand.volume')}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <form
              onSubmit={onSubmit}
              className="hidden sm:flex items-center gap-2 border border-rule rounded-lg px-3 py-2 focus-within:border-moss focus-within:ring-2 focus-within:ring-moss/10 transition-all bg-paper"
              style={{ minWidth: 280 }}
            >
              <Search size={16} className="text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                className="bg-transparent text-sm flex-1 placeholder:text-ink-mute focus:outline-none"
                aria-label={t('search.aria')}
              />
              <kbd className="text-xs text-ink-mute border border-rule rounded px-1.5 py-0.5 bg-ink-soft/5">/</kbd>
            </form>

            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-moss border border-rule rounded-lg px-3 py-2 hover:border-moss/50 transition-all"
              aria-label={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
              title={lang === 'en' ? 'Switch to 中文' : 'Switch to English'}
            >
              <Languages size={16} />
              <span>{lang === 'en' ? 'EN' : '中'}</span>
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-6 sm:gap-8 pb-3 text-sm overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group relative pb-1 text-ink-soft hover:text-ink transition-colors whitespace-nowrap font-medium ${
                  isActive ? 'text-moss' : ''
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{t(item.key)}</span>
                  <span
                    className={`absolute left-0 -bottom-0.5 h-0.5 bg-moss transition-all rounded-full ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
