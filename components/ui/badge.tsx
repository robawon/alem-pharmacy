import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all shadow-sm",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-800/80 text-slate-200",
        primary: "border-teal-500/40 bg-teal-500/20 text-teal-300 shadow-teal-500/10",
        success: "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-emerald-500/10",
        destructive: "border-rose-500/40 bg-rose-500/20 text-rose-300 shadow-rose-500/10",
        warning: "border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-amber-500/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
