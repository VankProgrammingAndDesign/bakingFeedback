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

export type SubmissionQa = {
  questionId: string
  questionText: string
  answerValue: string | number | null
}

export type SubmissionSummary = {
  id: string
  recipeId: string | null
  bakeSessionID: string | null
  submitterName: string | null
  formVersion: string | null
  submittedAtUtc: string | null
  qa: SubmissionQa[]
}

export async function getSubmissions(recipeId?: string | null): Promise<SubmissionSummary[]> {
  const params = recipeId ? `?recipeId=${encodeURIComponent(recipeId)}` : ''
  const res = await fetch(`/api/submissions${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'failed to load submissions' }))
    throw new Error(err?.error || 'failed to load submissions')
  }
  const body = await res.json()
  return body?.submissions ?? []
}

export async function getRecipeIds(): Promise<string[]> {
  const res = await fetch('/api/recipes')
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'failed to load recipe IDs' }))
    throw new Error(err?.error || 'failed to load recipe IDs')
  }
  const body = await res.json()
  return body?.recipeIds ?? []
}
