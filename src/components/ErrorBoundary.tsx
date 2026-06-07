import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-background text-foreground">
          <p className="text-lg font-semibold">發生錯誤</p>
          <p className="text-sm opacity-60">請重新整理頁面或返回首頁。</p>
          <a
            href="/"
            className="mt-4 py-2 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          >
            返回首頁
          </a>
        </div>
      )
    }

    return this.props.children
  }
}
