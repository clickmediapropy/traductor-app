/**
 * Script para generar iconos PWA de diferentes tamaños
 * Requiere: npm install --save-dev sharp
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const logoPath = join(publicDir, 'logo.png');

// Tamaños de iconos a generar
const iconSizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

// Tamaños de splash screens para iOS
const splashSizes = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // iPad
  { width: 1284, height: 2778, name: 'apple-splash-1284-2778.png' }, // iPhone 14 Pro Max
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png' }, // iPhone 14 Pro
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X/11 Pro
];

async function generateIcons() {
  console.log('🎨 Generando iconos PWA...\n');

  try {
    // Generar iconos
    for (const { size, name } of iconSizes) {
      const outputPath = join(publicDir, name);
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    // Generar splash screens con logo centrado
    console.log('\n🎨 Generando splash screens...\n');
    for (const { width, height, name } of splashSizes) {
      const outputPath = join(publicDir, name);
      const logoSize = Math.min(width, height) / 3; // Logo ocupa 1/3 del tamaño menor

      // Crear fondo con gradiente violeta
      const background = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 139, g: 92, b: 246, alpha: 1 } // #8b5cf6 (violeta)
        }
      }).png().toBuffer();

      // Resize logo
      const logo = await sharp(logoPath)
        .resize(Math.floor(logoSize), Math.floor(logoSize), {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();

      // Componer splash screen: fondo + logo centrado
      await sharp(background)
        .composite([{
          input: logo,
          gravity: 'center'
        }])
        .png()
        .toFile(outputPath);

      console.log(`✅ Generado: ${name} (${width}x${height})`);
    }

    console.log('\n✨ ¡Todos los iconos generados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
    process.exit(1);
  }
}

generateIcons();
