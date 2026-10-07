import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { MediaItem } from "@/lib/twitter"

export interface ExternalLinksSectionProps {
  externals: MediaItem[]
}

export const ExternalLinksSection = memo(function ExternalLinksSection({
  externals,
}: ExternalLinksSectionProps) {
  if (externals.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        External Links
      </h3>
      {externals.map((item) => (
        <Card key={item.id} size="sm">
          <CardContent className="flex flex-row items-center justify-between gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-primary hover:underline"
            >
              {item.url}
            </a>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  aria-label="Open external link in new tab"
                />
              }
            >
              <ExternalLink data-icon="inline-start" />Open</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})
