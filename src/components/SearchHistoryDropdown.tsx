import { memo } from "react"
import { PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { History, X } from "lucide-react"
import type { SearchHistoryItem } from "@/utils/history"

export interface SearchHistoryDropdownProps {
  history: SearchHistoryItem[]
  onSelect: (url: string) => void
  onRemoveItem: (id: string) => void
  onClearAll: () => void
}

export const SearchHistoryDropdown = memo(function SearchHistoryDropdown({
  history,
  onSelect,
  onRemoveItem,
  onClearAll,
}: SearchHistoryDropdownProps) {
  if (history.length === 0) return null

  return (
    <PopoverContent
      align="start"
      side="bottom"
      sideOffset={6}
      initialFocus={false}
      className="z-50 w-(--anchor-width) min-w-[320px] gap-0 overflow-hidden rounded-xl border-border bg-popover p-0 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <History className="size-3.5" />
          <span className="text-xs font-semibold">
            Search history ({history.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onClearAll()
          }}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          Clear all
        </Button>
      </div>

      {/* List */}
      <div className="max-h-80 divide-y divide-border/40 overflow-y-auto overscroll-contain">
        {history.map((item) => (
          <div
            key={item.id}
            role="option"
            aria-selected={false}
            tabIndex={0}
            onClick={() => onSelect(item.url)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelect(item.url)
              }
            }}
            className="group flex cursor-pointer items-center justify-between gap-3 p-2.5 text-left transition-colors outline-none hover:bg-accent/70 focus-visible:bg-accent/70"
          >
            {/* Left Column: Post Thumbnail */}
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/60">
              {item.thumb ? (
                <img
                  src={item.thumb}
                  alt={item.author}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.author}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <div className="text-sm font-bold text-muted-foreground">
                  {(item.author || "X")[0]?.toUpperCase() ?? "X"}
                </div>
              )}
            </div>

            {/* Right Column: Author + Snippet */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="truncate text-sm font-semibold text-foreground">
                  {item.author}
                </span>
                {item.authorHandle ? (
                  <span className="shrink-0 truncate text-xs text-muted-foreground">
                    {item.authorHandle}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs leading-normal text-muted-foreground">
                {item.text || item.url}
              </p>
            </div>

            {/* Remove Item Button */}
            <Button
              variant="ghost"
              size="icon"
              title="Remove from history"
              aria-label="Remove from history"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveItem(item.id)
              }}
              className="size-7 shrink-0 opacity-70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </PopoverContent>
  )
})
