'use client'

import { useState } from 'react'
import { Loader2, ScanSearch, Wand2 } from 'lucide-react'
import type { Analysis } from '@/lib/analysis'
import { AnalysisPanel } from '@/components/analysis-panel'

const EXAMPLE =
  'Write a product update email announcing our new analytics dashboard to existing customers.'

export function PromptChecker() {
  const [prompt, setPrompt] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Something went wrong.')
      }
      setAnalysis((await res.json()) as Analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="flex flex-col rounded-xl border border-border bg-card p-6">
        <label htmlFor="prompt" className="text-sm font-semibold text-foreground">
          Your prompt
        </label>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste the prompt you plan to ship. We&apos;ll score it and rewrite it.
        </p>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Summarize this contract and flag anything risky…"
          rows={12}
          className="mt-4 flex-1 resize-none rounded-lg border border-input bg-background/60 p-4 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {prompt.length} chars
            </span>
            <button
              type="button"
              onClick={() => setPrompt(EXAMPLE)}
              className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
            >
              Try an example
            </button>
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Analyzing…
              </>
            ) : (
              <>
                <Wand2 className="size-4" aria-hidden="true" /> Analyze
              </>
            )}
          </button>
        </div>
        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>

      <div className="min-h-full">
        {analysis ? (
          <AnalysisPanel analysis={analysis} />
        ) : (
          <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <ScanSearch className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No analysis yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground text-pretty">
              Enter a prompt and run an analysis to see its quality score, missing context, and a
              rewritten version.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
