import { useState, type SubmitEvent } from "react";
import styles from "./ConnectionForm.module.css";
import type { Credentials } from "@/entities/credentials";

interface ConnectionFormProps {
  onConnect: (credentials: Credentials) => void;
}

export function ConnectionForm({ onConnect }: ConnectionFormProps) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const instance = idInstance.trim();
    const token = apiTokenInstance.trim();
    if (!instance || !token) {
      setError("Заполните оба поля.");
      return;
    }
    if (!/^\d+$/.test(instance)) {
      setError("ID инстанса должен содержать только цифры.");
      return;
    }
    setError("");
    onConnect({ idInstance: instance, apiTokenInstance: token });
  }

  return (
    <main className={styles.screen}>
      <section className={styles.panel} aria-labelledby="connection-title">
        <div className={styles.wordmark} aria-label="MAX">MAX</div>
        <p className={styles.eyebrow}>GREEN-API</p>
        <h1 className={styles.title} id="connection-title">Подключение к MAX</h1>
        <p className={styles.copy}>
          Введите данные инстанса, чтобы начать переписку.
        </p>
        <form id="connect" className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="id-instance">ID инстанса</label>
          <input
            id="id-instance"
            name="idInstance"
            autoComplete="off"
            required
            value={idInstance}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "connection-error" : undefined}
            onChange={(event) => {
              setIdInstance(event.target.value);
              setError("");
            }}
          />
          <label htmlFor="api-token">Токен API</label>
          <input
            id="api-token"
            name="apiTokenInstance"
            type="password"
            autoComplete="off"
            required
            value={apiTokenInstance}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "connection-error" : undefined}
            onChange={(event) => {
              setApiTokenInstance(event.target.value);
              setError("");
            }}
          />
          {error && <p className={styles.formError} id="connection-error" role="alert">{error}</p>}
          <button className={`${styles.primaryButton} ${styles.submitButton}`} type="submit">
            Подключиться
          </button>
        </form>
      </section>
    </main>
  );
}