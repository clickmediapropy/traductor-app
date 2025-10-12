# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ElizabethAI**: Traductor de mensajes de Telegram del chino al español argentino usando Claude AI. La aplicación detecta automáticamente el tipo de mensaje y aplica reglas de traducción diferenciadas según el remitente.

**Características principales:**
- Traducción contextual con reglas opuestas según tipo de mensaje
- Integración con Telegram Bot para workaround de limitaciones de iOS Safari
- Storage persistente con Upstash Redis para sesiones de bot
- Sistema de instrucciones personalizadas con prioridad sobre reglas base

## Commands

### Development
```bash
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción (limpia cache de Vite automáticamente)
npm run preview      # Vista previa del build de producción
npm run lint         # Ejecutar ESLint
```

### Deployment
```bash
vercel --prod --yes  # Deploy a producción en Vercel
vercel env add       # Agregar variables de entorno
vercel env ls        # Listar variables de entorno
vercel alias set <deployment-url> traductor-app-two.vercel.app  # Actualizar alias
```

## Architecture

### Translation System (Core Logic)

El sistema de traducción está basado en dos "proyectos" con reglas completamente opuestas:

**PROYECTO 1 (Profesor y Asistente)**: Formal, académico
- CON acentos, CON comas, CON punto final
- SIN abreviaciones (escribir "que", "también", "porque" completo)
- Estilo profesional y estructurado

**PROYECTO 2 (Clientes)**: Informal, estilo WhatsApp argentino
- SIN acentos, SIN comas, SIN punto final
- CON abreviaciones (q, tmb, pq, d, x, pa, xq)
- Expresiones argentinas naturales (re, che, dale, obvio, toy)
- Diferenciación por género: mujeres pueden usar emojis sutiles, hombres no

### Message Detection Flow (Frontend)

1. **Input** → Usuario pega mensajes de Telegram O ingresa código de bot
2. **Parse** (`messageParser.js`) → Detecta tipo automáticamente:
   - `教授:` o `Professor:` → tipo: 'profesor'
   - `助理:` o `Assistant:` → tipo: 'asistente'
   - `30:` o `32(女):` → tipo: 'cliente', gender: 'hombre'/'mujer'
3. **Clean** → Remueve prefijos (教授:, 30:, etc.) y metadata de Telegram
4. **Translate** (`claudeAPI.js`) → Llama a Claude API en lotes de 5 mensajes paralelos
5. **Prompt** (`translationPrompt.js`) → Construye prompt específico según tipo y género
6. **Display** → Muestra resultados con opción de editar y copiar

### Telegram Bot Integration (Serverless)

**Problema resuelto:** iOS Safari trunca el clipboard cuando se copia de Telegram, solo capturando `text/plain` truncado en lugar del HTML completo.

**Solución:** Bot de Telegram que permite:
1. Usuario envía `/new` al bot → Recibe código de 6 caracteres
2. Usuario reenvía (forward) mensajes de Telegram al bot
3. Usuario envía `/done` → Sesión se cierra
4. Usuario ingresa código en la app web → Obtiene todos los mensajes

**Flujo técnico del bot:**

1. **Webhook** (`api/bot/webhook.js`) → Recibe updates de Telegram via POST
2. **Handler** (`api/bot/telegram-bot.js`) → Procesa comandos:
   - `/new` → Crea sesión en Redis, retorna código
   - `/done` → Cierra sesión (marca como `active: false`)
   - `/cancel` → Cancela sesión
   - Forwarded messages → Agrega mensaje a sesión activa
3. **Storage** (`api/bot/storage.js`) → Upstash Redis con TTL de 1 hora:
   - `bot_session:{CODE}` → Datos de sesión (messages, chatId, active, timestamps)
   - `chat_active:{CHAT_ID}` → Mapeo de chatId a código activo
4. **API** (`api/bot/get-messages.js`) → Frontend obtiene mensajes por código
5. **Frontend** (`CodeInput.jsx`) → Usuario ingresa código, llama a API, inserta texto

**CRÍTICO - Async/Await:** Todas las funciones de storage son async. SIEMPRE usar `await` cuando se llama a `createSession()`, `getSession()`, `addMessage()`, `closeSession()`, `getActiveChatSession()`.

### File Structure

```
src/
├── services/
│   ├── messageParser.js       # Detección de tipo de mensaje y limpieza
│   ├── translationPrompt.js   # Sistema de prompts + instrucciones personalizadas (CRÍTICO)
│   └── claudeAPI.js           # Integración con Anthropic SDK
├── components/
│   ├── MessageCard.jsx        # Card individual con edición inline
│   ├── ApiKeyModal.jsx        # Modal de configuración de API key
│   ├── CustomInstructionsModal.jsx  # Modal para gestionar instrucciones personalizadas
│   ├── InputArea.jsx          # Área de input con tabs (Paste/Bot Code)
│   ├── CodeInput.jsx          # Input para códigos de bot (6 caracteres)
│   ├── Header.jsx             # Header con botones de settings e instrucciones
│   └── LoadingSpinner.jsx     # Spinner de carga
├── utils/
│   └── clipboard.js           # Utilidad para copiar al portapapeles
└── App.jsx                    # Componente principal con lógica de estado

api/
└── bot/
    ├── webhook.js             # Vercel serverless function - Telegram webhook handler
    ├── get-messages.js        # API endpoint para obtener mensajes por código
    ├── debug-sessions.js      # Endpoint de debug para ver sesiones activas
    ├── telegram-bot.js        # Lógica de comandos del bot (/new, /done, /cancel)
    └── storage.js             # Storage con Upstash Redis (persistente)
```

## Critical Rules

### Translation Prompt System (`translationPrompt.js`)

Este archivo es el corazón del sistema. **NUNCA modificar sin revisar ambos proyectos**:

- La función `buildTranslationPrompt(type, gender, originalText)` genera prompts completamente diferentes según el tipo
- Los ejemplos de referencia son críticos para la calidad de traducción
- Las reglas de puntuación son opuestas entre proyectos (CON vs SIN)

### Custom Instructions System

Sistema de instrucciones personalizadas que permite a los usuarios agregar reglas adicionales:

- **Funciones disponibles**:
  - `getCustomInstructions()` - Obtiene array de instrucciones de localStorage
  - `addCustomInstruction(instruction)` - Agrega nueva instrucción
  - `removeCustomInstruction(index)` - Elimina instrucción por índice
  - `clearAllCustomInstructions()` - Limpia todas las instrucciones

- **Comportamiento**: Las instrucciones personalizadas se prepend al inicio del prompt con **PRIORIDAD ABSOLUTA** sobre las reglas base
- **Persistencia**: Se guardan en localStorage con key `customTranslationInstructions`
- **UI**: Botón "📝 Instrucciones" en el header muestra badge con cantidad activa
- **Modal**: `CustomInstructionsModal.jsx` permite agregar, ver y eliminar instrucciones individuales

**Nota importante**: Las instrucciones personalizadas tienen prioridad sobre el prompt base. Si un usuario reporta traducciones inesperadas, verificar primero si hay instrucciones personalizadas activas.

### Message Parser (`messageParser.js`)

- Soporta tanto `:` como `：` (fullwidth colon) para compatibilidad
- Soporta tanto `(女)` como `（女）` (fullwidth parenthesis)
- Pre-procesa texto de Telegram para eliminar metadata: `"blues 周伯通工作室, [2025-10-10 11:20 AM]"`
- Maneja mensajes multilínea correctamente

### Bot Storage (Upstash Redis)

**IMPORTANTE:** El storage usa Upstash Redis para persistencia entre invocaciones serverless.

**Configuración requerida en Vercel:**
- `KV_REST_API_URL` - URL del endpoint REST de Upstash
- `KV_REST_API_TOKEN` - Token de autenticación
- `TELEGRAM_BOT_TOKEN` - Token del bot de Telegram

**Características:**
- TTL automático de 1 hora para sesiones
- TEST99 es un código especial que nunca expira (para testing)
- Las funciones son todas async - SIEMPRE usar await
- Redis maneja la expiración automáticamente, no hay cleanup manual necesario

**Debug endpoint:** `/api/bot/debug-sessions` muestra todas las sesiones activas (útil para troubleshooting)

### Telegram Bot Configuration

**Bot actual:** `@elizabethai_translator_bot`
**Webhook:** `https://traductor-app-two.vercel.app/api/bot/webhook`

**Para actualizar el webhook:**
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://traductor-app-two.vercel.app/api/bot/webhook"
```

**Para verificar webhook:**
```bash
curl -X GET "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
```

## Tech Stack

- React 19.1 con hooks (useState, useEffect)
- Vite 7 como build tool (puerto 3000)
- Tailwind CSS con configuración custom (fuentes chinas, colores primarios)
- Anthropic SDK (@anthropic-ai/sdk v0.27.3)
- Upstash Redis (@upstash/redis) - Storage persistente para bot
- ESLint con plugins para React hooks y React refresh

## Common Patterns

### Adding New Message Types

Si necesitas agregar un nuevo tipo de mensaje:

1. Actualizar `messageParser.js`: Agregar detección en el loop de parsing
2. Actualizar `translationPrompt.js`: Agregar sección con reglas específicas
3. Validar que `buildTranslationPrompt()` maneje el nuevo tipo
4. Actualizar ejemplos de referencia en el prompt

### Modifying Translation Rules

Si necesitas ajustar reglas de traducción:

1. **NUNCA** mezclar reglas entre Proyecto 1 y Proyecto 2
2. Modificar solo la sección relevante en `translationPrompt.js`
3. Probar con mensajes de ejemplo para verificar comportamiento
4. Los parámetros críticos de Claude API: `max_tokens: 2000`, `temperature: 0.3` (no incluida actualmente, considerar agregar)

### Working with Custom Instructions

Para agregar o modificar instrucciones personalizadas programáticamente:

```javascript
import {
  getCustomInstructions,
  addCustomInstruction,
  removeCustomInstruction
} from './services/translationPrompt';

// Agregar instrucción
addCustomInstruction("Para clientes mujeres, usar más emojis");

// Obtener todas
const instructions = getCustomInstructions();

// Eliminar por índice
removeCustomInstruction(0);
```

### Deploying with Fresh Build Cache

El `vercel.json` está configurado para limpiar cache automáticamente:

```json
{
  "buildCommand": "rm -rf dist node_modules/.vite && npm run build",
  "outputDirectory": "dist"
}
```

Esto garantiza builds frescos que generan nuevos hashes de bundles, evitando problemas de cache del navegador.

### Adding New Bot Commands

Para agregar un nuevo comando al bot:

1. Agregar handler en `telegram-bot.js`:
```javascript
export async function handleMyCommand(botToken, chatId) {
  const code = await getActiveChatSession(chatId); // SIEMPRE usar await
  // ... lógica
  await sendMessage(botToken, chatId, 'Response'); // SIEMPRE usar await
}
```

2. Agregar case en `handleUpdate()` switch statement
3. **CRÍTICO:** SIEMPRE usar `await` con funciones de storage
4. Testear con el bot antes de commitear

## Important Notes

- Fecha actual según instrucciones globales: Septiembre 2025
- NUNCA usar valores de ejemplo en código - preguntar al usuario si falta información
- La API key debe comenzar con `sk-ant-`
- El archivo `system-prompt.md` es documentación de referencia del sistema de prompts (NO código ejecutable)
- Las sesiones de bot se comparten entre `traductor-app` y `elizabethAI-telegram` (mismo Redis)
- El código TEST99 está hardcodeado y siempre disponible para testing

## Troubleshooting

### Bot no responde
1. Verificar webhook: `curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo`
2. Verificar variables de entorno en Vercel: `vercel env ls`
3. Revisar logs del deployment: `vercel logs {deployment-url}`
4. Probar endpoint de debug: `https://traductor-app-two.vercel.app/api/bot/debug-sessions`

### Código de bot no funciona
1. Verificar que la sesión existe: `/api/bot/debug-sessions`
2. Confirmar que el usuario envió `/done` (sesión debe estar `active: false`)
3. Verificar que no pasó 1 hora (TTL automático)
4. Revisar que el deployment tenga las variables KV configuradas

### Error "[object Promise]" en mensajes del bot
- Falta `await` en alguna función de storage
- Buscar todas las llamadas a `createSession`, `getSession`, `addMessage`, `closeSession`, `getActiveChatSession`
- Agregar `await` antes de cada una

### Browser cache issues
- El bundle se cachea agresivamente - usar hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- O abrir en modo incógnito
- Verificar que el hash del bundle cambió: `curl -s {url} | grep -o 'index-[^"]*\.js'`
