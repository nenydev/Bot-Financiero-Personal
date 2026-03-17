# Bot Financiero Personal

Un bot de Telegram que registra ingresos, gastos y envíos en Google Sheets con solo escribir en lenguaje natural. Sin formularios, sin apps, sin complicaciones.

Le escribes `gasté 20000 en supermercado` y él solo se encarga de guardarlo.

---

## Cómo funciona

El bot recibe mensajes de texto, detecta el monto, la fecha, el tipo de movimiento y la fuente del dinero, y lo agrega como una fila nueva en tu planilla de Google Sheets. Todo sin inteligencia artificial — el parseo es mediante reglas y heurísticas, lo que lo hace predecible y fácil de ajustar.

Solo los usuarios que estén en la whitelist pueden usarlo. Si el bot no detecta la fuente del movimiento, le pregunta al usuario antes de guardar.

---

## Ejemplos de mensajes

**Movimientos financieros:**
```
gasté 20000 en supermercado
pagué 1.500 de taxi ayer en efectivo
recibí 150k de sueldo
me transfirieron 50 mil por BancoEstado
compré zapatillas por 45.000 el 3 de marzo
me depositaron 200 lucas hoy
gané 4 lucas en el casino
vendimos 30 mil por punto
```

**Envíos:**
```
envio 5 lucas ramo a maipu
enviamos 8000 flores a santiago centro
envié 12 mil bouquet a las condes
```

**Montos:** `20000`, `20.000`, `20,000`, `20k`, `20 mil`, `20 lucas`, `20 lukas`

**Fechas:** `dd/mm/yyyy`, `dd/mm/yy`, `2 de enero`, `4 de abril de 2026`, `hoy`, `ayer`, `anteayer`, `la semana pasada`

**Fuentes detectadas automáticamente:**
- **Cuenta:** transferencias, bancos (BancoEstado, BCI, Santander...), tarjeta, débito, crédito
- **Efectivo:** efectivo, cash, en mano, billetes
- **Punto:** punto, por punto, por caja, en caja *(solo Ingresos)*
- Sin mención → el bot pregunta antes de guardar

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `/hoy` | Resumen de los movimientos del día |
| `/semanal` | Resumen de los últimos 7 días |
| `/mensual` | Resumen del mes actual |
| `/trimestral` | Resumen de los últimos 3 meses |
| `/semestral` | Resumen de los últimos 6 meses |
| `/anual` | Resumen del año actual |
| `/historico` | Resumen de todos los movimientos |
| `/balance` | Balance rápido del mes actual |
| `/movimientos` | Últimos 10 movimientos registrados |
| `/ultimo` | Último movimiento registrado |
| `/envios_semanal` | Resumen de envíos de los últimos 7 días |
| `/envios_mensual` | Resumen de envíos del mes actual |
| `/envios_anual` | Resumen de envíos del año actual |
| `/reporte` | Genera y envía el PDF del mes por Telegram |
| `/reporte_email` | Envía el PDF del mes a tu correo |
| `/borrar` | Eliminar un movimiento (con confirmación) |
| `/ayuda` | Lista de comandos y ejemplos |

---

## Reportes automáticos

El bot envía automáticamente a todos los usuarios de la whitelist:
- **Domingos a las 9pm** (hora Chile) — resumen semanal por Telegram
- **Último día del mes a las 9pm** (hora Chile) — resumen mensual por Telegram
- **Último día del mes a las 9:05pm** (hora Chile) — PDF completo por Telegram y email

---

## Stack

- Node.js 18+ (ES Modules)
- Express
- Telegram Bot API via Webhook
- Google Sheets API con Service Account
- Gmail API via OAuth2 para envío de emails
- pdfkit para generación de reportes PDF
- Sin base de datos propia — todo va directo al Sheet
- Desplegado en Render con UptimeRobot

---

## Estructura del proyecto

```
financial-bot/
├── src/
│   ├── channels/
│   │   ├── telegram.js        ← webhook, comandos y respuestas
│   │   └── whatsapp.js        ← referencia para migración futura
│   ├── core/
│   │   ├── parser.js          ← orquesta el parseo completo
│   │   ├── amountParser.js    ← detecta y normaliza montos
│   │   ├── dateParser.js      ← detecta y normaliza fechas
│   │   ├── typeDetector.js    ← decide si es Ingreso o Gasto
│   │   ├── paymentParser.js   ← detecta la fuente del movimiento
│   │   ├── envioParser.js     ← detecta si el mensaje es un envío
│   │   └── resumen.js         ← genera resúmenes financieros
│   ├── services/
│   │   ├── sheets.js          ← lee y escribe en Google Sheets
│   │   ├── scheduler.js       ← resúmenes y PDF automáticos
│   │   ├── pdf.js             ← genera el reporte PDF
│   │   └── mailer.js          ← envía emails via Gmail API
│   ├── config.js              ← whitelist y configuración
│   └── server.js              ← servidor Express y rutas
├── .env.example
├── .gitignore
├── vercel.json
└── package.json
```

---

## Hojas del Google Sheet

**Hoja `Movimientos`:**

| Columna | Contenido |
|---|---|
| A | Fecha (dd/mm/yyyy) |
| B | Fuente (Cuenta / Efectivo / Punto) |
| C | Tipo (Ingreso / Gasto) |
| D | Monto |
| E | Detalle (mensaje original) |

**Hoja `Envios`:**

| Columna | Contenido |
|---|---|
| A | Fecha (dd/mm/yyyy) |
| B | Monto |
| C | Detalle (mensaje original) |

---

## Setup inicial

### 1. Crear el bot en Telegram

Busca **@BotFather** en Telegram, mándale `/newbot` y sigue los pasos. Al final te da un token que se ve así:

```
7412345678:AAHdqTcvCHCK7Bm4hHxzXKXAbcdef123456
```

Ese es tu `TELEGRAM_BOT_TOKEN`. Guárdalo.

### 2. Crear el Google Sheet

Entra a [sheets.google.com](https://sheets.google.com), crea una planilla nueva y crea dos hojas:

**Hoja `Movimientos`** — encabezados en fila 1:
`Fecha` | `Fuente` | `Tipo` | `Monto` | `Detalle`

**Hoja `Envios`** — encabezados en fila 1:
`Fecha` | `Monto` | `Detalle`

De la URL copia el ID:
```
https://docs.google.com/spreadsheets/d/  →ESTE_VALOR←  /edit
```

### 3. Habilitar APIs en Google Cloud

1. Entra a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Ve a **APIs y Servicios → Biblioteca** y habilita:
   - **Google Sheets API**
   - **Gmail API**

### 4. Crear una Service Account (para Sheets)

1. Ve a **APIs y Servicios → Credenciales**
2. Clic en **+ Crear credenciales → Cuenta de servicio**
3. Pon un nombre (ej: `bot-financiero`) y finaliza
4. Entra a la cuenta creada → pestaña **Claves** → **Agregar clave → JSON**
5. Se descarga un archivo `.json` — guárdalo

### 5. Compartir el Sheet con la Service Account

Copia el `client_email` del JSON descargado:
```
bot-financiero@tu-proyecto.iam.gserviceaccount.com
```

Abre tu Google Sheet → **Compartir** → pega el email → permiso de **Editor**.

### 6. Configurar Gmail OAuth2 (para emails)

1. En Google Cloud → **APIs y Servicios → Credenciales**
2. Clic en **+ Crear credenciales → ID de cliente OAuth**
3. Configura la pantalla de consentimiento si te lo pide (tipo Externo)
4. Tipo de aplicación: **Aplicación web**
5. En URIs de redireccionamiento agrega: `https://developers.google.com/oauthplayground`
6. Guarda el **Client ID** y **Client Secret**
7. Ve a [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
8. Clic en ⚙️ → activa **Use your own OAuth credentials** → pega Client ID y Secret
9. Selecciona `https://mail.google.com/` en Gmail API v1
10. Autoriza con tu cuenta de Google
11. Clic en **Exchange authorization code for tokens**
12. Copia el **Refresh token**

### 7. Configurar las variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Completa los valores:

```env
TELEGRAM_BOT_TOKEN=tu_token_aqui

# JSON completo de la Service Account en una sola línea
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

GOOGLE_SPREADSHEET_ID=tu_id_aqui
GOOGLE_SHEET_NAME=Movimientos

# Gmail OAuth2
GMAIL_USER=tu-correo@gmail.com
GMAIL_CLIENT_ID=tu_client_id
GMAIL_CLIENT_SECRET=tu_client_secret
GMAIL_REFRESH_TOKEN=tu_refresh_token

# Destinatarios del reporte PDF automático (separados por coma)
GMAIL_RECIPIENTS=correo1@gmail.com,correo2@gmail.com

PORT=3000
```

### 8. Agregar usuarios a la whitelist

Edita `src/config.js`:

```js
export const WHITELIST = [
  { id: 123456789, nombre: 'Nombre', email: 'correo@gmail.com' },
  { id: 987654321, nombre: 'Otro',   email: 'otro@gmail.com' },
];
```

Para saber el ID de alguien, diles que le escriban a **@userinfobot** en Telegram.

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

Registra el webhook:
```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"https://abc123.ngrok-free.app/webhook/telegram\"}"
```

Verifica:
```bash
curl "https://api.telegram.org/botTU_TOKEN/getWebhookInfo"
```

---

## Deploy en Render

1. Crea cuenta en [render.com](https://render.com)
2. Nuevo proyecto → **Web Service** → conecta tu repositorio de GitHub
3. Configura:
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Plan: **Free**
4. Agrega todas las variables de entorno en el panel de Render
5. Registra el webhook con la URL de Render:

```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"https://tu-app.onrender.com/webhook/telegram\"}"
```

### Mantener el servidor activo con UptimeRobot

1. Crea cuenta en [uptimerobot.com](https://uptimerobot.com)
2. Nuevo monitor → **HTTP(s)**
3. URL: `https://tu-app.onrender.com/ping`
4. Intervalo: 5 minutos

El endpoint `/ping` responde 200 de 8am a 12am hora Chile y 503 el resto del tiempo.

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token de BotFather | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON completo de credenciales de la Service Account | ✅ |
| `GOOGLE_SPREADSHEET_ID` | ID del Google Sheet | ✅ |
| `GOOGLE_SHEET_NAME` | Nombre de la hoja principal (default: `Movimientos`) | ❌ |
| `GMAIL_USER` | Correo Gmail desde el que se envían los reportes | ✅ |
| `GMAIL_CLIENT_ID` | Client ID de OAuth2 | ✅ |
| `GMAIL_CLIENT_SECRET` | Client Secret de OAuth2 | ✅ |
| `GMAIL_REFRESH_TOKEN` | Refresh token de OAuth2 | ✅ |
| `GMAIL_RECIPIENTS` | Emails destinatarios del reporte automático (separados por coma) | ✅ |
| `PORT` | Puerto del servidor (default: `3000`) | ❌ |

---

## Migrar a WhatsApp en el futuro

El parser no sabe nada de Telegram. Si quieres migrar a WhatsApp Cloud API, el `core/` completo se queda igual. Lo único que cambia:

- Implementar `src/channels/whatsapp.js` (ya hay un archivo de referencia documentado)
- Registrar las rutas nuevas en `server.js`
- Agregar las variables del canal (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc.)
- En la whitelist, usar números de teléfono en lugar de user IDs

---

## Licencia

Propietario — todos los derechos reservados.