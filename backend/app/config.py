import logging
import os
import secrets
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

# Banco: MySQL em produção (mesmo banco do dump AcomPaci_db). Sem a variável,
# usa um SQLite local para quem quiser rodar sem instalar o MySQL.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./acompaci.db")

# Endereço onde o front-end está publicado; usado no link enviado por e-mail.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# Origens que podem chamar a API pelo navegador (separadas por vírgula).
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", FRONTEND_URL).split(",")
    if o.strip()
]

# Fuso usado para exibir horários (o banco guarda tudo em UTC).
TIMEZONE = ZoneInfo(os.getenv("TIMEZONE", "America/Sao_Paulo"))

# RNF001: o acesso do acompanhante expira 24h após a alta.
EXPIRA_APOS_ALTA_HORAS = int(os.getenv("EXPIRA_APOS_ALTA_HORAS", "24"))

# E-mail (SMTP). Sem SMTP_HOST, o e-mail não é enviado: o conteúdo é só
# impresso no terminal, o que basta para desenvolvimento.
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "acompaci@localhost")
SMTP_TLS = os.getenv("SMTP_TLS", "starttls").lower()  # starttls | ssl | none

# Login da equipe (JWT). Defina JWT_SECRET no .env: sem ele, uma chave
# aleatória é gerada a cada início e todos precisam entrar de novo.
JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    logging.getLogger("acompaci").warning(
        "JWT_SECRET não definido; usando chave temporária (sessões caem ao reiniciar)."
    )
    JWT_SECRET = secrets.token_urlsafe(32)
# Duração da sessão: um plantão de 12h por padrão.
JWT_HORAS = int(os.getenv("JWT_HORAS", "12"))
