import * as React from "react"
import { cn } from "../lib/utils"

const Layout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-screen bg-background", className)}
    {...props}
  />
))
Layout.displayName = "Layout"

const LayoutHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "flex h-16 items-center justify-between border-b bg-background px-6",
      className
    )}
    {...props}
  />
))
LayoutHeader.displayName = "LayoutHeader"

const LayoutMain = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn("flex-1 overflow-auto", className)}
    {...props}
  />
))
LayoutMain.displayName = "LayoutMain"

const LayoutContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("container mx-auto p-6", className)}
    {...props}
  />
))
LayoutContent.displayName = "LayoutContent"

const LayoutSidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn("w-64 border-r bg-background", className)}
    {...props}
  />
))
LayoutSidebar.displayName = "LayoutSidebar"

export {
  Layout,
  LayoutHeader,
  LayoutMain,
  LayoutContent,
  LayoutSidebar,
}