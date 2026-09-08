import type { Analysis, Dimension } from '@/lib/analysis'

const WORD = /[a-z0-9]+(?:['-][a-z0-9]+)*/gi

const FORMAT_HINTS = [
  'json',
  'yaml',
  'markdown',
  'table',
  'bullet',
  'list',
  'csv',
  'xml',
  'schema',
  'format',
  'paragraph',
  'sentence',
  'word count',
  'words',
  'characters',
  'headings',
  'sections',
  'step-by-step',
  'numbered',
  'code block',
  'tone',
  'concise',
  'length',
]

const CONTEXT_HINTS = [
  'context',
  'background',
  'audience',
  'given',
  'based on',
  'using',
  'assume',
  'for a',
  'for an',
  'my',
  'our',
  'we are',
  "we're",
  'the user',
  'target',
  'industry',
  'company',
  'customer',
  'goal',
  'objective',
  'so that',
  'because',
]

const SPECIFIC_HINTS = [
  'specifically',
  'exactly',
  'must',
  'should',
  'include',
  'exclude',
  'avoid',
  'limit',
  'no more than',
  'at least',
  'between',
  'example',
  'e.g.',
  'such as',
  'constraint',
  'requirement',
  'do not',
  "don't",
]

const ROLE_HINTS = [
  'act as',
  'you are',
  'as a',
  'as an',
  'expert',
  'senior',
  'professional',
  'role of',
]

const VAGUE_WORDS = [
  'stuff',
  'things',
  'good',
  'nice',
  'better',
  'some',
  'etc',
  'various',
  'appropriate',
  'relevant',
  'proper',
]

function countHits(text: string, hints: string[]): number {
  let n = 0
  for (const h of hints) {
    if (text.includes(h)) n += 1
  }
  return n
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function analyzePrompt(rawPrompt: string): Analysis {
  const prompt = rawPrompt.trim()
  const lower = prompt.toLowerCase()
  const words = lower.match(WORD) ?? []
  const wordCount = words.length
  const sentences = prompt.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const hasQuestion = /\?/.test(prompt)
  const hasImperative = /\b(write|create|generate|summarize|analyze|explain|list|build|draft|design|translate|classify|extract|compare|review|rewrite|produce|suggest|plan)\b/i.test(
    prompt,
  )

  const formatHits = countHits(lower, FORMAT_HINTS)
  const contextHits = countHits(lower, CONTEXT_HINTS)
  const specificHits = countHits(lower, SPECIFIC_HINTS)
  const roleHits = countHits(lower, ROLE_HINTS)
  const vagueHits = countHits(lower, VAGUE_WORDS)
  const hasNumbers = /\d/.test(prompt)

  // Clarity: clear task verb, reasonable length, low vagueness.
  let clarity = 40
  if (hasImperative || hasQuestion) clarity += 25
  if (wordCount >= 8) clarity += 10
  if (wordCount >= 20) clarity += 10
  if (sentences.length >= 2) clarity += 8
  if (wordCount < 5) clarity -= 20
  clarity -= vagueHits * 6
  clarity = clamp(clarity)

  // Specificity: constraints, examples, numbers, detail.
  let specificity = 30
  specificity += Math.min(specificHits, 4) * 10
  if (hasNumbers) specificity += 12
  if (wordCount >= 30) specificity += 10
  specificity -= vagueHits * 5
  if (wordCount < 8) specificity -= 15
  specificity = clamp(specificity)

  // Context: audience, background, purpose, role.
  let context = 28
  context += Math.min(contextHits, 4) * 12
  if (roleHits > 0) context += 14
  if (/\bso that\b|\bbecause\b|\bin order to\b/.test(lower)) context += 8
  if (wordCount < 8) context -= 12
  context = clamp(context)

  // Output format: explicit shape/length/tone expectations.
  let outputFormat = 25
  outputFormat += Math.min(formatHits, 4) * 15
  if (/\d+\s*(words|sentences|paragraphs|bullets|items|characters)/.test(lower)) outputFormat += 12
  if (formatHits === 0) outputFormat -= 10
  outputFormat = clamp(outputFormat)

  const breakdown: Dimension[] = [
    { name: 'Clarity', score: clarity },
    { name: 'Specificity', score: specificity },
    { name: 'Context', score: context },
    { name: 'Output format', score: outputFormat },
  ]

  const score = clamp(clarity * 0.28 + specificity * 0.27 + context * 0.23 + outputFormat * 0.22)

  const missingContext: string[] = []
  if (roleHits === 0)
    missingContext.push(
      'No role or persona is set for the model (e.g. "You are a senior financial analyst"), which anchors tone and expertise.',
    )
  if (contextHits < 2)
    missingContext.push(
      'Missing background on the audience, domain, or situation — who is this for and what should the model assume?',
    )
  if (!/\bso that\b|\bbecause\b|\bgoal\b|\bobjective\b|\bin order to\b/.test(lower))
    missingContext.push(
      'The underlying goal or success criteria is unstated — explain why you need the output so the model can optimize for it.',
    )
  if (specificHits < 2 && !hasNumbers)
    missingContext.push(
      'Few explicit constraints or requirements — add hard rules, things to avoid, or a concrete example of what "good" looks like.',
    )
  if (outputFormat < 55)
    missingContext.push(
      'The desired output format, structure, and length are not specified (e.g. "Return a Markdown table with 5 rows").',
    )
  if (vagueHits > 0)
    missingContext.push(
      'Contains vague filler words (e.g. "good", "some", "things") — replace them with precise, measurable language.',
    )
  if (missingContext.length === 0)
    missingContext.push(
      'Well specified overall. For extra rigor, add one or two few-shot examples of ideal input/output pairs.',
    )

  const improvedPrompt = buildImprovedPrompt(prompt, {
    hasRole: roleHits > 0,
    hasFormat: outputFormat >= 55,
    hasContext: contextHits >= 2,
  })

  const verdict = verdictFor(score)
  const summary = summaryFor(score, breakdown)

  return { score, verdict, summary, breakdown, missingContext, improvedPrompt }
}

function verdictFor(score: number): string {
  if (score >= 85) return 'Excellent, production-ready prompt'
  if (score >= 70) return 'Strong prompt, minor gaps'
  if (score >= 50) return 'Workable but under-specified'
  if (score >= 30) return 'Weak, needs real structure'
  return 'Too vague to be reliable'
}

function summaryFor(score: number, breakdown: Dimension[]): string {
  const weakest = [...breakdown].sort((a, b) => a.score - b.score)[0]
  const strongest = [...breakdown].sort((a, b) => b.score - a.score)[0]
  if (score >= 70)
    return `Clear intent with solid detail. ${strongest.name} is its strongest dimension, while ${weakest.name.toLowerCase()} could still be tightened for enterprise consistency.`
  if (score >= 50)
    return `The core ask is understandable, but ${weakest.name.toLowerCase()} is the main weakness. Adding structure there will noticeably improve output reliability.`
  return `This prompt leaves too much to interpretation — ${weakest.name.toLowerCase()} in particular is underdeveloped, so results will vary run to run.`
}

function buildImprovedPrompt(
  original: string,
  has: { hasRole: boolean; hasFormat: boolean; hasContext: boolean },
): string {
  const task = original.replace(/\s+/g, ' ').trim()
  const lines: string[] = []

  lines.push(
    'You are a senior domain expert assisting an enterprise team. Approach the task with rigor and flag any assumptions you make.',
  )
  lines.push('')
  lines.push('## Task')
  lines.push(task || '<describe the task here>')
  lines.push('')
  lines.push('## Context')
  lines.push('- Audience: <who will read or use this output>')
  lines.push('- Background: <relevant systems, data, or prior decisions the model should assume>')
  lines.push('- Goal: <the outcome this output needs to drive>')
  lines.push('')
  lines.push('## Requirements')
  lines.push('- Be specific and cite concrete examples where relevant.')
  lines.push('- Call out any missing information rather than inventing it.')
  lines.push('- Avoid vague language; every claim should be verifiable.')
  lines.push('')
  lines.push('## Output format')
  lines.push('- Structure: <e.g. Markdown with H2 sections / a JSON object / a table>')
  lines.push('- Length: <e.g. under 300 words / exactly 5 bullet points>')
  lines.push('- Tone: <e.g. formal, executive-ready>')

  return lines.join('\n')
}
