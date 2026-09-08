export type Dimension = {
  name: 'Clarity' | 'Specificity' | 'Context' | 'Output format'
  score: number
}

export type Analysis = {
  score: number
  verdict: string
  summary: string
  breakdown: Dimension[]
  missingContext: string[]
  improvedPrompt: string
}

export function scoreTone(score: number): 'strong' | 'fair' | 'weak' {
  if (score >= 75) return 'strong'
  if (score >= 45) return 'fair'
  return 'weak'
}
