from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .config import TIMEZONE
from .models import HistoricoStatus, Paciente, Usuario

Status = Literal["Aguardando", "Em Preparação", "Em Cirurgia", "RPA", "No Quarto", "Alta"]


def hora_local(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).astimezone(TIMEZONE).strftime("%H:%M")


def iso_utc(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat()


# Os nomes dos campos seguem o tipo Patient do front-end (src/types.ts).


class PacienteNovo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    fullName: str = Field(min_length=1, max_length=150)
    procedure: str = Field(min_length=1, max_length=100)
    ward: str = Field(default="", max_length=100)
    email: EmailStr | None = None

    @field_validator("email", mode="before")
    @classmethod
    def email_vazio(cls, v):
        return v or None


class AtualizarStatus(BaseModel):
    status: Status


class EtapaHistorico(BaseModel):
    status: Status
    at: str  # ISO 8601 em UTC

    @classmethod
    def de(cls, h: HistoricoStatus) -> "EtapaHistorico":
        return cls(status=h.status, at=iso_utc(h.alterado_em))


class PacienteEquipe(BaseModel):
    """Visão da recepção e da enfermagem: inclui o nome completo."""

    id: str
    initials: str
    fullName: str
    token: str
    status: Status
    procedure: str
    admittedAt: str
    ward: str

    @classmethod
    def de(cls, p: Paciente) -> "PacienteEquipe":
        return cls(
            id=str(p.id),
            initials=p.iniciais,
            fullName=p.nome_completo,
            token=p.token,
            status=p.status,
            procedure=p.procedimento,
            admittedAt=hora_local(p.admitido_em),
            ward=p.ala,
        )


class PacienteAcompanhante(BaseModel):
    """Visão pública (RF004/LGPD): só as iniciais, nunca o nome."""

    token: str
    initials: str
    status: Status
    procedure: str
    admittedAt: str
    ward: str
    history: list[EtapaHistorico]

    @classmethod
    def de(cls, p: Paciente) -> "PacienteAcompanhante":
        return cls(
            token=p.token,
            initials=p.iniciais,
            status=p.status,
            procedure=p.procedimento,
            admittedAt=hora_local(p.admitido_em),
            ward=p.ala,
            history=[EtapaHistorico.de(h) for h in p.historico],
        )


EmailResultado = Literal["enviado", "simulado", "falhou", "sem_email"]


class AdmissaoResposta(BaseModel):
    patient: PacienteEquipe
    email: EmailResultado


class Credenciais(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    login: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class UsuarioPublico(BaseModel):
    name: str
    login: str
    role: Literal["recepcionista", "enfermeiro"]

    @classmethod
    def de(cls, u: Usuario) -> "UsuarioPublico":
        return cls(name=u.nome, login=u.login, role=u.perfil)


class LoginResposta(BaseModel):
    token: str
    user: UsuarioPublico
