import type { FormDefinition } from '../types'

export async function fetchForm(bakeSessionID: string): Promise<FormDefinition | null> {
  try {
    const res = await fetch(`/api/form?bakeSessionID=${encodeURIComponent(bakeSessionID)}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Failed to load form (${res.status})`)
    const body = await res.json()
    return body?.form ?? null
  } catch (err) {
    throw err
  }
}

export async function submitForm(payload: {
  bakeSessionID: string
  submitterName?: string | null
  answers: Record<string, string | number | null>
  formVersion?: string | null
}): Promise<{ submissionId: string }>
{
  const body = { ...payload, honeypot: '' }
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'submit failed' }))
    throw new Error(err?.error || 'submit failed')
  }
  return res.json()
}
