const LOADING_FRAME_CLASS = 'rich-image-frame'
const LOADING_ACTIVE_CLASS = 'rich-image-loading'
const LOADING_ERROR_CLASS = 'rich-image-error'

export const decorateRichImages = (container?: HTMLElement | null) => {
  if (!container) return

  const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'))

  images.forEach((image) => {
    const currentParent = image.parentElement
    const frame = currentParent?.classList.contains(LOADING_FRAME_CLASS)
      ? currentParent
      : document.createElement('span')

    if (!currentParent?.classList.contains(LOADING_FRAME_CLASS)) {
      frame.className = `${LOADING_FRAME_CLASS} ${LOADING_ACTIVE_CLASS}`
      const state = document.createElement('span')
      state.className = 'rich-image-state'
      state.textContent = '图片加载中'

      image.parentNode?.insertBefore(frame, image)
      frame.appendChild(image)
      frame.appendChild(state)
    }

    const state = frame.querySelector<HTMLElement>('.rich-image-state')
    const markLoaded = () => {
      frame.classList.remove(LOADING_ACTIVE_CLASS, LOADING_ERROR_CLASS)
      if (state) state.textContent = ''
    }
    const markError = () => {
      frame.classList.remove(LOADING_ACTIVE_CLASS)
      frame.classList.add(LOADING_ERROR_CLASS)
      if (state) state.textContent = '图片加载失败'
    }

    if (image.complete) {
      if (image.naturalWidth > 0) {
        markLoaded()
      } else {
        markError()
      }
      return
    }

    frame.classList.add(LOADING_ACTIVE_CLASS)
    image.addEventListener('load', markLoaded, { once: true })
    image.addEventListener('error', markError, { once: true })
  })
}
