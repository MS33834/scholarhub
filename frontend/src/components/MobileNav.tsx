import { ReactNode, useState } from 'react'
import { Menu, X, Home, BookOpen, Heart, Clock, List, Settings, Info } from 'lucide-react'
import { useMobile } from '@/hooks/useMobile'
import { Link, useLocation } from 'react-router-dom'
import { useT } from '@/i18n/useLang'

interface MobileNavProps {
  children?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MobileNav({ children, open, onOpenChange }: MobileNavProps) {
  const isMobile = useMobile()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }
  const { t } = useT()
  const location = useLocation()

  if (!isMobile) {
    return <>{children}</>
  }

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/resources', label: t('nav.resources'), icon: BookOpen },
    { to: '/favorites', label: t('nav.favorites'), icon: Heart },
    { to: '/history', label: t('nav.history'), icon: Clock },
    { to: '/lists', label: t('nav.lists'), icon: List },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
    { to: '/about', label: t('nav.about'), icon: Info },
  ]

  return (
    <>
      {!isControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-paper border border-rule rounded-[2px] hover:border-ink transition-colors"
          aria-label={t('nav.menu')}
        >
          <Menu size={22} className="text-ink" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-paper border-r border-rule p-6 overflow-y-auto animate-slideInLeft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 pb-5 border-b border-rule">
              <div>
                <h2 className="font-display text-2xl text-ink">ScholarHUB</h2>
                <p className="text-mono text-[11px] uppercase tracking-wider2 text-ink-mute mt-1">
                  {t('brand.volume')}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-ink-mute hover:text-moss transition-colors"
                aria-label={t('nav.close')}
              >
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 py-3 px-4 border-l transition-colors ${
                      isActive
                        ? 'border-moss text-moss'
                        : 'border-transparent text-ink-soft hover:text-ink'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-moss' : ''} />
                    <span className="text-base">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="mt-8 pt-6 border-t border-rule">
              <p className="text-xs text-ink-mute leading-relaxed">
                {t('brand.tagline')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
