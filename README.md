# 🍹 Catálogo de Drinks — Projeto 2 (Fullstack Distribuído)

Sistema fullstack distribuído que estende o Projeto 1 (SPA React que consumia a
TheCocktailDB). Agora os dados de drinks vêm do **nosso próprio backend**,
dividido em três microsserviços independentes que se comunicam por **HTTP** e por
uma **fila de mensagens (Redis Pub/Sub)**, com **notificações em tempo real via
WebSocket**.

> Disciplina: Programação Web Fullstack — Prof. Anderson Paulo Ávila Santos (UTFPR)

---

## 🏗️ Arquitetura

```
                         ┌──────────────────────────┐
                         │        Frontend          │
                         │   React + Vite + MUI      │
                         │      (porta 5173)         │
                         └─────┬───────────┬─────────┘
              HTTP (login)     │           │   WebSocket (tempo real)
                               │           │
          ┌────────────────────▼──┐     ┌──▼───────────────────────┐
          │     auth-service      │     │   notification-service   │
          │  Express + JWT (3001) │     │  Express + ws (3003)     │
          │  SQLite: auth.sqlite  │     │  (consumidor da fila)    │
          └───────────────────────┘     └──────────▲───────────────┘
                                                    │ subscribe
   HTTP (CRUD, Bearer JWT)                          │
          ┌────────────────────────┐               │
          │    resource-service    │   publish      │
          │  Express + CRUD (3002) ├───────────────►│
          │ SQLite: resource.sqlite│   (Redis Pub/Sub)
          └──────────┬─────────────┘
                     │
              ┌──────▼──────┐
              │    Redis    │  fila de mensagens + espelho de tokens revogados
              │  (porta 6379)│
              └─────────────┘
```

### Fluxo de comunicação

1. **Login:** Frontend → `auth-service` (`POST /login`) → retorna um **JWT**.
2. **CRUD:** Frontend → `resource-service` (HTTP, header `Authorization: Bearer <token>`).
   O `resource-service` valida o JWT **localmente** com o segredo compartilhado
   (não chama o `auth-service` a cada request).
3. A cada `create/update/delete` bem-sucedido, o `resource-service` **publica** um
   evento no Redis (`recurso.criado`, `recurso.atualizado`, `recurso.excluido`).
4. O `notification-service` está **inscrito** nesses canais e, ao receber um evento,
   **retransmite via WebSocket** para todos os clientes conectados.
5. O Frontend abre o WebSocket após o login e **atualiza a lista automaticamente**
   quando recebe uma notificação — sem reload.

### Independência dos serviços

- Cada serviço tem seu **próprio `package.json`**, sua **própria porta** e seu
  **próprio arquivo SQLite**. Nenhum serviço acessa o banco de outro.
- A comunicação acontece **somente** por HTTP (síncrono) ou pela fila Redis (assíncrono).

---

## 🧱 Tecnologias

| Camada            | Tecnologias                                                        |
| ----------------- | ------------------------------------------------------------------ |
| Frontend          | React 19, Vite 8, Material UI 9                                     |
| Backend           | Node.js, Express                                                   |
| Banco de dados    | SQLite (`better-sqlite3`) — um arquivo por serviço                  |
| Fila de mensagens | Redis Pub/Sub (`redis`)                                            |
| Autenticação      | JWT (`jsonwebtoken`) + hash de senha (`bcryptjs`)                  |
| Tempo real        | WebSocket (`ws`)                                                   |
| Outros            | `compression`, `express-rate-limit`, `cors`, `morgan`, `dotenv`   |

---

## 📁 Estrutura

```
projeto2/
├── auth-service/          # login, JWT, logout (porta 3001)
│   └── src/{routes,models,config}
├── resource-service/      # CRUD de drinks (porta 3002)
│   └── src/{routes,models,config}
├── notification-service/  # WebSocket + consumidor da fila (porta 3003)
│   └── src/{routes,models,config}
├── frontend/              # SPA React (porta 5173)
│   └── src/{components,contexts}
└── README.md
```

Cada serviço segue o padrão: **controladores escritos direto nos arquivos de
`routes/`**, acesso a dados em `models/` e configuração (banco, JWT, Redis, logger,
cache) em `config/`.

---

## ✅ Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (testado em Node 24)
- [Docker](https://www.docker.com/) **ou** um Redis local na porta 6379

---

## 🚀 Como executar localmente

### 1. Subir o Redis

Com Docker (mais simples):

```bash
docker run --name redis-projeto2 -p 6379:6379 -d redis
```

> Sem Redis os serviços ainda sobem, mas as **notificações em tempo real** e a
> revogação imediata de token no logout ficam indisponíveis (modo degradado).

### 2. Instalar dependências (uma vez por componente)

```bash
cd auth-service        && npm install && cd ..
cd resource-service    && npm install && cd ..
cd notification-service && npm install && cd ..
cd frontend            && npm install && cd ..
```

### 3. Configurar variáveis de ambiente

Cada serviço traz um `.env.example`. Copie para `.env` (os valores padrão já
funcionam para desenvolvimento local). **Importante:** o `JWT_SECRET` precisa ser
**idêntico** no `auth-service` e no `resource-service`.

```bash
cp auth-service/.env.example         auth-service/.env
cp resource-service/.env.example     resource-service/.env
cp notification-service/.env.example notification-service/.env
cp frontend/.env.example             frontend/.env
```

> No Windows (PowerShell) use `Copy-Item auth-service/.env.example auth-service/.env`.

### 4. Subir os 4 componentes (um terminal para cada)

```bash
# Terminal 1
cd auth-service && npm start          # http://localhost:3001

# Terminal 2
cd resource-service && npm start      # http://localhost:3002

# Terminal 3
cd notification-service && npm start  # http://localhost:3003 (HTTP + WebSocket)

# Terminal 4
cd frontend && npm run dev            # http://localhost:5173
```

Acesse **http://localhost:5173**.

### Portas

| Componente            | Porta | Protocolo        |
| --------------------- | ----- | ---------------- |
| auth-service          | 3001  | HTTP             |
| resource-service      | 3002  | HTTP             |
| notification-service  | 3003  | HTTP + WebSocket |
| frontend (Vite)       | 5173  | HTTP             |
| Redis                 | 6379  | TCP              |

### Usuários de teste (seed automático)

| Usuário | Senha      |
| ------- | ---------- |
| `alice` | `senha123` |
| `bob`   | `senha123` |

Os drinks de exemplo (Margarita, Mojito, Negroni, Daiquiri) pertencem à `alice` —
útil para ver o **HTTP 403** quando o `bob` tenta editá-los/excluí-los.

---

## 🔎 Demonstração de tempo real (dois navegadores)

1. Faça login como `alice` em uma janela e como `bob` em outra (janela anônima).
2. Em uma janela, **adicione/edite/exclua** um drink.
3. A outra janela atualiza a lista **automaticamente**, via WebSocket.

---

## 📋 Requisitos atendidos

**Funcionais:** RF1 Login (JWT + logout com revogação) · RF2 Busca · RF3 Inserção
(vínculo ao criador) · RF4 Atualização (PUT, dono → 403) · RF5 Exclusão (DELETE,
confirmação no front, dono → 403) · RF6 Notificações em tempo real.

**Não funcionais:** senhas com hash (bcrypt) · queries parametrizadas +
sanitização anti-XSS · rate limiting no login · invalidação de token no logout ·
verificação de propriedade no servidor (403) · logs com o nome do serviço de
origem · compressão das respostas HTTP · compressão dos assets estáticos do
frontend (`.gz`/`.br`) · cache em memória com TTL no `resource-service` · tuning
de conexão SQLite (WAL + `busy_timeout`).

### Sobre HTTPS

Em **produção**, todos os serviços ficariam atrás de **HTTPS** (TLS terminado por
um proxy reverso como Nginx, ou com certificado próprio) e o WebSocket usaria
**WSS**. Para o ambiente de **desenvolvimento local** usamos HTTP/WS simples para
facilitar a execução, sem necessidade de configurar certificados.
