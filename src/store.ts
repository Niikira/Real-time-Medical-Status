import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "./api"
import type { CompanionPatient, NewPatient, Patient, Role, Session, Status } from "./types"

// Os dados vêm da API Python (pasta backend/). As mudanças chegam em tempo
// real por Server-Sent Events; se a conexão cair, o navegador reconecta
// sozinho e a lista é recarregada para não perder nada.

export type Connection = "conectando" | "online" | "offline"

function upsert(list: Patient[], p: Patient): Patient[] {
  return list.some((x) => x.id === p.id)
    ? list.map((x) => (x.id === p.id ? p : x))
    : [p, ...list]
}

// Login da equipe. Cada tela guarda a sua sessão, então dá para ter a
// recepção e a enfermagem abertas no mesmo navegador com usuários diferentes.
const sessionKey = (role: Role) => `acompaci:sessao:${role}`

function loadSession(role: Role): Session | null {
  try {
    const raw = localStorage.getItem(sessionKey(role))
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function useSession(role: Role) {
  const [session, setSession] = useState<Session | null>(() => loadSession(role))

  const login = async (user: string, password: string) => {
    const s = await api.login(user, password)
    if (s.user.role !== role) {
      throw new ApiError(403, "Este usuário não tem acesso a esta tela.")
    }
    try {
      localStorage.setItem(sessionKey(role), JSON.stringify(s))
    } catch {
      // sem localStorage: a sessão vale até fechar a aba
    }
    setSession(s)
  }

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(sessionKey(role))
    } catch {
      // ignora
    }
    setSession(null)
  }, [role])

  return { session, login, logout }
}

// Recepção e enfermagem: todos os pacientes, com nome completo.
// Se o servidor recusar o token (expirado ou inválido), chama onUnauthorized.
export function usePatients(token: string, onUnauthorized: () => void) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [connection, setConnection] = useState<Connection>("conectando")
  const [error, setError] = useState("")

  const handleError = useCallback(
    (e: ApiError, prefix = "") => {
      if (e.status === 401) onUnauthorized()
      else setError(prefix + e.message)
    },
    [onUnauthorized],
  )

  const reload = useCallback(
    () =>
      api.listPatients(token).then(
        (list) => {
          setPatients(list)
          setError("")
        },
        (e: ApiError) => handleError(e),
      ),
    [token, handleError],
  )

  useEffect(() => {
    reload()
    const events = new EventSource(api.staffEventsUrl(token))
    events.onopen = () => {
      setConnection("online")
      reload() // a cada (re)conexão, sincroniza o que mudou enquanto estava fora
    }
    events.onerror = () => {
      setConnection("offline")
      // Fechado de vez = o servidor recusou (ex.: login expirou). O reload
      // confirma e, se for 401, leva de volta à tela de login.
      if (events.readyState === EventSource.CLOSED) reload()
    }
    events.addEventListener("paciente", (e) => {
      setPatients((prev) => upsert(prev, JSON.parse((e as MessageEvent).data)))
    })
    return () => events.close()
  }, [reload, token])

  const updateStatus = async (id: string, status: Status) => {
    // Atualiza na hora e confirma com o servidor; se falhar, volta ao real.
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    try {
      const saved = await api.updateStatus(token, id, status)
      setPatients((prev) => upsert(prev, saved))
      setError("")
    } catch (e) {
      handleError(e as ApiError, "Não foi possível salvar o status. ")
      reload()
    }
  }

  const addPatient = async (data: NewPatient) => {
    let result
    try {
      result = await api.admitPatient(token, data)
    } catch (e) {
      if ((e as ApiError).status === 401) onUnauthorized()
      throw e
    }
    setPatients((prev) => upsert(prev, result.patient))
    return result
  }

  return { patients, connection, error, updateStatus, addPatient }
}

export type CompanionState =
  | { state: "idle" | "loading" | "notfound" | "offline"; patient?: undefined }
  | { state: "ok"; patient: CompanionPatient; live: boolean }

// Acompanhante: só o paciente do token, e só com as iniciais (LGPD).
// `attempt` permite repetir a consulta do mesmo código.
export function useCompanion(token: string, attempt = 0): CompanionState {
  const [result, setResult] = useState<CompanionState>({ state: "idle" })

  useEffect(() => {
    if (!token) {
      setResult({ state: "idle" })
      return
    }
    let cancelled = false
    let events: EventSource | null = null

    const fail = (e: ApiError) => {
      if (cancelled) return
      if (e.status === 404) {
        events?.close()
        setResult({ state: "notfound" })
      } else {
        setResult((prev) =>
          prev.state === "ok" ? { ...prev, live: false } : { state: "offline" },
        )
      }
    }
    const fetchPatient = () =>
      api.companion(token).then((patient) => {
        if (!cancelled) setResult({ state: "ok", patient, live: true })
      }, fail)

    setResult({ state: "loading" })
    fetchPatient().then(() => {
      if (cancelled) return
      events = new EventSource(api.companionEventsUrl(token))
      events.onopen = () => fetchPatient()
      events.onerror = () =>
        setResult((prev) => (prev.state === "ok" ? { ...prev, live: false } : prev))
      events.addEventListener("paciente", (e) => {
        const patient = JSON.parse((e as MessageEvent).data) as CompanionPatient
        setResult({ state: "ok", patient, live: true })
      })
    })

    return () => {
      cancelled = true
      events?.close()
    }
  }, [token, attempt])

  return result
}
