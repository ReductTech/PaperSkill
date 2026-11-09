// Browser teaching approximations of the RGB-domain operations in Appendix B.
// The preview is intentionally bounded to the 560 × 300 teaching scene.
export const settings = [
  { min: -2, max: 2, step: .05, initial: .85, neutral: 0, unit: " EV" },
  { min: .4, max: 2.5, step: .05, initial: .6, neutral: 1, unit: "" },
  { min: -1, max: 1, step: .05, initial: .7, neutral: 0, unit: "" },
  { min: 0, max: 2, step: .05, initial: 1.8, neutral: 1, unit: "" },
  { min: 0, max: 1, step: .05, initial: .85, neutral: 0, unit: "" },
  { min: -1, max: 1, step: .05, initial: .8, neutral: 0, unit: "" },
  { min: -1, max: 1, step: .05, initial: .7, neutral: 0, unit: "" },
  { min: 0, max: 1, step: .05, initial: .85, neutral: 0, unit: "" },
  { min: 0, max: 1, step: .05, initial: .85, neutral: 0, unit: "" },
  { min: -1, max: 1, step: .05, initial: .8, neutral: 0, unit: "" },
] as const;

const clip = (x: number) => Math.max(0, Math.min(1, x));
const lum = (r: number, g: number, b: number) => .27 * r + .67 * g + .06 * b;

// Eight positive slopes, normalized by their sum: the same curve is drawn in §3.2.
export function tone(x: number, p: number) {
  const slopes = Array.from({ length: 8 }, (_, i) =>
    Math.max(.5, Math.min(2, 1 + p * (i < 4 ? .8 : -.55))));
  const total = slopes.reduce((a, b) => a + b, 0);
  const scaled = clip(x) * 8;
  return slopes.reduce((sum, slope, i) => sum + slope * Math.max(0, Math.min(1, scaled - i)), 0) / total;
}

export function rgbTransform(index: number, p: number, r: number, g: number, b: number): [number, number, number] {
  if (index === 0) return [r * 2 ** p, g * 2 ** p, b * 2 ** p];
  if (index === 1) return [r ** p, g ** p, b ** p];
  if (index === 2) {
    // Each row sums to one. Off-diagonal terms genuinely mix channels.
    return [r + p * (.22 * g - .22 * b), g + p * (.18 * b - .18 * r), b + p * (.2 * r - .2 * g)];
  }
  if (index === 5) return [tone(r, p), tone(g, p), tone(b, p)];
  if (index === 6) {
    const y = lum(r, g, b);
    const mapped = .5 * (1 - Math.cos(Math.PI * y));
    const ratio = y > 1e-5 ? mapped / y : 0;
    return [r * (1 - p + p * ratio), g * (1 - p + p * ratio), b * (1 - p + p * ratio)];
  }
  if (index === 7 || index === 8) {
    const y = lum(r, g, b);
    const factor = index === 7 ? 1 + .85 * p : 1 - p;
    return [y + (r - y) * factor, y + (g - y) * factor, y + (b - y) * factor];
  }
  if (index === 9) return [r * Math.exp(.5 * p), g, b * Math.exp(-.5 * p)];
  return [r, g, b];
}

export function brightnessCurve(index: number, p: number, x: number) {
  if (index === 0) return clip(x * 2 ** p);
  if (index === 1) return x ** p;
  if (index === 5) return tone(x, p);
  if (index === 6) return clip((1 - p) * x + p * .5 * (1 - Math.cos(Math.PI * x)));
  return x;
}

function spatial(source: ImageData, output: ImageData, index: number, p: number) {
  const { width, height, data } = source;
  const dst = output.data;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (y * width + x) * 4;
    if (index === 3) {
      // Appendix B Eq.17 uses a 3×3 kernel with centre weight 5/13.
      for (let c = 0; c < 3; c++) {
        let sum = 5 * data[at + c];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx || dy) {
            const sx = Math.max(0, Math.min(width - 1, x + dx));
            const sy = Math.max(0, Math.min(height - 1, y + dy));
            sum += data[(sy * width + sx) * 4 + c];
          }
        }
        const blurred = sum / 13;
        dst[at + c] = p * data[at + c] + (1 - p) * blurred;
      }
    } else {
      // Small edge-aware bilateral approximation of NLM, not a claim of NLM parity.
      const center = lum(data[at], data[at + 1], data[at + 2]);
      let weightSum = 0, sums = [0, 0, 0];
      const tolerance = 12 + p * 38;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const sx = Math.max(0, Math.min(width - 1, x + dx));
        const sy = Math.max(0, Math.min(height - 1, y + dy));
        const pos = (sy * width + sx) * 4;
        const difference = lum(data[pos], data[pos + 1], data[pos + 2]) - center;
        const w = Math.exp(-difference * difference / (2 * tolerance * tolerance)) / (1 + dx * dx + dy * dy);
        weightSum += w;
        for (let c = 0; c < 3; c++) sums[c] += w * data[pos + c];
      }
      for (let c = 0; c < 3; c++) dst[at + c] = (1 - p) * data[at + c] + p * sums[c] / weightSum;
    }
    dst[at + 3] = data[at + 3];
  }
}

export function processImage(source: ImageData, index: number, p: number) {
  const output = new ImageData(source.width, source.height);
  if (index === 3 || index === 4) {
    if (index === 4 && p === 0) { output.data.set(source.data); return output; }
    spatial(source, output, index, p);
    return output;
  }
  for (let i = 0; i < source.data.length; i += 4) {
    const [r, g, b] = rgbTransform(index, p, source.data[i] / 255, source.data[i + 1] / 255, source.data[i + 2] / 255);
    output.data[i] = clip(r) * 255;
    output.data[i + 1] = clip(g) * 255;
    output.data[i + 2] = clip(b) * 255;
    output.data[i + 3] = source.data[i + 3];
  }
  return output;
}
