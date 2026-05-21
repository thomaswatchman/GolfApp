/**
 * Simple stale-while-revalidate cache.
 * Screens read from this on mount — instant if warm.
 * Data is refreshed silently in the background.
 */

const TTL_MS = 3 * 60 * 1000 // 3 minutes

interface Entry<T> {
  data: T
  ts: number
}

const store: Record<string, Entry<any>> = {}

export function cacheSet<T>(key: string, data: T) {
  store[key] = { data, ts: Date.now() }
}

export function cacheGet<T>(key: string): T | null {
  const e = store[key]
  if (!e) return null
  if (Date.now() - e.ts > TTL_MS) { delete store[key]; return null }
  return e.data as T
}

export function cacheInvalidate(key: string) {
  delete store[key]
}
