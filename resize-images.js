const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = './img/img-originals';
const OUTPUT_DIR = './img';
const WIDTHS = [640, 1200, 1920, 2560];

// Crea las carpetas automáticamente si no existen
if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// MEJORA: El filtro ahora acepta tanto minúsculas como mayúsculas (.jpg, .JPG, .JPEG, etc.)
const files = fs.readdirSync(INPUT_DIR).filter(f => /\.(jpe?g|png)$/i.test(f));

(async () => {
  // AVISO: Si no hay imágenes en la carpeta, te lo indicará en la consola
  if (files.length === 0) {
    console.log('⚠️  The folder "img-originals" is empty or has no valid .jpg/.png images.');
    console.log('👉 Please drop your high-resolution renders inside "img-originals" and run the script again.');
    return;
  }

  console.log(`🚀 Found ${files.length} images. Starting optimization...`);

  for (const file of files) {
    // Reemplaza espacios por guiones por seguridad en servidores web
    const name = path.parse(file).name.replace(/\s+/g, '-');
    const inputPath = path.join(INPUT_DIR, file);

    for (const width of WIDTHS) {
      const img = sharp(inputPath).resize({ width, withoutEnlargement: true });

      // Generar versión JPG optimizada
      await img.clone().jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(OUTPUT_DIR, `${name}-${width}.jpg`));

      // Generar versión WebP (mucho más ligera para web)
      await img.clone().webp({ quality: 80 })
        .toFile(path.join(OUTPUT_DIR, `${name}-${width}.webp`));
    }
    console.log(`✓ ${file} processed successfully in all sizes.`);
  }
  
  console.log('✨ Done! Check your "img" folder.');
})();