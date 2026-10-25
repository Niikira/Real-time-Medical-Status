import { useState } from "react"
import type { Connection } from "../store"
import type { Patient, Status } from "../types"
import ConnectionBanner from "./ConnectionBanner"
import StaffUserBadge from "./StaffUserBadge"

const ALL_STATUSES: Status[] = [
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
  next: Status | null
}> = {
  Aguardando: {
    label: "Aguardando",
    color: "#8fa8a0",
    bg: "#f0f5f4",
    icon: "🕐",
    next: "Em Preparação",
  },
  "Em Preparação": {
    label: "Em Preparação",
    color: "#e67e22",
    bg: "#fdf3e7",
    icon: "🔧",
    next: "Em Cirurgia",
  },
  "Em Cirurgia": {
    label: "Em Cirurgia",
    color: "#c0392b",
    bg: "#fdecea",
    icon: "⚕️",
    next: "RPA",
  },
  RPA: {
    label: "Recuperação (RPA)",
    color: "#8e44ad",
    bg: "#f5eef8",
    icon: "💊",
    next: "No Quarto",
  },
  "No Quarto": {
    label: "No Quarto",
    color: "#2980b9",
    bg: "#eaf4fb",
    icon: "🛏️",
    next: "Alta",
  },
  Alta: {
    label: "Alta",
    color: "#27ae60",
    bg: "#eafaf1",
    icon: "✅",
    next: null,
  },
}

export default function EnfermeiroView({
  patients,
  connection,
  error,
  userName,
  onLogout,
  onUpdateStatus,
}: {
  patients: Patient[]
  connection: Connection
  error: string
  userName: string
  onLogout: () => void
  onUpdateStatus: (id: string, status: Status) => Promise<void>
}) {
  const [confirmState, setConfirmState] = useState<{
    patientId: string
    newStatus: Status
  } | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<Status | "Todos">("Todos")

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.initials.toLowerCase().includes(search.toLowerCase()) ||
      p.procedure.toLowerCase().includes(search.toLowerCase()) ||
      p.token.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "Todos" || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const confirm = () => {
    if (confirmState) {
      onUpdateStatus(confirmState.patientId, confirmState.newStatus)
      setConfirmState(null)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <div
        className="safe-header-top border-b"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 text-lg"
              style={{ background: "#eaf4fb" }}
            >
              🩺
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="font-bold text-base truncate"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-foreground)",
                }}
              >
                Painel de Enfermagem
              </h1>
              <p
                className="text-xs"
                style={{ color: "var(--color-foreground-soft)" }}
              >
                {patients.filter((p) => p.status !== "Alta").length} pacientes
                ativos
              </p>
            </div>
            <StaffUserBadge name={userName} onLogout={onLogout} />
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="7"
                cy="7"
                r="4.5"
                stroke="var(--color-muted)"
                strokeWidth="1.5"
              />
              <path
                d="M10.5 10.5l2.5 2.5"
                stroke="var(--color-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por iniciais, procedimento ou token…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(["Todos", ...ALL_STATUSES] as (Status | "Todos")[]).map((s) => {
              const active = filterStatus === s
              const cfg = s !== "Todos" ? STATUS_CONFIG[s] : null
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    background: active
                      ? (cfg?.color ?? "#2980b9")
                      : "var(--color-background)",
                    color: active ? "white" : "var(--color-foreground-soft)",
                    borderColor: active
                      ? (cfg?.color ?? "#2980b9")
                      : "var(--color-border)",
                  }}
                >
                  {s === "Todos" ? "Todos" : cfg!.icon + " " + cfg!.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <ConnectionBanner connection={connection} error={error} />

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid w-full grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 && (
            <div
              className="text-center py-12"
              style={{ color: "var(--color-muted)" }}
            >
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm">Nenhum paciente encontrado.</p>
            </div>
          )}
          {filtered.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onAdvance={() => {
                const next = STATUS_CONFIG[patient.status].next
                if (next)
                  setConfirmState({ patientId: patient.id, newStatus: next })
              }}
              onManual={(status) =>
                setConfirmState({ patientId: patient.id, newStatus: status })
              }
            />
          ))}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmState &&
        (() => {
          const patient = patients.find((p) => p.id === confirmState.patientId)
          if (!patient) return null
          const cfg = STATUS_CONFIG[confirmState.newStatus]
          return (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center sm:p-6"
              style={{
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(2px)",
              }}
            >
              <div
                className="w-full max-w-lg mx-auto rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl sm:p-6"
                style={{ background: "var(--color-surface)" }}
              >
                <div
                  className="w-12 h-1 rounded-full mx-auto mb-6"
                  style={{ background: "var(--color-border)" }}
                />
                <h3
                  className="font-bold text-base mb-1"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-foreground)",
                  }}
                >
                  Confirmar atualização
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--color-foreground-soft)" }}
                >
                  Paciente <strong>{patient.initials}</strong> ·{" "}
                  {patient.procedure}
                </p>
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl mb-5"
                  style={{ background: cfg.bg }}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                      style={{ color: cfg.color }}
                    >
                      Novo status
                    </div>
                    <div
                      className="font-bold text-base"
                      style={{
                        color: cfg.color,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {cfg.label}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmState(null)}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-sm border"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-foreground-soft)",
                      background: "var(--color-background)",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirm}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white"
                    style={{ background: cfg.color }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}

function PatientCard({
  patient,
  onAdvance,
  onManual,
}: {
  patient: Patient
  onAdvance: () => void
  onManual: (s: Status) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[patient.status]
  const hasNext = cfg.next !== null

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            background: cfg.bg,
            color: cfg.color,
            fontFamily: "var(--font-sans)",
          }}
        >
          {patient.initials.split(".")[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-sm truncate"
            style={{
              color: "var(--color-foreground)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Paciente {patient.initials}
          </div>
          <div
            className="text-xs truncate"
            style={{ color: "var(--color-foreground-soft)" }}
          >
            {patient.procedure} · {patient.admittedAt}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.icon}{" "}
            {patient.status === "RPA" ? "RPA" : patient.status.split(" ")[0]}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: "var(--color-background)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              <path
                d="M3 5l4 4 4-4"
                stroke="var(--color-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick advance button (always visible) */}
      {hasNext && (
        <div className="px-4 pb-3">
          <button
            onClick={onAdvance}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-98"
            style={{ background: STATUS_CONFIG[cfg.next!].color }}
          >
            Avançar para: {STATUS_CONFIG[cfg.next!].icon}{" "}
            {STATUS_CONFIG[cfg.next!].label}
          </button>
        </div>
      )}

      {/* Expanded: all statuses */}
      {expanded && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--color-muted)" }}
          >
            Definir status manualmente
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => {
              const scfg = STATUS_CONFIG[s]
              const isActive = s === patient.status
              return (
                <button
                  key={s}
                  onClick={() => !isActive && onManual(s)}
                  disabled={isActive}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                  style={{
                    background: isActive ? scfg.bg : "var(--color-background)",
                    color: isActive
                      ? scfg.color
                      : "var(--color-foreground-soft)",
                    borderColor: isActive ? scfg.color : "var(--color-border)",
                    opacity: isActive ? 1 : 0.85,
                  }}
                >
                  {scfg.icon} {scfg.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
