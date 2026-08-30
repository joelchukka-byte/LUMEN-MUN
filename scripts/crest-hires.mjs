/**
 * Build the crest asset used by the opening screen, from the supplied artwork.
 *
 * This is the original raster, upscaled and cleaned. It is deliberately NOT a
 * trace: tracing needed denoising to stop the dim wireframe breaking into
 * thousands of specks, and that denoising softened the whole mark. The original
 * is sharper, so the original is what ships.
 *
 * Two details matter for the seamless opening screen:
 *
 * 1. The outermost pixel ring of the source is a dark JPEG edge artifact
 *    (#46071C), not the artwork's background. It is cropped, otherwise it reads
 *    as a thin outline once the image is scaled up.
 * 2. The background is measured from the four corner patches, which are pure
 *    background. Measuring the border ring picks up that artifact and reads too
 *    dark; sampling inward picks up the globe and reads too light. Either one
 *    leaves a visible square where the image meets the page.
 *
 * Resampling then leaves the flat field varying by a couple of levels, which
 * shows against a solid page, so near-background pixels are snapped to exactly
 * one value. The script prints the colour as encoded, and that is what
 * --crest-field must hold.
 *
 *   npm run crest
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { statSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'public/img/crest.jpg');
const OUT = join(root, 'public/img/crest-hi.webp');

/** 1600 against a 660px display is ~2.4x density. The source is only 1179px. */
const TARGET = 1600;
const CROP = 3;
const PATCH = 70;
/** Pixels within this distance of the field colour are snapped to it exactly. */
const SNAP = 12;

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const at = (x, y) => {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2]];
};

const corners = [
  [CROP, CROP],
  [width - CROP - PATCH, CROP],
  [CROP, height - CROP - PATCH],
  [width - CROP - PATCH, height - CROP - PATCH],
];

const sum = [0, 0, 0];
let n = 0;
for (const [x0, y0] of corners) {
  for (let y = y0; y < y0 + PATCH; y++) {
    for (let x = x0; x < x0 + PATCH; x++) {
      const p = at(x, y);
      for (let c = 0; c < 3; c++) sum[c] += p[c];
      n++;
    }
  }
}
const field = '#' + sum.map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('');
const rgb = [1, 3, 5].map((i) => parseInt(field.slice(i, i + 2), 16));

const scaled = await sharp(SRC)
  .extract({ left: CROP, top: CROP, width: width - CROP * 2, height: height - CROP * 2 })
  .resize(TARGET, null, { kernel: sharp.kernel.lanczos3 })
  .sharpen({ sigma: 0.8 })
  .raw()
  .toBuffer({ resolveWithObject: true });

const px = scaled.data;
const ch = scaled.info.channels;
let snapped = 0;
for (let i = 0; i < px.length; i += ch) {
  if (Math.hypot(px[i] - rgb[0], px[i + 1] - rgb[1], px[i + 2] - rgb[2]) < SNAP) {
    px[i] = rgb[0];
    px[i + 1] = rgb[1];
    px[i + 2] = rgb[2];
    snapped++;
  }
}

await sharp(px, {
  raw: { width: scaled.info.width, height: scaled.info.height, channels: ch },
})
  // 95 measures 0.3% mean difference from lossless on this flat artwork, for an
  // eighth of the bytes.
  .webp({ quality: 95 })
  .toFile(OUT);

/* Read the field back out of the encoded file: WebP shifts it by a level or so,
   and that encoded value is what the page has to match. */
const encoded = await sharp(OUT).raw().toBuffer({ resolveWithObject: true });
const ec = encoded.info.channels;
const delivered =
  '#' + [0, 1, 2].map((c) => encoded.data[c + ec * 4].toString(16).padStart(2, '0')).join('');

const meta = await sharp(OUT).metadata();
console.log(`source     ${width}x${height}`);
console.log(`measured   ${field}  (source corner patches)`);
console.log(`delivered  ${delivered}  <- --crest-field must equal this`);
console.log(`wrote      ${OUT}`);
console.log(`           ${meta.width}x${meta.height}, ${(statSync(OUT).size / 1024).toFixed(0)}KB`);
console.log(`snapped    ${((snapped / (scaled.info.width * scaled.info.height)) * 100).toFixed(1)}% of pixels to the field`);
