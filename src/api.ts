import type {
  CompanionPatient,
  EmailResult,
  NewPatient,
  Patient,
  Session,
  StaffUser,
  Status,
} from "./types"

// Em desenvolvimento a API roda em outra porta; em produção, sirva a API e o
// front-end no mesmo domínio ou defina VITE_API_URL no build.
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "")

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor.")
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = typeof body?.detail === "string" ? body.detail : `Erro ${res.status}`
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export const api = {
  login: (login: string, password: string) =>
    request<{ token: string; user: StaffUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }) as Promise<Session>,

  // Rotas da equipe: exigem o token do login.
  listPatients: (token: string) => request<Patient[]>("/api/pacientes", {}, token),

  admitPatient: (token: string, data: NewPatient) =>
    request<{ patient: Patient; email: EmailResult }>(
      "/api/pacientes",
      { method: "POST", body: JSON.stringify(data) },
      token,
    ),

  updateStatus: (token: string, id: string, status: Status) =>
    request<Patient>(
      `/api/pacientes/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),

  companion: (token: string) =>
    request<CompanionPatient>(`/api/acompanhante/${encodeURIComponent(token)}`),

  // Fluxos de tempo real (Server-Sent Events). O EventSource não envia
  // cabeçalhos, então o token da equipe vai na URL.
  staffEventsUrl: (token: string) =>
    `${API_URL}/api/eventos/equipe?access_token=${encodeURIComponent(token)}`,
  companionEventsUrl: (token: string) =>
    `${API_URL}/api/acompanhante/${encodeURIComponent(token)}/eventos`,
}
