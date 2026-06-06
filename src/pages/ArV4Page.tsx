import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArV4Experience } from '../components/ar-v4/ArV4Experience'
import { AR_V4_ACTIONS } from '../lib/ar-v4/assets'
import type { ArV4ActionId, ArV4Status } from '../lib/ar-v4/types'

export function ArV4Page() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ArV4Status>('initializing')
  const [selectedActionId, setSelectedActionId] = useState<ArV4ActionId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedAction = AR_V4_ACTIONS.find((a) => a.id === selectedActionId)

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black text-white">
      {/* AR Experience Container */}
      <ArV4Experience
        onReady={() => setStatus('scanning')}
        onTargetFound={() => setStatus('tracking')}
        onTargetLost={() => setStatus('lost')}
        onAction={(id) => setSelectedActionId(id)}
        onError={(err) => {
          setStatus('error')
          setError(String(err))
        }}
      />

      {/* UI Shell */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-start pointer-events-auto">
          <button
            onClick={() => navigate('/ar')}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
          >
            ← 返回
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-tight">AR V4</h1>
            <p className="text-xs opacity-50">Three.js + MindAR</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Info Panel */}
        <div className="p-6 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  status === 'tracking' ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                }`}
              />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">{status}</span>
            </div>

            {error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : !selectedAction ? (
              <p className="text-sm opacity-50 leading-relaxed">
                {status === 'tracking' ? '點擊虛擬熱點來查看詳細資訊。' : '請對準識別圖以開始。'}
              </p>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-lg font-bold text-primary">{selectedAction.label}</h2>
                <p className="text-sm opacity-80 leading-relaxed">{selectedAction.description}</p>
                {selectedAction.id === 'web' && (
                  <a
                    href="https://softmind.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-bold text-blue-400 underline"
                  >
                    https://softmind.tech
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
