import type { InputHTMLAttributes } from "react";
import { classNames } from "@/shared/lib/class-names";
import styles from "./Input.module.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ id, label, error, hint, className, ...props }: InputProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        className={classNames(styles.input, className)}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descriptionId ?? props["aria-describedby"]}
      />
      {error && <p className={styles.error} id={`${id}-error`} role="alert">{error}</p>}
      {!error && hint && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}