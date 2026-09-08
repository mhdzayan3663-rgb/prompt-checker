import { ShieldCheck } from 'lucide-react'
import { PromptChecker } from '@/components/prompt-checker'

export default function Page() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Enterprise prompt review
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Prompt Quality Checker
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
          Score any prompt out of 100, surface the context it&apos;s missing, and get a rewritten,
          production-ready version — before it reaches your models or your team.
        </p>
      </header>
      <PromptChecker />
    </main>
  )
}
