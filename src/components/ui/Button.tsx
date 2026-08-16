import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'text'
  }
>

const variants = {
  primary:
    'min-h-11 rounded-[var(--radius-small)] border-0 bg-[var(--color-action)] px-5 py-2.5 font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'min-h-11 rounded-[var(--radius-small)] border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-5 py-2.5 font-semibold text-[var(--color-primary-dark)] transition-colors hover:bg-[#dfeae1] disabled:cursor-not-allowed disabled:opacity-60',
  text: 'border-0 bg-transparent p-0 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40',
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${variants[variant]} cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-focus)] ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
