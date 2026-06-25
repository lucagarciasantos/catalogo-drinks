# 🚀 Guia de Deploy (produção)

Arquitetura pública: **Frontend na Vercel** + **3 backends no Render** + **Redis no Render**.

```
Vercel (frontend)  ──HTTPS──►  auth-service (Render)
        │          ──HTTPS──►  resource-service (Render)
        └──────────  WSS  ───►  notification-service (Render)
                                       │
                                  Redis (Render)
```

> ⚠️ **Planos free**: os serviços do Render "dormem" após ~15 min sem uso e levam
> ~30–60s para acordar. Antes de apresentar, abra a URL de cada serviço uma vez
> para acordá-los. O SQLite no free é efêmero: os dados de **seed** (drinks e
> usuários de teste) são recriados sempre que o serviço reinicia; drinks criados
> à mão podem se perder em um restart. Para a demo isso é suficiente.

---

## Passo 1 — Enviar o código para o GitHub

Já está tudo commitado. Faça o push da branch `main`:

```bash
git push origin main
```

(Se o Git pedir login, use seu usuário do GitHub + um Personal Access Token como senha.)

---

## Passo 2 — Backends + Redis no Render

### Opção A — Blueprint (automático)

1. Acesse https://render.com e faça login com o GitHub.
2. **New +** → **Blueprint** → conecte o repositório `catalogo-drinks`.
3. O Render lê o `render.yaml` e cria: `projeto2-redis`, `auth-service`,
   `resource-service`, `notification-service`. Confirme e aguarde o build.

### Opção B — Manual (se o Blueprint reclamar de algum campo)

Crie um **Key Value (Redis)** e depois **3 Web Services**, todos a partir do mesmo repo:

| Serviço               | Root Directory          | Build         | Start       |
| --------------------- | ----------------------- | ------------- | ----------- |
| auth-service          | `auth-service`          | `npm install` | `npm start` |
| resource-service      | `resource-service`      | `npm install` | `npm start` |
| notification-service  | `notification-service`  | `npm install` | `npm start` |

Variáveis de ambiente (aba *Environment* de cada serviço):

- **auth-service**: `JWT_SECRET` (mesmo valor nos dois), `JWT_EXPIRES_IN=1h`,
  `SERVICE_NAME=auth-service`, `REDIS_URL=<Internal URL do Redis>`
- **resource-service**: `JWT_SECRET` (**igual** ao do auth), `CACHE_TTL_MS=30000`,
  `SERVICE_NAME=resource-service`, `REDIS_URL=<Internal URL do Redis>`
- **notification-service**: `SERVICE_NAME=notification-service`,
  `REDIS_URL=<Internal URL do Redis>`

> Não defina `PORT` à mão — o Render injeta automaticamente, e o código já usa `process.env.PORT`.

Ao final, anote as 3 URLs públicas, algo como:

```
https://auth-service-xxxx.onrender.com
https://resource-service-xxxx.onrender.com
https://notification-service-xxxx.onrender.com
```

---

## Passo 3 — Frontend na Vercel

1. Acesse https://vercel.com e faça login com o GitHub.
2. **Add New… → Project** → importe o repo `catalogo-drinks`.
3. Em **Root Directory**, selecione **`frontend`** (importante: é um monorepo).
   O preset **Vite** é detectado sozinho (build `npm run build`, output `dist`).
4. Em **Environment Variables**, adicione (use as URLs do Passo 2 — note o `wss://`):

   | Nome                | Valor                                               |
   | ------------------- | --------------------------------------------------- |
   | `VITE_AUTH_URL`     | `https://auth-service-xxxx.onrender.com`            |
   | `VITE_RESOURCE_URL` | `https://resource-service-xxxx.onrender.com`        |
   | `VITE_WS_URL`       | `wss://notification-service-xxxx.onrender.com`      |

5. **Deploy**.

> As variáveis `VITE_*` são "assadas" no build. Se mudar uma URL depois, **redeploy**
> o frontend na Vercel para o novo valor valer.

---

## Passo 4 — Testar

1. Abra cada URL do Render uma vez para acordar os serviços
   (a de `/health` retorna `{"status":"ok"}`).
2. Abra a URL da Vercel, faça login com **alice / senha123**.
3. Crie/edite/exclua um drink. Abra em duas janelas (uma anônima, logada como
   `bob`) para ver a atualização em tempo real via WebSocket.

---

## Observações de produção (já tratadas no código)

- **CORS** liberado nos serviços (o JWT vai no header `Authorization`, sem cookies).
- **WebSocket** sobe sobre o mesmo servidor HTTP → o Render serve via `wss://` (TLS) automaticamente.
- **Redis (Upstash como alternativa)**: se preferir o Upstash em vez do Redis do
  Render, crie um banco lá e use a URL `rediss://…` em `REDIS_URL` (o cliente já
  lida com TLS pelo esquema `rediss`).
- **HTTPS**: na Vercel e no Render o TLS é automático — em produção tudo roda sob HTTPS/WSS.
