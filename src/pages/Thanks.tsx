import { useLocation } from 'react-router-dom'

export default function ThanksPage() {
  const loc = useLocation()
  const state = (loc.state || {}) as { submissionId?: string }
  const submitterName = sessionStorage.getItem('submitterName')
  const bakeSessionID = sessionStorage.getItem('bakeSessionID')

  return (
    <div className="page center">
      <h2>Thanks{submitterName ? `, ${submitterName}` : ''}!</h2>
      <p>Your feedback for {bakeSessionID ?? 'the session'} was submitted.</p>
      {state.submissionId && <p>Submission ID: {state.submissionId}</p>}
    </div>
  )
}
