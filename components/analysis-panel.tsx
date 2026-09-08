'use client'

import { useState } from 'react'
import { AlertCircle, Check, Copy, Sparkles } from 'lucide-react'
import type { Analysis } from '@/lib/analysis'
import { scoreTone } from '@/lib/analysis'
import { ScoreRing } from '@/components/score-ring'

const toneLabel: Record<ReturnType<typeof scoreTone>, string> = {
  strong: 'text-chart-2',
  fair: 'text-chart-3',
  weak: 'text-chart-5',
}

function DimensionBar({ name, score }: { name: string; score: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono tabular-nums text-foreground">{Math.round(score)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  )
}

export function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false)

  async function copyImproved() {
    await navigator.clipboard.writeText(analysis.improvedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={analysis.score} />
          <div className="flex-1 text-center sm:text-left">
            <p
              className={`text-lg font-semibold text-balance ${toneLabel[scoreTone(analysis.score)]}`}
            >
              {analysis.verdict}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
              {analysis.summary}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
          {analysis.breakdown.map((d) => (
            <DimensionBar key={d.name} name={d.name} score={d.score} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="size-4 text-chart-3" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Missing context
          </h2>
        </div>
        {analysis.missingContext.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing critical missing — this prompt is well specified.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {analysis.missingContext.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-chart-3"
                  aria-hidden="true"
                />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Improved prompt
            </h2>
          </div>
          <button
            type="button"
            onClick={copyImproved}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3.5" aria-hidden="true" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" /> Copy
              </>
            )}
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-background/60 p-4 font-mono text-sm leading-relaxed text-foreground">
          {analysis.improvedPrompt}
        </pre>
      </section>
    </div>
  )
}
