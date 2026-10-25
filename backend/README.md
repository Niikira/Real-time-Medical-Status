# AcomPaci · Back-end (Python)

API em **FastAPI** que liga o banco **MySQL** (`AcomPaci_db`) às três telas do
front-end. Substitui o `localStorage` que o front-end usava.

## O que ela faz

- **Login da equipe**: recepcionista e enfermeiro entram com usuário e senha
  (JWT). Cada perfil só faz a sua parte: a recepção admite pacientes, a
  enfermagem muda status. O acompanhante não faz login, usa só o token.
- **Recepção** admite o paciente: a API grava no banco, gera o token de 6
  caracteres (RF001) e **envia o código e o link por e-mail** ao acompanhante.
- **Enfermagem** muda o status; cada mudança fica no histórico.
- **Acompanhante** consulta pelo token e vê só as iniciais (RF004/LGPD), com a
  linha do tempo e o horário de cada etapa (RF002).
- **Tempo real**: as telas recebem as mudanças na hora (Server-Sent Events). O
  acompanhante só recebe as do seu paciente. Se a rede cair, o navegador
  reconecta sozinho e ressincroniza.
- O acesso do acompanhante **expira 24h após a alta** (RNF001).

## Como rodar

Requer Python 3.10+ e MySQL 8.

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # edite a senha do MySQL e, se quiser, o SMTP
python -m app.seed          # opcional: pacientes e usuários de demonstração
uvicorn app.main:app --reload --port 8000
```

## Usuários da equipe

Cadastre cada pessoa pelo terminal (a senha é pedida na hora e guardada só
como hash):

```bash
python -m app.criar_usuario --perfil recepcionista --login maria --nome "Maria Souza"
python -m app.criar_usuario --perfil enfermeiro --login joao --nome "João Lima"
```

Rodar de novo com o mesmo login troca a senha. O `app.seed` cria dois usuários
de demonstração, `recepcao` e `enfermagem`, com a senha `acompaci123`: use só
para testar, nunca em um hospital.

Defina `JWT_SECRET` no `.env`; sem ele, todos precisam entrar de novo sempre
que a API reinicia. O login dura 12h (`JWT_HORAS`). Depois de 5 senhas
erradas, o usuário fica bloqueado por 15 minutos.

- As tabelas são criadas sozinhas ao iniciar. O banco `AcomPaci_db` precisa
  existir (ou rode `Database/schema.sql`, que cria banco e tabelas).
- Sem `DATABASE_URL` no `.env`, a API usa um arquivo SQLite local (`acompaci.db`),
  útil para testar sem MySQL.
- Documentação interativa dos endpoints: http://localhost:8000/docs

## E-mail do token

Preencha `SMTP_*` no `.env`. Com Gmail: `SMTP_HOST=smtp.gmail.com`,
`SMTP_PORT=587`, seu e-mail em `SMTP_USER` e uma **senha de app** em
`SMTP_PASSWORD` (myaccount.google.com/apppasswords).

Sem `SMTP_HOST`, o e-mail não sai: o texto aparece no terminal da API e a tela
da recepção mostra o botão para enviar pelo e-mail dela. Se o servidor de
e-mail falhar, a admissão é feita mesmo assim e a recepção vê o mesmo botão.

## Front-end

O front-end chama `http://localhost:8000` em desenvolvimento. Para outro
endereço, defina `VITE_API_URL` (ex.: `VITE_API_URL=https://api.meuhospital.gov.br`)
e inclua o endereço do front-end em `CORS_ORIGINS`/`FRONTEND_URL` no `.env` da API.

## Endpoints

| Método | Caminho | Quem usa |
|---|---|---|
| POST | `/api/auth/login` | recepção, enfermagem |
| GET | `/api/auth/eu` | dados de quem está logado |
| GET | `/api/pacientes` | recepção, enfermagem (login) |
| POST | `/api/pacientes` | só recepcionista (admissão + e-mail) |
| PATCH | `/api/pacientes/{id}/status` | só enfermeiro |
| GET | `/api/eventos/equipe` | recepção, enfermagem (tempo real, login) |
| GET | `/api/acompanhante/{token}` | acompanhante |
| GET | `/api/acompanhante/{token}/eventos` | acompanhante (tempo real) |

## Testes

```bash
pytest
```

## Ainda falta

- Limite de tentativas na consulta por token do acompanhante.
- Tela para gerenciar a equipe (hoje o cadastro é pelo terminal).
- Em produção, servir a API com HTTPS (a senha e o token trafegam na rede).
