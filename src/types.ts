export type Question = {
  id: string
  type: 'scale' | 'text'
  prompt?: string
  label?: string
  helpText?: string
  required?: boolean
  min?: number
  max?: number
}

export type FormDefinition = {
  id: string
  title?: string
  version?: string
  questions: Question[]
}
