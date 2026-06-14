import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
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
