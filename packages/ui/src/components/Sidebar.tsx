import * as React from "react"
import { cn } from "../lib/utils"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-64 flex-col border-r bg-slate-50/50 backdrop-blur-xl",
      className
    )}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-16 items-center border-b px-4", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto py-4", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("space-y-1 px-2", className)}
    {...props}
  />
))
SidebarNav.displayName = "SidebarNav"

interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: React.ReactNode
}

const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, active, icon, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {icon && <span className="flex h-4 w-4 items-center justify-center">{icon}</span>}
      {children}
    </button>
  )
)
SidebarItem.displayName = "SidebarItem"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-t p-4", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarNav,
  SidebarItem,
  SidebarFooter,
}