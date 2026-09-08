import { scoreTone } from '@/lib/analysis'

const toneColor: Record<ReturnType<typeof scoreTone>, string> = {
  strong: 'var(--color-chart-2)',
  fair: 'var(--color-chart-3)',
  weak: 'var(--color-chart-5)',
}

export function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference
  const color = toneColor[scoreTone(clamped)]

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="10"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-4xl font-semibold tabular-nums text-foreground">
          {clamped}
        </span>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">/ 100</span>
      </div>
      <span className="sr-only">{`Prompt quality score: ${clamped} out of 100`}</span>
    </div>
  )
}
