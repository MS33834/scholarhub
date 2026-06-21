import { ReactNode } from 'react'
import { BrowserRouter, MemoryRouter, type MemoryRouterProps, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { LangProvider } from '@/i18n/LangProvider'

interface TestWrapperProps {
  children: ReactNode
}

export function TestWrapper({ children }: TestWrapperProps) {
  return (
    <BrowserRouter>
      <LangProvider>
        {children}
      </LangProvider>
    </BrowserRouter>
  )
}

interface PageTestWrapperProps extends TestWrapperProps {
  initialEntries?: MemoryRouterProps['initialEntries']
  initialIndex?: MemoryRouterProps['initialIndex']
}

/**
 * Wrapper for page-level integration tests that need to assert on navigation.
 * Uses MemoryRouter so tests can start at a specific route and observe route
 * changes without touching the real browser history.
 */
export function PageTestWrapper({ children, initialEntries, initialIndex }: PageTestWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <LangProvider>
        {children}
      </LangProvider>
    </MemoryRouter>
  )
}

interface RoutedPageTestWrapperProps extends PageTestWrapperProps {
  path?: string
}

/**
 * Wrapper for page components that rely on `useParams()`.
 * Renders the child component inside a matching Route so route params are
 * populated correctly.
 */
export function RoutedPageTestWrapper({ children, initialEntries, initialIndex, path = '*' }: RoutedPageTestWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <LangProvider>
        <Routes>
          <Route path={path} element={children} />
        </Routes>
      </LangProvider>
    </MemoryRouter>
  )
}

/**
 * Helper component to expose the current MemoryRouter location for test assertions.
 */
export function RouteLocation({ testId = 'router-location' }: { testId?: string }) {
  const location = useLocation()
  return <div data-testid={testId} data-pathname={location.pathname} data-search={location.search} />
}

/**
 * Helper component to expose current route params for debugging.
 */
export function RouteParams({ testId = 'router-params' }: { testId?: string }) {
  const params = useParams()
  return <div data-testid={testId} data-params={JSON.stringify(params)} />
}
