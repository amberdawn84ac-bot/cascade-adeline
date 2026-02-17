/**
 * Generate favicon files from the Adeline hero illustration.
 * Run: node scripts/generate-favicon.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const INPUT = 'public/adeline-hero.png';
const OUT = 'public';

async function main() {
  // Favicon 32x32 (ICO replacement — browsers accept PNG)
  await sharp(INPUT)
    .resize(32, 32, { fit: 'cover', position: 'top' })
    .png()
    .toFile(`${OUT}/favicon-32.png`);

  // Apple touch icon 180x180
  await sharp(INPUT)
    .resize(180, 180, { fit: 'cover', position: 'top' })
    .png()
    .toFile(`${OUT}/apple-touch-icon.png`);

  // OG image 1200x630 (social sharing)
  await sharp(INPUT)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85 })
    .toFile(`${OUT}/og-image.jpg`);

  // Nav logo — small circular crop from top portion (grandmother's face area)
  await sharp(INPUT)
    .resize(200, 200, { fit: 'cover', position: 'top' })
    .png()
    .toFile(`${OUT}/adeline-nav.png`);

  // Watermark version — full image at reduced opacity (we'll handle opacity in CSS)
  await sharp(INPUT)
    .resize(800, null, { withoutEnlargement: true })
    .png({ quality: 80 })
    .toFile(`${OUT}/adeline-watermark.png`);

  console.log('✅ Generated: favicon-32.png, apple-touch-icon.png, og-image.jpg, adeline-nav.png, adeline-watermark.png');
}

main().catch(console.error);
