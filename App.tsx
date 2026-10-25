import { useState } from "react"
import AcompanhanteView from "./views/AcompanhanteView"
import EnfermeiroView from "./views/EnfermeiroView"
import RecepcionistaView from "./views/RecepcionistaView"

type Role = null | "acompanhante" | "enfermeiro" | "recepcionista"
const initialPatients = [
  {
    id: "1",
    initials: "M.S.",
    fullName: "Maria da Silva Santos",
    token: "A7K3P2",
    status: "Em Cirurgia" as Status,
    procedure: "Colecistectomia",
    admittedAt: "09:15",
    ward: "Bloco Cirúrgico 2",
  },
  {
    id: "2",
    initials: "J.O.",
    fullName: "João Carlos Oliveira",
    token: "B9R1X5",
    status: "RPA" as Status,
    procedure: "Apendicectomia",
    admittedAt: "07:30",
    ward: "Bloco Cirúrgico 1",
  },
  {
    id: "3",
    initials: "A.F.",
    fullName: "Ana Paula Ferreira",
    token: "C4M8Y7",
    status: "Em Preparação" as Status,
    procedure: "Hérnia Inguinal",
    admittedAt: "10:45",
    ward: "Bloco Cirúrgico 3",
  },
  {
    id: "4",
    initials: "R.C.",
    fullName: "Roberto Lima Costa",
    token: "D2N6Q9",
    status: "No Quarto" as Status,
    procedure: "Artroscopia Joelho",
    admittedAt: "06:00",
    ward: "Ala C — Quarto 412",
  },
]

export type Status = "Aguardando" | "Em Preparação" | "Em Cirurgia" | "RPA" | "No Quarto" | "Alta"
export type Patient = typeof initialPatients[0]

export default function App() {
  const [role, setRole] = useState<Role>(null)
  const [patients, setPatients] = useState<Patient[]>(initialPatients)

  const updateStatus = (id: string, status: Status) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  // Função para adicionar novo paciente gerado pela recepção
  const addPatient = (patient: Patient) => {
    setPatients((prev) => [patient, ...prev])
  }

  if (role === "acompanhante")
    return <AcompanhanteView patients={patients} onBack={() => setRole(null)} />
  if (role === "enfermeiro")
    return (
      <EnfermeiroView
        patients={patients}
        onUpdateStatus={updateStatus}
        onBack={() => setRole(null)}
      />
    )
  if (role === "recepcionista")
    return (
      <RecepcionistaView
        patients={patients}
        onAddPatient={addPatient}
        onBack={() => setRole(null)}
      />
    ) // <--- Adicionado

  if (role === "acompanhante")
    return <AcompanhanteView patients={patients} onBack={() => setRole(null)} />
  if (role === "enfermeiro")
    return (
      <EnfermeiroView
        patients={patients}
        onUpdateStatus={updateStatus}
        onBack={() => setRole(null)}
      />
    )

  return (
    <div
      className="safe-top min-h-dvh flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      style={{ background: "var(--color-background)" }}
    >
      <div className="w-full max-w-5xl">
        {/* Logo / Brand */}
        <div className="mb-8 text-center sm:mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "var(--color-primary)" }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 6v20M6 16h20"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--color-foreground)",
            }}
          >
            PacienteVivo
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-foreground-soft)" }}
          >
            Acompanhamento em tempo real · SUS
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RoleCard
            icon="👨‍👩‍👧"
            title="Acompanhante"
            desc="Acompanhe o estado do seu familiar"
            onClick={() => setRole("acompanhante")}
            accent="#0f6b5c"
          />
          <RoleCard
            icon="🩺"
            title="Enfermeiro(a)"
            desc="Atualize o status dos pacientes"
            onClick={() => setRole("enfermeiro")}
            accent="#2980b9"
          />
          <RoleCard
            icon="🗂️"
            title="Recepção"
            desc="Admitir pacientes e gerar tokens"
            onClick={() => setRole("recepcionista")}
            accent="#8e44ad"
          />
        </div>

        <p
          className="mt-8 text-center text-xs"
          style={{ color: "var(--color-muted)" }}
        >
          Dados protegidos conforme LGPD · Versão MVP
        </p>
      </div>
    </div>
  )
}

function RoleCard({
  icon,
  title,
  desc,
  onClick,
  accent,
}: {
  icon: string
  title: string
  desc: string
  onClick: () => void
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full min-w-0 text-left flex items-center gap-4 px-4 py-4 sm:px-5 rounded-2xl border transition-all active:scale-98"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-border)")
      }
    >
      <span
        className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
        style={{ background: accent + "15" }}
      >
        {icon}
      </span>
      <div>
        <div
          className="font-semibold text-sm"
          style={{
            color: "var(--color-foreground)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--color-foreground-soft)" }}
        >
          {desc}
        </div>
      </div>
      <svg
        className="ml-auto shrink-0"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M6 3l5 5-5 5"
          stroke="var(--color-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
