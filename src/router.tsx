import { createBrowserRouter } from 'react-router'
import { Landing } from './pages/Landing'
import { ArGuide } from './pages/ArGuide'
import { ArScanner } from './pages/ArScanner'
import { ArV2Page } from './pages/ArV2Page'
import { ArV3Page } from './pages/ArV3Page'
import { Quiz } from './pages/Quiz'
import { QuizResult } from './pages/QuizResult'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/ar', element: <ArGuide /> },
  { path: '/ar/scanner', element: <ArScanner /> },
  { path: '/ar/v2', element: <ArV2Page /> },
  { path: '/ar/v3', element: <ArV3Page /> },
  { path: '/quiz', element: <Quiz /> },
  { path: '/quiz/result/:type', element: <QuizResult /> },
  { path: '/product', element: <div style={{ color: '#fff', padding: '2rem' }}>Product page — Plan 3</div> },
])
