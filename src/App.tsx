import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Toaster, toast } from "@/components/ui/toast"
import { TweetInputBar } from "./components/TweetInputBar"
import { TweetHeaderCard } from "./components/TweetHeaderCard"
import { VideoSection } from "./components/VideoSection"
import { PhotoSection } from "./components/PhotoSection"
import { ExternalLinksSection } from "./components/ExternalLinksSection"
import { ThemeProvider } from "./components/theme-provider"
import { SiteHeader } from "./components/SiteHeader"
import { extractTweetId, fetchTweet, type MediaItem } from "./lib/twitter"
import { downloadMediaItem, downloadAllMediaItems } from "./utils/media"
import {
  getStoredHistory,
  addTweetToHistory,
  removeTweetFromHistory,
  clearAllStoredHistory,
  type SearchHistoryItem,
} from "./utils/history"
import {
  getStoredTranslationSettings,
  saveStoredTranslationSettings,
  type TranslationSettings,
} from "./utils/translation"

export function App() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() =>
    getStoredHistory()
  )
  const [activeInput, setActiveInput] = useState<{
    url: string
    id: string
  } | null>(null)

  const {
    data: tweet,
    isFetching: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tweet", activeInput?.id],
    queryFn: async () => {
      if (!activeInput) return null
      return await fetchTweet(activeInput.id)
    },
    enabled: !!activeInput?.id,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (tweet && activeInput) {
      const updatedHistory = addTweetToHistory(tweet, activeInput.url)
      setHistory(updatedHistory)

      if (tweet.items.length === 0) {
        toast.add({
          title: "Post does not contain images or videos",
          type: "warning",
        })
      }
    }
  }, [tweet, activeInput])

  useEffect(() => {
    if (error) {
      const message =
        error instanceof Error ? error.message : "Error fetching post data"
      toast.add({ title: message, type: "error" })
    }
  }, [error])

  const [translationSettings, setTranslationSettings] =
    useState<TranslationSettings>(() => getStoredTranslationSettings())

  const handleUpdateTranslationSettings = useCallback(
    (newSettings: TranslationSettings) => {
      setTranslationSettings(newSettings)
      saveStoredTranslationSettings(newSettings)
    },
    []
  )
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>(
    {}
  )
  const [itemProgressMap, setItemProgressMap] = useState<
    Record<string, number>
  >({})
  const [isDownloadingVideos, setIsDownloadingVideos] = useState(false)
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false)
  const [batchVideoProgress, setBatchVideoProgress] = useState<number | null>(
    null
  )
  const [batchPhotoProgress, setBatchPhotoProgress] = useState<number | null>(
    null
  )

  // Combine multiple filter iterations into a single pass using useMemo (js-combine-iterations)
  const { videos, photos, externals } = useMemo(() => {
    if (!tweet) return { videos: [], photos: [], externals: [] }
    const v: MediaItem[] = []
    const p: MediaItem[] = []
    const e: MediaItem[] = []
    for (const item of tweet.items) {
      if (item.type === "video") v.push(item)
      else if (item.type === "image") p.push(item)
      else if (item.type === "external") e.push(item)
    }
    return { videos: v, photos: p, externals: e }
  }, [tweet])

  const handleAnalyze = useCallback(
    (rawUrl: string) => {
      const trimmed = rawUrl.trim()
      if (!trimmed) {
        toast.add({
          title: "Please enter X post link",
          type: "error",
        })
        return
      }

      const tweetId = extractTweetId(trimmed)
      if (!tweetId) {
        toast.add({
          title: "No valid post ID found in link",
          type: "error",
        })
        return
      }

      if (activeInput?.id === tweetId) {
        // Không gọi refetch() nữa để tận dụng tối đa cache (không gọi mạng nếu bấm lại bài đang xem)
        return
      } else {
        setActiveInput({ url: trimmed, id: tweetId })
      }
    },
    [activeInput, refetch]
  )

  const handleRemoveHistoryItem = useCallback((id: string) => {
    const updated = removeTweetFromHistory(id)
    setHistory(updated)
  }, [])

  const handleClearAllHistory = useCallback(() => {
    clearAllStoredHistory()
    setHistory([])
  }, [])

  const handleDownloadItem = useCallback(
    async (item: MediaItem, index: number, formatIndex = 0) => {
      if (!tweet) return
      setDownloadingIds((prev) => ({ ...prev, [item.id]: true }))
      setItemProgressMap((prev) => ({ ...prev, [item.id]: 0 }))

      try {
        await downloadMediaItem(tweet, item, index, formatIndex, (percent) => {
          setItemProgressMap((prev) => ({ ...prev, [item.id]: percent }))
        })
      } catch {
        // Fallback handled in downloadFile
      } finally {
        setDownloadingIds((prev) => {
          const next = { ...prev }
          delete next[item.id]
          return next
        })
        setItemProgressMap((prev) => {
          const next = { ...prev }
          delete next[item.id]
          return next
        })
      }
    },
    [tweet]
  )

  const handleDownloadAllVideos = useCallback(async () => {
    if (!tweet || videos.length === 0) return
    setIsDownloadingVideos(true)
    setBatchVideoProgress(0)

    const initialIds: Record<string, boolean> = {}
    const initialPercents: Record<string, number> = {}
    for (const v of videos) {
      initialIds[v.id] = true
      initialPercents[v.id] = 0
    }
    setDownloadingIds((prev) => ({ ...prev, ...initialIds }))
    setItemProgressMap((prev) => ({ ...prev, ...initialPercents }))

    try {
      await downloadAllMediaItems(
        tweet,
        videos,
        (overallPercent, itemPercents) => {
          setBatchVideoProgress(overallPercent)
          setItemProgressMap((prev) => ({ ...prev, ...itemPercents }))
        }
      )
    } finally {
      setIsDownloadingVideos(false)
      setBatchVideoProgress(null)
      setDownloadingIds((prev) => {
        const next = { ...prev }
        for (const v of videos) delete next[v.id]
        return next
      })
      setItemProgressMap((prev) => {
        const next = { ...prev }
        for (const v of videos) delete next[v.id]
        return next
      })
    }
  }, [tweet, videos])

  const handleDownloadAllPhotos = useCallback(async () => {
    if (!tweet || photos.length === 0) return
    setIsDownloadingPhotos(true)
    setBatchPhotoProgress(0)

    const initialIds: Record<string, boolean> = {}
    const initialPercents: Record<string, number> = {}
    for (const p of photos) {
      initialIds[p.id] = true
      initialPercents[p.id] = 0
    }
    setDownloadingIds((prev) => ({ ...prev, ...initialIds }))
    setItemProgressMap((prev) => ({ ...prev, ...initialPercents }))

    try {
      await downloadAllMediaItems(
        tweet,
        photos,
        (overallPercent, itemPercents) => {
          setBatchPhotoProgress(overallPercent)
          setItemProgressMap((prev) => ({ ...prev, ...itemPercents }))
        }
      )
    } finally {
      setIsDownloadingPhotos(false)
      setBatchPhotoProgress(null)
      setDownloadingIds((prev) => {
        const next = { ...prev }
        for (const p of photos) delete next[p.id]
        return next
      })
      setItemProgressMap((prev) => {
        const next = { ...prev }
        for (const p of photos) delete next[p.id]
        return next
      })
    }
  }, [tweet, photos])

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
          <Toaster />

          <TweetInputBar
            isLoading={isLoading}
            history={history}
            onAnalyze={handleAnalyze}
            onRemoveHistoryItem={handleRemoveHistoryItem}
            onClearAllHistory={handleClearAllHistory}
          />

          {tweet ? (
            <div className="flex flex-col gap-6 pt-1">
              <TweetHeaderCard
                tweet={tweet}
                translationSettings={translationSettings}
                onUpdateTranslationSettings={handleUpdateTranslationSettings}
              />

              <VideoSection
                videos={videos}
                downloadingIds={downloadingIds}
                itemProgressMap={itemProgressMap}
                batchProgress={batchVideoProgress}
                isDownloadingAll={isDownloadingVideos}
                onDownloadItem={handleDownloadItem}
                onDownloadAll={handleDownloadAllVideos}
              />

              <PhotoSection
                photos={photos}
                downloadingIds={downloadingIds}
                itemProgressMap={itemProgressMap}
                batchProgress={batchPhotoProgress}
                isDownloadingAll={isDownloadingPhotos}
                onDownloadItem={handleDownloadItem}
                onDownloadAll={handleDownloadAllPhotos}
              />

              <ExternalLinksSection externals={externals} />
            </div>
          ) : null}
        </main>
      </div>
    </ThemeProvider>
  )
}
