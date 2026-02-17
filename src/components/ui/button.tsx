import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold tracking-[0.01em] transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-200 ease-out disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
  {
    variants: {
      variant: {
        default:
          "border-primary/60 bg-primary text-primary-foreground shadow-[0_14px_26px_-18px_rgba(1,30,65,0.95)] hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_32px_-18px_rgba(1,30,65,0.95)]",
        destructive:
          "border-destructive/60 bg-destructive text-white shadow-[0_12px_24px_-16px_rgba(229,55,107,0.75)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline:
          "border-border/75 bg-card/80 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/75 dark:bg-card/70 dark:hover:border-primary/45",
        secondary:
          "border-[var(--color-crowe-amber-dark)]/35 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] shadow-[0_14px_28px_-20px_rgba(245,168,0,0.85)] hover:-translate-y-0.5 hover:bg-[var(--color-crowe-amber-bright)]",
        ghost:
          "border-transparent text-muted-foreground shadow-none hover:border-border/70 hover:bg-accent/70 hover:text-foreground",
        link: "border-transparent text-primary shadow-none underline-offset-4 hover:text-primary/80 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 text-sm has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
