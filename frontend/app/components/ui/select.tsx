"use client"

import * as React from "react"
import { Content, Group, Icon, Item, ItemIndicator, ItemText, Label, Portal, Root, ScrollDownButton, ScrollUpButton, Separator, Trigger, Value, Viewport } from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = Root

const SelectGroup = Group

const SelectValue = Value

/**
 * SelectTrigger with standardized heights matching input/button sizes
 * Part of the unified design system
 */
interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof Trigger> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Trigger>,
  SelectTriggerProps
>(({ className, children, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',          // 36px height (matches button/input sm)
    md: 'h-11 px-4 text-base',       // 44px height (matches button/input md)
    lg: 'h-12 px-5 text-lg',         // 48px height (matches button/input lg)
    xl: 'h-14 px-6 text-xl',         // 56px height (matches button/input xl)
  }
  
  return (
    <Trigger
      ref={ref}
      className={cn(
        "flex w-full items-center justify-between rounded-full border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-200",
        "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      <Icon asChild>
        <ChevronDown className={cn(
          "opacity-50",
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5',
          size === 'xl' && 'h-6 w-6'
        )} />
      </Icon>
    </Trigger>
  )
})
SelectTrigger.displayName = Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof ScrollUpButton>
>(({ className, ...props }, ref) => (
  <ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </ScrollUpButton>
))
SelectScrollUpButton.displayName = ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof ScrollDownButton>
>(({ className, ...props }, ref) => (
  <ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </ScrollDownButton>
))
SelectScrollDownButton.displayName =
  ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <Portal>
    <Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden  border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </Viewport>
      <SelectScrollDownButton />
    </Content>
  </Portal>
))
SelectContent.displayName = Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof Item>,
  React.ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...props }, ref) => (
  <Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center  py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicator>
        <Check className="h-4 w-4" />
      </ItemIndicator>
    </span>

    <ItemText>{children}</ItemText>
  </Item>
))
SelectItem.displayName = Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

export type { SelectTriggerProps }
