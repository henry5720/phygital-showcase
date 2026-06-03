import { createBrowserRouter } from 'react-router'
import { Landing } from './pages/Landing'
import { ArGuide } from './pages/ArGuide'
import { Quiz } from './pages/Quiz'
import { QuizResult } from './pages/QuizResult'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/ar', element: <ArGuide /> },
  { path: '/quiz', element: <Quiz /> },
  { path: '/quiz/result/:type', element: <QuizResult /> },
  { path: '/product', element: <div style={{ color: '#fff', padding: '2rem' }}>Product page — Plan 2</div> },
])
