import type { Question } from '../types'

type Props = {
  question: Question
  value: string | number | null
  onChange: (id: string, value: string | number) => void
  error?: string | null
}

export default function QuestionRenderer({ question, value, onChange, error }: Props) {
  const label = question.label ?? question.prompt ?? 'Question'
  const help = question.helpText

  if (question.type === 'text') {
    return (
      <div className="question-card">
        <div className="question-header">
          <div className="prompt">{label}{question.required ? <span className="required-star"> *</span> : ''}</div>
          {help && <div className="help-text">{help}</div>}
        </div>
        <textarea
          className="text-input"
          placeholder="Type your answer..."
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          rows={4}
        />
        {error && <div className="error">This question is required.</div>}
      </div>
    )
  }

  // scale
  const min = question.min ?? 1
  const max = question.max ?? 5
  const buttons = []
  for (let i = min; i <= max; i++) buttons.push(i)

  return (
    <div className="question-card">
      <div className="question-header">
        <div className="prompt">{label}{question.required ? ' *' : ''}</div>
        {help && <div className="help-text">{help}</div>}
      </div>
      <div className="scale-grid" role="radiogroup" aria-label={label}>
        {buttons.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label}: ${n}`}
            className={String(value) === String(n) ? 'scale-btn selected' : 'scale-btn'}
            onClick={() => onChange(question.id, n)}
          >
            {n}
          </button>
        ))}
      </div>
      {error && <div className="error">This question is required.</div>}
    </div>
  )
}
