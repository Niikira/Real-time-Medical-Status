from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# Mesma ordem da linha do tempo no front-end (src/types.ts).
STATUSES = ("Aguardando", "Em Preparação", "Em Cirurgia", "RPA", "No Quarto", "Alta")

# Perfis da equipe; cada um entra pela sua própria tela.
PERFIS = ("recepcionista", "enfermeiro")


def utcnow() -> datetime:
    # Guardado sem fuso (UTC) para ser igual no MySQL e no SQLite.
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


class Paciente(Base):
    __tablename__ = "paciente"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome_completo: Mapped[str] = mapped_column(String(150))
    iniciais: Mapped[str] = mapped_column(String(10))
    procedimento: Mapped[str] = mapped_column(String(100))
    ala: Mapped[str] = mapped_column(String(100), default="A definir")
    status: Mapped[str] = mapped_column(
        Enum(*STATUSES, name="status_paciente"), default="Aguardando"
    )
    token: Mapped[str] = mapped_column(String(6), unique=True, index=True)
    email_acompanhante: Mapped[str | None] = mapped_column(String(254), nullable=True)
    admitido_em: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    alta_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    historico: Mapped[list["HistoricoStatus"]] = relationship(
        back_populates="paciente",
        order_by="HistoricoStatus.alterado_em",
        cascade="all, delete-orphan",
    )


class HistoricoStatus(Base):
    """Cada mudança de status, para montar a linha do tempo (RF002)."""

    __tablename__ = "historico_status"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("paciente.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(Enum(*STATUSES, name="status_paciente"))
    alterado_em: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    paciente: Mapped[Paciente] = relationship(back_populates="historico")


class Usuario(Base):
    """Membro da equipe que entra na recepção ou na enfermagem."""

    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(150))
    login: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    perfil: Mapped[str] = mapped_column(Enum(*PERFIS, name="perfil_usuario"))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
