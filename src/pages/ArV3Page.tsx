import { useNavigate } from 'react-router'
import { ArV3Scene } from '../components/ArV3Scene'

export function ArV3Page() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white font-sans">
      <button
        type="button"
        onClick={() => navigate('/ar')}
        className="absolute top-4 left-4 z-50 text-sm opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1 transition-opacity"
      >
        <span>←</span> 返回 AR 首頁
      </button>

      <div className="absolute top-16 inset-x-0 z-40 px-4 text-center pointer-events-none">
        <h1 className="text-xl font-semibold tracking-tight">AR V3 實作頁</h1>
        <p className="mt-2 text-sm opacity-60">
          進階 AR 實作驗證，包含自定義追蹤與互動邏輯。
        </p>
      </div>

      <div className="pt-32">
        <ArV3Scene />
      </div>
    </div>
  )
}
