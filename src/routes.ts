// Não existe tela inicial: cada perfil acessa a plataforma pelo seu próprio link.
//   /acompanhante               → consulta pelo código
//   /acompanhante?token=A7K3P2  → link único enviado ao familiar (RF001)
//   /enfermeiro                 → painel de enfermagem
//   /recepcionista              → admissão de pacientes e geração de token
export const ROUTES = {
  acompanhante: "/acompanhante",
  enfermeiro: "/enfermeiro",
  recepcionista: "/recepcionista",
} as const

export function companionLink(token: string) {
  return `${window.location.origin}${ROUTES.acompanhante}?token=${token}`
}
