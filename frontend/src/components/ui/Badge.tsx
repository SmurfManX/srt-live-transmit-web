import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'outline'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-smooth',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'shadow-soft',
          {
            'bg-gradient-primary text-white': variant === 'default',
            'bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border-2 border-green-500/30 backdrop-blur-sm': variant === 'success',
            'bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border-2 border-red-500/30 backdrop-blur-sm': variant === 'destructive',
            'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-2 border-amber-500/30 backdrop-blur-sm': variant === 'warning',
            'border-2 border-border/60 bg-background/50 backdrop-blur-sm': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export default Badge
