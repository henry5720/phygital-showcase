import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { Landing } = await import('./pages/Landing')
      return { Component: Landing }
    },
  },
  {
    path: '/ar/guide',
    lazy: async () => {
      const { ArGuide } = await import('./pages/ArGuide')
      return { Component: ArGuide }
    },
  },
  {
    path: '/ar/scanner',
    lazy: async () => {
      const { ArScanner } = await import('./pages/ArScanner')
      return { Component: ArScanner }
    },
  },
  {
    path: '/quiz',
    lazy: async () => {
      const { Quiz } = await import('./pages/Quiz')
      return { Component: Quiz }
    },
  },
  {
    path: '/quiz/result/:type',
    lazy: async () => {
      const { QuizResult } = await import('./pages/QuizResult')
      return { Component: QuizResult }
    },
  },
  {
    path: '/product',
    lazy: async () => ({
      Component: () => (
        <div className="text-white p-8">
          Product page — Plan 3
        </div>
      ),
    }),
  },
])
