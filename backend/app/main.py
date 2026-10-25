import asyncio
import secrets
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .auth import autenticar, emitir_jwt, exigir, usuario_atual
from .database import Base, engine, get_db
from .email_service import enviar_token
from .events import canal, stream
from .models import HistoricoStatus, Paciente, Usuario, utcnow
from .schemas import (
    AdmissaoResposta,
    AtualizarStatus,
    Credenciais,
    LoginResposta,
    PacienteAcompanhante,
    PacienteEquipe,
    PacienteNovo,
    UsuarioPublico,
)

# Sem letras/números parecidos (O/0, I/1), como no front-end.
TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    canal.iniciar(asyncio.get_running_loop())
    yield


app = FastAPI(title="AcomPaci API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)


def gerar_iniciais(nome: str) -> str:
    partes = nome.split()
    if len(partes) == 1:
        return partes[0][:2].upper() + "."
    return f"{partes[0][0]}.{partes[-1][0]}.".upper()


def gerar_token(db: Session) -> str:
    while True:
        token = "".join(secrets.choice(TOKEN_CHARS) for _ in range(6))
        if db.scalar(select(Paciente.id).where(Paciente.token == token)) is None:
            return token


def acesso_expirado(p: Paciente) -> bool:
    """RNF001: o link do acompanhante deixa de valer 24h após a alta."""
    if p.status != "Alta" or p.alta_em is None:
        return False
    return utcnow() > p.alta_em + timedelta(hours=config.EXPIRA_APOS_ALTA_HORAS)


def notificar(p: Paciente) -> None:
    canal.publicar(
        p.token,
        PacienteEquipe.de(p).model_dump(),
        PacienteAcompanhante.de(p).model_dump(),
    )


# ---------- Login da equipe ----------

# Bloqueia um login por 15 min após 5 senhas erradas (proteção simples
# contra tentativa e erro; vale enquanto o servidor estiver no ar).
_TENTATIVAS_MAX, _JANELA_S = 5, 15 * 60
_falhas: dict[str, deque[float]] = defaultdict(deque)


def _bloqueado(login: str) -> bool:
    agora, fila = time.monotonic(), _falhas[login]
    while fila and agora - fila[0] > _JANELA_S:
        fila.popleft()
    return len(fila) >= _TENTATIVAS_MAX


@app.post("/api/auth/login", response_model=LoginResposta)
def login(dados: Credenciais, db: Session = Depends(get_db)):
    chave = dados.login.lower()
    if _bloqueado(chave):
        raise HTTPException(429, "Muitas tentativas. Aguarde 15 minutos e tente de novo.")
    u = autenticar(db, dados.login, dados.password)
    if u is None:
        _falhas[chave].append(time.monotonic())
        raise HTTPException(401, "Usuário ou senha incorretos.")
    _falhas.pop(chave, None)
    return LoginResposta(token=emitir_jwt(u), user=UsuarioPublico.de(u))


@app.get("/api/auth/eu", response_model=UsuarioPublico)
def eu(u: Usuario = Depends(usuario_atual)):
    return UsuarioPublico.de(u)


# ---------- Recepção e enfermagem (exigem login) ----------

equipe = exigir("recepcionista", "enfermeiro")


@app.get("/api/pacientes", response_model=list[PacienteEquipe], dependencies=[Depends(equipe)])
def listar_pacientes(db: Session = Depends(get_db)):
    pacientes = db.scalars(
        select(Paciente).order_by(Paciente.admitido_em.desc(), Paciente.id.desc())
    )
    return [PacienteEquipe.de(p) for p in pacientes]


@app.post(
    "/api/pacientes",
    response_model=AdmissaoResposta,
    status_code=201,
    dependencies=[Depends(exigir("recepcionista"))],
)
def admitir_paciente(dados: PacienteNovo, db: Session = Depends(get_db)):
    """Admissão (RF001): gera o token e envia ao acompanhante por e-mail."""
    agora = utcnow()
    p = Paciente(
        nome_completo=dados.fullName,
        iniciais=gerar_iniciais(dados.fullName),
        procedimento=dados.procedure,
        ala=dados.ward or "A definir",
        status="Aguardando",
        token=gerar_token(db),
        email_acompanhante=dados.email,
        admitido_em=agora,
    )
    p.historico.append(HistoricoStatus(status="Aguardando", alterado_em=agora))
    db.add(p)
    db.commit()

    email = enviar_token(p, dados.email) if dados.email else "sem_email"
    notificar(p)
    return AdmissaoResposta(patient=PacienteEquipe.de(p), email=email)


@app.patch(
    "/api/pacientes/{paciente_id}/status",
    response_model=PacienteEquipe,
    dependencies=[Depends(exigir("enfermeiro"))],
)
def atualizar_status(
    paciente_id: int, dados: AtualizarStatus, db: Session = Depends(get_db)
):
    """Enfermagem (RF003): muda o status e avisa todos em tempo real."""
    p = db.get(Paciente, paciente_id)
    if p is None:
        raise HTTPException(404, "Paciente não encontrado.")

    if dados.status != p.status:
        agora = utcnow()
        p.status = dados.status
        p.alta_em = agora if dados.status == "Alta" else None
        p.historico.append(HistoricoStatus(status=dados.status, alterado_em=agora))
        db.commit()
        notificar(p)
    return PacienteEquipe.de(p)


@app.get("/api/eventos/equipe", dependencies=[Depends(equipe)])
def eventos_equipe():
    return StreamingResponse(stream(canal.inscrever(None)), media_type="text/event-stream")


# ---------- Acompanhante (público) ----------


def buscar_por_token(token: str, db: Session) -> Paciente:
    p = db.scalar(select(Paciente).where(Paciente.token == token.strip().upper()))
    if p is None or acesso_expirado(p):
        raise HTTPException(404, "Código não encontrado ou expirado.")
    return p


@app.get("/api/acompanhante/{token}", response_model=PacienteAcompanhante)
def consultar_acompanhante(token: str, db: Session = Depends(get_db)):
    return PacienteAcompanhante.de(buscar_por_token(token, db))


@app.get("/api/acompanhante/{token}/eventos")
def eventos_acompanhante(token: str, db: Session = Depends(get_db)):
    p = buscar_por_token(token, db)
    return StreamingResponse(
        stream(canal.inscrever(p.token)), media_type="text/event-stream"
    )


@app.get("/api/saude")
def saude():
    return {"ok": True}
