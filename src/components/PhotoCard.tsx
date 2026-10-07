import { memo, useCallback } from "react"
import { Card, CardFooter } from "@/components/ui/card"
import { MediaActions } from "./MediaActions"
import type { MediaItem } from "@/lib/twitter"

export interface PhotoCardProps {
  item: MediaItem
  index: number
  isDownloading: boolean
  downloadProgress?: number | null
  onDownload: (item: MediaItem, index: number) => void
}

export const PhotoCard = memo(function PhotoCard({
  item,
  index,
  isDownloading,
  downloadProgress,
  onDownload,
}: PhotoCardProps) {
  const handleDownload = useCallback(() => {
    onDownload(item, index)
  }, [item, index, onDownload])

  return (
    <Card size="sm" className="justify-between gap-0 pt-0">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted/20">
        <img
          src={item.url}
          alt={`Image ${index + 1}`}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      </div>

      <CardFooter className="justify-end gap-1.5 border-t">
        <MediaActions
          url={item.url}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onDownload={handleDownload}
        />
      </CardFooter>
    </Card>
  )
})
