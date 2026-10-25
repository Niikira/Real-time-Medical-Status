import { ROUTES } from "./routes"
import { usePatients, useSession } from "./store"
import type { Session } from "./types"
import AcompanhanteView from "./views/AcompanhanteView"
import EnfermeiroView from "./views/EnfermeiroView"
import LoginView from "./views/LoginView"
import RecepcionistaView from "./views/RecepcionistaView"

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "").toLowerCase()

  // O acompanhante não carrega a lista de pacientes: consulta só o seu token.
  if (path === ROUTES.acompanhante) return <AcompanhanteView />
  if (path === ROUTES.enfermeiro) return <EnfermeiroPage />
  if (path === ROUTES.recepcionista) return <RecepcionistaPage />

  return <InvalidLink />
}

// As telas da equipe só abrem depois do login com o perfil certo.
function EnfermeiroPage() {
  const { session, login, logout } = useSession("enfermeiro")
  if (!session) return <LoginView role="enfermeiro" onLogin={login} />
  return <EnfermeiroScreen session={session} onLogout={logout} />
}

function EnfermeiroScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { patients, connection, error, updateStatus } = usePatients(session.token, onLogout)
  return (
    <EnfermeiroView
      patients={patients}
      connection={connection}
      error={error}
      userName={session.user.name}
      onLogout={onLogout}
      onUpdateStatus={updateStatus}
    />
  )
}

function RecepcionistaPage() {
  const { session, login, logout } = useSession("recepcionista")
  if (!session) return <LoginView role="recepcionista" onLogin={login} />
  return <RecepcionistaScreen session={session} onLogout={logout} />
}

function RecepcionistaScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { patients, connection, error, addPatient } = usePatients(session.token, onLogout)
  return (
    <RecepcionistaView
      patients={patients}
      connection={connection}
      error={error}
      userName={session.user.name}
      onLogout={onLogout}
      onAddPatient={addPatient}
    />
  )
}

// Exibida para qualquer endereço que não seja um dos três links acima.
// Não lista os perfis, para que ninguém chegue a uma área que não é a sua.
function InvalidLink() {
  return (
    <div
      className="safe-top min-h-dvh flex flex-col items-center justify-center px-4 py-8 text-center"
      style={{ background: "var(--color-background)" }}
    >
      <div className="text-4xl mb-3">🔗</div>
      <h1
        className="text-xl font-bold"
        style={{ fontFamily: "var(--font-sans)", color: "var(--color-foreground)" }}
      >
        Link inválido
      </h1>
      <p
        className="text-sm mt-2 max-w-sm"
        style={{ color: "var(--color-foreground-soft)" }}
      >
        Use o link de acesso que você recebeu. Se for acompanhante, procure a
        recepção do hospital para receber o seu código.
      </p>
    </div>
  )
}
