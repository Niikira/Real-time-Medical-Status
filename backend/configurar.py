"""Prepara o .env deste computador (chamado pelo inicia.bat).

Cada computador tem o seu .env, com a senha do root do MySQL daquela
máquina. Se o .env não existe ou a conexão com o MySQL falha, a senha é
pedida de novo. Senha em branco = usar SQLite (sem MySQL).

Uso: python configurar.py [--trocar]

Sai com 0 se a configuração já servia, 10 se gravou uma nova (o
inicia.bat roda o seed nesse caso) e 1 se o usuário desistiu.
"""

import getpass
import secrets
import sys
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

ENV = Path(__file__).with_name(".env")
BANCO = "AcomPaci_db"
HOST, PORTA = "127.0.0.1", 3306

PADRAO = {
    "JWT_HORAS": "12",
    "FRONTEND_URL": "http://localhost:5173",
    "SMTP_HOST": "",
    "SMTP_PORT": "587",
    "SMTP_USER": "",
    "SMTP_PASSWORD": "",
    "SMTP_FROM": "AcomPaci <seu-email@gmail.com>",
    "SMTP_TLS": "starttls",
}


def ler_env() -> dict[str, str]:
    valores: dict[str, str] = {}
    if ENV.exists():
        # utf-8-sig: o Bloco de Notas pode salvar o arquivo com BOM.
        for linha in ENV.read_text(encoding="utf-8-sig").splitlines():
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                k, v = linha.split("=", 1)
                valores[k.strip()] = v.strip()
    return valores


def gravar_env(valores: dict[str, str]) -> None:
    linhas = [
        "# Configuração DESTE computador (gerada pelo inicia.bat).",
        "# Não copie este arquivo para outra máquina nem envie ao GitHub.",
        "# Para trocar a senha do MySQL: inicia.bat trocar",
    ]
    if not valores.get("DATABASE_URL"):
        linhas.append("# Sem DATABASE_URL: usando SQLite (backend\\acompaci.db).")
    for k, v in valores.items():
        if k == "DATABASE_URL" and not v:
            continue
        linhas.append(f"{k}={v}")
    ENV.write_text("\n".join(linhas) + "\n", encoding="utf-8")


def conectar(usuario: str, senha: str) -> str | None:
    """Testa o MySQL e cria o banco. Devolve None se deu certo, ou o erro."""
    import pymysql

    try:
        con = pymysql.connect(host=HOST, port=PORTA, user=usuario, password=senha,
                              charset="utf8mb4", connect_timeout=5)
    except pymysql.err.OperationalError as e:
        codigo = e.args[0] if e.args else 0
        if codigo == 1045:
            return "senha incorreta"
        if codigo == 2003:
            return f"MySQL não está rodando em {HOST}:{PORTA}"
        return str(e)
    with con:
        with con.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS {BANCO} "
                        "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")
    return None


def url_atual_funciona(url: str) -> bool:
    if not url.startswith("mysql"):
        return True  # SQLite ou outro banco: nada a testar aqui
    partes = urlsplit(url)
    erro = conectar(unquote(partes.username or "root"), unquote(partes.password or ""))
    if erro:
        print(f"Não foi possível conectar ao MySQL com a senha salva ({erro}).")
        return False
    return True


def pedir_senha() -> str | None:
    """Pergunta a senha até conectar. Devolve a DATABASE_URL ('' = SQLite)."""
    print()
    print("Senha do usuário root do MySQL DESTE computador.")
    print("Deixe em branco e aperte Enter para usar SQLite (sem MySQL).")
    while True:
        try:
            senha = getpass.getpass("Senha do root (não aparece ao digitar): ")
        except (EOFError, KeyboardInterrupt):
            return None
        if not senha:
            print("Usando SQLite.")
            return ""
        erro = conectar("root", senha)
        if erro is None:
            print(f"Conectado ao MySQL. Banco {BANCO} pronto.")
            return (f"mysql+pymysql://root:{quote(senha, safe='')}@{HOST}:{PORTA}/"
                    f"{BANCO}?charset=utf8mb4")
        print(f"Falhou: {erro}. Tente de novo (ou deixe em branco para SQLite).")


def main() -> int:
    trocar = "--trocar" in sys.argv
    valores = ler_env()
    novo = not ENV.exists()

    banco_ok = not novo and not trocar and url_atual_funciona(valores.get("DATABASE_URL", ""))
    if banco_ok and valores.get("JWT_SECRET"):
        return 0

    if not banco_ok:
        url = pedir_senha()
        if url is None:
            return 1
        valores["DATABASE_URL"] = url

    if not valores.get("JWT_SECRET"):
        valores["JWT_SECRET"] = secrets.token_urlsafe(32)
    for k, v in PADRAO.items():
        valores.setdefault(k, v)
    # DATABASE_URL primeiro, para ficar fácil de achar no arquivo.
    valores = {"DATABASE_URL": valores.pop("DATABASE_URL", ""), **valores}
    gravar_env(valores)
    print("Configuração salva em backend\\.env.")
    return 10


if __name__ == "__main__":
    sys.exit(main())
