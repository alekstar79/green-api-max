import { X } from "lucide-react";
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { classNames } from "@/shared/lib/class-names";
import { Button } from "@/shared/ui/button";
import styles from "./Dialog.module.css";

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  contentProps?: HTMLAttributes<HTMLElement>;
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  className,
  closeOnBackdrop = true,
  contentProps,
}: DialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href]',
    )?.focus();
    return () => returnFocus.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        {...contentProps}
        ref={dialogRef}
        className={classNames(styles.dialog, className, contentProps?.className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-dialog-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose();
            return;
          }
          if (event.key !== "Tab") return;

          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href]',
            ),
          );
          const first = focusable[0];
          const last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <header className={styles.header}>
          <h2 className={styles.title} id="shared-dialog-title">{title}</h2>
          <Button
            variant="icon"
            type="button"
            aria-label="Закрыть окно"
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  );
}