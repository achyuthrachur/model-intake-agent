import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em] [&>svg]:size-3 [&>svg]:pointer-events-none transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/12 text-primary [a&]:hover:bg-primary/20 [a&]:hover:-translate-y-0.5",
        secondary:
          "border-secondary/30 bg-secondary/20 text-secondary-foreground [a&]:hover:bg-secondary/30",
        destructive:
          "border-destructive/30 bg-destructive/12 text-destructive [a&]:hover:bg-destructive/18",
        outline:
          "border-border/85 bg-background/70 text-foreground [a&]:hover:border-primary/35 [a&]:hover:bg-accent/75",
        ghost: "border-transparent bg-transparent [a&]:hover:bg-accent/60 [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
