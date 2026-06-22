import { NavLink, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, User, LogOut, Shield, Upload } from 'lucide-react'
import { useUI } from '@/store'
import { useT } from '@/i18n/useLang'
import { useAuth } from '@/store/authStore'

export function SiteHeader() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const showToast = useUI((s) => s.showToast)
  const { t, lang, toggleLang } = useT()
  const { user, isAuthenticated, logout } = useAuth()
  const [q, setQ] = useState('')

  // Sync search box with ?q= from any page
  useEffect(() => {
    const v = searchParams.get('q') ?? ''
    // Guarded setState: only updates when the URL param differs from local input,
    // so no cascading render occurs in practice.
    setQ((prev) => (prev === v ? prev : v))
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

  const skipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const main = document.querySelector('main') as HTMLElement | null
    if (!main) return
    main.setAttribute('tabindex', '-1')
    main.focus()
  }

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-rule">
      <a
        href="#main-content"
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-[2px] focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:outline focus:outline-[1.5px] focus:outline-moss focus:outline-offset-3"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-column px-6 sm:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link to="/" className="flex items-baseline gap-3 group">
            <span className="font-display text-2xl text-ink">ScholarHUB</span>
            <span className="text-mono text-[11px] uppercase tracking-wider2 text-ink-mute border border-rule px-2 py-0.5 rounded-[2px]">
              {t('brand.volume')}
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <form
              onSubmit={onSubmit}
              className="hidden sm:flex items-center gap-2 border border-rule rounded-[2px] px-3 py-1.5 bg-paper focus-within:border-moss transition-colors"
              style={{ minWidth: 260 }}
            >
              <Search size={16} className="text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                className="bg-transparent text-sm flex-1 placeholder:text-ink-mute focus:outline-none"
                aria-label={t('search.aria')}
              />
              <kbd className="text-mono text-[11px] text-ink-mute border border-rule px-1.5 py-0.5">/</kbd>
            </form>

            <button
              onClick={toggleLang}
              className="text-sm font-medium text-ink-soft hover:text-moss px-2 py-1 transition-colors"
              aria-label={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
              title={lang === 'en' ? 'Switch to 中文' : 'Switch to English'}
            >
              EN/中
            </button>

            <Link
              to={isAuthenticated ? '/submit' : '/login'}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-moss px-2 py-1 transition-colors"
              aria-label={t('nav.submit')}
              title={t('nav.submit')}
            >
              <Upload size={18} />
              <span>{t('nav.submit')}</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center" aria-label={t('profile.user')}>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="p-2 text-ink-soft hover:text-moss transition-colors"
                    aria-label={t('profile.adminPanel')}
                    title={t('profile.adminPanel')}
                  >
                    <Shield size={20} />
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="p-2 text-ink-soft hover:text-moss transition-colors"
                  aria-label={t('profile.user')}
                  title={t('profile.user')}
                >
                  <User size={20} />
                </Link>
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="p-2 text-ink-soft hover:text-ochre transition-colors"
                  aria-label={t('profile.logout')}
                  title={t('profile.logout')}
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 text-ink-soft hover:text-moss transition-colors"
                aria-label={t('auth.login.submit')}
                title={t('auth.login.submit')}
              >
                <User size={20} />
              </Link>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-6 sm:gap-8 pb-2 pt-1 text-sm overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              aria-current="page"
              className={({ isActive }) =>
                `whitespace-nowrap pb-0.5 border-b-[1.5px] transition-colors ${
                  isActive
                    ? 'text-moss border-moss'
                    : 'text-ink-soft border-transparent hover:text-ink'
                }`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
