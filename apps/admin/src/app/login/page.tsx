"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

export default function LoginPage() {
  const router = useRouter();
  const { user, initialized, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (initialized && user) router.replace("/dashboard");
  }, [initialized, user, router]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <Image
          src="/terrasse-bleue-logo.png"
          alt="Terrasse Bleue"
          width={210}
          height={210}
          priority
        />
        <p>ESSAOUIRA · MAROC</p>
        <h1>Le service, en un coup d’œil.</h1>
        <span>
          Commandes, préparation et carte du restaurant réunies dans un espace
          fiable.
        </span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-login-logo">
            <Image
              src="/terrasse-bleue-logo.png"
              alt="Terrasse Bleue"
              width={92}
              height={92}
            />
          </div>
          <p className="eyebrow">ESPACE RESTAURANT</p>
          <h2>Connexion équipe</h2>
          <p className="muted">
            Utilisez votre compte administrateur ou membre du personnel.
          </p>
          <form onSubmit={submit}>
            <label>
              Adresse e-mail
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Mot de passe
              <span className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.3A10.8 10.8 0 0112 4c5.5 0 9 5.2 9 5.2a16.8 16.8 0 01-3 3.5M6.2 6.2C4.1 7.6 3 9.2 3 9.2S6.5 16 12 16c1.1 0 2.1-.3 3-.7" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </span>
            </label>
            {error ? (
              <div className="form-error" role="alert">
                {error}
              </div>
            ) : null}
            <button className="button primary" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
          <small>Accès réservé à l’équipe Terrasse Bleue.</small>
        </div>
      </section>
    </main>
  );
}
