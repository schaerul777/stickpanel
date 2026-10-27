import { brandColor, fmtDateTime, type SurveyPhoto } from './surveyData';

// ─── Dummy survey photo ───────────────────────────────────────────────────────
// The prototype has no real photo assets, so each survey photo is drawn as an
// SVG street scene that reflects what the board shows (brand / blank / for-rent
// sign / removed). Cached per seed+scene since rows re-render often.

const cache = new Map<string, string>();

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function photoSrc(photo: SurveyPhoto): string {
  const key = `${photo.seed}|${JSON.stringify(photo.scene)}|${photo.takenAt}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { scene, seed } = photo;
  const skies = [['#9CC9EA', '#E3F0F8'], ['#F3C99A', '#FBE7CF'], ['#B7C6D4', '#E6ECF1'], ['#8FB8DE', '#DDEBF6']];
  const [skyTop, skyBottom] = skies[seed % skies.length];
  const tilt = ((seed % 7) - 3) * 0.8;
  const shift = ((seed % 5) - 2) * 14;

  const buildings = Array.from({ length: 7 }, (_, i) => {
    const w = 70 + ((seed * (i + 3)) % 50);
    const h = 90 + ((seed * (i + 7)) % 120);
    const x = i * 95 - 20;
    return `<rect x="${x}" y="${330 - h}" width="${w}" height="${h}" fill="#${['8A97A6', '9AA6B3', '7F8C9A'][i % 3]}" opacity="0.55"/>`;
  }).join('');

  const bx = 150 + shift;
  const by = 70;
  const bw = 340;
  const bh = 165;
  let board = '';
  if (scene.status === 'Filled') {
    const c = brandColor(scene.brand);
    board = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${c}"/>
      <rect x="${bx}" y="${by + bh - 34}" width="${bw}" height="34" fill="rgba(0,0,0,0.18)"/>
      <text x="${bx + bw / 2}" y="${by + 88}" font-family="Arial, sans-serif" font-size="${scene.brand.length > 16 ? 22 : 34}" font-weight="700" fill="#fff" text-anchor="middle">${esc(scene.brand)}</text>
      <circle cx="${bx + bw - 34}" cy="${by + 34}" r="18" fill="rgba(255,255,255,0.25)"/>`;
  } else if (scene.status === 'Empty') {
    board = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#EDEDE8"/>
      <path d="M${bx + 40} ${by} l6 ${bh} M${bx + 190} ${by} l-4 ${bh} M${bx + 280} ${by} l3 ${bh}" stroke="#C9B9A0" stroke-width="5" opacity="0.5"/>`;
  } else if (scene.status === 'Space available') {
    board = `
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#FFFFFF"/>
      <text x="${bx + bw / 2}" y="${by + 58}" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#C2410C" text-anchor="middle">DISEWAKAN</text>
      ${scene.cp ? `<text x="${bx + bw / 2}" y="${by + 102}" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#111" text-anchor="middle">${esc(scene.cp)}</text>` : ''}
      ${scene.owner ? `<rect x="${bx + 14}" y="${by + bh - 42}" width="${Math.min(240, scene.owner.length * 9 + 20)}" height="28" rx="4" fill="#525252"/><text x="${bx + 24}" y="${by + bh - 23}" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">${esc(scene.owner)}</text>` : ''}`;
  }

  const structure = scene.status === 'No longer exists'
    ? `<rect x="${bx + 70}" y="${by + 200}" width="16" height="130" fill="#6B6B6B"/><rect x="${bx + bw - 86}" y="${by + 230}" width="16" height="100" fill="#6B6B6B"/>`
    : `<rect x="${bx + 70}" y="${by + bh}" width="16" height="${330 - by - bh}" fill="#55595E"/>
       <rect x="${bx + bw - 86}" y="${by + bh}" width="16" height="${330 - by - bh}" fill="#55595E"/>
       <rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="${bh + 12}" fill="none" stroke="#3F4348" stroke-width="8"/>
       ${board}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" width="640" height="420">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <g ${scene.blurry ? 'filter="url(#blur)"' : ''} transform="rotate(${tilt} 320 210)">
      <rect x="-40" y="-40" width="720" height="500" fill="url(#sky)"/>
      ${buildings}
      <rect x="-40" y="330" width="720" height="130" fill="#6E7378"/>
      <path d="M-40 390 L680 380" stroke="#F4F4F4" stroke-width="5" stroke-dasharray="36 28"/>
      ${structure}
    </g>
    <rect x="0" y="390" width="640" height="30" fill="rgba(0,0,0,0.45)"/>
    <text x="12" y="410" font-family="monospace" font-size="13" fill="#fff">${esc(fmtDateTime(photo.takenAt))}${photo.lat != null ? `  ·  ${photo.lat.toFixed(5)}, ${photo.lng!.toFixed(5)}` : '  ·  GPS n/a'}</text>
  </svg>`;

  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}
