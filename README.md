<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9d8b2885-45e6-492d-8748-56d8ec1723cf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Opcionalmente, define `VITE_LOGIN_EMAIL` e `VITE_LOGIN_PASSWORD` no `.env.local` para alterar as credenciais de acesso. Por defeito, o email é `goncalo.fcmacedo@gmail.com` e a palavra-passe é `leadhunter`.
4. Run the app:
   `npm run dev`

## Deploy no Coolify (VPS)

A app inclui um `Dockerfile` multi-stage pronto para o Coolify (build da imagem, sem necessidade de Nixpacks).

1. No Coolify, cria um novo recurso do tipo **Application** a partir deste repositório Git, com **Build Pack: Dockerfile**.
2. Define a porta do container como `3000` (é a porta exposta pelo `Dockerfile`; o Traefik do Coolify trata do SSL/domínio automaticamente).
3. Configura as variáveis de ambiente:
   - **Environment Variables** (runtime): `GEMINI_API_KEY` — obrigatória para os endpoints de IA.
   - **Build Variables** (usadas apenas durante o `docker build`, porque o Vite as embebe no bundle do frontend): `VITE_LOGIN_EMAIL` e `VITE_LOGIN_PASSWORD`, caso queiras alterar as credenciais de acesso por defeito.
4. Ativa o **Health Check** do Coolify apontando para `GET /api/health` (o `Dockerfile` já define um `HEALTHCHECK` interno equivalente).
5. Faz deploy — o Coolify passa a fazer rebuild automático em cada push para o branch configurado.

Não é necessário Postgres/Redis: a app guarda os dados localmente no browser (`localStorage`), sem base de dados no servidor.

Para testar localmente com Docker antes de enviar para o servidor:

```bash
GEMINI_API_KEY=a_tua_chave docker compose up --build
```
