/* Shared drawing and degradation kit for the BSRGAN tutorial.
 * All image synthesis is deterministic and runs locally on small canvases.
 * The teaching JPEG/sensor models are simplified; see each widget's notes. */

export type Vec = { x: number; y: number };

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/* The reference photograph: a sunflower still life on a studio desk.  */
/* ------------------------------------------------------------------ */

export function drawReferencePhoto(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sx = w / 320;
  const sy = h / 240;
  ctx.save();
  ctx.scale(sx, sy);

  const wall = ctx.createLinearGradient(0, 0, 0, 240);
  wall.addColorStop(0, '#e8dfcd');
  wall.addColorStop(1, '#d6c8ae');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 320, 240);

  // window opening
  ctx.fillStyle = '#c9b99c';
  ctx.fillRect(20, 12, 280, 150);
  const sky = ctx.createLinearGradient(0, 18, 0, 150);
  sky.addColorStop(0, '#9fc9df');
  sky.addColorStop(0.65, '#d9e7df');
  sky.addColorStop(1, '#efe3c6');
  ctx.fillStyle = sky;
  ctx.fillRect(28, 20, 264, 134);

  // distant hills and a soft sun
  ctx.fillStyle = '#9db9a1';
  ctx.beginPath();
  ctx.moveTo(28, 120);
  ctx.quadraticCurveTo(80, 92, 132, 118);
  ctx.quadraticCurveTo(190, 86, 246, 116);
  ctx.quadraticCurveTo(270, 100, 292, 112);
  ctx.lineTo(292, 154);
  ctx.lineTo(28, 154);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9d8b8';
  ctx.beginPath();
  ctx.moveTo(28, 138);
  ctx.quadraticCurveTo(96, 116, 160, 140);
  ctx.quadraticCurveTo(222, 118, 292, 136);
  ctx.lineTo(292, 154);
  ctx.lineTo(28, 154);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#f6d98f';
  ctx.beginPath();
  ctx.arc(248, 54, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // window mullions
  ctx.strokeStyle = '#f4eddf';
  ctx.lineWidth = 7;
  ctx.strokeRect(28, 20, 264, 134);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(160, 20);
  ctx.lineTo(160, 154);
  ctx.moveTo(28, 88);
  ctx.lineTo(292, 88);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,70,45,.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 24, 256, 126);

  // table
  const wood = ctx.createLinearGradient(0, 168, 0, 240);
  wood.addColorStop(0, '#b9855a');
  wood.addColorStop(0.55, '#9a623c');
  wood.addColorStop(1, '#7b4b2d');
  ctx.fillStyle = wood;
  ctx.fillRect(0, 170, 320, 70);
  ctx.strokeStyle = 'rgba(70,40,20,.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, 178 + i * 11);
    ctx.bezierCurveTo(90, 176 + i * 11, 220, 182 + i * 11, 320, 179 + i * 11);
    ctx.stroke();
  }

  // notebook with high-frequency lines
  ctx.save();
  ctx.translate(18, 176);
  ctx.rotate(-0.08);
  ctx.fillStyle = '#f5efe1';
  ctx.fillRect(0, 0, 86, 52);
  ctx.strokeStyle = '#d6c9b1';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.moveTo(7, 8 + i * 6);
    ctx.lineTo(78, 8 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#b5533f';
  ctx.fillRect(0, 0, 86, 4);
  ctx.restore();

  // striped cloth on the right
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(238, 178);
  ctx.lineTo(320, 168);
  ctx.lineTo(320, 240);
  ctx.lineTo(252, 240);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#e7d9bd';
  ctx.fillRect(230, 160, 100, 90);
  ctx.fillStyle = 'rgba(68,106,120,.42)';
  for (let i = 0; i < 9; i += 1) {
    ctx.fillRect(228 + i * 12, 160, 5, 90);
  }
  ctx.restore();

  // vase
  const vase = ctx.createLinearGradient(132, 0, 190, 0);
  vase.addColorStop(0, '#7e99a0');
  vase.addColorStop(0.45, '#b7ccd0');
  vase.addColorStop(1, '#6f8a92');
  ctx.fillStyle = vase;
  ctx.beginPath();
  ctx.moveTo(146, 156);
  ctx.quadraticCurveTo(130, 196, 146, 214);
  ctx.quadraticCurveTo(163, 224, 180, 214);
  ctx.quadraticCurveTo(196, 196, 180, 156);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(45,65,70,.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5d7a82';
  ctx.beginPath();
  ctx.ellipse(163, 157, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // stem and leaves
  ctx.strokeStyle = '#4f6f3e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(163, 158);
  ctx.quadraticCurveTo(156, 128, 163, 96);
  ctx.stroke();
  ctx.fillStyle = '#5d8046';
  ctx.beginPath();
  ctx.ellipse(144, 142, 18, 7, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(182, 132, 17, 7, 0.45, 0, Math.PI * 2);
  ctx.fill();

  // sunflower petals and seeded center
  ctx.save();
  ctx.translate(166, 90);
  for (let i = 0; i < 22; i += 1) {
    const a = (i / 22) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    const petal = ctx.createLinearGradient(0, -14, 0, -56);
    petal.addColorStop(0, i % 2 ? '#f2b21f' : '#f7ca32');
    petal.addColorStop(1, i % 2 ? '#e39a12' : '#f0b623');
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.ellipse(0, -36, 8.5, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const core = ctx.createRadialGradient(-6, -6, 3, 0, 0, 24);
  core.addColorStop(0, '#8a5a2b');
  core.addColorStop(1, '#3f2614');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,200,130,.55)';
  const rng = mulberry32(41);
  for (let i = 0; i < 90; i += 1) {
    const r = 3 + rng() * 18;
    const a = rng() * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.8 + rng() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // small ceramic cup
  ctx.fillStyle = '#e9e1d2';
  ctx.beginPath();
  ctx.ellipse(48, 206, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cfc4b1';
  ctx.fillRect(30, 206, 36, 13);
  ctx.beginPath();
  ctx.ellipse(48, 219, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function createReferenceImage(w = 320, h = 240): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  drawReferencePhoto(ctx, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/* Image plumbing                                                      */
/* ------------------------------------------------------------------ */

export function cloneImage(data: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(data.data), data.width, data.height);
}

export function drawImageTo(canvas: HTMLCanvasElement, data: ImageData, smooth = false): void {
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.putImageData(data, 0, 0);
  canvas.style.imageRendering = smooth ? 'auto' : 'pixelated';
}

function sampleBilinear(data: ImageData, x: number, y: number): [number, number, number] {
  const { width: w, height: h, data: p } = data;
  const x0 = clamp(Math.floor(x), 0, w - 1);
  const y0 = clamp(Math.floor(y), 0, h - 1);
  const x1 = clamp(x0 + 1, 0, w - 1);
  const y1 = clamp(y0 + 1, 0, h - 1);
  const fx = clamp(x - x0, 0, 1);
  const fy = clamp(y - y0, 0, 1);
  const at = (xx: number, yy: number, c: number) => p[(yy * w + xx) * 4 + c];
  const out: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c += 1) {
    const a = at(x0, y0, c) * (1 - fx) + at(x1, y0, c) * fx;
    const b = at(x0, y1, c) * (1 - fx) + at(x1, y1, c) * fx;
    out[c] = a * (1 - fy) + b * fy;
  }
  return out;
}

function cubic(t: number): number {
  const x = Math.abs(t);
  if (x <= 1) return 1.5 * x * x * x - 2.5 * x * x + 1;
  if (x < 2) return -0.5 * x * x * x + 2.5 * x * x - 4 * x + 2;
  return 0;
}

function sampleBicubic(data: ImageData, x: number, y: number): [number, number, number] {
  const { width: w, height: h, data: p } = data;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const out: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c += 1) {
    let sum = 0;
    for (let m = -1; m <= 2; m += 1) {
      for (let n = -1; n <= 2; n += 1) {
        const xx = clamp(ix + m, 0, w - 1);
        const yy = clamp(iy + n, 0, h - 1);
        sum += p[(yy * w + xx) * 4 + c] * cubic(m - fx) * cubic(n - fy);
      }
    }
    out[c] = sum;
  }
  return out;
}

function gaussianKernel(sigma: number): Float32Array {
  const s = Math.max(0.01, Math.min(sigma, 14));
  const radius = Math.max(1, Math.ceil(s * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let total = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const v = Math.exp(-(i * i) / (2 * s * s));
    kernel[i + radius] = v;
    total += v;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i] /= total;
  return kernel;
}

function blurAxis(data: ImageData, sigma: number, horizontal: boolean): ImageData {
  if (sigma <= 0.04) return cloneImage(data);
  const { width: w, height: h, data: p } = data;
  const out = new ImageData(w, h);
  const o = out.data;
  const kernel = gaussianKernel(sigma);
  const radius = (kernel.length - 1) / 2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const xx = horizontal ? clamp(x + k, 0, w - 1) : x;
        const yy = horizontal ? y : clamp(y + k, 0, h - 1);
        const idx = (yy * w + xx) * 4;
        const weight = kernel[k + radius];
        r += p[idx] * weight;
        g += p[idx + 1] * weight;
        b += p[idx + 2] * weight;
      }
      const di = (y * w + x) * 4;
      o[di] = r;
      o[di + 1] = g;
      o[di + 2] = b;
      o[di + 3] = p[di + 3];
    }
  }
  return out;
}

function rotateImage(data: ImageData, angle: number): ImageData {
  const { width: w, height: h } = data;
  const out = new ImageData(w, h);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const sx = cos * dx + sin * dy + cx;
      const sy = -sin * dx + cos * dy + cy;
      const [r, g, b] = sampleBilinear(data, sx, sy);
      const i = (y * w + x) * 4;
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = 255;
    }
  }
  return out;
}

/** Isotropic blur when ratio = 1, otherwise an oriented elliptical Gaussian. */
export function blurImage(data: ImageData, sigma: number, angleDeg = 0, ratio = 1): ImageData {
  const minor = Math.max(0.05, sigma);
  const major = Math.max(minor, minor * Math.max(1, ratio));
  if (ratio <= 1.02 || angleDeg === 0) {
    return blurAxis(blurAxis(data, minor, true), major, false);
  }
  const rad = (angleDeg * Math.PI) / 180;
  const rotated = rotateImage(data, -rad);
  const blurred = blurAxis(blurAxis(rotated, major, true), minor, false);
  return rotateImage(blurred, rad);
}

export type DownMode = 'nearest' | 'bilinear' | 'bicubic' | 'downup';

export function downsample(
  data: ImageData,
  scale: number,
  mode: DownMode,
  align = false,
  a = 1,
): ImageData {
  const w = data.width;
  const h = data.height;
  const outW = Math.max(1, Math.floor(w / scale));
  const outH = Math.max(1, Math.floor(h / scale));
  if (mode === 'downup') {
    const m = clamp(scale / Math.max(0.25, a), 1, 16);
    const midW = Math.max(1, Math.round(w / m));
    const midH = Math.max(1, Math.round(h / m));
    const mid = resample(data, midW, midH, 'bilinear');
    return resample(mid, outW, outH, 'bilinear');
  }
  const prepared = mode === 'nearest' && align
    ? blurAxis(blurAxis(data, 0.55 * scale, true), 0.55 * scale, false)
    : data;
  const out = new ImageData(outW, outH);
  for (let y = 0; y < outH; y += 1) {
    for (let x = 0; x < outW; x += 1) {
      let sx: number;
      let sy: number;
      if (mode === 'nearest') {
        sx = x * scale;
        sy = y * scale;
        if (align) {
          sx = (x + 0.5) * scale - 0.5;
          sy = (y + 0.5) * scale - 0.5;
        }
        const px = clamp(Math.round(sx), 0, w - 1);
        const py = clamp(Math.round(sy), 0, h - 1);
        const si = (py * w + px) * 4;
        const di = (y * outW + x) * 4;
        out.data[di] = prepared.data[si];
        out.data[di + 1] = prepared.data[si + 1];
        out.data[di + 2] = prepared.data[si + 2];
        out.data[di + 3] = 255;
      } else {
        sx = (x + 0.5) * scale - 0.5;
        sy = (y + 0.5) * scale - 0.5;
        const [r, g, b] = mode === 'bicubic'
          ? sampleBicubic(prepared, sx, sy)
          : sampleBilinear(prepared, sx, sy);
        const di = (y * outW + x) * 4;
        out.data[di] = r;
        out.data[di + 1] = g;
        out.data[di + 2] = b;
        out.data[di + 3] = 255;
      }
    }
  }
  return out;
}

export function resample(data: ImageData, nw: number, nh: number, mode: 'bilinear' | 'bicubic' = 'bilinear'): ImageData {
  const out = new ImageData(nw, nh);
  const sxRatio = data.width / nw;
  const syRatio = data.height / nh;
  for (let y = 0; y < nh; y += 1) {
    for (let x = 0; x < nw; x += 1) {
      const sx = (x + 0.5) * sxRatio - 0.5;
      const sy = (y + 0.5) * syRatio - 0.5;
      const [r, g, b] = mode === 'bicubic'
        ? sampleBicubic(data, sx, sy)
        : sampleBilinear(data, sx, sy);
      const di = (y * nw + x) * 4;
      out.data[di] = r;
      out.data[di + 1] = g;
      out.data[di + 2] = b;
      out.data[di + 3] = 255;
    }
  }
  return out;
}

export function addGaussianNoise(data: ImageData, sigma255: number, seed = 1, gray = false): ImageData {
  const out = cloneImage(data);
  const rng = mulberry32(seed);
  const sigma = Math.max(0, sigma255);
  let shared = 0;
  for (let i = 0; i < out.data.length; i += 4) {
    if (gray && i % 16 === 0) shared = randn(rng) * sigma;
    const n = gray ? shared : randn(rng) * sigma;
    out.data[i] = out.data[i] + n;
    out.data[i + 1] = out.data[i + 1] + n;
    out.data[i + 2] = out.data[i + 2] + n;
  }
  return out;
}

/* Simplified signal-dependent sensor noise: shot + read noise, channel gains,
 * and a gentle tone curve. The paper's full reverse-forward ISP is not reproduced. */
export function addSensorNoise(data: ImageData, iso: number, seed = 3): ImageData {
  const out = cloneImage(data);
  const rng = mulberry32(seed);
  const level = clamp(iso / 6400, 0.02, 1.4);
  const gains = [1.05, 1.0, 0.95];
  for (let i = 0; i < out.data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const v = out.data[i + c] / 255;
      const sigma = level * (0.012 + 0.075 * Math.sqrt(Math.max(0, v)));
      const noisy = clamp(v + randn(rng) * sigma, 0, 1);
      out.data[i + c] = Math.pow(noisy, 0.94) * gains[c] * 255;
    }
  }
  return out;
}

const JPEG_TABLE = [
  16, 11, 10, 16, 24, 40, 51, 61,
  12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77,
  24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

const COS_TABLE: number[] = [];
for (let u = 0; u < 8; u += 1) {
  for (let x = 0; x < 8; x += 1) {
    COS_TABLE[u * 8 + x] = Math.cos(((2 * x + 1) * u * Math.PI) / 16);
  }
}

function dct8(block: number[]): number[] {
  const tmp = new Array<number>(64).fill(0);
  const out = new Array<number>(64).fill(0);
  for (let y = 0; y < 8; y += 1) {
    for (let u = 0; u < 8; u += 1) {
      let sum = 0;
      for (let x = 0; x < 8; x += 1) sum += block[y * 8 + x] * COS_TABLE[u * 8 + x];
      tmp[y * 8 + u] = sum * (u === 0 ? Math.SQRT1_2 : 1) * 0.5;
    }
  }
  for (let u = 0; u < 8; u += 1) {
    for (let v = 0; v < 8; v += 1) {
      let sum = 0;
      for (let y = 0; y < 8; y += 1) sum += tmp[y * 8 + u] * COS_TABLE[v * 8 + y];
      out[v * 8 + u] = sum * (v === 0 ? Math.SQRT1_2 : 1) * 0.5;
    }
  }
  return out;
}

function idct8(coeff: number[]): number[] {
  const tmp = new Array<number>(64).fill(0);
  const out = new Array<number>(64).fill(0);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      let sum = 0;
      for (let u = 0; u < 8; u += 1) {
        sum += (u === 0 ? Math.SQRT1_2 : 1) * coeff[y * 8 + u] * COS_TABLE[u * 8 + x];
      }
      tmp[y * 8 + x] = sum * 0.5;
    }
  }
  for (let x = 0; x < 8; x += 1) {
    for (let y = 0; y < 8; y += 1) {
      let sum = 0;
      for (let v = 0; v < 8; v += 1) {
        sum += (v === 0 ? Math.SQRT1_2 : 1) * tmp[v * 8 + x] * COS_TABLE[v * 8 + y];
      }
      out[y * 8 + x] = sum * 0.5;
    }
  }
  return out;
}

export function jpegCompress(data: ImageData, quality: number): ImageData {
  const { width: w, height: h } = data;
  const out = cloneImage(data);
  const q = clamp(quality, 1, 100);
  const scale = q < 50 ? 5000 / q : 200 - q * 2;
  const table = JPEG_TABLE.map((v) => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));
  for (let by = 0; by < h; by += 8) {
    for (let bx = 0; bx < w; bx += 8) {
      for (let c = 0; c < 3; c += 1) {
        const block = new Array<number>(64).fill(0);
        for (let y = 0; y < 8; y += 1) {
          for (let x = 0; x < 8; x += 1) {
            const xx = Math.min(w - 1, bx + x);
            const yy = Math.min(h - 1, by + y);
            block[y * 8 + x] = out.data[(yy * w + xx) * 4 + c] - 128;
          }
        }
        const coeff = dct8(block);
        for (let i = 0; i < 64; i += 1) coeff[i] = Math.round(coeff[i] / table[i]) * table[i];
        const restored = idct8(coeff);
        for (let y = 0; y < 8; y += 1) {
          for (let x = 0; x < 8; x += 1) {
            const xx = bx + x;
            const yy = by + y;
            if (xx < w && yy < h) {
              out.data[(yy * w + xx) * 4 + c] = restored[y * 8 + x] + 128;
            }
          }
        }
      }
    }
  }
  return out;
}

export type Op =
  | { type: 'blur'; kind: 'iso' | 'aniso'; width: number; angle: number; ratio: number }
  | { type: 'down'; mode: DownMode; scale: number; align: boolean; a: number }
  | { type: 'gauss'; sigma: number; gray?: boolean }
  | { type: 'jpeg'; quality: number }
  | { type: 'sensor'; iso: number };

export function applyOps(data: ImageData, ops: Op[]): ImageData {
  let current = data;
  for (const op of ops) {
    if (op.type === 'blur') {
      current = blurImage(current, op.width, op.kind === 'aniso' ? op.angle : 0, op.kind === 'aniso' ? op.ratio : 1);
    } else if (op.type === 'down') {
      current = downsample(current, op.scale, op.mode, op.align, op.a);
    } else if (op.type === 'gauss') {
      current = addGaussianNoise(current, op.sigma, 11, op.gray);
    } else if (op.type === 'jpeg') {
      current = jpegCompress(current, op.quality);
    } else {
      current = addSensorNoise(current, op.iso, 17);
    }
  }
  return current;
}

/* ------------------------------------------------------------------ */
/* Measurements and charts                                             */
/* ------------------------------------------------------------------ */

export function meanAbsDiff(a: ImageData, b: ImageData): number {
  const n = Math.min(a.data.length, b.data.length);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < n; i += 4) {
    sum += Math.abs(a.data[i] - b.data[i]);
    sum += Math.abs(a.data[i + 1] - b.data[i + 1]);
    sum += Math.abs(a.data[i + 2] - b.data[i + 2]);
    count += 3;
  }
  return count ? sum / count : 0;
}

export function diffImage(a: ImageData, b: ImageData): ImageData {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const ai = (y * a.width + x) * 4;
      const bi = (y * b.width + x) * 4;
      const d = Math.min(255, (Math.abs(a.data[ai] - b.data[bi]) + Math.abs(a.data[ai + 1] - b.data[bi + 1]) + Math.abs(a.data[ai + 2] - b.data[bi + 2])) / 3 * 3);
      const oi = (y * w + x) * 4;
      out.data[oi] = 255;
      out.data[oi + 1] = 255 - d;
      out.data[oi + 2] = 255 - d;
      out.data[oi + 3] = 255;
    }
  }
  return out;
}

export function edgeEnergy(data: ImageData): number {
  const { width: w, height: h, data: p } = data;
  let sum = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = (y * w + x) * 4;
      const gx = Math.abs(p[i] - p[(y * w + x + 1) * 4]) + Math.abs(p[i + 1] - p[(y * w + x + 1) * 4 + 1]);
      const gy = Math.abs(p[i] - p[((y + 1) * w + x) * 4]) + Math.abs(p[i + 1] - p[((y + 1) * w + x) * 4 + 1]);
      sum += gx + gy;
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

export function luminanceHistogram(data: ImageData, bins = 32): number[] {
  const hist = new Array<number>(bins).fill(0);
  for (let i = 0; i < data.data.length; i += 4) {
    const l = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    hist[clamp(Math.floor((l / 256) * bins), 0, bins - 1)] += 1;
  }
  return hist;
}

export function drawHistogram(canvas: HTMLCanvasElement, data: ImageData, color = '#27446e'): void {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const hist = luminanceHistogram(data, 32);
  const max = Math.max(...hist, 1);
  const bw = w / hist.length;
  ctx.fillStyle = color;
  hist.forEach((value, index) => {
    const bh = (value / max) * (h - 8);
    ctx.fillRect(index * bw + 1, h - bh, bw - 2, bh);
  });
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

/* ------------------------------------------------------------------ */
/* Small studio props                                                  */
/* ------------------------------------------------------------------ */

export function drawDesk(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f6f3ea';
  ctx.fillRect(0, 0, w, h);
  const wood = ctx.createLinearGradient(0, h - 54, 0, h);
  wood.addColorStop(0, '#d9cfb8');
  wood.addColorStop(1, '#c3b393');
  ctx.fillStyle = wood;
  ctx.fillRect(0, h - 54, w, 54);
  ctx.strokeStyle = 'rgba(120,96,60,.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, h - 48 + i * 12);
    ctx.bezierCurveTo(w * 0.3, h - 50 + i * 12, w * 0.7, h - 46 + i * 12, w, h - 49 + i * 12);
    ctx.stroke();
  }
}

export function drawPrint(
  ctx: CanvasRenderingContext2D,
  data: ImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  border = '#ffffff',
): void {
  const off = document.createElement('canvas');
  off.width = data.width;
  off.height = data.height;
  const octx = off.getContext('2d');
  if (!octx) return;
  octx.putImageData(data, 0, 0);
  ctx.save();
  ctx.shadowColor = 'rgba(33,50,74,.18)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = border;
  ctx.fillRect(x - 7, y - 7, w + 14, h + 14);
  ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, x, y, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 7.5, y - 7.5, w + 15, h + 15);
  ctx.restore();
}

export function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#3b4a61';
  ctx.beginPath();
  ctx.roundRect(-46, -26, 92, 52, 9);
  ctx.fill();
  ctx.fillStyle = '#68778f';
  ctx.fillRect(-22, -36, 44, 12);
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9fc9df';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(39,68,110,.6)';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(34, -14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLens(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(159,201,223,.35)';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.lineTo(r * 0.9, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawMagnifier(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.7, cy + r * 0.7);
  ctx.lineTo(cx + r * 1.5, cy + r * 1.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(159,201,223,.18)';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFilmStrip(
  ctx: CanvasRenderingContext2D,
  data: ImageData,
  x: number,
  y: number,
  index = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.roundRect(0, 0, 96, 84, 5);
  ctx.fill();
  ctx.fillStyle = '#f6f3ea';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(4, 6 + i * 20, 4, 10);
    ctx.fillRect(88, 6 + i * 20, 4, 10);
  }
  const off = document.createElement('canvas');
  off.width = data.width;
  off.height = data.height;
  const octx = off.getContext('2d');
  if (octx) {
    octx.putImageData(data, 0, 0);
    ctx.drawImage(off, 10, 14, 76, 56);
  }
  ctx.fillStyle = '#f6f3ea';
  ctx.font = '11px system-ui';
  ctx.fillText(String(index + 1).padStart(2, '0'), 12, 80);
  ctx.restore();
}

export function px(n: number, digits = 1): string {
  return Number(n.toFixed(digits)).toString();
}
