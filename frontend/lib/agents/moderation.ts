export interface ModerationFlag {
  artifactId: string
  reason: string
}

const BANNED = ['spam', 'clickbait']

export function scanArtifacts(artifacts: { id: string; data?: unknown }[]): ModerationFlag[] {
  const flags: ModerationFlag[] = []
  for (const a of artifacts) {
    const text = typeof a.data === 'string' ? a.data : JSON.stringify(a.data || '')
    const lower = text.toLowerCase()
    for (const w of BANNED) {
      if (lower.includes(w)) {
        flags.push({ artifactId: a.id, reason: `contains banned term: ${w}` })
      }
    }
    if (text.length > 50000) {
      flags.push({ artifactId: a.id, reason: 'content too long' })
    }
  }
  return flags
}


