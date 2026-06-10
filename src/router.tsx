import { createBrowserRouter } from 'react-router'
import { ROUTES } from './config/routes'
import { ErrorBoundary } from './components/ErrorBoundary'

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { Landing } = await import('./pages/Landing')
      return { Component: Landing }
    },
  },
  {
    path: ROUTES.AR_GUIDE,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { ArGuide } = await import('./pages/ArGuide')
      return { Component: ArGuide }
    },
  },
  {
    path: ROUTES.AR_SCANNER,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { ArScanner } = await import('./pages/ArScanner')
      return { Component: ArScanner }
    },
  },
  {
    path: ROUTES.QUIZ,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { Quiz } = await import('./pages/Quiz')
      return { Component: Quiz }
    },
  },
  {
    path: ROUTES.QUIZ_RESULT,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { QuizResult } = await import('./pages/QuizResult')
      return { Component: QuizResult }
    },
  },
  {
    path: ROUTES.PRODUCT,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { Product } = await import('./pages/Product')
      return { Component: Product }
    },
  },
  {
    path: ROUTES.MODEL_VIEWER,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { ModelViewer } = await import('./pages/ModelViewer')
      return { Component: ModelViewer }
    },
  },
])
