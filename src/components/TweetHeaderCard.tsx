import React from "react"
import { memo, useState, useCallback, useTransition, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Settings, Loader2 } from "lucide-react"
import { formatPostDate } from "@/utils/format"
import type { TweetData } from "@/lib/twitter"
import {
  translateTweetText,
  type TranslationSettings,
} from "@/utils/translation"
import { toast } from "@/components/ui/toast"

const TranslationSettingsDialog = React.lazy(() =>
  import("./TranslationSettingsDialog").then((mod) => ({
    default: mod.TranslationSettingsDialog,
  }))
)

export interface TweetHeaderCardProps {
  tweet: TweetData
  translationSettings: TranslationSettings
  onUpdateTranslationSettings: (settings: TranslationSettings) => void
}

// Hoisted URL splitting regex
const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g

/**
 * Format URLs to clean display format like Twitter/X:
 * - Drops https:// and www.
 * - Truncates excessively long query/path with "..."
 * Example: https://www.xiaohongshu.com/discovery/item/... -> xiaohongshu.com/discovery/item...
 */
function formatDisplayUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    const host = parsed.hostname.replace(/^www\./, "")
    const pathname = parsed.pathname

    if (pathname === "/" || !pathname) {
      return host
    }

    const fullPath = pathname + (parsed.search || "")
    if (fullPath.length <= 25) {
      return `${host}${fullPath}`
    }

    const segments = pathname.split("/").filter(Boolean)
    if (segments.length >= 2) {
      return `${host}/${segments[0]}/${segments[1]}...`
    } else if (segments.length === 1) {
      const seg = segments[0]!.slice(0, 15)
      return `${host}/${seg}...`
    }

    return `${host}${pathname.slice(0, 18)}...`
  } catch {
    const clean = rawUrl.replace(/^https?:\/\/(www\.)?/, "")
    if (clean.length > 32) {
      return `${clean.slice(0, 30)}...`
    }
    return clean
  }
}

/**
 * Parses tweet text to detect URLs, turns them into clickable links,
 * and shortens their visual display text.
 */
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null
  const parts = text.split(URL_SPLIT_REGEX)

  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      let url = part
      let trailingPunct = ""
      const matchPunct = /[.,!?;:)\]]+$/.exec(url)
      if (matchPunct) {
        trailingPunct = matchPunct[0]
        url = url.slice(0, -trailingPunct.length)
      }

      const display = formatDisplayUrl(url)

      return (
        <React.Fragment key={index}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            className="inline font-normal text-primary hover:underline"
          >
            {display}
          </a>
          {trailingPunct}
        </React.Fragment>
      )
    }
    return part
  })
}

export const TweetHeaderCard = memo(function TweetHeaderCard({
  tweet,
  translationSettings,
  onUpdateTranslationSettings,
}: TweetHeaderCardProps) {
  const initial = (tweet.author || "X")[0]?.toUpperCase() ?? "X"

  const [isShowingTranslation, setIsShowingTranslation] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [, startTransition] = useTransition()

  const {
    data: translationResult,
    isFetching: isTranslating,
    refetch: executeTranslation,
  } = useQuery({
    queryKey: ["translation", tweet.id, translationSettings.engine],
    queryFn: async () => {
      return await translateTweetText(tweet.text, translationSettings)
    },
    enabled: false, // Lazy execution
    staleTime: Infinity, // Keep translation in cache indefinitely
  })

  const handleToggleTranslation = useCallback(async () => {
    if (isShowingTranslation) {
      // Toggle back to original text
      setIsShowingTranslation(false)
      return
    }

    if (translationResult) {
      // Already translated previously, show directly
      setIsShowingTranslation(true)
      return
    }

    if (!tweet.text) return

    try {
      const res = await executeTranslation()
      if (res.isError && res.error) {
        throw res.error
      }
      if (res.data) {
        startTransition(() => {
          setIsShowingTranslation(true)
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed"
      toast.add({
        title: "Translation failed",
        description: msg,
      })
      if (
        translationSettings.engine === "gemini" &&
        !translationSettings.geminiApiKey
      ) {
        setIsSettingsOpen(true)
      }
    }
  }, [
    isShowingTranslation,
    translationResult,
    tweet.text,
    executeTranslation,
    startTransition,
    translationSettings.engine,
    translationSettings.geminiApiKey,
  ])

  const activeText =
    isShowingTranslation && translationResult?.translatedText
      ? translationResult.translatedText
      : tweet.text

  return (
    <>
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {tweet.avatar ? (
              <img
                src={tweet.avatar}
                alt={tweet.author}
                className="size-10 shrink-0 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {initial}
              </div>
            )}
            <div className="flex min-w-0 flex-col">
              <CardTitle className="truncate text-base!">
                {tweet.author || `Tweet #${tweet.id}`}
              </CardTitle>
              {tweet.authorHandle ? (
                <span className="truncate text-sm text-muted-foreground">
                  {tweet.authorHandle}
                </span>
              ) : null}
            </div>
          </div>

          <CardAction>
            <div className="flex items-center gap-1">
              <Button
                variant="link"
                nativeButton={false}
                render={
                  <a
                    href={tweet.rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    aria-label="Open original post in new tab"
                  />
                }
              >
                <ExternalLink data-icon="inline-start" />Open post</Button>
            </div>
          </CardAction>
        </CardHeader>

        {tweet.text ? (
          <CardContent className="space-y-1.5">
            {/* Translation Action Header */}
            <div className="flex items-center gap-1.5 text-xs select-none">
              {isShowingTranslation ? (
                <span className="text-muted-foreground">
                  {translationResult?.sourceLangName
                    ? `Translated from ${translationResult.sourceLangName}`
                    : "Translated"}
                </span>
              ) : null}

              <button
                type="button"
                onClick={handleToggleTranslation}
                disabled={isTranslating}
                className="inline-flex cursor-pointer items-center gap-1 font-normal text-primary hover:underline disabled:opacity-50"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />Translating...</>
                ) : isShowingTranslation ? (
                  "Show original"
                ) : (
                  "Show translation"
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Translation settings"
                aria-label="Translation Settings"
                className="ml-0.5 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="size-3.5" />
              </button>
            </div>

            <p className="leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-line">
              {renderFormattedText(activeText)}
            </p>

            {tweet.created ? (
              <time className="block pt-0.5 text-xs text-muted-foreground">
                {formatPostDate(tweet.created)}
              </time>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <Suspense fallback={null}>
        <TranslationSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          settings={translationSettings}
          onSave={onUpdateTranslationSettings}
        />
      </Suspense>
    </>
  )
})
