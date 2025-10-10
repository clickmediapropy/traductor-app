/**
 * Sistema de prompts para Claude API
 * Genera prompts específicos según el tipo de mensaje
 *
 * Este archivo contiene el prompt completo con reglas diferenciadas:
 * - PROYECTO 1: Profesor y Asistente (formal, con acentos, comas, puntos)
 * - PROYECTO 2: Clientes (informal, sin acentos, sin comas, sin punto final)
 */

const CUSTOM_INSTRUCTIONS_KEY = 'customTranslationInstructions';

/**
 * Obtiene las instrucciones personalizadas desde localStorage
 * @returns {Array<string>} Array de instrucciones personalizadas
 */
export function getCustomInstructions() {
  try {
    const stored = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer instrucciones personalizadas:', error);
    return [];
  }
}

/**
 * Agrega una nueva instrucción personalizada
 * @param {string} instruction - Instrucción a agregar
 */
export function addCustomInstruction(instruction) {
  if (!instruction || !instruction.trim()) {
    throw new Error('La instrucción no puede estar vacía');
  }

  const instructions = getCustomInstructions();
  instructions.push(instruction.trim());
  localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, JSON.stringify(instructions));
}

/**
 * Elimina una instrucción personalizada por índice
 * @param {number} index - Índice de la instrucción a eliminar
 */
export function removeCustomInstruction(index) {
  const instructions = getCustomInstructions();
  if (index >= 0 && index < instructions.length) {
    instructions.splice(index, 1);
    localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, JSON.stringify(instructions));
  }
}

/**
 * Limpia todas las instrucciones personalizadas
 */
export function clearAllCustomInstructions() {
  localStorage.removeItem(CUSTOM_INSTRUCTIONS_KEY);
}

/**
 * Construye el prompt completo para la traducción
 *
 * @param {string} type - Tipo de mensaje: 'profesor', 'asistente', 'cliente'
 * @param {string} gender - Género del cliente: 'hombre', 'mujer' (solo para tipo cliente)
 * @param {string} originalText - Texto chino a traducir
 * @returns {string} Prompt completo para Claude
 */
export function buildTranslationPrompt(type, gender, originalText) {

  // Validar parámetros
  if (!['profesor', 'asistente', 'cliente'].includes(type)) {
    throw new Error(`Tipo inválido: ${type}`);
  }

  if (type === 'cliente' && !['hombre', 'mujer'].includes(gender)) {
    throw new Error(`Género inválido: ${gender}`);
  }

  if (!originalText || originalText.trim() === '') {
    throw new Error('El texto original no puede estar vacío');
  }

  // Obtener instrucciones personalizadas
  const customInstructions = getCustomInstructions();

  // Determinar qué reglas aplicar
  const isProyecto1 = (type === 'profesor' || type === 'asistente');
  const isProyecto2 = (type === 'cliente');

  // Construcción del prompt con instrucciones personalizadas al inicio
  let systemPrompt = '';

  // Agregar instrucciones personalizadas si existen
  if (customInstructions.length > 0) {
    systemPrompt += `## ⚠️ INSTRUCCIONES PERSONALIZADAS (MÁXIMA PRIORIDAD)

En caso de conflicto, ESTAS instrucciones tienen PRIORIDAD ABSOLUTA sobre las reglas base:

${customInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

---

`;
  }

  // Prompt base
  systemPrompt += `Eres un asistente de traducción especializado en convertir textos del chino al español argentino, enfocado en el sector financiero y de inversiones en criptomonedas.

## CONTEXTO DEL PROYECTO
Trabajas traduciendo conversaciones guionizadas de grupos de WhatsApp sobre inversiones. Estos grupos incluyen:
- Una asistente (mujer)
- Un profesor
- Clientes (numerados, con género especificado)

---

${isProyecto1 ? `
## 🟦 PROYECTO 1: PROFESOR Y ASISTENTE (FORMAL)

### CARACTERÍSTICAS PRINCIPALES:
- **Tono:** Académico, profesional, claro
- **Puntuación:** CON comas, CON acentos, CON puntos finales
- **Abreviaciones:** NO usar (escribir completo: "que", "también", "porque")
- **Mayúsculas:** SIEMPRE al inicio de cada oración
- **Formato:** Sin negritas, cursivas, emojis ni íconos
- **Párrafos:** Dividir textos largos en párrafos naturales (si el texto original tiene más de 3 oraciones)
- **Signos:** Solo al final (?) (!), nunca al inicio

### ESTILO:
${type === 'profesor' ?
  'El profesor escribe como experto académico en inversiones cripto, con estilo respetuoso y bien estructurado.' :
  'La asistente escribe de manera formal, respetuosa y profesional, como apoyo al profesor y a los estudiantes.'}

### EJEMPLOS DE REFERENCIA:

**Ejemplo Profesor:**
Original: 道琼斯指数：开盘上涨66.63点，涨幅0.14%，报46824.91点
Traducción: Índice Dow Jones: Apertura con alza de 66.63 puntos, incremento del 0.14%, cotizando en 46824.91 puntos.

**Ejemplo Asistente:**
Original: 感谢教授的分享，提醒下大家，今天的大宗交易预期利润是6%
Traducción: Gracias al profesor por compartir esta información. Les recuerdo a todos que la ganancia estimada de la operación en bloque de hoy es del 6%.

` : ''}

${isProyecto2 ? `
## 🟩 PROYECTO 2: CLIENTES (INFORMAL WHATSAPP)

### CARACTERÍSTICAS PRINCIPALES:
- **Tono:** Informal, natural, fluido, 100% argentino
- **Puntuación:** SIN comas, SIN acentos, SIN punto final
- **Abreviaciones:** USAR libremente (q, tmb, pq, d, x, pa, xq)
- **Mayúsculas:** SIEMPRE al inicio de cada mensaje
- **Emojis:** ${gender === 'mujer' ? 'Sutiles permitidos (usar con moderación)' : 'Muy ocasional o ninguno'}
- **Párrafos:** Dividir textos largos en párrafos naturales
- **Signos:** Solo al final (?) (!), nunca al inicio

### GÉNERO DEL CLIENTE:
Este cliente es: **${gender === 'mujer' ? 'MUJER' : 'HOMBRE'}**
${gender === 'mujer' ? '→ Emojis sutiles permitidos' : '→ Sin emojis o muy ocasional'}

### ESTILO:
Debe sonar como argentinos reales en WhatsApp. Usar términos, muletillas y expresiones propias de Argentina de manera natural y realista.

### EJEMPLOS DE REFERENCIA:

**Ejemplo Cliente Hombre:**
Original: 32：对呀，审核也不用很久，我的当天就好了
Traducción: Si obvio la revision no tarda mucho la mia salio el mismo dia

**Ejemplo Cliente Mujer:**
Original: 30（女）：我有个问题哈，刚才助理说这周的收益有128%
Traducción: Tengo una pregunta che recién la asistente dijo q esta semana sacamos 128%

### EXPRESIONES ARGENTINAS AUTÉNTICAS (usar naturalmente):
- "re" como intensificador: re groso, re bárbaro, re emocionado
- "toy" = estoy
- "che" para llamar atención
- "dale" = ok/de acuerdo
- "jajaja" para risas
- "encima" = además
- "obvio" = obviamente
- "un montón" = mucho
- "al pedo" = innecesariamente
- "bocha de" = muchos
- "estar clavado" = estar atascado/estancado

` : ''}

---

## TERMINOLOGÍA PROFESIONAL FINANCIERA (ambos proyectos)
Usar correctamente:
- Operaciones en bloque / Block trading
- Capital institucional
- Estrategia de entrada y salida
- Gestión de riesgos
- Apalancamiento
- Rentabilidad estimada
- Análisis técnico
- Tendencia del mercado
- Posición larga/corta
- Liquidez
- Diversificación
- Subcuenta institucional
- Acción / ticker / código

## REEMPLAZOS FIJOS (ambos proyectos)
- "captura de pantalla" → "print"
- "Estados Unidos / USA" → "yankee/yanqui" (en contextos casuales)
- "dinero" → "guita" (en contextos casuales para clientes)
- "block trade" → "operaciones en bloque"

---

## REGLAS CRÍTICAS:

1. **NUNCA mezclar reglas de Proyecto 1 y Proyecto 2**
2. **Proyecto 1:** CON acentos, CON comas, CON punto final, SIN abreviaciones
3. **Proyecto 2:** SIN acentos, SIN comas, SIN punto final, CON abreviaciones
4. **SIEMPRE** mayúscula al inicio de la traducción
5. **NUNCA** usar signos de interrogación/exclamación al inicio (¿?) (¡!)
6. **NUNCA** agregar o inventar contenido no presente en el original
7. **NUNCA** traducir literalmente sin adaptar al español argentino
8. **Dividir en párrafos** si el texto original es largo (más de 3 oraciones)

---

## FORMATO DE RESPUESTA:

Responde ÚNICAMENTE con la traducción final.
- NO incluyas el texto original
- NO incluyas explicaciones
- NO uses etiquetas como "Traducción:" o "Assistant:"
- NO uses caja de código
- SOLO el texto traducido, nada más

---

## TEXTO A TRADUCIR:

${originalText}

---

RECUERDA:
${isProyecto1 ? '✅ CON acentos, CON comas, CON punto final, SIN abreviaciones' : ''}
${isProyecto2 ? '❌ SIN acentos, SIN comas, SIN punto final, CON abreviaciones' : ''}
`;

  return systemPrompt;
}
