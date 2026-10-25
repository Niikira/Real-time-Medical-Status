-- Estrutura do banco AcomPaci_db (MySQL 8).
-- O back-end também cria estas tabelas sozinho ao iniciar (se não existirem);
-- este arquivo serve para criar o banco manualmente ou documentar o modelo.

CREATE DATABASE IF NOT EXISTS AcomPaci_db
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE AcomPaci_db;

-- Paciente admitido pela recepção. O token (6 caracteres) é o acesso do
-- acompanhante; o nome completo nunca sai da API para a visão pública (LGPD).
CREATE TABLE IF NOT EXISTS paciente (
  id                 INT          NOT NULL AUTO_INCREMENT,
  nome_completo      VARCHAR(150) NOT NULL,
  iniciais           VARCHAR(10)  NOT NULL,
  procedimento       VARCHAR(100) NOT NULL,
  ala                VARCHAR(100) NOT NULL DEFAULT 'A definir',
  status             ENUM('Aguardando','Em Preparação','Em Cirurgia','RPA','No Quarto','Alta')
                                  NOT NULL DEFAULT 'Aguardando',
  token              VARCHAR(6)   NOT NULL,
  email_acompanhante VARCHAR(254)     NULL,
  admitido_em        DATETIME     NOT NULL,           -- UTC
  alta_em            DATETIME         NULL,           -- UTC; o acesso expira 24h depois
  PRIMARY KEY (id),
  UNIQUE KEY ix_paciente_token (token)
) ENGINE=InnoDB;

-- Cada mudança de status, para a linha do tempo do acompanhante.
CREATE TABLE IF NOT EXISTS historico_status (
  id          INT      NOT NULL AUTO_INCREMENT,
  paciente_id INT      NOT NULL,
  status      ENUM('Aguardando','Em Preparação','Em Cirurgia','RPA','No Quarto','Alta') NOT NULL,
  alterado_em DATETIME NOT NULL,                      -- UTC
  PRIMARY KEY (id),
  KEY ix_historico_status_paciente_id (paciente_id),
  CONSTRAINT fk_historico_paciente FOREIGN KEY (paciente_id)
    REFERENCES paciente (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Equipe que entra na recepção ou na enfermagem. A senha é guardada só como
-- hash PBKDF2; crie usuários com: python -m app.criar_usuario
CREATE TABLE IF NOT EXISTS usuario (
  id         INT          NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(150) NOT NULL,
  login      VARCHAR(100) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil     ENUM('recepcionista','enfermeiro') NOT NULL,
  ativo      TINYINT(1)   NOT NULL DEFAULT 1,
  criado_em  DATETIME     NOT NULL,                   -- UTC
  PRIMARY KEY (id),
  UNIQUE KEY ix_usuario_login (login)
) ENGINE=InnoDB;
