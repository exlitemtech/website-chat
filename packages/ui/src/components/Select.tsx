import * as React from "react"
import { cn } from "../lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
  contentRef: React.RefObject<HTMLDivElement>
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select provider")
  }
  return context
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <SelectContext.Provider 
      value={{ 
        value, 
        onValueChange, 
        open, 
        onOpenChange: setOpen,
        triggerRef,
        contentRef
      }}
    >
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    placeholder?: string
  }
>(({ className, placeholder, children, ...props }, ref) => {
  const { open, onOpenChange, triggerRef } = useSelectContext()

  const handleRef = (node: HTMLButtonElement) => {
    if (triggerRef) {
      ;(triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpenChange(!open)
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      onOpenChange(true)
    }
  }

  return (
    <button
      ref={handleRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={() => onOpenChange(!open)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <span className="block truncate text-left">
        {children || placeholder}
      </span>
      <ChevronDown 
        className={cn(
          "h-4 w-4 opacity-50 transition-transform duration-200 flex-shrink-0",
          open && "rotate-180"
        )} 
      />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string
  }
>(({ placeholder, className, ...props }, ref) => {
  const { value } = useSelectContext()
  
  return (
    <span 
      ref={ref} 
      className={cn("block truncate", className)}
      {...props}
    >
      {value || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: 'item-aligned' | 'popper'
    sideOffset?: number
    alignOffset?: number
  }
>(({ 
  className, 
  children, 
  position = 'item-aligned',
  sideOffset = 4,
  alignOffset = 0,
  ...props 
}, ref) => {
  const { open, onOpenChange, triggerRef, contentRef } = useSelectContext()
  const [positionStyles, setPositionStyles] = React.useState<React.CSSProperties>({})

  const handleRef = (node: HTMLDivElement) => {
    if (contentRef) {
      ;(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  // Calculate position based on available space
  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return

    const trigger = triggerRef.current
    const content = contentRef.current
    const triggerRect = trigger.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let styles: React.CSSProperties = {}

    if (position === 'item-aligned') {
      // Set width to match trigger
      styles.width = triggerRect.width
      styles.minWidth = triggerRect.width
    } else {
      styles.minWidth = triggerRect.width
    }

    // Calculate vertical position
    const spaceBelow = viewportHeight - triggerRect.bottom - sideOffset
    const spaceAbove = triggerRect.top - sideOffset
    const contentHeight = contentRect.height || 200 // fallback height

    if (spaceBelow >= contentHeight || spaceBelow >= spaceAbove) {
      // Position below
      styles.top = '100%'
      styles.marginTop = sideOffset
      styles.maxHeight = Math.min(spaceBelow, 300)
    } else {
      // Position above
      styles.bottom = '100%'
      styles.marginBottom = sideOffset
      styles.maxHeight = Math.min(spaceAbove, 300)
    }

    // Handle horizontal overflow
    const triggerLeft = triggerRect.left
    const contentWidth = styles.width as number || triggerRect.width

    if (triggerLeft + contentWidth > viewportWidth) {
      styles.right = alignOffset
    } else {
      styles.left = alignOffset
    }

    setPositionStyles(styles)
  }, [open, position, sideOffset, alignOffset])

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        onOpenChange(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  // Handle scroll locking
  React.useEffect(() => {
    if (open) {
      const handleScroll = () => {
        onOpenChange(false)
      }
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleScroll)
      }
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      ref={handleRef}
      role="listbox"
      style={positionStyles}
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      <div className="overflow-y-auto p-1">
        {children}
      </div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, disabled = false, ...props }, ref) => {
    const { value: selectedValue, onValueChange, onOpenChange } = useSelectContext()
    const isSelected = value === selectedValue

    const handleClick = () => {
      if (disabled) return
      onValueChange(value)
      onOpenChange(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onValueChange(value)
        onOpenChange(false)
      }
    }

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <span className="block truncate">{children}</span>
        {isSelected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </span>
        )}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

// Additional components for better UX
const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-muted-foreground", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
SelectGroup.displayName = "SelectGroup"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectLabel,
  SelectGroup,
}