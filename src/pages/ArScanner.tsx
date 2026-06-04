import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useConfig } from '../hooks/useConfig'
import { MindArCanvas } from '../components/MindArCanvas'
import { VideoOverlay } from '../components/VideoOverlay'

type ArState = 'idle' | 'tracking' | 'video_playing'

export function ArScanner() {
  const config = useConfig()
  const navigate = useNavigate()
  const [arState, setArState] = useState<ArState>('idle')
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  function handleTargetFound() {
    setArState('tracking')
  }

  function handleTargetLost() {
    setArState(prev => prev === 'video_playing' ? prev : 'idle')
  }

  function handleHotspot(type: 'A' | 'B' | 'C') {
    const src = {
      A: config.ar.videos.stageA,
      B: config.ar.videos.stageB,
      C: config.ar.videos.stageC,
    }[type]
    setVideoSrc(src)
    setArState('video_playing')
  }

  function handleVideoEnd() {
    setVideoSrc(null)
    setArState('tracking')
  }

  return (
    <div className="relative w-full h-dvh" style={{ backgroundColor: '#000' }}>
      <MindArCanvas
        modelSrc={config.ar.model}
        mindFileSrc={config.brand.logoMindFile}
        onTargetFound={handleTargetFound}
        onTargetLost={handleTargetLost}
        onHotspot={handleHotspot}
      />

      {arState === 'idle' && (
        <div className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-4 pointer-events-none">
          <p className="text-sm opacity-50" style={{ color: '#fff' }}>
            對準 Fizz't Logo 開始體驗
          </p>
        </div>
      )}

      <button
        onClick={() => navigate('/ar')}
        className="absolute top-4 left-4 text-sm opacity-50 hover:opacity-100 cursor-pointer pointer-events-auto"
        style={{ color: '#fff' }}
      >
        ← 返回
      </button>

      {arState === 'video_playing' && videoSrc && (
        <VideoOverlay
          src={videoSrc}
          onEnd={handleVideoEnd}
          onClose={handleVideoEnd}
        />
      )}
    </div>
  )
}
