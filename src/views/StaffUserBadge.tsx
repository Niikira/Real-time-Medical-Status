// Nome de quem está logado e o botão Sair, no cabeçalho das telas da equipe.
export default function StaffUserBadge({
  name,
  onLogout,
}: {
  name: string
  onLogout: () => void
}) {
  return (
    <div className="flex items-center gap-2 text-xs min-w-0">
      <span className="truncate" style={{ color: "var(--color-foreground-soft)" }}>
        {name}
      </span>
      <button
        onClick={onLogout}
        className="shrink-0 px-2.5 py-1 rounded-lg border font-semibold"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-foreground-soft)",
          background: "var(--color-background)",
        }}
      >
        Sair
      </button>
    </div>
  )
}
