"use client"

import * as React from "react"
import { Action, Close, Description, Provider, Root, Title, Viewport } from '@radix-ui/react-toast'
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof Viewport>,
  React.ComponentPropsWithoutRef<typeof Viewport>
>(({ className, ...props }, ref) => (
  <Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-6 pr-8 shadow-lg backdrop-blur-md transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 shadow-lg",
        success: "border-emerald-200/50 dark:border-emerald-700/50 bg-emerald-50/95 dark:bg-emerald-950/95 text-emerald-900 dark:text-emerald-100 shadow-lg shadow-emerald-500/10",
        error: "border-red-200/50 dark:border-red-700/50 bg-red-50/95 dark:bg-red-950/95 text-red-900 dark:text-red-100 shadow-lg shadow-red-500/10",
        warning: "border-amber-200/50 dark:border-amber-700/50 bg-amber-50/95 dark:bg-amber-950/95 text-amber-900 dark:text-amber-100 shadow-lg shadow-amber-500/10",
        info: "border-blue-200/50 dark:border-blue-700/50 bg-blue-50/95 dark:bg-blue-950/95 text-blue-900 dark:text-blue-100 shadow-lg shadow-blue-500/10",
        destructive: "border-red-200/50 dark:border-red-700/50 bg-red-50/95 dark:bg-red-950/95 text-red-900 dark:text-red-100 shadow-lg shadow-red-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof Action>,
  React.ComponentPropsWithoutRef<typeof Action>
>(({ className, ...props }, ref) => (
  <Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center  border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof Close>,
  React.ComponentPropsWithoutRef<typeof Close>
>(({ className, ...props }, ref) => (
  <Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2  p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-blue-50 group-[.destructive]:focus:ring-blue-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </Close>
))
ToastClose.displayName = Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof Title>,
  React.ComponentPropsWithoutRef<typeof Title>
>(({ className, ...props }, ref) => (
  <Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof Description>,
  React.ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
  <Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
