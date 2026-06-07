import { createBrowserRouter } from 'react-router'
import { Landing } from './pages/Landing'
import { ArGuide } from './pages/ArGuide'
import { ArScanner } from './pages/ArScanner'
import { ProductARPage } from './pages/ProductARPage'
import { Quiz } from './pages/Quiz'
import { QuizResult } from './pages/QuizResult'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/ar', element: <ArGuide /> },
  { path: '/ar/scanner', element: <ArScanner /> },
  { path: '/product-ar', element: <ProductARPage /> },
  { path: '/quiz', element: <Quiz /> },
  { path: '/quiz/result/:type', element: <QuizResult /> },
  { path: '/product', element: <div style={{ color: '#fff', padding: '2rem' }}>Product page — Plan 3</div> },
])
