import logging
import smtplib
import ssl
from email.message import EmailMessage

from . import config
from .models import Paciente

log = logging.getLogger("acompaci.email")


def link_acompanhante(token: str) -> str:
    return f"{config.FRONTEND_URL}/acompanhante?token={token}"


def montar_email(p: Paciente, destino: str) -> EmailMessage:
    link = link_acompanhante(p.token)
    msg = EmailMessage()
    msg["Subject"] = f"AcomPaci · Acompanhamento do paciente {p.iniciais}"
    msg["From"] = config.SMTP_FROM
    msg["To"] = destino
    msg.set_content(
        "Olá!\n\n"
        f"Acompanhe em tempo real o paciente {p.iniciais} ({p.procedimento}) pelo link:\n"
        f"{link}\n\n"
        f"Se preferir, acesse a página do acompanhante e digite o código {p.token}.\n"
        f"O acesso expira {config.EXPIRA_APOS_ALTA_HORAS}h após a alta.\n\n"
        "Esta mensagem foi enviada automaticamente pela recepção do hospital."
    )
    return msg


def enviar_token(p: Paciente, destino: str) -> str:
    """Envia o código e o link ao acompanhante.

    Retorna "enviado", "simulado" (SMTP não configurado: só imprime no log)
    ou "falhou". Uma falha no e-mail nunca impede a admissão do paciente.
    """
    msg = montar_email(p, destino)

    if not config.SMTP_HOST:
        log.warning(
            "SMTP não configurado; e-mail NÃO enviado.\nPara: %s\nAssunto: %s\n\n%s",
            destino, msg["Subject"], msg.get_content(),
        )
        return "simulado"

    try:
        if config.SMTP_TLS == "ssl":
            with smtplib.SMTP_SSL(
                config.SMTP_HOST, config.SMTP_PORT, timeout=10,
                context=ssl.create_default_context(),
            ) as smtp:
                _autenticar_e_enviar(smtp, msg)
        else:
            with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10) as smtp:
                if config.SMTP_TLS == "starttls":
                    smtp.starttls(context=ssl.create_default_context())
                _autenticar_e_enviar(smtp, msg)
    except (smtplib.SMTPException, OSError):
        log.exception("Falha ao enviar e-mail para %s", destino)
        return "falhou"
    return "enviado"


def _autenticar_e_enviar(smtp: smtplib.SMTP, msg: EmailMessage) -> None:
    if config.SMTP_USER:
        smtp.login(config.SMTP_USER, config.SMTP_PASSWORD)
    smtp.send_message(msg)
