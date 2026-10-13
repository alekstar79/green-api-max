import { X } from "lucide-react";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useFocusTrap } from "../model/useFocusTrap";
import { isValidMaxPhoneNumber, normalizePhoneNumber, phoneNumberError } from "@/shared/lib/phone";
import styles from "./NewChatDialog.module.css";

interface NewChatDialogProps {
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (phoneNumber: string) => Promise<boolean>;
}

export function NewChatDialog({ busy, error, onClose, onCreate }: NewChatDialogProps) {
  const [phone, setPhone] = useState("");
  const [validationError, setValidationError] = useState("");
  const phoneInput = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const focusTrapHandler = useFocusTrap(onClose, busy);

  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    phoneInput.current?.focus();
    return () => returnFocus.current?.focus();
  }, []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidMaxPhoneNumber(phone)) {
      setValidationError(phoneNumberError(phone));
      return;
    }
    setValidationError("");
    if (await onCreate(normalizePhoneNumber(phone))) {
      onClose();
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
        onKeyDown={focusTrapHandler}
      >
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>НОВАЯ ПЕРЕПИСКА</p>
            <h2 className={styles.title} id="new-chat-title">Кому написать?</h2>
          </div>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Закрыть окно создания чата"
            onClick={onClose}
            disabled={busy}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="phone-number">Номер телефона</label>
          <input
            ref={phoneInput}
            id="phone-number"
            name="phoneNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 999 123-45-67"
            value={phone}
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? "phone-error" : "phone-hint"}
            onChange={(event) => {
              setPhone(event.target.value);
              setValidationError("");
            }}
          />
          {validationError ? (
            <p className={styles.fieldError} id="phone-error" role="alert">{validationError}</p>
          ) : (
            <p className={styles.fieldHint} id="phone-hint">Номер с кодом страны, РФ или Беларусь.</p>
          )}
          {error && <p className={styles.formError} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={busy}>
              Отмена
            </button>
            <button className={styles.primaryButton} type="submit" disabled={busy}>
              {busy ? "Проверяем номер..." : "Создать чат"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}