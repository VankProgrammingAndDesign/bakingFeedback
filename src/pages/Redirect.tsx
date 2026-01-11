import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

export default function RedirectPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bakeSessionID = searchParams.get('bakeSessionID')
    const submitterName = searchParams.get('submitterName')

    if (!bakeSessionID || !submitterName) {
      setError('Missing bakeSessionID or submitterName in the link.')
      return
    }

    sessionStorage.setItem('bakeSessionID', bakeSessionID)
    sessionStorage.setItem('submitterName', submitterName)

    // short delay for UX, then navigate
    const t = setTimeout(() => navigate('/survey'), 300)
    return () => clearTimeout(t)
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="page center">
        <h3>Error</h3>
        <p>{error}</p>
        <p>
          Go back <Link to="/">home</Link> to start.
        </p>
      </div>
    )
  }

  return (
    <div className="page center">
      <p>Preparing your survey…</p>
    </div>
  )
}
