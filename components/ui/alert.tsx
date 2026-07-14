import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AlertTone = "success" | "error" | "warning" | "info";

const alertStyles: Record<AlertTone, { container: string; icon: string; Icon: typeof Info }> = {
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-950",
    icon: "bg-emerald-100 text-emerald-700",
    Icon: CheckCircle2,
  },
  error: {
    container: "border-rose-200 bg-rose-50 text-rose-950",
    icon: "bg-rose-100 text-rose-700",
    Icon: CircleAlert,
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-950",
    icon: "bg-amber-100 text-amber-700",
    Icon: AlertTriangle,
  },
  info: {
    container: "border-sky-200 bg-sky-50 text-sky-950",
    icon: "bg-sky-100 text-sky-700",
    Icon: Info,
  },
};

type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  tone?: AlertTone;
  title?: ReactNode;
  onDismiss?: () => void;
};

export function Alert({ tone = "info", title, children, className, onDismiss, ...props }: AlertProps) {
  const style = alertStyles[tone];
  const { Icon } = style;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl border p-4 shadow-sm sm:gap-4 sm:p-5", style.container, className)}
      {...props}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", style.icon)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {title ? <p className="font-semibold leading-6">{title}</p> : null}
        <div className={cn("text-sm leading-6 opacity-85", title && "mt-1")}>{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
