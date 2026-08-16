type LeafMarkProps = {
  className?: string
  decorative?: boolean
}

export function LeafMark({ className = '', decorative = false }: LeafMarkProps) {
  return (
    <span
      className={`inline-grid size-9 place-items-center rounded-[var(--radius-small)] bg-[var(--color-primary)] text-[var(--color-surface)] ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'JoyFlow logo'}
      aria-hidden={decorative || undefined}
    >
      <svg
        className="size-5 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <path d="M18.8 5.2C12.7 5.4 7.1 8.5 6.2 14.1c-.4 2.5 1.3 4.7 3.9 4.7 5.7 0 8.6-6.5 8.7-13.6Z" />
        <path d="M6 19c2.1-3.5 4.9-6.2 8.5-8.2" />
      </svg>
    </span>
  )
}

export default function Brand() {
  return (
    <a
      className="mb-7 inline-flex items-center gap-2.5 font-semibold text-[var(--color-text)] no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-focus)]"
      href="#top"
      id="top"
      aria-label="JoyFlow home"
    >
      <LeafMark decorative />
      <span>JoyFlow</span>
    </a>
  )
}
