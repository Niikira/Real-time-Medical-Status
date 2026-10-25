import type { Connection } from "../store"

// Aviso para a equipe quando a API está fora do ar ou algo não foi salvo.
export default function ConnectionBanner({
  connection,
  error,
}: {
  connection: Connection
  error: string
}) {
  const message =
    error ||
    (connection === "offline"
      ? "Sem conexão com o servidor. Tentando reconectar…"
      : "")
  if (!message) return null
  return (
    <div
      role="alert"
      className="px-4 py-2 text-xs text-center"
      style={{ background: "#fdecea", color: "#c0392b" }}
    >
      {message}
    </div>
  )
}
