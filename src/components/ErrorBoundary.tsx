import { Component, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useT } from '@/i18n/LangProvider'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

function ErrorBoundaryContent({ hasError, onReset }: { hasError: boolean; onReset: () => void }) {
  const { t } = useT()

  if (!hasError) return null

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="text-center px-6 max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-ochre/10 mb-6">
          <span className="text-display text-3xl text-ochre">!</span>
        </div>
        <h1 className="text-display text-3xl sm:text-4xl text-ink tracking-tight">{t('common.errorTitle')}</h1>
        <p className="mt-4 text-[17px] leading-7 text-ink-soft">
          {t('common.errorBody')}
        </p>
        <button
          onClick={onReset}
          className="mt-8 inline-flex items-center gap-2 text-mono text-[11px] uppercase tracking-wider2 text-moss hover:text-ink transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('common.backHome')}
        </button>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ScholarHUB] Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent
          hasError={this.state.hasError}
          onReset={() => {
            this.setState({ hasError: false })
            window.location.hash = '/'
          }}
        />
      )
    }

    return this.props.children
  }
}
