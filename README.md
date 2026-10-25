# AcomPaci

Sistema para o SUS que permite ao familiar (acompanhante) acompanhar em tempo
real a situação do paciente no hospital. Projeto de TCC; Gabriel Azevedo Cruz
cuida do front-end/UX.

Este arquivo junta num só lugar as decisões do projeto e o guia do back-end.

## Estrutura da pasta

| Pasta | Conteúdo |
|---|---|
| `src/` | Front-end em React + Vite + Tailwind 4 (três telas, uma por perfil) |
| `backend/` | API em Python (FastAPI + SQLAlchemy + MySQL) |
| `Database/` | `schema.sql` (cria banco e tabelas) e o dump original `AcomPaci_db.sql` |
| `src/imports/` | PDF do planejamento inicial |

Ainda não há `package.json` na pasta: para rodar o front-end é preciso um
projeto Vite com React e Tailwind 4 em volta de `src/`.

## Decisões do projeto

### Front-end: três telas, sem página inicial
Cada perfil recebe o seu próprio link e não existe tela de escolha de perfil:

- `/acompanhante` consulta pelo código
- `/acompanhante?token=A7K3P2` é o link único enviado ao familiar (RF001)
- `/enfermeiro` é o painel de enfermagem
- `/recepcionista` faz a admissão de pacientes e gera o token

Qualquer outro endereço mostra "Link inválido", sem listar os perfis. Motivo:
o familiar não deve conseguir chegar às telas da equipe. As rotas ficam em
`src/App.tsx` e `src/routes.ts`; na hospedagem, configure o fallback de SPA
para `index.html`. Não reintroduzir tela inicial nem botões de voltar para ela.

### Token do acompanhante por e-mail
O token é enviado **por e-mail** (não WhatsApp/SMS). O formulário da recepção
pede o e-mail do acompanhante e o back-end envia o código e o link. O botão
"enviar pelo meu e-mail" (mailto) aparece só quando o envio automático falha.

### QR code removido
O QR code saiu da tela da recepção. O token é entregue só por e-mail, código
ou link. Não reintroduzir.

### Login da equipe
Recepcionista e enfermeiro entram com usuário e senha (JWT, 12h). Só a
recepção admite pacientes; só a enfermagem muda status; ambos veem a lista.
O acompanhante continua sem login, apenas com o token. Cada perfil tem sua
sessão e um botão Sair.

### Privacidade
O acompanhante vê só as iniciais do paciente (RF004/LGPD) e nunca recebe a
lista completa de pacientes. O acesso expira 24h após a alta (RNF001).

## Back-end (Python)

API em **FastAPI** que liga o banco **MySQL** (`AcomPaci_db`) às três telas do
front-end. Substitui o `localStorage` que o front-end usava.

### O que ela faz

- **Login da equipe**: recepcionista e enfermeiro entram com usuário e senha
  (JWT). Cada perfil só faz a sua parte.
- **Recepção** admite o paciente: a API grava no banco, gera o token de 6
  caracteres (RF001) e **envia o código e o link por e-mail** ao acompanhante.
- **Enfermagem** muda o status; cada mudança fica no histórico.
- **Acompanhante** consulta pelo token e vê só as iniciais, com a linha do
  tempo e o horário de cada etapa (RF002).
- **Tempo real**: as telas recebem as mudanças na hora (Server-Sent Events). O
  acompanhante só recebe as do seu paciente. Se a rede cair, o navegador
  reconecta sozinho e ressincroniza.
- O acesso do acompanhante **expira 24h após a alta** (RNF001).

### Como rodar

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

- As tabelas são criadas sozinhas ao iniciar. O banco `AcomPaci_db` precisa
  existir (ou rode `Database/schema.sql`, que cria banco e tabelas).
- Sem `DATABASE_URL` no `.env`, a API usa um arquivo SQLite local
  (`acompaci.db`), útil para testar sem MySQL.
- Documentação interativa dos endpoints: http://localhost:8000/docs

### Como criar o .env

O `.env` guarda senhas e chaves, por isso **não vem na pasta** e não deve ser
enviado para o GitHub (já está no `backend/.gitignore`). Crie o seu a partir
do modelo `backend/.env.example`:

1. **Copie o modelo** dentro da pasta `backend`:

   ```bash
   cd backend
   cp .env.example .env          # Windows (PowerShell): copy .env.example .env
   ```

2. **Crie o banco no MySQL** (uma vez só), rodando o script que cria banco e
   tabelas:

   ```bash
   mysql -u root -p < ../Database/schema.sql
   ```

3. **Conexão com o banco**: em `DATABASE_URL`, troque `SUA_SENHA` pela senha do
   seu usuário `root` do MySQL (ou use outro usuário):

   ```
   DATABASE_URL=mysql+pymysql://root:SUA_SENHA@127.0.0.1:3306/AcomPaci_db?charset=utf8mb4
   ```

   Se a senha tiver caracteres especiais (`@`, `:`, `/`, `#`), escreva-os
   codificados (`@` vira `%40`, por exemplo). Para testar sem MySQL, apague ou
   comente essa linha com `#`: a API usa um arquivo SQLite local.

4. **Chave do login (JWT)**: gere uma chave aleatória e cole em `JWT_SECRET`:

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

   ```
   JWT_SECRET=cole_aqui_a_chave_gerada
   JWT_HORAS=12
   ```

   Sem ela, todos precisam entrar de novo sempre que a API reinicia. Não
   compartilhe essa chave.

5. **Endereço do front-end**: deixe `FRONTEND_URL=http://localhost:5173` em
   desenvolvimento (é a porta padrão do Vite). Em produção, coloque o endereço
   real do site; ele vai no link do e-mail e libera o CORS.

6. **E-mail do token (opcional)**: para enviar o token de verdade, preencha o
   SMTP. Exemplo com Gmail:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seu-email@gmail.com
   SMTP_PASSWORD=senha_de_app_de_16_letras
   SMTP_FROM=AcomPaci <seu-email@gmail.com>
   SMTP_TLS=starttls
   ```

   A senha do Gmail **não** funciona aqui: ative a verificação em duas etapas
   na conta Google e crie uma "senha de app" em
   myaccount.google.com/apppasswords. Deixando `SMTP_HOST` vazio, o e-mail só
   aparece no terminal da API (bom para testes).

7. **Confira**: rode `uvicorn app.main:app --reload --port 8000` e abra
   http://localhost:8000/docs. Se abrir, o `.env` está certo.

Exemplo de `.env` completo para desenvolvimento:

```
DATABASE_URL=mysql+pymysql://root:minhasenha@127.0.0.1:3306/AcomPaci_db?charset=utf8mb4
JWT_SECRET=Xb3k9...(sua chave gerada)
JWT_HORAS=12
FRONTEND_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=AcomPaci <seu-email@gmail.com>
SMTP_TLS=starttls
```

Resumo das variáveis:

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o MySQL (sem ela, usa SQLite local) |
| `JWT_SECRET` | Chave que assina o login da equipe |
| `JWT_HORAS` | Duração do login (padrão 12, um plantão) |
| `FRONTEND_URL` | Endereço do front-end (link do e-mail e CORS) |
| `CORS_ORIGINS` | Opcional: outros endereços liberados no CORS, separados por vírgula (padrão: `FRONTEND_URL`) |
| `SMTP_*` | Envio do e-mail com o token do acompanhante |

### Usuários da equipe

Cadastre cada pessoa pelo terminal (a senha é pedida na hora e guardada só
como hash):

```bash
python -m app.criar_usuario --perfil recepcionista --login maria --nome "Maria Souza"
python -m app.criar_usuario --perfil enfermeiro --login joao --nome "João Lima"
```

Rodar de novo com o mesmo login troca a senha. O `app.seed` cria dois usuários
de demonstração, `recepcao` e `enfermagem`, com a senha `acompaci123`: use só
para testar, nunca em um hospital. Depois de 5 senhas erradas, o usuário fica
bloqueado por 15 minutos.

### E-mail do token

Com Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, seu e-mail em
`SMTP_USER` e uma **senha de app** em `SMTP_PASSWORD`
(myaccount.google.com/apppasswords).

Sem `SMTP_HOST`, o e-mail não sai: o texto aparece no terminal da API e a tela
da recepção mostra o botão para enviar pelo e-mail dela. Se o servidor de
e-mail falhar, a admissão é feita mesmo assim e a recepção vê o mesmo botão.

### Ligação com o front-end

O front-end (`src/api.ts` e `src/store.ts`) chama `http://localhost:8000` em
desenvolvimento. Para outro endereço, defina `VITE_API_URL` (ex.:
`VITE_API_URL=https://api.meuhospital.gov.br`) e inclua o endereço do
front-end em `CORS_ORIGINS`/`FRONTEND_URL` no `.env` da API.

### Endpoints

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

### Testes

```bash
cd backend
pytest
```

## Ainda falta

- Limite de tentativas na consulta por token do acompanhante.
- Tela para gerenciar a equipe (hoje o cadastro é pelo terminal).
- Em produção, servir a API com HTTPS (a senha e o token trafegam na rede).
- `package.json` e configuração do Vite para o front-end rodar fora do editor.
