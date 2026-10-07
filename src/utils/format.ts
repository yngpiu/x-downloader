const postDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

/**
 * Format ISO post date string to Vietnamese localized format.
 * Module-level Intl.DateTimeFormat instance is reused for performance.
 */
export function formatPostDate(created: string): string {
  if (!created) return ""
  const time = new Date(created).getTime()
  if (Number.isNaN(time)) return created
  return postDateFormatter.format(time)
}
