import { memo } from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Spinner } from "@/components/ui/spinner"
import { Download, ExternalLink, Copy, Check } from "lucide-react"
import { useCopyLink } from "@/hooks/useCopyLink"

export interface MediaActionsProps {
  url: string
  isDownloading: boolean
  downloadProgress?: number | null
  onDownload: () => void
  downloadLabel?: string
  downloadingLabel?: string
}

export const MediaActions = memo(function MediaActions({
  url,
  isDownloading,
  downloadProgress,
  onDownload,
  downloadLabel = "Download",
  downloadingLabel = "Downloading...",
}: MediaActionsProps) {
  const { isCopied, copyLink } = useCopyLink()

  const progressContent =
    isDownloading &&
    downloadProgress !== null &&
    downloadProgress !== undefined &&
    downloadProgress >= 0 ? (
      <span>
        Downloading <span className="tabular-nums">{downloadProgress}</span>%
      </span>
    ) : (
      downloadingLabel
    )

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onDownload} disabled={isDownloading}>
        {isDownloading ? (
          <Spinner className="animate-spin" data-icon="inline-start" />
        ) : (
          <Download data-icon="inline-start" />
        )}
        {isDownloading ? progressContent : downloadLabel}
      </Button>

      <ButtonGroup>
        <Button
          variant="outline"
          onClick={() => copyLink(url)}
          title="Copy link"
          aria-label="Copy link"
        >
          {isCopied ? <Check className="text-emerald-500" /> : <Copy />}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              aria-label="Open link in new tab"
            />
          }
        >
          <ExternalLink />
        </Button>
      </ButtonGroup>
    </div>
  )
})
