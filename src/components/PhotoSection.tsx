import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Download, ImageIcon } from "lucide-react"
import { PhotoCard } from "./PhotoCard"
import type { MediaItem } from "@/lib/twitter"

export interface PhotoSectionProps {
  photos: MediaItem[]
  downloadingIds: Record<string, boolean>
  itemProgressMap: Record<string, number>
  batchProgress?: number | null
  isDownloadingAll: boolean
  onDownloadItem: (item: MediaItem, index: number) => void
  onDownloadAll: () => void
}

export const PhotoSection = memo(function PhotoSection({
  photos,
  downloadingIds,
  itemProgressMap,
  batchProgress,
  isDownloadingAll,
  onDownloadItem,
  onDownloadAll,
}: PhotoSectionProps) {
  if (photos.length === 0) return null

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
    "Download all images"
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Images ({photos.length})</h3>
        </div>
        {photos.length > 1 ? (
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
          photos.length === 1
            ? "w-full"
            : "grid grid-cols-1 gap-4 md:grid-cols-2"
        }
      >
        {photos.map((item, index) => {
          const isDownloadingThis = Boolean(downloadingIds[item.id])
          const currentProgress = isDownloadingThis
            ? (itemProgressMap[item.id] ?? 0)
            : null

          return (
            <PhotoCard
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
