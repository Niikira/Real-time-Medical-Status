import { useState } from "react"
import type { ApiError } from "../api"
import type { Role } from "../types"

const ROLE_CONFIG: Record<Role, { title: string; color: string; light: string; icon: string }> = {
  recepcionista: { title: "Recepção", color: "#8e44ad", light: "#f5eef8", icon: "🗂️" },
  enfermeiro: { title: "Enfermagem", color: "#2980b9", light: "#eaf4fb", icon: "🩺" },
}

export default function LoginView({
  role,
  onLogin,
}: {
  role: Role
  onLogin: (login: string, password: string) => Promise<void>
}) {
  const cfg = ROLE_CONFIG[role]
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await onLogin(login.trim(), password)
    } catch (err) {
      setError((err as ApiError).message)
      setPassword("")
      setLoading(false)
    }
  }

  return (
    <div
      className="safe-top min-h-dvh flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--color-background)" }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: cfg.light }}
          >
            {cfg.icon}
          </div>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-sans)", color: "var(--color-foreground)" }}
          >
            AcomPaci · {cfg.title}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-foreground-soft)" }}>
            Entre com o seu usuário da equipe.
          </p>
        </div>

        <label className="block">
          <span
            className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--color-foreground-soft)" }}
          >
            Usuário
          </span>
          <input
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--color-foreground-soft)" }}
          >
            Senha
          </span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle}
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-center" style={{ color: "#c0392b" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!login.trim() || !password || loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
          style={{ background: cfg.color, fontFamily: "var(--font-sans)" }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "var(--color-background)",
  color: "var(--color-foreground)",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--font-body)",
}
