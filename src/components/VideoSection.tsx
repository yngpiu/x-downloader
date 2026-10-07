import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Download, Film } from "lucide-react"
import { VideoCard } from "./VideoCard"
import type { MediaItem } from "@/lib/twitter"

export interface VideoSectionProps {
  videos: MediaItem[]
  downloadingIds: Record<string, boolean>
  itemProgressMap: Record<string, number>
  batchProgress?: number | null
  isDownloadingAll: boolean
  onDownloadItem: (item: MediaItem, index: number, formatIndex: number) => void
  onDownloadAll: () => void
}

export const VideoSection = memo(function VideoSection({
  videos,
  downloadingIds,
  itemProgressMap,
  batchProgress,
  isDownloadingAll,
  onDownloadItem,
  onDownloadAll,
}: VideoSectionProps) {
  if (videos.length === 0) return null

  const downloadAllContent = isDownloadingAll ? (
    batchProgress !== null &&
    batchProgress !== undefined &&
    batchProgress >= 0 ? (
      <span>
        Downloading <span className="tabular-nums">{batchProgress}</span>%
      </span>
    ) : (
      "Downloading..."
    )
  ) : (
    "Download all videos"
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Film className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Video ({videos.length})</h3>
        </div>
        {videos.length > 1 ? (
          <Button onClick={onDownloadAll} disabled={isDownloadingAll}>
            {isDownloadingAll ? (
              <Spinner className="animate-spin" data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            {downloadAllContent}
          </Button>
        ) : null}
      </div>

      <div
        className={
          videos.length === 1
            ? "w-full"
            : "grid grid-cols-1 gap-4 md:grid-cols-2"
        }
      >
        {videos.map((item, index) => {
          const isDownloadingThis = Boolean(downloadingIds[item.id])
          const currentProgress = isDownloadingThis
            ? (itemProgressMap[item.id] ?? 0)
            : null

          return (
            <VideoCard
              key={item.id}
              item={item}
              index={index}
              isDownloading={isDownloadingThis}
              downloadProgress={currentProgress}
              onDownload={onDownloadItem}
            />
          )
        })}
      </div>
    </div>
  )
})
