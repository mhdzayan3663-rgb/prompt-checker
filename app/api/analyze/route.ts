import { analyzePrompt } from '@/lib/analyze-engine'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return Response.json({ error: 'Prompt is required.' }, { status: 400 })
  }

  const analysis = analyzePrompt(prompt)
  return Response.json(analysis)
}
