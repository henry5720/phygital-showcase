interface Props {
  src: string
  onEnd: () => void
  onClose: () => void
}

export function VideoOverlay({ src, onEnd, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
    >
      <button
        aria-label="關閉"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-2xl cursor-pointer opacity-70 hover:opacity-100 text-foreground"
      >
        ✕
      </button>
      <video
        role="video"
        src={src}
        autoPlay
        playsInline
        onEnded={onEnd}
        className="w-full max-w-lg"
        style={{ maxHeight: '80dvh' }}
      />
    </div>
  )
}
