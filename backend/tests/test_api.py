import asyncio
from datetime import timedelta


def admitir(client, rec, **extra):
    dados = {"fullName": "Maria da Silva Santos", "procedure": "Colecistectomia", **extra}
    r = client.post("/api/pacientes", json=dados, headers=rec)
    assert r.status_code == 201, r.text
    return r.json()


def test_admissao_gera_token_e_iniciais(client, rec):
    r = admitir(client, rec, ward="Bloco 2")
    p = r["patient"]
    assert p["initials"] == "M.S."
    assert p["status"] == "Aguardando"
    assert p["ward"] == "Bloco 2"
    assert len(p["token"]) == 6 and p["token"].isalnum()
    assert r["email"] == "sem_email"
    assert client.get("/api/pacientes", headers=rec).json() == [p]


def test_admissao_com_email_sem_smtp_e_simulada(client, rec):
    assert admitir(client, rec, email="familia@example.com")["email"] == "simulado"


def test_admissao_valida_campos(client, rec):
    r = client.post("/api/pacientes", json={"fullName": " ", "procedure": "X"}, headers=rec)
    assert r.status_code == 422
    r = client.post(
        "/api/pacientes", json={"fullName": "A B", "procedure": "X", "email": "nao-e-email"}, headers=rec
    )
    assert r.status_code == 422


def test_acompanhante_ve_so_iniciais_sem_login(client, rec):
    token = admitir(client, rec)["patient"]["token"]
    r = client.get(f"/api/acompanhante/{token.lower()}")
    assert r.status_code == 200
    dados = r.json()
    assert dados["initials"] == "M.S."
    assert "fullName" not in dados and "id" not in dados
    assert "Maria" not in r.text
    assert [h["status"] for h in dados["history"]] == ["Aguardando"]


def test_token_inexistente(client):
    assert client.get("/api/acompanhante/ZZZZZZ").status_code == 404


def test_atualizar_status_registra_historico(client, rec, enf):
    p = admitir(client, rec)["patient"]
    for s in ["Em Preparação", "Em Cirurgia"]:
        r = client.patch(f"/api/pacientes/{p['id']}/status", json={"status": s}, headers=enf)
        assert r.status_code == 200 and r.json()["status"] == s
    hist = client.get(f"/api/acompanhante/{p['token']}").json()["history"]
    assert [h["status"] for h in hist] == ["Aguardando", "Em Preparação", "Em Cirurgia"]


def test_status_invalido_e_paciente_inexistente(client, rec, enf):
    p = admitir(client, rec)["patient"]
    url = f"/api/pacientes/{p['id']}/status"
    assert client.patch(url, json={"status": "Voando"}, headers=enf).status_code == 422
    assert client.patch("/api/pacientes/999/status", json={"status": "RPA"}, headers=enf).status_code == 404


def test_acesso_expira_24h_apos_alta(client, rec, enf):
    from app.database import SessionLocal
    from app.models import Paciente

    p = admitir(client, rec)["patient"]
    client.patch(f"/api/pacientes/{p['id']}/status", json={"status": "Alta"}, headers=enf)
    assert client.get(f"/api/acompanhante/{p['token']}").status_code == 200

    with SessionLocal() as db:
        pac = db.get(Paciente, int(p["id"]))
        pac.alta_em -= timedelta(hours=25)
        db.commit()
    assert client.get(f"/api/acompanhante/{p['token']}").status_code == 404


# ---------- Login e permissões ----------


def test_rotas_da_equipe_exigem_login(client):
    assert client.get("/api/pacientes").status_code == 401
    assert client.post("/api/pacientes", json={"fullName": "A B", "procedure": "X"}).status_code == 401
    assert client.patch("/api/pacientes/1/status", json={"status": "RPA"}).status_code == 401
    assert client.get("/api/eventos/equipe").status_code == 401
    h = {"Authorization": "Bearer token-falso"}
    assert client.get("/api/pacientes", headers=h).status_code == 401


def test_cada_perfil_so_faz_a_sua_parte(client, rec, enf):
    p = admitir(client, rec)["patient"]
    # enfermeiro não admite; recepcionista não muda status
    r = client.post("/api/pacientes", json={"fullName": "A B", "procedure": "X"}, headers=enf)
    assert r.status_code == 403
    r = client.patch(f"/api/pacientes/{p['id']}/status", json={"status": "RPA"}, headers=rec)
    assert r.status_code == 403
    # os dois veem a lista
    assert client.get("/api/pacientes", headers=enf).status_code == 200


def test_login_e_dados_do_usuario(client, rec):
    eu = client.get("/api/auth/eu", headers=rec).json()
    assert eu == {"name": "Rita Recepção", "login": "recepcao", "role": "recepcionista"}
    r = client.post("/api/auth/login", json={"login": "RECEPCAO ", "password": "senha-de-teste"})
    assert r.status_code == 200


def test_senha_errada_e_bloqueio(client):
    for _ in range(5):
        r = client.post("/api/auth/login", json={"login": "enfermagem", "password": "errada"})
        assert r.status_code == 401
    r = client.post("/api/auth/login", json={"login": "enfermagem", "password": "senha-de-teste"})
    assert r.status_code == 429
    r = client.post("/api/auth/login", json={"login": "ninguem", "password": "x"})
    assert r.status_code == 401


def test_usuario_inativo_perde_acesso(client, rec):
    from app.database import SessionLocal
    from app.models import Usuario

    with SessionLocal() as db:
        db.query(Usuario).filter_by(login="recepcao").one().ativo = False
        db.commit()
    assert client.get("/api/pacientes", headers=rec).status_code == 401


def test_canal_separa_equipe_e_acompanhante():
    from app.events import Canal

    async def cenario():
        canal = Canal()
        canal.iniciar(asyncio.get_running_loop())
        equipe = canal.inscrever(None)
        dono = canal.inscrever("AAAAAA")
        outro = canal.inscrever("BBBBBB")
        canal.publicar("AAAAAA", {"quem": "equipe"}, {"quem": "publico"})
        await asyncio.sleep(0)
        assert equipe.fila.get_nowait() == {"quem": "equipe"}
        assert dono.fila.get_nowait() == {"quem": "publico"}
        assert outro.fila.empty()

    asyncio.run(cenario())
