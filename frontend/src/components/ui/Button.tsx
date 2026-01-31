import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'success' | 'info'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-smooth interactive-scale',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          'relative overflow-hidden',
          {
            // Default - Earthy Green with gradient
            'bg-gradient-primary text-white hover:shadow-elegant hover:glow-green focus-visible:ring-[#4A8B57] shadow-soft':
              variant === 'default',
            // Destructive - Warm Red with gradient
            'bg-gradient-to-br from-[#B91C1C] to-[#991b1b] text-white hover:shadow-elegant focus-visible:ring-[#B91C1C] shadow-soft':
              variant === 'destructive',
            // Success - Same as default (earthy green)
            'bg-gradient-primary text-white hover:shadow-elegant hover:glow-green focus-visible:ring-[#4A8B57] shadow-soft':
              variant === 'success',
            // Info - Blue accent with gradient
            'bg-gradient-to-br from-[#3B82F6] to-[#2563eb] text-white hover:shadow-elegant focus-visible:ring-[#3B82F6] shadow-soft':
              variant === 'info',
            // Outline - Enhanced border style
            'border-2 border-border/60 bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:shadow-soft':
              variant === 'outline',
            // Ghost - Minimal style with hover effect
            'hover:bg-accent/80 hover:text-accent-foreground': variant === 'ghost',
          },
          {
            'h-11 px-6 py-2.5 text-sm': size === 'default',
            'h-9 rounded-lg px-3.5 text-sm': size === 'sm',
            'h-12 rounded-xl px-8 text-base': size === 'lg',
            'h-10 w-10 p-0 rounded-xl': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
