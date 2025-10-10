# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Traductor Chino-Español Argentino: Una aplicación web para traducir mensajes de Telegram del chino al español argentino usando Claude AI. La aplicación detecta automáticamente el tipo de mensaje y aplica reglas de traducción diferenciadas según el remitente.

## Commands

### Development
```bash
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000
npm run build        # Build de producción
npm run preview      # Vista previa del build de producción
npm run lint         # Ejecutar ESLint
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

### Message Detection Flow

1. **Input** → Usuario pega mensajes de Telegram
2. **Parse** (`messageParser.js`) → Detecta tipo automáticamente:
   - `教授:` o `Professor:` → tipo: 'profesor'
   - `助理:` o `Assistant:` → tipo: 'asistente'
   - `30:` o `32(女):` → tipo: 'cliente', gender: 'hombre'/'mujer'
3. **Clean** → Remueve prefijos (教授:, 30:, etc.) del texto original
4. **Translate** (`claudeAPI.js`) → Llama a Claude API en lotes de 5 mensajes paralelos
5. **Prompt** (`translationPrompt.js`) → Construye prompt específico según tipo y género
6. **Display** → Muestra resultados con opción de editar y copiar

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
│   ├── InputArea.jsx          # Área de input de mensajes
│   ├── Header.jsx             # Header con botones de settings e instrucciones
│   └── LoadingSpinner.jsx     # Spinner de carga
├── utils/
│   └── clipboard.js           # Utilidad para copiar al portapapeles
└── App.jsx                    # Componente principal con lógica de estado
```

## Critical Rules

### Translation Prompt System (`translationPrompt.js`)

Este archivo es el corazón del sistema. **NUNCA modificar sin revisar ambos proyectos**:

- La función `buildTranslationPrompt(type, gender, originalText)` genera prompts completamente diferentes según el tipo
- Los ejemplos de referencia son críticos para la calidad de traducción
- Las reglas de puntuación son opuestas entre proyectos (CON vs SIN)

### Custom Instructions System (NEW)

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

### Message Parser (`messageParser.js`)

- Soporta tanto `:` como `：` (fullwidth colon) para compatibilidad
- Soporta tanto `(女)` como `（女）` (fullwidth parenthesis)
- Pre-procesa texto de Telegram para eliminar metadata: `"blues 周伯通工作室, [2025-10-10 11:20 AM]"`
- Maneja mensajes multilínea correctamente

### API Integration

- API key se almacena en `localStorage` (solo frontend, no seguro para producción)
- Modelo usado: `claude-sonnet-4-20250514`
- Batch size: 5 mensajes en paralelo para respetar rate limits
- `dangerouslyAllowBrowser: true` está habilitado (necesario para uso en frontend)

## Tech Stack

- React 19.1 con hooks (useState, useEffect)
- Vite 7 como build tool (puerto 3000)
- Tailwind CSS con configuración custom (fuentes chinas, colores primarios)
- Anthropic SDK (@anthropic-ai/sdk v0.27.3)
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

**Nota importante**: Las instrucciones personalizadas tienen prioridad sobre el prompt base. Si un usuario reporta traducciones inesperadas, verificar primero si hay instrucciones personalizadas activas.

## Important Notes

- Fecha actual según instrucciones globales: Septiembre 2025
- NUNCA usar valores de ejemplo en código - preguntar al usuario si falta información
- La API key debe comenzar con `sk-ant-`
- El archivo `system-prompt.md` es documentación de referencia del sistema de prompts (NO código ejecutable)
