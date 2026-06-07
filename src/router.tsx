import { createBrowserRouter } from 'react-router'
import { ROUTES } from './config/routes'

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    lazy: async () => {
      const { Landing } = await import('./pages/Landing')
      return { Component: Landing }
    },
  },
  {
    path: ROUTES.AR_GUIDE,
    lazy: async () => {
      const { ArGuide } = await import('./pages/ArGuide')
      return { Component: ArGuide }
    },
  },
  {
    path: ROUTES.AR_SCANNER,
    lazy: async () => {
      const { ArScanner } = await import('./pages/ArScanner')
      return { Component: ArScanner }
    },
  },
  {
    path: ROUTES.QUIZ,
    lazy: async () => {
      const { Quiz } = await import('./pages/Quiz')
      return { Component: Quiz }
    },
  },
  {
    path: ROUTES.QUIZ_RESULT,
    lazy: async () => {
      const { QuizResult } = await import('./pages/QuizResult')
      return { Component: QuizResult }
    },
  },
  {
    path: ROUTES.PRODUCT,
    lazy: async () => ({
      Component: () => (
        <div className="text-white p-8">
          Product page — Plan 3
        </div>
      ),
    }),
  },
])
