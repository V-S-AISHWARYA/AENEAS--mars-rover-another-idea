import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Panel({
  title,
  code,
  right,
  className,
  children,
}: {
  title: string
  code?: string
  right?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground">{title}</h2>
          {code && <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{code}</span>}
        </div>
        {right}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
    </section>
  )
}
