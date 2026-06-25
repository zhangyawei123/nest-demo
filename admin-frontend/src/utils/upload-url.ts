type UploadPayload = {
  relativeUrl?: string
  url?: string
  path?: string
}

export function normalizeAssetUrl(value?: string) {
  if (!value) return ''

  const url = value.trim()
  if (!url) return ''
  if (/^data:/i.test(url)) return url

  const withoutApiPrefix = url.replace(/^\/api(?=https?:\/\/)/i, '')
  if (withoutApiPrefix.startsWith('/api/uploads/')) {
    return withoutApiPrefix.replace(/^\/api(?=\/uploads\/)/, '')
  }

  if (/^https?:\/\//i.test(withoutApiPrefix)) {
    try {
      const parsed = new URL(withoutApiPrefix)
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    } catch {
      return withoutApiPrefix
    }
  }

  return withoutApiPrefix
}

export function getUploadedAssetUrl(response: unknown) {
  const payload = ((response as any)?.data || response || {}) as UploadPayload
  return normalizeAssetUrl(payload.relativeUrl || payload.path || payload.url)
}

export function normalizeHtmlAssetUrls(html?: string) {
  if (!html) return ''

  return html.replace(/(src=["'])([^"']+)(["'])/gi, (_match, prefix, url, suffix) => {
    return `${prefix}${normalizeAssetUrl(url)}${suffix}`
  })
}
