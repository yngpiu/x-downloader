import { downloadFile, type MediaItem, type TweetData } from "@/lib/twitter"

export function getVideoDownloadFilename(
  tweetId: string,
  index: number,
  resP?: string,
  height?: number
): string {
  const qualitySuffix = resP ? `_${resP}` : height ? `_${height}p` : ""
  return `x_${tweetId}_video_${index + 1}${qualitySuffix}.mp4`
}

export function getImageDownloadFilename(
  tweetId: string,
  index: number,
  url: string
): string {
  const ext = url.split("?")[0]?.split(".").pop() || "jpg"
  return `x_${tweetId}_image_${index + 1}.${ext.slice(0, 4)}`
}

export async function downloadMediaItem(
  tweet: TweetData,
  item: MediaItem,
  index: number,
  formatIndex = 0,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (item.type === "video") {
    const format = item.formats?.[formatIndex]
    const targetUrl = format?.url || item.url
    const filename = getVideoDownloadFilename(
      tweet.id,
      index,
      format?.resP,
      format?.height
    )
    await downloadFile(targetUrl, filename, onProgress)
  } else {
    const filename = getImageDownloadFilename(tweet.id, index, item.url)
    await downloadFile(item.url, filename, onProgress)
  }
}

/**
 * Downloads multiple media items simultaneously over network via Promise.all (async-parallel)
 * with individual item progress & aggregate percentage tracking, then staggers browser file saving triggers.
 */
export async function downloadAllMediaItems(
  tweet: TweetData,
  items: MediaItem[],
  onProgress?: (
    overallPercent: number,
    itemPercents: Record<string, number>
  ) => void
): Promise<void> {
  const totalCount = items.length
  if (totalCount === 0) return

  const itemPercents: Record<string, number> = {}
  for (const item of items) {
    itemPercents[item.id] = 0
  }

  const notifyProgress = () => {
    if (!onProgress) return
    let sum = 0
    for (const item of items) {
      sum += itemPercents[item.id] ?? 0
    }
    const overall = Math.min(99, Math.round(sum / totalCount))
    onProgress(overall, { ...itemPercents })
  }

  // Initial trigger
  notifyProgress()

  // Step 1: Fetch all file blobs in parallel across the network with stream progress tracking
  const downloadPromises = items.map(async (item, index) => {
    const isVideo = item.type === "video"
    const targetUrl = isVideo ? item.formats?.[0]?.url || item.url : item.url
    const filename = isVideo
      ? getVideoDownloadFilename(
          tweet.id,
          index,
          item.formats?.[0]?.resP,
          item.formats?.[0]?.height
        )
      : getImageDownloadFilename(tweet.id, index, item.url)

    try {
      const res = await fetch(targetUrl)
      if (!res.ok) throw new Error("Fetch failed")

      let blob: Blob
      const contentLength = res.headers.get("content-length")
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0

      if (totalBytes > 0 && res.body) {
        const reader = res.body.getReader()
        const chunks: Uint8Array[] = []
        let receivedBytes = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            chunks.push(value)
            receivedBytes += value.length
            itemPercents[item.id] = Math.min(
              99,
              Math.round((receivedBytes / totalBytes) * 100)
            )
            notifyProgress()
          }
        }
        blob = new Blob(chunks as BlobPart[])
        itemPercents[item.id] = 100
        notifyProgress()
      } else {
        blob = await res.blob()
        itemPercents[item.id] = 100
        notifyProgress()
      }

      return { blob, filename, targetUrl }
    } catch {
      itemPercents[item.id] = 100
      notifyProgress()
      return { blob: null, filename, targetUrl }
    }
  })

  const results = await Promise.all(downloadPromises)
  for (const item of items) {
    itemPercents[item.id] = 100
  }
  onProgress?.(100, { ...itemPercents })

  // Step 2: Trigger downloads smoothly with a short 100ms interval to prevent browser popup blocker
  for (const { blob, filename, targetUrl } of results) {
    if (blob) {
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
    } else {
      window.open(targetUrl, "_blank", "noopener")
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
