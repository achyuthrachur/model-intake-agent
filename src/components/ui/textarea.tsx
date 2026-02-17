import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input/80 placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-lg border bg-background/85 px-3 py-2 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:shadow-[var(--ring-glow)] hover:border-primary/35 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
