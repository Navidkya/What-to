import sharp from 'sharp';

// SVG base do ícone What to
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="80" fill="#0B0D12"/>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <defs>
    <radialGradient id="grad" cx="30%" cy="10%">
      <stop offset="0%" stop-color="#3d1f05" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0B0D12" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <text x="256" y="200" font-family="Georgia, serif" font-size="160" font-weight="700" fill="#f5f1eb" text-anchor="middle" dominant-baseline="middle">what</text>
  <text x="256" y="360" font-family="Georgia, serif" font-size="160" font-weight="700" font-style="italic" fill="#C89B3C" text-anchor="middle" dominant-baseline="middle">to</text>
</svg>`;

const svgBuffer = Buffer.from(svg);

await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-512x512.png');
console.log('✓ pwa-512x512.png');

await sharp(svgBuffer).resize(192, 192).png().toFile('public/pwa-192x192.png');
console.log('✓ pwa-192x192.png');

await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('✓ apple-touch-icon.png');

await sharp(svgBuffer).resize(32, 32).png().toFile('public/favicon.ico');
console.log('✓ favicon.ico');

console.log('Ícones gerados com sucesso!');
