# Bot Financiero Personal

Un bot de Telegram que registra tus ingresos y gastos en Google Sheets con solo escribir en lenguaje natural. Sin formularios, sin apps, sin complicaciones.

Le escribes `gasté 20000 en supermercado` y él solo se encarga de guardarlo.

---

## Cómo funciona

El bot recibe mensajes de texto, detecta el monto, la fecha y si es un ingreso o gasto, y lo agrega como una fila nueva en tu planilla de Google Sheets. Todo sin inteligencia artificial — el parseo es mediante reglas y heurísticas, lo que lo hace predecible y fácil de ajustar.

Solo los usuarios que estén en la whitelist pueden usarlo. Ideal para uso personal o familiar cerrado.

---

## Ejemplos de mensajes

```
gasté 20000 en supermercado
pagué 1.500 de taxi ayer
recibí 150k de sueldo
transferí 50 mil a Juan el 10/01/2026
compré zapatillas por 45.000 el 3 de marzo
me depositaron 200 lucas hoy
```

Formatos de monto que entiende: `20000`, `20.000`, `20,000`, `20k`, `20 mil`, `20 lucas`

Fechas: `dd/mm/yyyy`, `dd/mm/yy`, `2 de enero`, `4 de abril de 2026`, `hoy`, `ayer`, `anteayer`, `la semana pasada`

Si no detecta un monto, responde avisando. Si no hay fecha, usa la fecha de hoy.

---

## Stack

- Node.js 18+ (ES Modules)
- Express
- Telegram Bot API via Webhook
- Google Sheets API con Service Account
- Sin base de datos propia — todo va directo al Sheet

---

## Estructura del proyecto

```
financial-bot/
├── src/
│   ├── channels/
│   │   ├── telegram.js        ← todo lo que tiene que ver con Telegram
│   │   └── whatsapp.js        ← referencia para migración futura
│   ├── core/
│   │   ├── parser.js          ← orquesta el parseo completo
│   │   ├── amountParser.js    ← detecta y normaliza montos
│   │   ├── dateParser.js      ← detecta y normaliza fechas
│   │   └── typeDetector.js    ← decide si es Ingreso o Gasto
│   ├── services/
│   │   └── sheets.js          ← escribe en Google Sheets
│   ├── config.js              ← whitelist y configuración
│   └── server.js              ← servidor Express y rutas
├── .env.example
├── .gitignore
├── vercel.json
└── package.json
```

La lógica de parseo está completamente separada del canal. Si en algún momento quieres migrar a WhatsApp, el core no se toca — solo cambia el adaptador en `channels/`.

---

## Setup inicial

### 1. Crear el bot en Telegram

Busca **@BotFather** en Telegram, mándale `/newbot` y sigue los pasos. Al final te da un token que se ve así:

```
7412345678:AAHdqTcvCHCK7Bm4hHxzXKXAbcdef123456
```

Ese es tu `TELEGRAM_BOT_TOKEN`. Guárdalo.

### 2. Crear el Google Sheet

Entra a [sheets.google.com](https://sheets.google.com), crea una planilla nueva y renombra la primera hoja como `Movimientos`. El bot crea los encabezados automáticamente en el primer uso.

De la URL copia el ID:
```
https://docs.google.com/spreadsheets/d/  →ESTE_VALOR←  /edit
```

### 3. Habilitar la API de Google Sheets

1. Entra a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Ve a **APIs y Servicios → Biblioteca**
4. Busca **Google Sheets API** y habilítala

### 4. Crear una Service Account

1. En Google Cloud, ve a **APIs y Servicios → Credenciales**
2. Clic en **+ Crear credenciales → Cuenta de servicio**
3. Pon un nombre (ej: `bot-financiero`) y finaliza
4. Una vez creada, entra a ella → pestaña **Claves** → **Agregar clave → JSON**
5. Se descarga un archivo `.json` — ese es el que necesitas

### 5. Compartir el Sheet con la Service Account

Abre el JSON descargado y copia el valor de `client_email`. Se ve así:

```
bot-financiero@tu-proyecto.iam.gserviceaccount.com
```

Abre tu Google Sheet, haz clic en **Compartir**, pega ese email y dale permiso de **Editor**.

### 6. Configurar las variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Completa los valores:

```env
TELEGRAM_BOT_TOKEN=tu_token_aqui

# Pega el contenido completo del JSON en una sola línea
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

GOOGLE_SPREADSHEET_ID=tu_id_aqui

GOOGLE_SHEET_NAME=Movimientos

PORT=3000
```

> El JSON de credenciales tiene que estar en una sola línea. Para convertirlo: `cat credenciales.json | tr -d '\n'`

### 7. Agregar usuarios a la whitelist

Edita `src/config.js` y agrega los Telegram User IDs que pueden usar el bot:

```js
whitelist: [
  123456789,  // tu ID
  987654321,  // alguien más
],
```

Para saber tu ID, háblale a **@userinfobot** en Telegram. También aparece en los logs del servidor cuando alguien no autorizado intenta escribir.

---

## Correr el proyecto

```bash
npm install
npm start
```

---

## Probar localmente

Telegram necesita una URL pública para enviar los webhooks. Para desarrollo local usa [ngrok](https://ngrok.com).

**Terminal 1:**
```bash
npm start
```

**Terminal 2:**
```bash
ngrok http 3000
```

Ngrok te da una URL como `https://abc123.ngrok-free.app`. Regístrala como webhook:

```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok-free.app/webhook/telegram"}'
```

Para verificar que quedó bien:

```bash
curl "https://api.telegram.org/botTU_TOKEN/getWebhookInfo"
```

> Cada vez que reinicias ngrok cambia la URL, así que hay que repetir el registro del webhook.

---

## Deploy en producción

### Vercel

```bash
npm i -g vercel
vercel --prod
```

Configura las variables de entorno en el dashboard (Settings → Environment Variables) y registra el webhook con la URL de producción.

### Render / Railway

Conecta tu repositorio de GitHub en la plataforma y configura las variables de entorno en el panel. Ambas detectan Node.js automáticamente.

- Build command: `npm install`
- Start command: `npm start`

### Google Cloud Run

Agrega un `Dockerfile` al proyecto:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
```

```bash
gcloud run deploy financial-bot --source . --region us-central1 --allow-unauthenticated
```

---

## Migrar a WhatsApp en el futuro

El parser no sabe nada de Telegram. Si quieres migrar a WhatsApp Cloud API, el `core/` completo se queda igual. Lo único que cambia:

- Implementar `src/channels/whatsapp.js` (ya hay un archivo de referencia con todo documentado)
- Registrar las rutas nuevas en `server.js`
- Agregar las variables de entorno del canal (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc.)
- En la whitelist, usar números de teléfono en lugar de user IDs

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token de BotFather | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON completo de credenciales de la Service Account | ✅ |
| `GOOGLE_SPREADSHEET_ID` | ID del Google Sheet | ✅ |
| `GOOGLE_SHEET_NAME` | Nombre de la hoja (default: `Movimientos`) | ❌ |
| `PORT` | Puerto del servidor (default: `3000`) | ❌ |

---

## Licencia

MIT