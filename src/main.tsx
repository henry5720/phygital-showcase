import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { applyDesignTokens } from './config/applyDesignTokens'
import { router } from './router'
import './index.css'

applyDesignTokens()

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
