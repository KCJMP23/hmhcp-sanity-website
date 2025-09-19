import { cn } from "@/lib/utils"

interface PlaceholderProps {
  width?: number | string
  height?: number | string
  className?: string
  text?: string
  color?: string
  backgroundColor?: string
}

export function Placeholder({
  width = "100%",
  height = "100%",
  className,
  text = "Image",
  color = "#9CA3AF", // gray-400
  backgroundColor = "#F3F4F6", // gray-100
}: PlaceholderProps) {
  return (
    <div
      className={cn("flex items-center justify-center  overflow-hidden", className)}
      style={{
        width,
        height,
        backgroundColor,
        color,
      }}
    >
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}
