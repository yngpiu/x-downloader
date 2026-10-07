import { useRef, useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { X, ClipboardPaste } from "lucide-react"
import { SearchHistoryDropdown } from "./SearchHistoryDropdown"
import { extractTweetId } from "@/lib/twitter"
import type { SearchHistoryItem } from "@/utils/history"

export interface TweetInputBarProps {
  isLoading: boolean
  history: SearchHistoryItem[]
  onAnalyze: (url: string) => void
  onRemoveHistoryItem: (id: string) => void
  onClearAllHistory: () => void
}

export const TweetInputBar = memo(function TweetInputBar({
  isLoading,
  history,
  onAnalyze,
  onRemoveHistoryItem,
  onClearAllHistory,
}: TweetInputBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState("")
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleClear = useCallback(() => {
    setUrlInput("")
    inputRef.current?.focus()
    if (history.length > 0) {
      setIsHistoryOpen(true)
    }
  }, [history.length])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const trimmed = text?.trim()
      if (trimmed) {
        setUrlInput(trimmed)
        setIsHistoryOpen(false)
        onAnalyze(trimmed)
      } else {
        inputRef.current?.focus()
      }
    } catch {
      inputRef.current?.focus()
    }
  }, [onAnalyze])

  const handleNativePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text")?.trim()
      if (pastedText && extractTweetId(pastedText)) {
        e.preventDefault()
        setUrlInput(pastedText)
        setIsHistoryOpen(false)
        onAnalyze(pastedText)
      }
    },
    [onAnalyze]
  )

  const handleSubmit = useCallback(() => {
    setIsHistoryOpen(false)
    onAnalyze(urlInput)
  }, [onAnalyze, urlInput])

  const handleSelectHistory = useCallback(
    (url: string) => {
      setUrlInput(url)
      setIsHistoryOpen(false)
      onAnalyze(url)
    },
    [onAnalyze]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        if (isHistoryOpen) {
          setIsHistoryOpen(false)
        } else if (urlInput) {
          handleClear()
        }
      }
    },
    [handleSubmit, handleClear, isHistoryOpen, urlInput]
  )

  const ignoreFocusRef = useRef(false)

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        if (!urlInput.trim() && history.length > 0) {
          setIsHistoryOpen(true)
        }
      } else {
        setIsHistoryOpen(false)
        // BaseUI / Radix có cơ chế trả focus về cho trigger khi popover đóng,
        // khiến onFocus bị gọi lại ngay lập tức và làm popover mở ra.
        // Ta dùng cờ này để bỏ qua sự kiện onFocus trong 150ms sau khi đóng.
        ignoreFocusRef.current = true
        setTimeout(() => {
          ignoreFocusRef.current = false
        }, 150)
      }
    },
    [urlInput, history.length]
  )

  const isInputEmpty = !urlInput.trim()
  const shouldShowHistory = isHistoryOpen && isInputEmpty && history.length > 0

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <div className="relative flex-1">
        <Popover open={shouldShowHistory} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={<div className="w-full" />}
            nativeButton={false}
          >
            <InputGroup className="h-11 w-full text-base">
              <InputGroupInput
                ref={inputRef}
                type="text"
                name="x-downloader-url"
                placeholder="https://x.com/.../status/..."
                value={urlInput}
                onChange={(e) => {
                  const val = e.target.value
                  setUrlInput(val)
                  if (val.trim()) {
                    setIsHistoryOpen(false)
                  } else if (history.length > 0) {
                    setIsHistoryOpen(true)
                  }
                }}
                onPaste={handleNativePaste}
                onPointerDown={(e) => {
                  // Ngăn chặn PopoverTrigger bắt event này và toggle popover
                  e.stopPropagation()
                }}
                onFocus={() => {
                  if (ignoreFocusRef.current) return
                  if (!urlInput.trim() && history.length > 0) {
                    setIsHistoryOpen(true)
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!urlInput.trim() && history.length > 0) {
                    setIsHistoryOpen(true)
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="text-base placeholder:text-sm"
              />
              <InputGroupAddon align="inline-end">
                {urlInput ? (
                  <InputGroupButton
                    size="sm"
                    variant="ghost"
                    onClick={handleClear}
                    disabled={isLoading}
                    title="Clear link"
                    aria-label="Clear content"
                  >
                    <X />Clear</InputGroupButton>
                ) : (
                  <InputGroupButton
                    size="sm"
                    variant="ghost"
                    onClick={handlePaste}
                    disabled={isLoading}
                    title="Paste from clipboard"
                    aria-label="Paste link"
                  >
                    <ClipboardPaste />Paste</InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
          </PopoverTrigger>

          <SearchHistoryDropdown
            history={history}
            onSelect={handleSelectHistory}
            onRemoveItem={onRemoveHistoryItem}
            onClearAll={onClearAllHistory}
          />
        </Popover>
      </div>

      <Button
        size="lg"
        className="h-11 px-6 text-base font-medium"
        onClick={handleSubmit}
        disabled={isLoading || isInputEmpty}
      >
        {isLoading ? (
          <>
            <Spinner className="animate-spin" data-icon="inline-start" />
            Analyzing...
          </>
        ) : (
          "Analyze"
        )}
      </Button>
    </div>
  )
})
