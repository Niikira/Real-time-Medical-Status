import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

SENHA = "senha-de-teste"


@pytest.fixture()
def client(tmp_path):
    # Banco SQLite novo para cada teste; SMTP desligado (e-mail "simulado").
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_path / 'teste.db'}"
    os.environ["SMTP_HOST"] = ""
    os.environ["JWT_SECRET"] = "chave-de-teste-com-mais-de-32-caracteres"
    for mod in [m for m in sys.modules if m == "app" or m.startswith("app.")]:
        del sys.modules[mod]

    from fastapi.testclient import TestClient

    from app.criar_usuario import salvar
    from app.main import app

    salvar("recepcao", "Rita Recepção", "recepcionista", SENHA)
    salvar("enfermagem", "Ênio Enfermeiro", "enfermeiro", SENHA)
    with TestClient(app) as c:
        yield c


def _headers(client, login):
    r = client.post("/api/auth/login", json={"login": login, "password": SENHA})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture()
def rec(client):
    return _headers(client, "recepcao")


@pytest.fixture()
def enf(client):
    return _headers(client, "enfermagem")
