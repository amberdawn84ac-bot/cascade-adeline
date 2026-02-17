/**
 * Crop the Adeline illustration to remove text overlay.
 * Extracts just the characters (grandmother, child, dog, book, flowers).
 */
import sharp from 'sharp';

// Original: 644x800
// Text is on left side + top. Characters are center-right, bottom 55%.
// Crop: start at x=100, y=200, width=544, height=600
// This captures the grandmother, child, dog, open book, and flowers
// while removing "Education as Unique as Your Child" text and the button.

await sharp('public/adeline-hero.png')
  .extract({ left: 170, top: 350, width: 474, height: 450 })
  .png()
  .toFile('public/adeline-characters.png');

console.log('✅ Cropped to adeline-characters.png (560x620, text removed)');
