import { useEffect, useMemo, useState } from 'react'
import { getRecipeIds, getSubmissions, type SubmissionSummary } from '../lib/api'

export default function DashboardPage() {
  const [recipeIds, setRecipeIds] = useState<string[]>([])
  const [selected, setSelected] = useState<string>('all')
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([])
  const [totalAll, setTotalAll] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const pageSize = 1

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const ids = await getRecipeIds()
        if (!mounted) return
        setRecipeIds(ids)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load recipe IDs')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const selectedId = selected === 'all' ? null : selected
        const [filtered, all] = await Promise.all([
          getSubmissions(selectedId),
          selectedId ? getSubmissions(null) : Promise.resolve(null),
        ])
        if (!mounted) return
        setSubmissions(filtered)
        setTotalAll(selectedId ? (all ? all.length : 0) : filtered.length)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load submissions')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [selected, refreshTick])

  useEffect(() => {
    setPage(1)
  }, [selected])

  const totalCount = totalAll
  const filteredCount = submissions.length
  const filterLabel = selected === 'all' ? 'All bake IDs' : selected

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(filteredCount, startIndex + pageSize)
  const tableRows = useMemo(() => submissions.slice(startIndex, endIndex), [submissions, startIndex, endIndex])
  const formatTime = (value: string | null) => {
    if (!value) return 'Unknown time'
    const dt = new Date(value)
    if (Number.isNaN(dt.getTime())) return value
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(dt)
  }

  return (
    <div className="page dashboard">
      <div className="dashboard-topbar">
        <div>
          <h2 className="dashboard-title">Dashboard</h2>
          <div className="dashboard-subtitle">Submissions overview</div>
        </div>
        <div className="dashboard-filter">
          <label htmlFor="recipeSelect">Bake ID</label>
          <select
            id="recipeSelect"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="all">All bake IDs</option>
            {recipeIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-label">Total Submissions</div>
          <div className="metric-value">{totalCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Selected Bake ID</div>
          <div className="metric-value">{filteredCount}</div>
          <div className="metric-subtext">{filterLabel}</div>
        </div>
      </div>

      {loading && <div className="page center">Loading dashboard...</div>}
      {error && !loading && (
        <div className="page center">
          <h3>Could not load submissions</h3>
          <p>{error}</p>
          <button type="button" className="submit-btn" onClick={() => setRefreshTick((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && tableRows.length === 0 && (
        <div className="page center">
          <h3>No submissions found</h3>
          <p>Try a different bake ID or check back later.</p>
        </div>
      )}

      {!loading && !error && tableRows.length > 0 && (
        <>
          <div className="pagination">
            <div className="page-controls">
              <button
                type="button"
                className="page-btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                &lt;
              </button>
              <button
                type="button"
                className="page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                &gt;
              </button>
            </div>
            <div className="page-status">
              Page {safePage} of {totalPages} · Showing {startIndex + 1}-{endIndex} of {filteredCount}
            </div>
          </div>
          <div className="submissions-grid single">
            {tableRows.map((s) => (
              <div key={s.id} className="submission-card">
                <div className="submission-meta">
                  <div className="submission-title">{s.recipeId || s.bakeSessionID || 'Bake ID'}</div>
                <div className="submission-subtitle">
                  {s.submitterName ? `by ${s.submitterName}` : 'Anonymous'} · {formatTime(s.submittedAtUtc)}
                </div>
                </div>
                <div className="qa-list">
                  {s.qa.map((qa) => (
                    <div key={`${s.id}-${qa.questionId}`} className="qa-item">
                      <div className="qa-question">{qa.questionText}</div>
                      <div className="qa-answer">{qa.answerValue === null || qa.answerValue === undefined ? '—' : String(qa.answerValue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
