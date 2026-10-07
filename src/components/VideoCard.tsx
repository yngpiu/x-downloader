import { useState, memo, useCallback } from "react"
import { Card, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MediaActions } from "./MediaActions"
import type { MediaItem, VideoFormat } from "@/lib/twitter"

export interface VideoCardProps {
  item: MediaItem
  index: number
  isDownloading: boolean
  downloadProgress?: number | null
  onDownload: (item: MediaItem, index: number, formatIndex: number) => void
}

function renderFormatLabel(format?: VideoFormat) {
  if (!format) return "Quality"

  const sizeText = format.size
    ? ` • ${(format.size / 1024 / 1024).toFixed(1)}MB`
    : ""

  return (
    <span className="inline-flex items-center">
      <span className="tabular-nums">{format.resP || format.label}</span>
      {format.tag ? (
        <sup className="ml-0.5 text-[10px] font-bold tracking-tight text-primary uppercase">
          {format.tag}
        </sup>
      ) : null}
      {sizeText ? (
        <span className="ml-1 text-xs font-normal text-muted-foreground tabular-nums">
          {sizeText}
        </span>
      ) : null}
    </span>
  )
}

export const VideoCard = memo(function VideoCard({
  item,
  index,
  isDownloading,
  downloadProgress,
  onDownload,
}: VideoCardProps) {
  const [selectedFormatIndex, setSelectedFormatIndex] = useState(0)
  const formats = item.formats ?? []
  const currentVideoUrl = formats[selectedFormatIndex]?.url ?? item.url

  const handleDownload = useCallback(() => {
    onDownload(item, index, selectedFormatIndex)
  }, [item, index, selectedFormatIndex, onDownload])

  return (
    <Card size="sm" className="justify-between gap-0 pt-0">
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black">
        <video
          key={currentVideoUrl}
          src={currentVideoUrl}
          poster={item.thumb}
          controls
          playsInline
          preload="metadata"
          className="mx-auto size-full object-contain"
        >
          <source src={currentVideoUrl} type="video/mp4" />
          Your browser does not support direct video playback.
        </video>
      </div>

      <CardFooter className="flex-wrap justify-between gap-2 border-t">
        <div className="flex flex-wrap items-center gap-2">
          {formats.length > 1 ? (
            <Select
              value={String(selectedFormatIndex)}
              onValueChange={(val) => {
                if (val !== undefined && val !== null) {
                  setSelectedFormatIndex(Number(val))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {renderFormatLabel(formats[selectedFormatIndex])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {formats.map((f, fi) => (
                  <SelectItem key={fi} value={String(fi)}>
                    {renderFormatLabel(f)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <MediaActions
          url={currentVideoUrl}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onDownload={handleDownload}
        />
      </CardFooter>
    </Card>
  )
})
