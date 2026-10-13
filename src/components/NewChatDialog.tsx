import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { isValidMaxPhoneNumber, normalizePhoneNumber, phoneNumberError } from "../lib/phone";

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

  useEffect(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    phoneInput.current?.focus();
    return () => returnFocus.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !busy) {
      onClose();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

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
  }

  return (
    <div
      className="dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <section
        className="new-chat-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">НОВАЯ ПЕРЕПИСКА</p>
            <h2 id="new-chat-title">Кому написать?</h2>
          </div>
          <button
            className="icon-button dialog-close"
            type="button"
            aria-label="Закрыть окно создания чата"
            onClick={onClose}
            disabled={busy}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <form className="new-chat-form" onSubmit={handleSubmit}>
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
            <p className="field-error" id="phone-error" role="alert">{validationError}</p>
          ) : (
            <p className="field-hint" id="phone-hint">Номер с кодом страны, РФ или Беларусь.</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>
              Отмена
            </button>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? "Проверяем номер..." : "Создать чат"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}