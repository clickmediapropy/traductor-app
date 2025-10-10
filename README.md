# Traductor Chino-Español Argentino

Aplicación web para traducir mensajes de Telegram del chino al español argentino usando Claude AI.

## 🚀 Características

- ✅ Detección automática del tipo de mensaje (Profesor, Asistente, Cliente)
- ✅ Traducción contextual según el tipo de remitente
- ✅ Detección automática de género para clientes
- ✅ Traducción en lote (máximo 5 mensajes paralelos)
- ✅ Edición inline de traducciones
- ✅ Copiar traducciones con un click
- ✅ Interfaz responsive y profesional
- ✅ Error handling robusto

## 📋 Requisitos

- Node.js 18+
- API Key de Anthropic (https://console.anthropic.com/)

## 🛠️ Instalación

1. Clonar o descargar el proyecto
2. Instalar dependencias:

```bash
npm install
```

3. (Opcional) Crear un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

**NOTA:** La aplicación permite configurar la API key desde la interfaz, por lo que el archivo `.env` es opcional.

## 🚀 Uso

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción

```bash
npm run build
npm run preview
```

## 📖 Cómo usar

1. **Configurar API Key**: Al abrir la aplicación por primera vez, se abrirá un modal para configurar tu API key de Anthropic
2. **Pegar mensajes**: Pegá los mensajes de Telegram en el área de texto
3. **Traducir**: Hacé click en "Traducir Todo"
4. **Editar**: Podés editar cualquier traducción haciendo click en "Editar"
5. **Copiar**: Copiá traducciones individuales con el botón "Copiar"

## 📝 Formato de mensajes

La aplicación detecta automáticamente estos tipos de mensajes:

```
教授: Mensaje del profesor...
助理: Mensaje del asistente...
30: Mensaje de cliente hombre...
32(女): Mensaje de cliente mujer...
```

## 🏗️ Estructura del proyecto

```
traductor-app/
├── src/
│   ├── components/       # Componentes React
│   ├── services/         # Lógica de negocio (API, parser, prompts)
│   ├── utils/           # Utilidades (clipboard)
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── public/              # Archivos estáticos
└── package.json         # Dependencias
```

## 🎨 Stack Tecnológico

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Anthropic SDK** - Integración con Claude AI
- **LocalStorage** - Almacenamiento de API key

## 🔒 Seguridad

- La API key se almacena en localStorage del navegador
- Para producción, considerá usar variables de entorno del servidor
- Nunca commitees tu API key en el código

## 📦 Deploy

La aplicación está lista para deployarse en:
- Vercel
- Netlify
- Cualquier servicio que soporte aplicaciones Vite

## 🐛 Troubleshooting

### Error "No se configuró la API key"
- Asegurate de haber ingresado tu API key en el modal de configuración
- La API key debe comenzar con `sk-ant-`

### Error de traducción
- Verificá que tu API key sea válida
- Comprobá que tengas créditos en tu cuenta de Anthropic
- Revisá la consola del navegador para más detalles

## 📄 Licencia

MIT

## 👨‍💻 Autor

Creado con Claude Code
