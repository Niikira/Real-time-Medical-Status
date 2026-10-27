# AcomPaci

**Acompanhamento do paciente cirúrgico em tempo real, para o SUS.**

O AcomPaci permite que o familiar (acompanhante) saiba, pelo celular e em tempo
real, em que etapa está o paciente no hospital: aguardando, em preparação, em
cirurgia, na recuperação, no quarto ou de alta. A recepção admite o paciente e
envia um código ao familiar; a enfermagem atualiza o status; o familiar
acompanha sem precisar perguntar no balcão.

Projeto de TCC. Gabriel Azevedo Cruz cuida do front-end e da UX.

---

## Sumário

1. [Como usar](#como-usar)
2. [Acessando o sistema](#acessando-o-sistema)
3. [Dúvidas comuns](#dúvidas-comuns)
4. [Estrutura do projeto](#estrutura-do-projeto)
5. [Decisões do projeto](#decisões-do-projeto)
6. [Detalhes técnicos](#detalhes-técnicos)
7. [Ainda falta](#ainda-falta)

---

## Como usar

No Windows, o sistema inteiro liga e desliga com **dois arquivos**. Não é
preciso abrir terminal nem digitar comandos.

| Arquivo | O que faz |
|---|---|
| **`inicia.bat`** | Liga o AcomPaci e abre o navegador na tela da recepção |
| **`parar.bat`** | Desliga o AcomPaci |

### Antes da primeira vez

Instale estes programas no computador (só uma vez):

| Programa | Obrigatório | Onde baixar |
|---|---|---|
| Python 3.10 ou mais novo | Sim | https://www.python.org/downloads/ (marque **"Add python.exe to PATH"** na instalação) |
| Node.js (versão LTS) | Sim | https://nodejs.org/ |
| MySQL 8 | Não | https://dev.mysql.com/downloads/installer/ (sem ele, o sistema usa um banco SQLite local) |

### Ligar

Dê **dois cliques em `inicia.bat`**.

Na primeira vez em cada computador, ele faz sozinho:

1. Instala as dependências da API e do front-end (pode levar alguns minutos).
2. Pede a **senha do usuário root do MySQL deste computador**. A senha não
   aparece enquanto você digita. Se o computador não tiver MySQL, deixe em
   branco e aperte Enter para usar SQLite.
3. Cria o banco `AcomPaci_db` e os usuários de demonstração.
4. Liga a API e o front-end e abre o navegador.

Nas vezes seguintes, ele só liga o sistema e abre o navegador.

A API e o front-end ficam rodando em duas janelas minimizadas, chamadas
"AcomPaci API" e "AcomPaci Front". Não feche essas janelas enquanto estiver
usando o sistema.

### Desligar

Dê **dois cliques em `parar.bat`**. Ele fecha as duas janelas e libera as
portas usadas.

---

## Acessando o sistema

Cada perfil tem o seu próprio endereço. Não existe uma página inicial com a
lista de perfis, de propósito (veja [Decisões do projeto](#decisões-do-projeto)).

| Perfil | Endereço |
|---|---|
| Recepção | http://localhost:5173/recepcionista |
| Enfermagem | http://localhost:5173/enfermeiro |
| Acompanhante | http://localhost:5173/acompanhante |
| Documentação da API | http://localhost:8000/docs |

### Usuários de demonstração

| Perfil | Usuário | Senha |
|---|---|---|
| Recepção | `recepcao` | `acompaci123` |
| Enfermagem | `enfermagem` | `acompaci123` |

O acompanhante não tem login: entra com o código de 6 caracteres que recebe
por e-mail. Para testar, use um dos pacientes de exemplo, como o código
`A7K3P2`.

> Os usuários de demonstração servem só para testes. Nunca use essas senhas
> em um hospital.

---

## Dúvidas comuns

**Cada computador tem uma senha diferente no MySQL. Como fica?**
A senha é guardada só no arquivo `backend\.env` do próprio computador e nunca
vai para o GitHub. Se você copiar a pasta para outro computador e a senha
salva não funcionar lá, o `inicia.bat` pede a senha de novo.

**Errei ou troquei a senha do MySQL.**
Se a senha salva parar de funcionar, o `inicia.bat` pede a nova sozinho. Para
forçar a troca (por exemplo, para sair do SQLite e passar a usar o MySQL),
apague o arquivo `backend\.env` e dê dois cliques em `inicia.bat`. Quem
prefere o terminal pode rodar `inicia.bat trocar`.

**O `inicia.bat` diz que o sistema já está rodando.**
Rode o `parar.bat` e depois o `inicia.bat` de novo.

**O e-mail com o código do acompanhante não chega.**
Por padrão o envio de e-mail fica desligado: o texto aparece na janela
"AcomPaci API" e a tela da recepção oferece um botão para enviar pelo e-mail
de quem está atendendo. Para enviar de verdade, configure o SMTP em
`backend\.env` (veja [E-mail do token](#e-mail-do-token)).

**Apareceu "Python não encontrado" ou "Node.js não encontrado".**
Instale o programa indicado (veja [Antes da primeira vez](#antes-da-primeira-vez))
e rode o `inicia.bat` de novo.

---

## Estrutura do projeto

| Caminho | Conteúdo |
|---|---|
| `inicia.bat` / `parar.bat` | Ligam e desligam o sistema no Windows |
| `src/` | Front-end em React + Vite + Tailwind 4 (três telas, uma por perfil) |
| `src/imports/` | PDF do planejamento inicial |
| `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json` | Configuração do front-end |
| `backend/` | API em Python (FastAPI + SQLAlchemy + MySQL ou SQLite) |
| `backend/configurar.py` | Cria o `.env` do computador e testa a senha do MySQL (usado pelo `inicia.bat`) |
| `Database/` | `schema.sql` (cria banco e tabelas) e o dump original `AcomPaci_db.sql` |

---

## Decisões do projeto

### Três telas, sem página inicial

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

---

## Detalhes técnicos

Esta parte é para quem vai mexer no código. Para só usar o sistema, os
arquivos `.bat` bastam.

### O que a API faz

API em **FastAPI** que liga o banco **MySQL** (`AcomPaci_db`) às três telas do
front-end.

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

### Rodar sem os arquivos .bat (macOS, Linux ou manualmente)

API, em um terminal:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edite a senha do MySQL e, se quiser, o SMTP
python -m app.seed          # opcional: pacientes e usuários de demonstração
uvicorn app.main:app --reload --port 8000
```

Front-end, em outro terminal, na raiz do projeto:

```bash
npm install
npm run dev
```

- As tabelas são criadas sozinhas ao iniciar. O banco `AcomPaci_db` precisa
  existir (ou rode `Database/schema.sql`, que cria banco e tabelas).
- Sem `DATABASE_URL` no `.env`, a API usa um arquivo SQLite local
  (`backend/acompaci.db`).
- No PowerShell, se o `npm` for bloqueado pela política de scripts, use
  `npm.cmd`.

### O arquivo .env

O `backend/.env` guarda senhas e chaves, por isso **não vai para o GitHub**
(está no `backend/.gitignore`). O `inicia.bat` cria esse arquivo sozinho; para
criar à mão, copie o modelo `backend/.env.example`.

Exemplo para desenvolvimento:

```
DATABASE_URL=mysql+pymysql://root:minhasenha@127.0.0.1:3306/AcomPaci_db?charset=utf8mb4
JWT_SECRET=Xb3k9...(chave gerada)
JWT_HORAS=12
FRONTEND_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=AcomPaci <seu-email@gmail.com>
SMTP_TLS=starttls
```

Se a senha do MySQL tiver caracteres especiais (`@`, `:`, `/`, `#`), escreva-os
codificados na `DATABASE_URL` (`@` vira `%40`, por exemplo). O `inicia.bat` já
faz isso sozinho. Para gerar uma chave JWT à mão:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o MySQL (sem ela, usa SQLite local) |
| `JWT_SECRET` | Chave que assina o login da equipe. Sem ela, todos precisam entrar de novo sempre que a API reinicia |
| `JWT_HORAS` | Duração do login (padrão 12, um plantão) |
| `FRONTEND_URL` | Endereço do front-end (vai no link do e-mail e libera o CORS) |
| `CORS_ORIGINS` | Opcional: outros endereços liberados no CORS, separados por vírgula (padrão: `FRONTEND_URL`) |
| `SMTP_*` | Envio do e-mail com o token do acompanhante |
| `SMTP_TLS` | `starttls` (porta 587), `ssl` (porta 465) ou `none` |
| `TIMEZONE` | Opcional: fuso dos horários exibidos (padrão `America/Sao_Paulo`) |
| `EXPIRA_APOS_ALTA_HORAS` | Opcional: horas de acesso do acompanhante após a alta (padrão 24) |

### E-mail do token

Exemplo com Gmail, em `backend\.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=senha_de_app_de_16_letras
SMTP_FROM=AcomPaci <seu-email@gmail.com>
SMTP_TLS=starttls
```

A senha normal do Gmail **não** funciona aqui: ative a verificação em duas
etapas na conta Google e crie uma "senha de app" em
myaccount.google.com/apppasswords.

Sem `SMTP_HOST`, o e-mail não sai: o texto aparece no terminal da API e a tela
da recepção mostra o botão para enviar pelo e-mail dela. Se o servidor de
e-mail falhar, a admissão é feita mesmo assim e a recepção vê o mesmo botão.

### Usuários da equipe

Cadastre cada pessoa pelo terminal, dentro de `backend` com o ambiente
ativado (a senha é pedida na hora e guardada só como hash):

```bash
python -m app.criar_usuario --perfil recepcionista --login maria --nome "Maria Souza"
python -m app.criar_usuario --perfil enfermeiro --login joao --nome "João Lima"
```

Rodar de novo com o mesmo login troca a senha. Depois de 5 senhas erradas, o
usuário fica bloqueado por 15 minutos.

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

---

## Ainda falta

- Limite de tentativas na consulta por token do acompanhante.
- Tela para gerenciar a equipe (hoje o cadastro é pelo terminal).
- Em produção, servir a API com HTTPS (a senha e o token trafegam na rede).
