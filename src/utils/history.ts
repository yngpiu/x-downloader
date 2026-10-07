import type { TweetData } from "@/lib/twitter"

export interface SearchHistoryItem {
  id: string
  url: string
  author: string
  authorHandle?: string
  avatar?: string
  thumb?: string
  text: string
  timestamp: number
}

const STORAGE_KEY = "x_downloader_search_history_v1"
const MAX_HISTORY_ITEMS = 20

/**
 * Reads search history safely from localStorage.
 */
export function getStoredHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_HISTORY_ITEMS)
  } catch {
    return []
  }
}

/**
 * Saves search history list to localStorage.
 */
export function saveStoredHistory(items: SearchHistoryItem[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS))
    )
  } catch {
    // Fail silently on quota or privacy mode errors
  }
}

/**
 * Picks the best thumbnail image representing the post:
 * 1. Video thumb if video exists
 * 2. Photo thumb or url if photo exists
 * 3. Author avatar
 */
export function extractPostThumbnail(tweet: TweetData): string | undefined {
  const videoItem = tweet.items.find((i) => i.type === "video")
  if (videoItem?.thumb) return videoItem.thumb

  const photoItem = tweet.items.find((i) => i.type === "image")
  if (photoItem?.thumb || photoItem?.url) {
    return photoItem.thumb || photoItem.url
  }

  return tweet.avatar
}

/**
 * Adds a successfully parsed tweet to history (max 10 items).
 */
export function addTweetToHistory(
  tweet: TweetData,
  rawUrl: string
): SearchHistoryItem[] {
  const current = getStoredHistory()
  const thumb = extractPostThumbnail(tweet)

  const newItem: SearchHistoryItem = {
    id: tweet.id,
    url: rawUrl || tweet.rawUrl,
    author: tweet.author || `Tweet #${tweet.id}`,
    authorHandle: tweet.authorHandle,
    avatar: tweet.avatar,
    thumb,
    text: tweet.text || "",
    timestamp: Date.now(),
  }

  // Remove existing entry with same id and prepend new one
  const filtered = current.filter((item) => item.id !== tweet.id)
  const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
  saveStoredHistory(updated)
  return updated
}

/**
 * Removes a single item from history by ID.
 */
export function removeTweetFromHistory(id: string): SearchHistoryItem[] {
  const current = getStoredHistory()
  const updated = current.filter((item) => item.id !== id)
  saveStoredHistory(updated)
  return updated
}

/**
 * Clears all search history items.
 */
export function clearAllStoredHistory(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}
