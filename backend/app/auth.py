"""Login da equipe: senhas com PBKDF2 e sessões com JWT."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import config
from .database import get_db
from .models import Usuario

_ITERACOES = 600_000


def gerar_hash(senha: str) -> str:
    sal = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), sal, _ITERACOES)
    return f"pbkdf2_sha256${_ITERACOES}${sal.hex()}${dk.hex()}"


def conferir_senha(senha: str, guardado: str) -> bool:
    try:
        _, iteracoes, sal, dk = guardado.split("$")
        novo = hashlib.pbkdf2_hmac("sha256", senha.encode(), bytes.fromhex(sal), int(iteracoes))
    except ValueError:
        return False
    return hmac.compare_digest(novo.hex(), dk)


# Usado quando o login não existe, para a resposta levar o mesmo tempo.
_HASH_FALSO = gerar_hash(secrets.token_hex(8))


def autenticar(db: Session, login: str, senha: str) -> Usuario | None:
    u = db.query(Usuario).filter(Usuario.login == login.strip().lower()).one_or_none()
    if u is None:
        conferir_senha(senha, _HASH_FALSO)
        return None
    if not conferir_senha(senha, u.senha_hash) or not u.ativo:
        return None
    return u


def emitir_jwt(u: Usuario) -> str:
    agora = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(u.id), "perfil": u.perfil, "iat": agora,
         "exp": agora + timedelta(hours=config.JWT_HORAS)},
        config.JWT_SECRET,
        algorithm="HS256",
    )


_bearer = HTTPBearer(auto_error=False)


def _usuario_do_jwt(token: str | None, db: Session) -> Usuario:
    if not token:
        raise HTTPException(401, "Faça login para continuar.")
    try:
        dados = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        u = db.get(Usuario, int(dados["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        u = None
    if u is None or not u.ativo:
        raise HTTPException(401, "Sessão expirada. Entre novamente.")
    return u


def usuario_atual(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    # O EventSource do navegador não envia cabeçalhos; nos fluxos de tempo
    # real o token vai na URL.
    access_token: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> Usuario:
    return _usuario_do_jwt(cred.credentials if cred else access_token, db)


def exigir(*perfis: str):
    def dependencia(u: Usuario = Depends(usuario_atual)) -> Usuario:
        if u.perfil not in perfis:
            raise HTTPException(403, "Seu perfil não tem acesso a esta ação.")
        return u

    return dependencia
