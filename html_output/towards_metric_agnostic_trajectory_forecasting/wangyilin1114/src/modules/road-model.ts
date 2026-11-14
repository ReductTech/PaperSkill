export type Point = { x: number; y: number };
export type Sample = Point & { angle: number };

export const endpoints: Point[] = [{ x: -6.2, y: 7.5 }, { x: .2, y: 9.2 }, { x: 6.4, y: 7.4 }];
export const startingPicks: Point[] = [{ x: -.4, y: 8.2 }, { x: 1.2, y: 9.3 }, { x: 3.9, y: 7.5 }];

export function sampleRoad(left: number, counts = [left, 96 - left - 19, 19]): Sample[] {
  return endpoints.flatMap((center, branch) => Array.from({ length: counts[branch] }, (_, index) => {
    const theta = index * 2.399963 + branch;
    const radius = Math.sqrt((index + .5) / counts[branch]);
    return { x: center.x + Math.cos(theta) * radius * 2.2,
      y: center.y + Math.sin(theta) * radius * 1.45, angle: [135, 90, 45][branch] };
  }));
}

export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function nearest(point: Point, picks: Point[]) {
  return picks.reduce((best, candidate, index) => distance(point, candidate) < distance(point, picks[best])
    ? index : best, 0);
}

export function objective(samples: Point[], picks: Point[]) {
  return samples.reduce((sum, sample) => sum + distance(sample, picks[nearest(sample, picks)]), 0) / samples.length;
}

export function distanceStep(samples: Point[], picks: Point[]) {
  const directions = picks.map(() => ({ x: 0, y: 0 }));
  for (const sample of samples) {
    const index = nearest(sample, picks);
    const p = picks[index];
    const norm = distance(p, sample);
    if (norm < 1e-9) continue;
    directions[index].x += (sample.x - p.x) / norm;
    directions[index].y += (sample.y - p.y) / norm;
  }
  const before = objective(samples, picks);
  for (const rate of [2, 1, .5, .25, .125]) {
    const candidate = picks.map((p, i) => ({ x: p.x + rate * directions[i].x / samples.length,
      y: p.y + rate * directions[i].y / samples.length }));
    if (objective(samples, candidate) <= before) return candidate;
  }
  return picks;
}

export function hit(endpoint: Point, window: Sample, scale: number) {
  const angle = window.angle * Math.PI / 180;
  const x = endpoint.x - window.x;
  const y = endpoint.y - window.y;
  return Math.abs(x * Math.cos(angle) + y * Math.sin(angle)) <= 1.55 * scale
    && Math.abs(-x * Math.sin(angle) + y * Math.cos(angle)) <= .78 * scale;
}

export function greedyCoverage(samples: Sample[], budget: number, scale: number) {
  let remaining = samples;
  const selected: { point: Sample; newlyHit: Sample[]; confidence: number }[] = [];
  for (let step = 0; step < budget; step++) {
    let best: Sample | undefined;
    let matches: Sample[] = [];
    for (const sample of samples) {
      if (selected.some(choice => choice.point === sample)) continue;
      const covered = remaining.filter(window => hit(sample, window, scale));
      if (!best || covered.length > matches.length) {
        best = sample;
        matches = covered;
      }
    }
    if (!best) break;
    selected.push({ point: best, newlyHit: matches, confidence: matches.length / samples.length });
    const removed = new Set(matches);
    remaining = remaining.filter(sample => !removed.has(sample));
  }
  return { selected, remaining };
}
