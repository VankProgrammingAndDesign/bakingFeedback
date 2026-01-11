import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionRenderer from '../components/QuestionRenderer'
import type { FormDefinition, Question } from '../types'
import { fetchForm, submitForm } from '../lib/api'

export default function SurveyPage() {
  const navigate = useNavigate()
  const [bakeSessionID, setBakeSessionID] = useState<string | null>(null)
  const [submitterName, setSubmitterName] = useState<string | null>(null)
  const [form, setForm] = useState<FormDefinition | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | null>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const b = sessionStorage.getItem('bakeSessionID')
    const s = sessionStorage.getItem('submitterName')
    if (!b || !s) return navigate('/')
    setBakeSessionID(b)
    setSubmitterName(s)

    let mounted = true
    ;(async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const f = await fetchForm(b)
        if (!mounted) return
        if (!f) {
          setFetchError('Form not found')
          setForm(null)
          return
        }
        setForm(f)
        // init answers
        const map: Record<string, null> = {}
        f.questions.forEach((q) => (map[q.id] = null))
        setAnswers(map)
      } catch (err: any) {
        setFetchError(err?.message ?? 'Failed to load form')
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [navigate])

  function handleChange(id: string, value: string | number) {
    setAnswers((a) => ({ ...a, [id]: value }))
    setValidationErrors((v) => ({ ...v, [id]: '' }))
  }

  function validateAll() {
    const errs: Record<string, string> = {}
    if (form) {
      for (const q of form.questions) {
        if (q.required) {
          const v = answers[q.id]
          if (v === null || v === undefined || v === '') errs[q.id] = 'Required'
        }
      }
    }
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const [submitSummaryError, setSubmitSummaryError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!bakeSessionID) return
    setSubmitSummaryError(null)
    if (!validateAll()) {
      setSubmitSummaryError('Please answer the required questions.')
      return
    }
    setLoading(true)
    try {
      const resp = await submitForm({
        bakeSessionID,
        submitterName,
        answers,
        formVersion: form?.version ?? null,
      })
      navigate('/thanks', { state: { submissionId: resp.submissionId } })
    } catch (err: any) {
      setFetchError(err?.message ?? 'Submit failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !form) return <div className="page center">Loading…</div>
  if (fetchError && !form) return (
    <div className="page center">
      <h3>{fetchError}</h3>
      <p>Form ID: {bakeSessionID}</p>
    </div>
  )

  return (
    <div className="page form-container">
      <h2 className="form-title">{form?.title ?? 'Bakery Feedback'}</h2>
      {submitterName && <div className="meta">for {submitterName}</div>}

      {loading && form && <div>Loading…</div>}

      {submitSummaryError && <div className="error summary">{submitSummaryError}</div>}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        {form?.questions.map((q: Question) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            value={answers[q.id] ?? null}
            onChange={handleChange}
            error={validationErrors[q.id]}
          />
        ))}

        {fetchError && <div className="error">{fetchError}</div>}

        <div className="actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  )
}
