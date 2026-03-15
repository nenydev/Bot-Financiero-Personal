# Bot Financiero Personal

Un bot de Telegram que registra tus ingresos y gastos en Google Sheets con solo escribir en lenguaje natural. Sin formularios, sin apps, sin complicaciones.

Le escribes `gasté 20000 en supermercado` y él solo se encarga de guardarlo.

---

## Cómo funciona

El bot recibe mensajes de texto, detecta el monto, la fecha, el tipo de movimiento y el medio de pago, y lo agrega como una fila nueva en tu planilla de Google Sheets. Todo sin inteligencia artificial — el parseo es mediante reglas y heurísticas, lo que lo hace predecible y fácil de ajustar.

Solo los usuarios que estén en la whitelist pueden usarlo. Ideal para uso personal o familiar cerrado.

---

## Ejemplos de mensajes

```
gasté 20000 en supermercado
pagué 1.500 de taxi ayer con tarjeta
recibí 150k de sueldo
me transfirieron 50 mil por BancoEstado
compré zapatillas por 45.000 el 3 de marzo en efectivo
me depositaron 200 lucas hoy
gané 4 lucas en el casino
la policía me quitó 3 lucas
```

**Montos:** `20000`, `20.000`, `20,000`, `20k`, `20 mil`, `20 lucas`, `20 lukas`

**Fechas:** `dd/mm/yyyy`, `dd/mm/yy`, `2 de enero`, `4 de abril de 2026`, `hoy`, `ayer`, `anteayer`, `la semana pasada`

**Medio de pago detectado automáticamente:**
- Transferencia: bancoestado, banco de chile, bci, scotiabank, santander, itaú, transferí, me transfirieron, le mandé...
- Efectivo: efectivo, cash, en mano, billetes...
- Tarjeta/Punto: tarjeta, débito, crédito, punto de venta, por caja...
- Sin mención: No especificado

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
| `/borrar` | Eliminar un movimiento (con confirmación) |
| `/ayuda` | Lista de comandos y ejemplos |

---

## Stack

- Node.js 18+ (ES Modules)
- Express
- Telegram Bot API via Webhook
- Google Sheets API con Service Account
- Sin base de datos propia — todo va directo al Sheet
- Desplegado en Render con UptimeRobot para mantenerlo activo

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
│   │   ├── paymentParser.js   ← detecta el medio de pago
│   │   └── resumen.js         ← genera resúmenes financieros
│   ├── services/
│   │   ├── sheets.js          ← lee y escribe en Google Sheets
│   │   └── scheduler.js       ← resúmenes automáticos
│   ├── config.js              ← whitelist y configuración
│   └── server.js              ← servidor Express y rutas
├── .env.example
├── .gitignore
├── vercel.json
└── package.json
```

La lógica de parseo está completamente separada del canal. Si en algún momento quieres migrar a WhatsApp, el `core/` no se toca — solo cambia el adaptador en `channels/`.

---

## Columnas del Google Sheet

| Columna | Contenido |
|---|---|
| A | Fecha (dd/mm/yyyy) |
| B | Medio de pago |
| C | Tipo (Ingreso / Gasto) |
| D | Monto |
| E | Detalle (mensaje original) |

---

## Setup inicial

### 1. Crear el bot en Telegram

Busca **@BotFather** en Telegram, mándale `/newbot` y sigue los pasos. Al final te da un token que se ve así:

```
7412345678:AAHdqTcvCHCK7Bm4hHxzXKXAbcdef123456
```

Ese es tu `TELEGRAM_BOT_TOKEN`. Guárdalo.

### 2. Crear el Google Sheet

Entra a [sheets.google.com](https://sheets.google.com), crea una planilla nueva y renombra la primera hoja como `Movimientos`.

Agrega los encabezados manualmente en la fila 1:
- A1: `Fecha` | B1: `Medio de pago` | C1: `Tipo` | D1: `Monto` | E1: `Detalle`

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
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"https://abc123.ngrok-free.app/webhook/telegram\"}"
```

Para verificar que quedó bien:

```bash
curl "https://api.telegram.org/botTU_TOKEN/getWebhookInfo"
```

> Cada vez que reinicias ngrok cambia la URL, así que hay que repetir el registro del webhook.

---

## Deploy en Render (recomendado)

1. Crea una cuenta en [render.com](https://render.com)
2. Nuevo proyecto → **Web Service** → conecta tu repositorio de GitHub
3. Configura:
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Plan: **Free**
4. Agrega las variables de entorno en el panel de Render
5. Una vez desplegado, registra el webhook con la URL de Render:

```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" -H "Content-Type: application/json" -d "{\"url\":\"https://tu-app.onrender.com/webhook/telegram\"}"
```

### Mantener el servidor activo con UptimeRobot

El plan gratuito de Render duerme el servidor tras 15 minutos de inactividad. Para mantenerlo activo en horario de uso (8am a 12am hora Chile):

1. Crea una cuenta en [uptimerobot.com](https://uptimerobot.com)
2. Nuevo monitor → **HTTP(s)**
3. URL: `https://tu-app.onrender.com/ping`
4. Intervalo: 5 minutos

El endpoint `/ping` responde 200 de 8am a 12am hora Chile y 503 el resto del tiempo, así el servidor duerme fuera de horario.

---

## Resúmenes automáticos

El bot envía resúmenes automáticos a todos los usuarios de la whitelist:
- Domingos a las 9pm (hora Chile) — resumen semanal
- Último día del mes a las 9pm (hora Chile) — resumen mensual

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