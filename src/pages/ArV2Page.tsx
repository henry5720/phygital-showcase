import { useNavigate } from 'react-router'
import { ArV2Scene } from '../components/ArV2Scene'

export function ArV2Page() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white">
      <button
        type="button"
        onClick={() => navigate('/ar')}
        className="absolute top-4 left-4 z-50 text-sm opacity-70 hover:opacity-100 cursor-pointer"
      >
        ← 返回 AR 首頁
      </button>

      <div className="absolute top-16 inset-x-0 z-40 px-4 text-center pointer-events-none">
        <h1 className="text-xl font-semibold">AR V2 驗證頁</h1>
        <p className="mt-2 text-sm opacity-70">
          使用官網 demo 素材，先確認 A-Frame + MindAR 流程可跑。
        </p>
      </div>

      <ArV2Scene />
    </div>
  )
}
