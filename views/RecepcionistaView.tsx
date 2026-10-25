import { useState } from "react"
import type { Patient, Status } from "../App"

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("")
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase() + "."
  return (parts[0][0] + "." + parts[parts.length - 1][0] + ".").toUpperCase()
}

const PROCEDURES = [
  "Colecistectomia",
  "Apendicectomia",
  "Hérnia Inguinal",
  "Artroscopia Joelho",
  "Cesariana",
  "Tireoidectomia",
  "Prostatectomia",
  "Cirurgia Cardíaca",
  "Outro Procedimento",
]

const STATUS_CONFIG: Record<Status, {
  label: string
  color: string
  bg: string
  icon: string
}> = {
  Aguardando: {
    label: "Aguardando",
    color: "#8fa8a0",
    bg: "#f0f5f4",
    icon: "🕐",
  },
  "Em Preparação": {
    label: "Em Preparação",
    color: "#e67e22",
    bg: "#fdf3e7",
    icon: "🔧",
  },
  "Em Cirurgia": {
    label: "Em Cirurgia",
    color: "#c0392b",
    bg: "#fdecea",
    icon: "⚕️",
  },
  RPA: {
    label: "Recuperação (RPA)",
    color: "#8e44ad",
    bg: "#f5eef8",
    icon: "💊",
  },
  "No Quarto": {
    label: "No Quarto",
    color: "#2980b9",
    bg: "#eaf4fb",
    icon: "🛏️",
  },
  Alta: { label: "Alta", color: "#27ae60", bg: "#eafaf1", icon: "✅" },
}

export default function RecepcionistaView({
  patients,
  onAddPatient,
  onBack,
}: {
  patients: Patient[]
  onAddPatient: (p: Patient) => void
  onBack: () => void
}) {
  const [name, setName] = useState("")
  const [procedure, setProcedure] = useState("")
  const [ward, setWard] = useState("")
  const [phone, setPhone] = useState("")
  const [generated, setGenerated] = useState<Patient | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const token = generateToken()
    const now = new Date()
    const admittedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const patient: Patient = {
      id: Date.now().toString(),
      initials: getInitials(name),
      fullName: name,
      token,
      status: "Aguardando",
      procedure: procedure || "Procedimento",
      admittedAt,
      ward: ward || "A definir",
    }
    onAddPatient(patient)
    setGenerated(patient)
    setCopied(false)
  }

  const reset = () => {
    setName("")
    setProcedure("")
    setWard("")
    setPhone("")
    setGenerated(null)
    setCopied(false)
  }

  const copyToken = () => {
    if (generated) {
      navigator.clipboard.writeText(generated.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const filtered = patients.filter(
    (p) =>
      p.initials.toLowerCase().includes(search.toLowerCase()) ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.procedure.toLowerCase().includes(search.toLowerCase()) ||
      p.token.toLowerCase().includes(search.toLowerCase()),
  )

  const stats = {
    total: patients.length,
    active: patients.filter((p) => p.status !== "Alta").length,
    inSurgery: patients.filter((p) => p.status === "Em Cirurgia").length,
    discharge: patients.filter((p) => p.status === "Alta").length,
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      {/* Top bar */}
      <header
        className="border-b px-8 py-4 flex items-center justify-between"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--color-foreground-soft)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3l-5 5 5 5"
                stroke="#8e44ad"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Voltar
          </button>
          <div
            className="w-px h-5"
            style={{ background: "var(--color-border)" }}
          />
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#8e44ad" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" />
                <rect
                  x="9"
                  y="9"
                  width="5"
                  height="5"
                  rx="1"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </div>
            <div>
              <h1
                className="font-bold text-sm leading-none"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "var(--color-foreground)",
                }}
              >
                PacienteVivo · Recepção
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-muted)" }}
              >
                Sistema de Acompanhamento Familiar · SUS
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "var(--color-muted)" }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "#27ae60" }}
          />
          Sistema online
          <span className="mx-2" style={{ color: "var(--color-border)" }}>
            ·
          </span>
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Admission form / token result */}
        <aside
          className="w-96 shrink-0 border-r flex flex-col overflow-y-auto"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          {!generated ? (
            <form onSubmit={submit} className="flex flex-col gap-0 h-full">
              <div
                className="px-6 pt-6 pb-4 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <h2
                  className="font-bold text-base"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-foreground)",
                  }}
                >
                  Admissão de Paciente
                </h2>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--color-foreground-soft)" }}
                >
                  Preencha os dados para gerar o token de acompanhamento.
                </p>
              </div>

              <div className="flex-1 px-6 py-5 flex flex-col gap-4">
                <FormField label="Nome completo" required>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Maria da Silva Santos"
                    style={fieldStyle}
                  />
                </FormField>

                <FormField label="Procedimento" required>
                  <select
                    required
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    style={fieldStyle}
                  >
                    <option value="">Selecionar…</option>
                    {PROCEDURES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Ala / Bloco cirúrgico">
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Bloco Cirúrgico 2"
                    style={fieldStyle}
                  />
                </FormField>

                <FormField label="E-mail do acompanhante">
                  <input
                    type="email"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="mariasilva@email.com"
                    style={fieldStyle}
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Para envio do token via E-mail.
                  </p>
                </FormField>

                <div
                  className="p-3 rounded-xl"
                  style={{ background: "#f5eef8", border: "1px solid #d7bde2" }}
                >
                  <p className="text-xs" style={{ color: "#8e44ad" }}>
                    <strong>LGPD:</strong> Apenas as iniciais do paciente serão
                    exibidas ao acompanhante. O token expira 24h após a alta.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  type="submit"
                  disabled={!name || !procedure}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
                  style={{
                    background: "#8e44ad",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Gerar Token de Acesso
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col h-full">
              <div
                className="px-6 pt-6 pb-4 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">✅</span>
                  <h2
                    className="font-bold text-base"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    Token gerado
                  </h2>
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-foreground-soft)" }}
                >
                  Paciente {generated.initials} · {generated.procedure}
                </p>
              </div>

              <div className="flex-1 px-6 py-5 flex flex-col gap-4">
                {/* Token card */}
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{ background: "#8e44ad" }}
                >
                  <div className="text-white text-xs font-semibold uppercase tracking-widest mb-2 opacity-75">
                    Código de Acesso
                  </div>
                  <div
                    className="text-white font-bold text-3xl tracking-widest mb-4"
                    style={{
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "0.3em",
                    }}
                  >
                    {generated.token}
                  </div>
                  <div
                    className="mx-auto w-28 h-28 rounded-xl flex items-center justify-center"
                    style={{ background: "white" }}
                  >
                    <QRPlaceholder token={generated.token} />
                  </div>
                  <div className="text-white text-xs mt-3 opacity-60">
                    Válido por 24h após a alta
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={copyToken}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={{
                    borderColor: copied ? "#27ae60" : "var(--color-border)",
                    color: copied ? "#27ae60" : "var(--color-foreground-soft)",
                    background: copied ? "#eafaf1" : "var(--color-background)",
                  }}
                >
                  {copied ? "✓ Copiado!" : "📋 Copiar código"}
                </button>

                {phone && (
                  <button
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all"
                    style={{
                      borderColor: "#25D366",
                      color: "#25D366",
                      background: "#f0fdf4",
                    }}
                    onClick={() =>
                      alert(
                        `SMS simulado para ${phone}: "Seu token de acompanhamento é ${generated.token}"`,
                      )
                    }
                  >
                    📱 Enviar por WhatsApp/SMS
                  </button>
                )}

                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-foreground-soft)" }}
                  >
                    <strong>Instrução:</strong> Informe ao acompanhante para
                    acessar o sistema e inserir o código{" "}
                    <strong>{generated.token}</strong>.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={reset}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "#8e44ad" }}
                >
                  Admitir outro paciente
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT: Patient table */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats bar */}
          <div
            className="flex gap-4 px-8 py-4 border-b"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            {[
              {
                label: "Total admitidos",
                value: stats.total,
                color: "var(--color-foreground)",
              },
              {
                label: "Pacientes ativos",
                value: stats.active,
                color: "#2980b9",
              },
              {
                label: "Em cirurgia",
                value: stats.inSurgery,
                color: "#c0392b",
              },
              { label: "Altas hoje", value: stats.discharge, color: "#27ae60" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col px-4 py-2.5 rounded-xl border"
                style={{
                  background: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  minWidth: 120,
                }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: s.color, fontFamily: "var(--font-sans)" }}
                >
                  {s.value}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-muted)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Search + table header */}
          <div className="flex items-center justify-between px-8 py-4">
            <h2
              className="font-bold text-sm"
              style={{
                fontFamily: "var(--font-sans)",
                color: "var(--color-foreground)",
              }}
            >
              Pacientes admitidos
            </h2>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="4"
                  stroke="var(--color-muted)"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 9l2.5 2.5"
                  stroke="var(--color-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar paciente ou token…"
                className="pl-8 pr-4 py-2 text-sm rounded-lg border outline-none"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-foreground)",
                  width: 260,
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: "var(--color-background)",
                    }}
                  >
                    {[
                      "Paciente",
                      "Procedimento",
                      "Admissão",
                      "Ala / Bloco",
                      "Token",
                      "Status",
                    ].map((col) => (
                      <th
                        key={col}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-16"
                        style={{ color: "var(--color-muted)" }}
                      >
                        <div className="text-2xl mb-2">🔍</div>
                        <p className="text-sm">Nenhum paciente encontrado.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, idx) => {
                      const cfg = STATUS_CONFIG[p.status]
                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom:
                              idx < filtered.length - 1
                                ? "1px solid var(--color-border)"
                                : "none",
                          }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                  background: "var(--color-primary-light)",
                                  color: "var(--color-primary)",
                                }}
                              >
                                {p.initials.split(".")[0]}
                              </div>
                              <div>
                                <div
                                  className="font-semibold text-xs"
                                  style={{
                                    color: "var(--color-foreground)",
                                    fontFamily: "var(--font-sans)",
                                  }}
                                >
                                  Paciente {p.initials}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: "var(--color-muted)" }}
                                >
                                  Nome protegido · LGPD
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-5 py-3.5 text-xs"
                            style={{ color: "var(--color-foreground-soft)" }}
                          >
                            {p.procedure}
                          </td>
                          <td
                            className="px-5 py-3.5 text-xs font-mono"
                            style={{ color: "var(--color-foreground-soft)" }}
                          >
                            {p.admittedAt}
                          </td>
                          <td
                            className="px-5 py-3.5 text-xs"
                            style={{ color: "var(--color-foreground-soft)" }}
                          >
                            {p.ward}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="font-mono font-bold text-xs px-2 py-1 rounded-lg"
                              style={{
                                background: "var(--color-background)",
                                color: "#8e44ad",
                                letterSpacing: "0.12em",
                              }}
                            >
                              {p.token}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
  required,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: "var(--color-foreground-soft)" }}
      >
        {label}
        {required && <span style={{ color: "#c0392b" }}> *</span>}
      </label>
      {children}
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
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--font-body)",
}

function QRPlaceholder({ token }: { token: string }) {
  const seed = token.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const size = 7
  const cells = Array.from({ length: size * size }, (_, i) => {
    const row = Math.floor(i / size)
    const col = i % size
    const inFinder =
      (row < 2 && col < 2) ||
      (row < 2 && col >= size - 2) ||
      (row >= size - 2 && col < 2)
    if (inFinder) return true
    return (seed * (i + 1) * 37) % 17 > 8
  })
  return (
    <svg width="88" height="88" viewBox={`0 0 ${size * 12} ${size * 12}`}>
      {cells.map((filled, i) => {
        const row = Math.floor(i / size)
        const col = i % size
        return filled ? (
          <rect
            key={i}
            x={col * 12 + 1}
            y={row * 12 + 1}
            width="10"
            height="10"
            rx="1.5"
            fill="#8e44ad"
          />
        ) : null
      })}
    </svg>
  )
}
