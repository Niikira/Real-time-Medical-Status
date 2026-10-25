export type Status =
  | "Aguardando"
  | "Em Preparação"
  | "Em Cirurgia"
  | "RPA"
  | "No Quarto"
  | "Alta"

export type Patient = {
  id: string
  initials: string
  fullName: string
  token: string
  status: Status
  procedure: string
  admittedAt: string
  ward: string
}

// O que o acompanhante recebe da API: sem nome completo nem id (LGPD).
export type CompanionPatient = Pick<
  Patient,
  "token" | "initials" | "status" | "procedure" | "admittedAt" | "ward"
> & {
  history: { status: Status; at: string }[]
}

export type NewPatient = {
  fullName: string
  procedure: string
  ward: string
  email: string
}

// Resultado do envio automático do token por e-mail na admissão.
//   enviado   → o back-end enviou o e-mail
//   simulado  → SMTP não configurado no back-end (e-mail só aparece no terminal)
//   falhou    → o servidor de e-mail recusou ou não respondeu
//   sem_email → nenhum e-mail foi informado
export type EmailResult = "enviado" | "simulado" | "falhou" | "sem_email"

export type Role = "recepcionista" | "enfermeiro"

export type StaffUser = { name: string; login: string; role: Role }

// Login da equipe: o token (JWT) vai em todas as chamadas da recepção e da enfermagem.
export type Session = { token: string; user: StaffUser }
