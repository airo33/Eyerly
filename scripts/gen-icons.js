const sharp = require('sharp');
const path = require('path');

const CORAL = '#EF6350';
const WHITE = '#FFFFFF';

const blink = (withBg) => `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${withBg ? `<rect width="1024" height="1024" fill="${CORAL}"/>` : ''}
  <path d="M205 499 Q512 755 819 499" fill="none" stroke="${WHITE}" stroke-width="70" stroke-linecap="round"/>
  <line x1="339" y1="712" x2="314" y2="812" stroke="${WHITE}" stroke-width="45" stroke-linecap="round"/>
  <line x1="512" y1="748" x2="512" y2="855" stroke="${WHITE}" stroke-width="45" stroke-linecap="round"/>
  <line x1="685" y1="712" x2="710" y2="812" stroke="${WHITE}" stroke-width="45" stroke-linecap="round"/>
</svg>`;

const out = (p) => path.join(__dirname, '..', 'assets', 'images', p);

async function main() {
  // App icon: full-bleed coral square + white blink (iOS masks corners).
  await sharp(Buffer.from(blink(true)))
    .resize(1024, 1024)
    .png()
    .toFile(out('icon.png'));

  // Splash icon: white blink on transparent (splash background is coral).
  await sharp(Buffer.from(blink(false)))
    .resize(1024, 1024)
    .png()
    .toFile(out('splash-icon.png'));

  // Android adaptive foreground: white blink on transparent, padded a bit.
  await sharp(Buffer.from(blink(false)))
    .resize(1024, 1024)
    .png()
    .toFile(out('android-icon-foreground.png'));

  console.log('Generated icon.png, splash-icon.png, android-icon-foreground.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
