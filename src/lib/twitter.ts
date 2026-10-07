export interface VideoFormat {
  url: string
  width?: number
  height?: number
  bitrate?: number
  size?: number
  quality?: string
  container?: string
  label: string
  resP?: string
  tag?: string
}

export interface MediaItem {
  id: string
  type: "image" | "video" | "external"
  url: string
  thumb: string
  formats?: VideoFormat[]
}

export interface TweetData {
  id: string
  author: string
  authorHandle?: string
  avatar?: string
  text: string
  created?: string
  rawUrl: string
  items: MediaItem[]
  endpoint: string
}

// Hoisted regular expressions to avoid recompilation on every execution (js-hoist-regexp)
const TWEET_ID_ONLY_REGEX = /^\d{2,25}$/
const STATUS_URL_REGEX = /status\/(\d{2,25})/i
const DIMENSIONS_REGEX = /(\d{3,4})x(\d{3,4})/
const MP4_REGEX = /\.mp4/i

export function extractTweetId(input: string): string | null {
  const trimmed = input.trim()
  // Support direct tweet ID
  if (TWEET_ID_ONLY_REGEX.test(trimmed)) {
    return trimmed
  }
  // Extract from URL (twitter.com, x.com, vxtwitter, fxtwitter, etc.)
  const match = STATUS_URL_REGEX.exec(trimmed)
  return match?.[1] ?? null
}

function dimsFromUrl(url: string): { width: number; height: number } | null {
  const match = DIMENSIONS_REGEX.exec(url || "")
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

export function getResolutionMeta(
  w?: number,
  h?: number
): { resP: string; tag?: string } | null {
  if (!w && !h) return null
  // Chuẩn quốc tế (YouTube, TikTok, Reels, ffmpeg): Độ phân giải tính theo min(w, h)
  const base = w && h ? Math.min(w, h) : h || w || 0
  if (!base) return null

  // Ánh xạ các chuẩn hiển thị phổ biến (8K, 5K, 4K, 2K, FHD, HD, SD)
  if (base >= 4300) return { resP: "4320p", tag: "8K" }
  if (base >= 2800) return { resP: "2880p", tag: "5K" }
  if (base >= 2000) return { resP: "2160p", tag: "4K" }
  if (base >= 1400) return { resP: "1440p", tag: "2K" }
  if (base >= 1000) return { resP: "1080p", tag: "FHD" }
  if (base >= 700) return { resP: "720p", tag: "HD" }
  if (base >= 460) return { resP: "480p", tag: "SD" }
  if (base >= 340) return { resP: "360p", tag: "SD" }
  if (base >= 220) return { resP: "240p", tag: "SD" }

  return { resP: `${base}p` }
}

function fmtLabel(
  f: {
    width?: number
    height?: number
    quality?: string
    bitrate?: number
    size?: number
    container?: string
    url: string
  },
  index: number
): { label: string; resP: string; tag?: string } {
  let w = f.width
  let h = f.height
  if (!w || !h) {
    const d = dimsFromUrl(f.url)
    if (d) {
      w = d.width
      h = d.height
    }
  }

  const meta = getResolutionMeta(w, h)
  const resP =
    meta?.resP || f.quality || (w && h ? `${w}x${h}` : `Ver ${index + 1}`)
  const tag = meta?.tag
  const sz = f.size ? ` • ${(f.size / 1024 / 1024).toFixed(1)}MB` : ""
  const co = !w && f.container ? ` • ${f.container}` : ""
  const label = `${resP}${sz}${co}`

  return { label, resP, tag }
}

function sortFormats(formats: unknown[]): VideoFormat[] {
  const allFormats = (formats || []).filter((f): f is VideoFormat =>
    Boolean(
      f && typeof f === "object" && "url" in f && (f as { url: unknown }).url
    )
  )
  // Ưu tiên các định dạng MP4 trực tiếp, loại bỏ HLS playlist (.m3u8) vì trình duyệt desktop không phát được HLS trực tiếp
  const mp4List = allFormats.filter(
    (f) => !f.url.includes(".m3u8") && f.container !== "m3u8"
  )
  const targetList = mp4List.length > 0 ? mp4List : allFormats

  // Chuẩn hóa kích thước width/height từ URL nếu API chưa có sẵn
  const normalizedList = targetList.map((f) => {
    let w = f.width
    let h = f.height
    if (!w || !h) {
      const d = dimsFromUrl(f.url)
      if (d) {
        w = d.width
        h = d.height
      }
    }
    return { ...f, width: w, height: h }
  })

  normalizedList.sort((a, b) => {
    const scoreB = (b.width || 0) * (b.height || 0) || b.bitrate || 0
    const scoreA = (a.width || 0) * (a.height || 0) || a.bitrate || 0
    return scoreB - scoreA
  })

  return normalizedList.map((f, i) => {
    const formatted = fmtLabel(f, i)
    return {
      ...f,
      label: formatted.label,
      resP: formatted.resP,
      tag: formatted.tag,
    }
  })
}

const API_ENDPOINTS = [
  "https://api.fxtwitter.com/2/status/",
  "https://api.fxtwitter.com/i/status/",
] as const

interface RawPhoto {
  url?: string
  type?: string
}

interface RawVideo {
  formats?: unknown[]
  url?: string
  transcode_url?: string
  thumbnail_url?: string
}

interface RawLegacyExtended {
  type?: string
  url?: string
  thumbnail_url?: string
}

interface RawStatusPayload {
  status?: {
    author?: {
      name?: string
      screen_name?: string
      avatar_url?: string
    }
    text?: string
    created_at?: string
    url?: string
    media?: {
      photos?: RawPhoto[]
      videos?: RawVideo[]
      external?: {
        url?: string
        thumbnail_url?: string
      }
    }
  }
  tweetID?: string
  author?: {
    avatar_url?: string
  }
  user_name?: string
  user_screen_name?: string
  user_profile_image_url?: string
  media_extended?: RawLegacyExtended[]
  mediaURLs?: string[]
  text?: string
  date?: string
  tweetURL?: string
}

/**
 * Fetch tweet data concurrently across mirror endpoints using Promise.any.
 * Whichever endpoint responds first wins; slower requests are immediately aborted (async-parallel).
 */
export async function fetchTweet(id: string): Promise<TweetData> {
  const controller = new AbortController()
  const signal = controller.signal

  const fetchEndpoint = async (base: string): Promise<TweetData> => {
    const endpoint = `${base}${id}`
    const res = await fetch(endpoint, { signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} @ ${endpoint}`)
    }
    const json = (await res.json()) as RawStatusPayload
    if (
      !json ||
      (!json.status && !json.tweetID && !json.mediaURLs && !json.media_extended)
    ) {
      throw new Error(`Invalid payload from ${endpoint}`)
    }
    return normalizeTweet(id, json, endpoint)
  }

  try {
    const result = await Promise.any(
      API_ENDPOINTS.map((base) => fetchEndpoint(base))
    )
    // Abort other slower requests immediately
    controller.abort()
    return result
  } catch {
    throw new Error(
      "Cannot fetch post data (post is private, deleted, or API rate limited)."
    )
  }
}

function normalizeTweet(
  id: string,
  json: RawStatusPayload,
  endpoint: string
): TweetData {
  if (json.status) {
    const s = json.status
    const author = s.author?.name || ""
    const authorHandle = s.author?.screen_name ? `@${s.author.screen_name}` : ""
    const avatar = s.author?.avatar_url || json.author?.avatar_url || undefined
    const items: MediaItem[] = []
    const media = s.media || {}

    // Photos
    const rawPhotos = media.photos || []
    for (let i = 0; i < rawPhotos.length; i++) {
      const p = rawPhotos[i]
      if (!p?.url) continue
      const isGif = p.type === "gif"
      const origUrl =
        !isGif && p.url.includes("pbs.twimg.com") && !p.url.includes("?")
          ? `${p.url}?format=jpg&name=orig`
          : p.url
      items.push({
        id: `photo_${i}`,
        type: isGif ? "video" : "image",
        url: origUrl,
        thumb: p.url,
      })
    }

    // Videos
    const rawVideos = media.videos || []
    for (let i = 0; i < rawVideos.length; i++) {
      const v = rawVideos[i]
      if (!v) continue
      const formats = sortFormats(v.formats || [])
      const bestUrl =
        formats.length > 0 && formats[0]
          ? formats[0].url
          : v.url || v.transcode_url
      if (bestUrl) {
        items.push({
          id: `video_${i}`,
          type: "video",
          url: bestUrl,
          thumb: v.thumbnail_url || "",
          formats,
        })
      }
    }

    // External media
    if (items.length === 0 && media.external?.url) {
      items.push({
        id: "external_0",
        type: "external",
        url: media.external.url,
        thumb: media.external.thumbnail_url || "",
      })
    }

    return {
      id,
      author,
      authorHandle,
      avatar,
      text: s.text || "",
      created: s.created_at || "",
      rawUrl: s.url || `https://x.com/i/status/${id}`,
      items,
      endpoint,
    }
  }

  // v1 legacy fallback
  const author = json.user_name || ""
  const authorHandle = json.user_screen_name ? `@${json.user_screen_name}` : ""
  const avatar = json.user_profile_image_url || undefined
  const items: MediaItem[] = []

  const legacyExtended = json.media_extended || []
  for (let i = 0; i < legacyExtended.length; i++) {
    const m = legacyExtended[i]
    if (!m?.url) continue
    const isVid = m.type === "video"
    const url =
      !isVid && m.url.includes("pbs.twimg.com") && !m.url.includes("?")
        ? `${m.url}?format=jpg&name=orig`
        : m.url
    items.push({
      id: `legacy_${i}`,
      type: isVid ? "video" : "image",
      url,
      thumb: m.thumbnail_url || url,
    })
  }

  if (items.length === 0 && Array.isArray(json.mediaURLs)) {
    for (let i = 0; i < json.mediaURLs.length; i++) {
      const u = json.mediaURLs[i]
      if (!u) continue
      const isVid = MP4_REGEX.test(u)
      items.push({
        id: `legacy_url_${i}`,
        type: isVid ? "video" : "image",
        url: u,
        thumb: u,
      })
    }
  }

  return {
    id,
    author,
    authorHandle,
    avatar,
    text: json.text || "",
    created: json.date || "",
    rawUrl: json.tweetURL || `https://x.com/i/status/${id}`,
    items,
    endpoint,
  }
}

/**
 * Downloads a file from remote URL with real-time stream progress tracking.
 */
export async function downloadFile(
  url: string,
  filename: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error("Direct download failed")

    let blob: Blob
    const contentLength = res.headers.get("content-length")
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0

    if (totalBytes > 0 && res.body && onProgress) {
      const reader = res.body.getReader()
      const chunks: Uint8Array[] = []
      let receivedBytes = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          receivedBytes += value.length
          onProgress(
            Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
          )
        }
      }
      blob = new Blob(chunks as BlobPart[])
      onProgress(100)
    } else {
      blob = await res.blob()
    }

    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
  } catch {
    // Fallback in case of CORS restriction
    window.open(url, "_blank", "noopener")
  }
}
