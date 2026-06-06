type Cleanup = () => void

function setVisible(el: Element | null, visible: boolean) {
  if (!el) return
  const current = el.getAttribute('visible')
  if (current === String(visible)) return
  el.setAttribute('visible', visible ? 'true' : 'false')
}

function showPortfolioItem(index: number) {
  for (let i = 0; i <= 2; i += 1) {
    setVisible(document.getElementById(`portfolio-item${i}`), i === index)
  }
}

export function initArV2Experience(root: Document = document): Cleanup {
  const target = root.getElementById('ar-v2-target')
  const portfolio = root.getElementById('portfolio-panel')
  const left = root.getElementById('portfolio-left-button')
  const right = root.getElementById('portfolio-right-button')
  const previewButton = root.getElementById('paintandquest-preview-button')
  const previewVideo = root.getElementById('paintandquest-video-link')
  const mp4 = root.getElementById('paintandquest-video-mp4') as HTMLVideoElement | null
  const webm = root.getElementById('paintandquest-video-webm') as HTMLVideoElement | null

  let currentItem = 0
  let activated = false

  const onTargetFound = () => {
    if (activated) return
    activated = true
    setVisible(portfolio, true)
    setVisible(left, true)
    setVisible(right, true)
    showPortfolioItem(0)
  }

  const onLeftClick = () => {
    currentItem = (currentItem - 1 + 3) % 3
    showPortfolioItem(currentItem)
  }

  const onRightClick = () => {
    currentItem = (currentItem + 1) % 3
    showPortfolioItem(currentItem)
  }

  const onPreviewClick = () => {
    const canPlayWebm = root.createElement('video').canPlayType('video/webm; codecs="vp8, vorbis"')
    if (canPlayWebm === '') {
      previewVideo?.setAttribute('src', '#paintandquest-video-mp4')
      mp4?.play()?.catch(() => {})
      return
    }
    previewVideo?.setAttribute('src', '#paintandquest-video-webm')
    webm?.play()?.catch(() => {})
  }

  target?.addEventListener('targetFound', onTargetFound)
  left?.addEventListener('click', onLeftClick)
  right?.addEventListener('click', onRightClick)
  previewButton?.addEventListener('click', onPreviewClick)

  return () => {
    target?.removeEventListener('targetFound', onTargetFound)
    left?.removeEventListener('click', onLeftClick)
    right?.removeEventListener('click', onRightClick)
    previewButton?.removeEventListener('click', onPreviewClick)
  }
}
