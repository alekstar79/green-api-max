import type { ButtonHTMLAttributes } from "react";
import { classNames } from "@/shared/lib/class-names";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={classNames(styles.button, styles[variant], className)}
    />
  );
}