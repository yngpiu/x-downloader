export type TranslationEngine = "google" | "gemini"

export interface TranslationSettings {
  engine: TranslationEngine
  geminiApiKey: string
  geminiPrompt: string
}

const STORAGE_KEY = "x_downloader_translation_settings_v1"

export const DEFAULT_GEMINI_PROMPT =
  "You are a professional translator. Translate this X (Twitter) social media post to English naturally, with accurate Kpop/social media context, keeping emojis, hashtags and links intact (if any). Return only the translated content, no explanations or markdown code blocks."

export const DEFAULT_TRANSLATION_SETTINGS: TranslationSettings = {
  engine: "google",
  geminiApiKey: "",
  geminiPrompt: DEFAULT_GEMINI_PROMPT,
}

/**
 * Reads translation settings safely from localStorage.
 */
export function getStoredTranslationSettings(): TranslationSettings {
  if (typeof window === "undefined") return DEFAULT_TRANSLATION_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TRANSLATION_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      engine: parsed.engine === "gemini" ? "gemini" : "google",
      geminiApiKey:
        typeof parsed.geminiApiKey === "string"
          ? parsed.geminiApiKey.trim()
          : "",
      geminiPrompt:
        typeof parsed.geminiPrompt === "string" &&
        parsed.geminiPrompt.trim().length > 0
          ? parsed.geminiPrompt
          : DEFAULT_GEMINI_PROMPT,
    }
  } catch {
    return DEFAULT_TRANSLATION_SETTINGS
  }
}

/**
 * Saves translation settings to localStorage.
 */
export function saveStoredTranslationSettings(
  settings: TranslationSettings
): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore localStorage write error (e.g. private browsing quota exceeded)
  }
}

export interface TranslationResult {
  translatedText: string
  sourceLangName?: string
}

// In-memory cache to prevent redundant API calls
const translationMemoryCache = new Map<string, TranslationResult>()

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  es: "Spanish",
  fr: "French",
  de: "German",
  th: "Thai",
  vi: "Vietnamese",
}

/**
 * Translates text using Google Translate GTX endpoint (CORS-friendly in browsers)
 */
async function translateWithGoogle(text: string): Promise<TranslationResult> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(
    text
  )}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Google Translate returned HTTP error ${res.status}`)
  }

  const data = await res.json()
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Invalid Google Translate response format")
  }

  const translatedText = data[0]
    .map((seg: unknown[]) => (seg?.[0] ? String(seg[0]) : ""))
    .join("")

  const rawLangCode = typeof data[2] === "string" ? data[2].toLowerCase() : ""
  const sourceLangName =
    LANGUAGE_NAMES[rawLangCode] ||
    (rawLangCode ? rawLangCode.toUpperCase() : "foreign language")

  return {
    translatedText,
    sourceLangName,
  }
}

/**
 * Translates text using Gemini API
 */
async function translateWithGemini(
  text: string,
  apiKey: string,
  prompt: string
): Promise<TranslationResult> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) {
    throw new Error(
      "Please enter Gemini API Key in Translation Settings to use"
    )
  }

  const effectivePrompt = prompt.trim() || DEFAULT_GEMINI_PROMPT
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    cleanKey
  )}`

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${effectivePrompt}\n\nText to translate:\n${text}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
    },
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null)
    const errorMsg =
      errorJson?.error?.message ||
      `Gemini API Error (status code ${res.status})`
    throw new Error(errorMsg)
  }

  const data = await res.json()
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (typeof candidateText !== "string" || !candidateText.trim()) {
    throw new Error("Gemini did not return valid translation content")
  }

  return {
    translatedText: candidateText.trim(),
    sourceLangName: "AI Gemini",
  }
}

/**
 * Dispatches translation according to configured settings
 */
export async function translateTweetText(
  text: string,
  settings: TranslationSettings
): Promise<TranslationResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { translatedText: "" }
  }

  const cacheKey = `${settings.engine}:${settings.engine === "gemini" ? settings.geminiPrompt : ""}:${trimmed}`
  const cached = translationMemoryCache.get(cacheKey)
  if (cached) {
    return cached
  }

  let result: TranslationResult
  if (settings.engine === "gemini") {
    result = await translateWithGemini(
      trimmed,
      settings.geminiApiKey,
      settings.geminiPrompt
    )
  } else {
    result = await translateWithGoogle(trimmed)
  }

  translationMemoryCache.set(cacheKey, result)
  return result
}
