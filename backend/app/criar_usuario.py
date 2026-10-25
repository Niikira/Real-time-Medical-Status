"""Cadastra (ou troca a senha de) um membro da equipe.

Uso:
  python -m app.criar_usuario --perfil enfermeiro --login ana --nome "Ana Souza"
A senha é pedida no terminal.
"""

import argparse
import getpass

from .auth import gerar_hash
from .database import Base, SessionLocal, engine
from .models import PERFIS, Usuario


def salvar(login: str, nome: str, perfil: str, senha: str) -> bool:
    """Cria o usuário; se o login já existe, atualiza. Retorna True se criou."""
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        u = db.query(Usuario).filter(Usuario.login == login.strip().lower()).one_or_none()
        criado = u is None
        if criado:
            u = Usuario(login=login.strip().lower())
            db.add(u)
        u.nome, u.perfil, u.senha_hash, u.ativo = nome, perfil, gerar_hash(senha), True
        db.commit()
    return criado


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--perfil", required=True, choices=PERFIS)
    ap.add_argument("--login", required=True)
    ap.add_argument("--nome", required=True)
    args = ap.parse_args()

    senha = getpass.getpass("Senha: ")
    if len(senha) < 8:
        raise SystemExit("A senha precisa ter pelo menos 8 caracteres.")
    if senha != getpass.getpass("Repita a senha: "):
        raise SystemExit("As senhas não conferem.")

    criado = salvar(args.login, args.nome, args.perfil, senha)
    print(("Usuário criado: " if criado else "Usuário atualizado: ") + args.login.lower())


if __name__ == "__main__":
    main()
