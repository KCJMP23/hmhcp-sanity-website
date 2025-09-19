/**
 * Simple robust fetch wrapper with backup fallback.
 * - Tries primary API URL
 * - If it fails, loads a local snapshot from lib/fallback-snapshots/{key}.json
 *
 * Phase 1: local snapshots committed to the repo
 * Phase 2: wire to real backup store (Supabase backups every 4 hours)
 */

export async function fetchWithBackup<T = any>(url: string, snapshotKey: string, options?: RequestInit): Promise<T> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch {
    // Fallback to bundled snapshot
    try {
      const snapshot = await import(`@/lib/fallback-snapshots/${snapshotKey}.json`)
      return snapshot.default as T
    } catch (e) {
      throw new Error(`Backup snapshot not available for ${snapshotKey}`)
    }
  }
}

export function isVideoUrl(src?: string | null): boolean {
  if (!src) return false
  const lower = src.toLowerCase()
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')
}


