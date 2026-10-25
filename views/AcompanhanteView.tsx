import { useState } from "react"
import type { Patient, Status } from "../App"

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

export default function AcompanhanteView({
  patients,
  onBack,
}: {
  patients: Patient[]
  onBack: () => void
}) {
  const [token, setToken] = useState("")
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [patient, setPatient] = useState<Patient | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = patients.find(
      (p) => p.token.toUpperCase() === input.trim().toUpperCase(),
    )
    if (found) {
      setPatient(found)
      setToken(input.trim().toUpperCase())
      setError("")
    } else {
      setError("Token não encontrado. Verifique o código e tente novamente.")
    }
  }

  if (patient) {
    return (
      <PatientStatus
        patient={patient}
        onReset={() => {
          setPatient(null)
          setInput("")
          setToken("")
        }}
        onBack={onBack}
      />
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <Header
        title="Acompanhante"
        onBack={onBack}
        color="var(--color-primary)"
      />

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
                  setError("")
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
              disabled={input.length < 6}
              className="w-full py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: "var(--color-primary)",
                color: "white",
                fontFamily: "var(--font-sans)",
              }}
            >
              Consultar Status
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
  onReset,
  onBack,
}: {
  patient: Patient
  onReset: () => void
  onBack: () => void
}) {
  const currentIdx = STATUS_STEPS.indexOf(patient.status)
  const cfg = STATUS_CONFIG[patient.status]

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <Header
        title="Status do Paciente"
        onBack={onBack}
        color="var(--color-primary)"
      />

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
                const isPending = idx > currentIdx

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

function Header({
  title,
  onBack,
  color,
}: {
  title: string
  onBack: () => void
  color: string
}) {
  return (
    <div
      className="safe-header-top border-b"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pb-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0"
          style={{ background: "var(--color-background)" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4l-5 5 5 5"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
