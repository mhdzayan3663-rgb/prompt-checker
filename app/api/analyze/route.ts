import { generateText, Output } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const analysisSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall prompt quality score from 0 to 100.'),
  verdict: z
    .string()
    .describe('A short 3-6 word verdict, e.g. "Solid but missing constraints".'),
  summary: z.string().describe('One or two sentences summarizing the prompt quality.'),
  breakdown: z
    .array(
      z.object({
        name: z.enum(['Clarity', 'Specificity', 'Context', 'Output format']),
        score: z.number().min(0).max(100),
      }),
    )
    .length(4)
    .describe('Score for each of the four quality dimensions.'),
  missingContext: z
    .array(z.string())
    .describe('Concrete pieces of context, constraints, or details the prompt is missing.'),
  improvedPrompt: z
    .string()
    .describe('A rewritten, production-ready version of the prompt that fixes the issues.'),
})

export async function POST(req: Request) {
  const { prompt } = await req.json()

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return Response.json({ error: 'Prompt is required.' }, { status: 400 })
  }

  try {
    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({ schema: analysisSchema }),
      system:
        'You are a senior prompt engineer reviewing prompts for an enterprise team. ' +
        'Evaluate the given prompt rigorously for clarity, specificity, sufficient context, ' +
        'and a well-defined output format. Be critical and specific. The improved prompt should ' +
        'preserve the original intent while adding role, concrete context placeholders, ' +
        'explicit constraints, and a clear output format. Keep feedback concise and actionable.',
      prompt: `Analyze the following prompt and return your structured review.\n\nPROMPT:\n"""\n${prompt}\n"""`,
    })

    return Response.json(output)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log('[v0] analyze error:', message)

    if (/credit card|billing|payment method/i.test(message)) {
      return Response.json(
        {
          error:
            'AI Gateway needs a credit card on file to serve requests (this unlocks free credits — you will not be charged for normal usage). Add one at vercel.com → your team → AI, then try again.',
        },
        { status: 402 },
      )
    }

    return Response.json({ error: 'Failed to analyze the prompt. Please try again.' }, { status: 500 })
  }
}
