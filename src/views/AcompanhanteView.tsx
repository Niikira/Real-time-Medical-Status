import { useEffect, useState } from "react"
import { useCompanion } from "../store"
import type { CompanionPatient, Status } from "../types"

const STATUS_STEPS: Status[] = [
  "Aguardando",
  "Em Preparação",
  "Em Cirurgia",
  "RPA",
  "No Quarto",
  "Alta",
]

const STATUS_CONFIG: Record<Status, {
  label: string
  color: string
  bg: string
  icon: string
  desc: string
}> = {
  Aguardando: {
    label: "Aguardando",
    color: "#8fa8a0",
    bg: "#f0f5f4",
    icon: "🕐",
    desc: "Paciente aguardando chamada para o procedimento.",
  },
  "Em Preparação": {
    label: "Em Preparação",
    color: "#e67e22",
    bg: "#fdf3e7",
    icon: "🔧",
    desc: "Paciente sendo preparado pela equipe de enfermagem.",
  },
  "Em Cirurgia": {
    label: "Em Cirurgia",
    color: "#c0392b",
    bg: "#fdecea",
    icon: "⚕️",
    desc: "Procedimento cirúrgico em andamento.",
  },
  RPA: {
    label: "Recuperação (RPA)",
    color: "#8e44ad",
    bg: "#f5eef8",
    icon: "💊",
    desc: "Paciente na sala de recuperação pós-anestésica.",
  },
  "No Quarto": {
    label: "No Quarto",
    color: "#2980b9",
    bg: "#eaf4fb",
    icon: "🛏️",
    desc: "Paciente internado em quarto. Em breve poderá receber visitas.",
  },
  Alta: {
    label: "Alta Hospitalar",
    color: "#27ae60",
    bg: "#eafaf1",
    icon: "✅",
    desc: "Paciente recebeu alta. Dirija-se à recepção para orientações.",
  },
}

function tokenFromUrl() {
  return (
    new URLSearchParams(window.location.search).get("token")?.trim().toUpperCase() ?? ""
  )
}

function setTokenInUrl(token: string) {
  const url = new URL(window.location.href)
  if (token) url.searchParams.set("token", token)
  else url.searchParams.delete("token")
  window.history.replaceState(null, "", url)
}

export default function AcompanhanteView() {
  // O token vem do link do e-mail (?token=) ou é digitado. A consulta e as
  // atualizações em tempo real ficam no useCompanion.
  const [token, setToken] = useState(tokenFromUrl)
  const [input, setInput] = useState(token)
  const [typed, setTyped] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const companion = useCompanion(token, attempt)

  useEffect(() => {
    if (companion.state === "ok") setTokenInUrl(token)
  }, [companion.state, token])

  const error =
    companion.state === "notfound"
      ? typed
        ? "Token não encontrado. Verifique o código e tente novamente."
        : "Link expirado ou inválido. Confira o código com a recepção."
      : companion.state === "offline"
        ? "Sem conexão com o servidor. Tente novamente em instantes."
        : ""

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTyped(true)
    setToken(input.trim().toUpperCase())
    setAttempt((n) => n + 1)
  }

  if (companion.state === "ok") {
    return (
      <PatientStatus
        patient={companion.patient}
        live={companion.live}
        onReset={() => {
          setToken("")
          setInput("")
          setTokenInUrl("")
        }}
      />
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <Header title="Acompanhante" />

      <div className="flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👨‍👩‍👧</div>
            <h2
              className="text-xl font-bold"
              style={{
                fontFamily: "var(--font-sans)",
                color: "var(--color-foreground)",
              }}
            >
              Onde está seu familiar?
            </h2>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--color-foreground-soft)" }}
            >
              Digite o token que você recebeu na recepção para acompanhar o
              status em tempo real.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--color-foreground-soft)" }}
              >
                Código de Acesso
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value.toUpperCase())
                  if (error) setToken("") // limpa o aviso de erro
                }}
                placeholder="Ex: A7K3P2"
                maxLength={6}
                className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest rounded-2xl border outline-none transition-all"
                style={{
                  background: "var(--color-surface)",
                  borderColor: error ? "#c0392b" : "var(--color-border)",
                  color: "var(--color-foreground)",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.3em",
                }}
              />
              {error && (
                <p
                  className="text-xs mt-2 text-center"
                  style={{ color: "#c0392b" }}
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={input.length < 6 || companion.state === "loading"}
              className="w-full py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: "var(--color-primary)",
                color: "white",
                fontFamily: "var(--font-sans)",
              }}
            >
              {companion.state === "loading" ? "Consultando…" : "Consultar Status"}
            </button>
          </form>

          <div
            className="mt-8 p-4 rounded-xl"
            style={{ background: "var(--color-primary-light)" }}
          >
            <p className="text-xs" style={{ color: "var(--color-primary)" }}>
              <strong>Privacidade:</strong> Apenas as iniciais do nome do
              paciente são exibidas, conforme a LGPD.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientStatus({
  patient,
  live,
  onReset,
}: {
  patient: CompanionPatient
  live: boolean
  onReset: () => void
}) {
  const currentIdx = STATUS_STEPS.indexOf(patient.status)
  const cfg = STATUS_CONFIG[patient.status]

  // Horário em que cada etapa começou (a última vez que o paciente entrou nela).
  const stepTime: Partial<Record<Status, string>> = {}
  for (const h of patient.history) {
    stepTime[h.status] = new Date(h.at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <Header title="Status do Paciente" />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Patient Card */}
          <div
            className="rounded-2xl p-5 mb-6 border"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                style={{
                  background: "var(--color-primary)",
                  color: "white",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {patient.initials.split(".")[0]}
              </div>
              <div>
                <div
                  className="font-bold text-base"
                  style={{
                    color: "var(--color-foreground)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Paciente {patient.initials}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-foreground-soft)" }}
                >
                  {patient.procedure} · Admissão {patient.admittedAt}
                </div>
              </div>
            </div>

            {/* Current status pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </div>
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--color-foreground-soft)" }}
            >
              {cfg.desc}
            </p>
            <p
              className="mt-3 flex items-center gap-1.5 text-xs"
              style={{ color: "var(--color-muted)" }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: live ? "#27ae60" : "#e67e22" }}
              />
              {live
                ? "Atualizando em tempo real"
                : "Sem conexão. Tentando reconectar…"}
            </p>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Linha do Tempo
            </h3>
            <div className="flex flex-col gap-0">
              {STATUS_STEPS.map((step, idx) => {
                const stepCfg = STATUS_CONFIG[step]
                const isDone = idx < currentIdx
                const isCurrent = idx === currentIdx

                return (
                  <div key={step} className="flex gap-4 items-start">
                    {/* Connector */}
                    <div
                      className="flex flex-col items-center"
                      style={{ width: 28, minWidth: 28 }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                        style={{
                          background: isDone
                            ? "var(--color-primary)"
                            : isCurrent
                              ? stepCfg.color
                              : "var(--color-border)",
                          color:
                            isDone || isCurrent
                              ? "white"
                              : "var(--color-muted)",
                          border: isCurrent
                            ? `2px solid ${stepCfg.color}`
                            : "none",
                          boxShadow: isCurrent
                            ? `0 0 0 4px ${stepCfg.bg}`
                            : "none",
                        }}
                      >
                        {isDone ? "✓" : stepCfg.icon}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{
                            minHeight: 24,
                            background: isDone
                              ? "var(--color-primary)"
                              : "var(--color-border)",
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pb-5 flex-1 min-w-0">
                      <div
                        className="text-sm font-semibold"
                        style={{
                          color: isCurrent
                            ? stepCfg.color
                            : isDone
                              ? "var(--color-foreground)"
                              : "var(--color-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {stepCfg.label}
                        {(isDone || isCurrent) && stepTime[step] && (
                          <span
                            className="ml-2 text-xs font-normal"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {stepTime[step]}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-normal">
                            ← agora
                          </span>
                        )}
                      </div>
                      {isCurrent && (
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--color-foreground-soft)" }}
                        >
                          {stepCfg.desc}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ward info */}
          {(patient.status === "No Quarto" || patient.status === "Alta") && (
            <div
              className="p-4 rounded-xl mb-6"
              style={{ background: "#eafaf1", border: "1px solid #a9dfbf" }}
            >
              <div
                className="text-sm font-semibold"
                style={{ color: "#27ae60" }}
              >
                📍 {patient.ward}
              </div>
              <div className="text-xs mt-1" style={{ color: "#1e8449" }}>
                {patient.status === "No Quarto"
                  ? "Verifique com a enfermagem o horário de visitas."
                  : "Dirija-se à recepção para finalizar a alta."}
              </div>
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground-soft)",
              background: "var(--color-surface)",
            }}
          >
            Consultar outro token
          </button>
        </div>
      </div>
    </div>
  )
}

function Header({ title }: { title: string }) {
  return (
    <div
      className="safe-header-top border-b"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-4 sm:px-6 lg:px-8">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
          style={{ background: "var(--color-primary)" }}
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 6v20M6 16h20"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1
          className="font-bold text-base truncate"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-foreground)",
          }}
        >
          {title}
        </h1>
      </div>
    </div>
  )
}
