import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const switchVariants = cva(
  "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gray-300 peer-checked:bg-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface SwitchProps 
  extends React.InputHTMLAttributes<HTMLInputElement>, 
    VariantProps<typeof switchVariants> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, variant, checked, onCheckedChange, id, ...props }, ref) => {
    return (
      <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div className={cn(switchVariants({ variant, className }))}>
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 peer-checked:translate-x-5" />
        </div>
      </label>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }