"""Atualizações em tempo real via Server-Sent Events (SSE).

A equipe recebe todas as mudanças; cada acompanhante recebe só as do seu
paciente. O EventSource do navegador reconecta sozinho se a rede cair.
"""

import asyncio
import json
from dataclasses import dataclass, field


@dataclass(eq=False)
class Inscricao:
    token: str | None  # None = equipe (vê todos os pacientes)
    fila: asyncio.Queue = field(default_factory=asyncio.Queue)


class Canal:
    def __init__(self) -> None:
        self._inscricoes: set[Inscricao] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def iniciar(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def inscrever(self, token: str | None) -> Inscricao:
        insc = Inscricao(token)
        self._inscricoes.add(insc)
        return insc

    def cancelar(self, insc: Inscricao) -> None:
        self._inscricoes.discard(insc)

    def publicar(self, token: str, equipe: dict, publico: dict) -> None:
        """Chamado pelas rotas (que rodam em threads) após gravar no banco."""
        if self._loop is None:
            return
        for insc in list(self._inscricoes):
            dados = equipe if insc.token is None else publico if insc.token == token else None
            if dados is not None:
                self._loop.call_soon_threadsafe(insc.fila.put_nowait, dados)


canal = Canal()


async def stream(insc: Inscricao, ping_segundos: float = 15):
    try:
        yield "retry: 3000\n\n"
        while True:
            try:
                dados = await asyncio.wait_for(insc.fila.get(), timeout=ping_segundos)
            except asyncio.TimeoutError:
                # Comentário SSE: mantém a conexão viva atrás de proxies.
                yield ": ping\n\n"
                continue
            yield f"event: paciente\ndata: {json.dumps(dados, ensure_ascii=False)}\n\n"
    finally:
        canal.cancelar(insc)
