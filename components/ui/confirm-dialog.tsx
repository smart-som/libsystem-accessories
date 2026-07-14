"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "warning" | "danger";
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  tone = "warning",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, onCancel, open]);

  if (!open) return null;

  const Icon = tone === "danger" ? Trash2 : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={() => !isBusy && onCancel()}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-lg rounded-t-[28px] border border-white/10 bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", tone === "danger" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-xl font-semibold text-slate-950 sm:text-2xl">{title}</h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelButtonRef} type="button" variant="secondary" disabled={isBusy} onClick={onCancel} className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className={cn("w-full sm:w-auto", tone === "danger" && "border-rose-700 bg-rose-700 hover:bg-rose-800")}
          >
            {isBusy ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
