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

A app inclui um `Dockerfile` multi-stage pronto para o Coolify (build da imagem, sem necessidade de Nixpacks), e guarda todos os dados (leads, notas, lembretes, visitas, registos de contacto, definições) numa base de dados **Postgres**.

1. **Cria primeiro a base de dados**: no Coolify, adiciona um recurso do tipo **Postgres** (gerido por ele, com backups automáticos) e copia a connection string interna que ele gera.
2. Cria um novo recurso do tipo **Application** a partir deste repositório Git, com **Build Pack: Dockerfile**.
3. Define a porta do container como `3000` (é a porta exposta pelo `Dockerfile`; o Traefik do Coolify trata do SSL/domínio automaticamente).
4. Configura as variáveis de ambiente:
   - **Environment Variables** (runtime):
     - `GEMINI_API_KEY` — obrigatória para os endpoints de IA.
     - `DATABASE_URL` — obrigatória, a connection string do recurso Postgres criado no passo 1.
   - **Build Variables** (usadas apenas durante o `docker build`, porque o Vite as embebe no bundle do frontend): `VITE_LOGIN_EMAIL` e `VITE_LOGIN_PASSWORD`, caso queiras alterar as credenciais de acesso por defeito.
5. Ativa o **Health Check** do Coolify apontando para `GET /api/health` (o `Dockerfile` já define um `HEALTHCHECK` interno equivalente).
6. Faz deploy — o servidor cria automaticamente as tabelas necessárias no arranque (não precisas de correr migrações à mão). O Coolify passa a fazer rebuild automático em cada push para o branch configurado.

Se já tinhas dados guardados no `localStorage` do browser de uma versão anterior da app, a primeira vez que abrires a app depois deste deploy ela deteta isso automaticamente e migra tudo para o Postgres (é seguro, só corre uma vez e nunca substitui dados já existentes na base de dados).

Para testar localmente com Docker antes de enviar para o servidor (já inclui um Postgres descartável só para desenvolvimento):

```bash
GEMINI_API_KEY=a_tua_chave docker compose up --build
```
