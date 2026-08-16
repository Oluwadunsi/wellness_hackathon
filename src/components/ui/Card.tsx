import type { HTMLAttributes, PropsWithChildren } from 'react'

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement>>

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <section
      className={`border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}
