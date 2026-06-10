import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { ROUTES } from '@/config/routes'
import { MindARScene } from '../features/ar/scanner/MindARScene'

type ArStatus = 'initializing' | 'scanning' | 'tracking' | 'lost' | 'error'

export function ArScanner() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ArStatus>('initializing')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black text-white">
      <MindARScene
        onReady={() => setStatus('scanning')}
        onTargetFound={() => setStatus('tracking')}
        onTargetLost={() => setStatus('lost')}
        onError={(err: unknown) => { setStatus('error'); setError(err instanceof Error ? err.message : String(err)) }}
        navigate={navigate}
      />

      <div className="absolute inset-0 z-50 pointer-events-none flex flex-col">
        <div className="p-6 flex justify-between items-start pointer-events-auto">
          <Link
            to={ROUTES.AR_GUIDE}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
          >
            ← 返回
          </Link>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-tight">產品 AR</h1>
            <p className="text-xs opacity-50">DOM Island</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="p-6 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                status === 'tracking' ? 'bg-green-400'
                  : status === 'error' ? 'bg-red-400'
                  : 'bg-yellow-400'
              }`} />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">{status}</span>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {!error && status === 'scanning' && (
              <p className="text-sm opacity-50">請對準識別圖以開始。</p>
            )}
            {!error && status === 'lost' && (
              <p className="text-sm opacity-50">識別圖遺失，請重新對準。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
