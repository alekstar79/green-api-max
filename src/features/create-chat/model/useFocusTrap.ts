import { useCallback, type KeyboardEvent } from "react";

export function useFocusTrap(onClose: () => void, busy: boolean) {
    // A stable handler avoids replacing the dialog's keyboard listener on unrelated renders.
    return useCallback((event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Escape" && !busy) {
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
    }, [busy, onClose]);
}