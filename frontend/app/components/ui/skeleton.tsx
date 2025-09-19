import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "shimmer" | "pulse" | "wave"
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        {
          "animate-pulse": variant === "pulse" || variant === "default",
          "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%]": variant === "shimmer",
          "animate-wave bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700": variant === "wave",
        },
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
