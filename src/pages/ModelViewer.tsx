import { useState } from 'react'
import { ModelViewerScene } from '@/features/ar/viewer/ModelViewerScene'

export function ModelViewer() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="h-dvh bg-background">
      {error ? (
        <div className="flex items-center justify-center h-dvh">
          <p className="text-red-500">Failed to load 3D model: {error}</p>
        </div>
      ) : (
        <ModelViewerScene onError={(err) => setError(err instanceof Error ? err.message : String(err))} />
      )}
    </div>
  )
}
