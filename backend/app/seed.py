"""Popula o banco com pacientes e usuários de demonstração.

Não use em produção: as senhas de demonstração são públicas. Para a equipe
real, use python -m app.criar_usuario.

Uso: python -m app.seed
"""

from datetime import timedelta

from sqlalchemy import select

from .criar_usuario import salvar as salvar_usuario
from .database import Base, SessionLocal, engine
from .main import gerar_iniciais
from .models import STATUSES, HistoricoStatus, Paciente, utcnow

EXEMPLOS = [
    ("Maria da Silva Santos", "A7K3P2", "Em Cirurgia", "Colecistectomia", "Bloco Cirúrgico 2"),
    ("João Carlos Oliveira", "B9R1X5", "RPA", "Apendicectomia", "Bloco Cirúrgico 1"),
    ("Ana Paula Ferreira", "C4M8Y7", "Em Preparação", "Hérnia Inguinal", "Bloco Cirúrgico 3"),
    ("Roberto Lima Costa", "D2N6Q9", "No Quarto", "Artroscopia Joelho", "Ala C — Quarto 412"),
]

USUARIOS_DEMO = [
    ("recepcao", "Recepção (demonstração)", "recepcionista"),
    ("enfermagem", "Enfermagem (demonstração)", "enfermeiro"),
]
SENHA_DEMO = "acompaci123"


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        agora = utcnow()
        for i, (nome, token, status, proc, ala) in enumerate(EXEMPLOS):
            if db.scalar(select(Paciente.id).where(Paciente.token == token)):
                continue
            admitido = agora - timedelta(hours=4 - i)
            p = Paciente(
                nome_completo=nome, iniciais=gerar_iniciais(nome), procedimento=proc,
                ala=ala, status=status, token=token, admitido_em=admitido,
            )
            # Histórico com as etapas já percorridas, 30 min entre cada uma.
            for n, etapa in enumerate(STATUSES[: STATUSES.index(status) + 1]):
                p.historico.append(
                    HistoricoStatus(status=etapa, alterado_em=admitido + timedelta(minutes=30 * n))
                )
            db.add(p)
        db.commit()
    print("Pacientes de exemplo inseridos.")

    for login, nome, perfil in USUARIOS_DEMO:
        salvar_usuario(login, nome, perfil, SENHA_DEMO)
    print(f"Usuários de demonstração: recepcao / enfermagem (senha {SENHA_DEMO}).")


if __name__ == "__main__":
    main()
