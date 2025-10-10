/**
 * Copia texto al clipboard con feedback
 *
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} true si se copió exitosamente, false si falló
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error al copiar:', error);

    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
