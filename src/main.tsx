import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
import './index.css'

// StrictMode removed: double-invokes useEffect in dev, which triggers getUserMedia twice
// and causes "Permission dismissed" on WebRTC/camera APIs used by MindAR.
createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
