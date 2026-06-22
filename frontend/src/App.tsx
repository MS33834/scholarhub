import { BrowserRouter, HashRouter, Route, Routes, useLocation, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { env } from '@/lib/env'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Toast } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MobileNav } from '@/components/MobileNav'
import { useDocumentSettings } from '@/hooks/useDocumentSettings'
import { useAutoDarkMode } from '@/hooks/useAutoDarkMode'
import { useT } from '@/i18n/useLang'
import { useAuth } from '@/store/authStore'
import { HomePage } from '@/pages/HomePage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { ResourceDetailPage } from '@/pages/ResourceDetailPage'
import { DisciplinePage } from '@/pages/DisciplinePage'
import { SearchPage } from '@/pages/SearchPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ListsPage } from '@/pages/ListsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AboutPage } from '@/pages/AboutPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'
import { SubmitPage } from '@/pages/SubmitPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function NotFound() {
  const { t } = useT()
  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-32 pb-32 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-ink-soft/10 mb-6">
        <span className="text-display text-4xl text-ink-mute">404</span>
      </div>
      <h1 className="text-display text-3xl sm:text-4xl text-ink tracking-tight">{t('common.pageNotFound')}</h1>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 text-mono text-[11px] uppercase tracking-wider2 text-moss hover:text-ink transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('common.backHome')}
      </Link>
    </div>
  )
}

function AppRoutes() {
  useDocumentSettings()
  useAutoDarkMode()
  const checkAuth = useAuth((s) => s.checkAuth)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper)' }}>
          <SiteHeader onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resource/:id" element={<ResourceDetailPage />} />
              <Route path="/discipline/:slug" element={<DisciplinePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
          <Toast />
        </div>
      </ErrorBoundary>
    </MobileNav>
  )
}

/**
 * Router adapter: BrowserRouter is used for real server deployments;
 * HashRouter is kept only for the static GitHub Pages showcase build.
 */
const basePath = env.basePath === '/' ? undefined : env.basePath
const Router = env.routerMode === 'hash' ? HashRouter : BrowserRouter
const routerProps = env.routerMode === 'hash' ? {} : { basename: basePath }

export default function App() {
  return (
    <Router {...routerProps}>
      <AppRoutes />
    </Router>
  )
}
