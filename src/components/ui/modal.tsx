"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** El diálogo nativo retiene el foco, permite Escape y lo devuelve al control que lo abrió. */
export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  React.useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
    const previous = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={(e) => { e.preventDefault(); onClose(); }}
    onClick={(e) => {
      if (e.target !== e.currentTarget) return;
      const box = e.currentTarget.getBoundingClientRect();
      if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) onClose();
    }}
    className={cn("fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-panel p-6 text-foreground shadow-2xl", className)}>
    <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
      <div><h2 id={titleId} className="text-xl font-semibold tracking-tight">{title}</h2>{description && <p id={descriptionId} className="mt-2 text-sm text-muted">{description}</p>}</div>
      <button type="button" onClick={onClose} aria-label="Cerrar diálogo" className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-foreground"><X className="h-5 w-5" /></button>
    </div>
    <div className="mt-5">{isOpen ? children : null}</div>
  </dialog>;
}
