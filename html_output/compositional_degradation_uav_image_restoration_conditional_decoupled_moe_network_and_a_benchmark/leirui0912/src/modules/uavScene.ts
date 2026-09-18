// 合成「无人机航拍影像」的共用底座。
//
// 封面（heroConditionCompare）第 1 章上下两个「退化识别器」都要一张同类照片，
// 而且退化必须真的作用在像素上、能随开关变化，所以景物与 8 种退化只写一份，
// 由这三个位置共用 —— 否则三处各画一遍，稍有改动就会互相对不上。
//
// 8 种退化按论文语义作用在像素上：雨丝、雪点、大气散射、低照度、高光溢出、
// 高斯模糊、传感器噪声、块状伪影。强度按「8 种全开时景物仍可辨认」标定，
// 不引入论文未报告的数值指标（不编造 PSNR / SSIM）。

export const DEGRADATIONS = [
  { id: 'rain', name: '雨', color: '#3b82f6' },
  { id: 'snow', name: '雪', color: '#e2e8f0' },
  { id: 'haze', name: '雾', color: '#94a3b8' },
  { id: 'lowlight', name: '低光', color: '#1e293b' },
  { id: 'overexpose', name: '过曝', color: '#fbbf24' },
  { id: 'blur', name: '模糊', color: '#a78bfa' },
  { id: 'noise', name: '噪声', color: '#f87171' },
  { id: 'artifact', name: '伪影', color: '#fb923c' },
];

export const ALL_IDS = DEGRADATIONS.map((d) => d.id);

export const colorOf = (id: string) => DEGRADATIONS.find((d) => d.id === id) ?? DEGRADATIONS[0];

// ---------------------------------------------------------------------------
// 确定性伪随机：每次重建都从同一颗种子开始，切换某个退化不会让雨丝重新洗牌
// ---------------------------------------------------------------------------

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

// ---------------------------------------------------------------------------
// 尺寸：景物按 2 倍分辨率离屏绘制，dpr=2 的屏上正好 1:1，dpr=1 时降采样也清晰
// ---------------------------------------------------------------------------

export const SW = 620;
export const SH = 248;

// ---------------------------------------------------------------------------
// 景物：无人机航拍条带（农田、河流、道路、屋顶、树冠、车辆）
// ---------------------------------------------------------------------------

const FIELD = ['#5c7a3c', '#6b8a46', '#4e6b34', '#8a8f52', '#7b6f45', '#61764a'];
const ROOF = ['#8a8f96', '#9c6b52', '#b0b4ba', '#7a8188', '#a8846a', '#6f747b'];
const RIVER = '#4a6f8c';
const BANK = '#9c9169';
const ROAD = '#8d8f92';
const TREE = '#39542f';

// 河道中心线的三次贝塞尔控制点。绘制与「避开河面」判定共用同一组常量，
// 避免两处各写一遍导致建筑/树冠落在水面上。
const RV = [
  { x: -15, y: 190 },
  { x: SW * 0.28, y: 120 },
  { x: SW * 0.55, y: 215 },
  { x: SW + 15, y: 130 },
];

function riverPoints(): { x: number; y: number }[] {
  const [p0, p1, p2, p3] = RV;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 220; i++) {
    const t = i / 220;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return pts;
}

const RIVER_PTS = riverPoints();

function riverPath(g: CanvasRenderingContext2D) {
  g.beginPath();
  g.moveTo(RV[0].x, RV[0].y);
  g.bezierCurveTo(RV[1].x, RV[1].y, RV[2].x, RV[2].y, RV[3].x, RV[3].y);
}

function nearRiver(x: number, y: number, dist: number) {
  for (const p of RIVER_PTS) {
    if (Math.abs(p.x - x) > dist) continue;
    if (Math.abs(p.y - y) < dist) return true;
  }
  return false;
}

function buildScene(cv: HTMLCanvasElement) {
  const g = cv.getContext('2d');
  if (!g) return;
  const rn = mulberry32(20260912);

  g.fillStyle = '#66713f';
  g.fillRect(0, 0, SW, SH);

  // 田块
  for (let i = 0; i < 24; i++) {
    const w = 70 + rn() * 190;
    const h = 50 + rn() * 130;
    g.globalAlpha = 0.5 + rn() * 0.4;
    g.fillStyle = FIELD[(rn() * FIELD.length) | 0];
    g.fillRect(rn() * SW - w * 0.3, rn() * SH - h * 0.3, w, h);
  }
  g.globalAlpha = 1;

  // 耕作行纹理
  g.strokeStyle = 'rgba(0,0,0,0.07)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 64; i++) {
    const x = rn() * SW;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + (rn() - 0.5) * 46, SH);
    g.stroke();
  }

  // 河流：先河岸再水体
  g.lineCap = 'round';
  g.strokeStyle = BANK;
  g.lineWidth = 40;
  riverPath(g);
  g.stroke();
  g.strokeStyle = RIVER;
  g.lineWidth = 30;
  riverPath(g);
  g.stroke();

  // 道路
  g.strokeStyle = ROAD;
  g.lineWidth = 24;
  g.beginPath();
  g.moveTo(-8, 56);
  g.lineTo(SW + 8, 38);
  g.stroke();
  g.beginPath();
  g.moveTo(SW * 0.62, -12);
  g.lineTo(SW * 0.6, SH + 12);
  g.stroke();

  g.strokeStyle = 'rgba(240,240,236,0.7)';
  g.lineWidth = 1.8;
  g.setLineDash([13, 13]);
  g.beginPath();
  g.moveTo(-8, 56);
  g.lineTo(SW + 8, 38);
  g.stroke();
  g.setLineDash([]);

  // 屋顶
  for (let i = 0; i < 18; i++) {
    const w = 26 + rn() * 40;
    const h = 22 + rn() * 30;
    const x = rn() * (SW - 70) + 12;
    const y = rn() * (SH - h - 18) + 9;
    if (nearRiver(x + w / 2, y + h / 2, 34)) continue;
    g.fillStyle = 'rgba(30,35,25,0.28)';
    g.fillRect(x + 3, y + 4, w, h);
    g.fillStyle = ROOF[(rn() * ROOF.length) | 0];
    g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  // 树冠
  for (let i = 0; i < 46; i++) {
    const x = rn() * SW;
    const y = rn() * SH;
    const r = 5 + rn() * 9;
    if (nearRiver(x, y, 26)) continue;
    g.fillStyle = 'rgba(28,44,22,0.35)';
    g.beginPath();
    g.arc(x + 2, y + 3, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = TREE;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // 道路上的车辆
  const cars: [number, number, string][] = [
    [120, 52, '#e8e9ea'],
    [300, 46, '#c9564a'],
    [520, 42, '#e8e9ea'],
    [SW * 0.607, 150, '#3f4a58'],
    [SW * 0.613, 300, '#d8d2c0'],
  ];
  for (const [cx, cy, col] of cars) {
    g.fillStyle = 'rgba(20,25,20,0.3)';
    g.fillRect(cx + 1.5, cy + 2, 10, 5.5);
    g.fillStyle = col;
    g.fillRect(cx, cy, 10, 5.5);
  }
}

// ---------------------------------------------------------------------------
// 退化：把 8 种原子退化按论文语义作用到像素上
// ---------------------------------------------------------------------------

function drawRain(d: CanvasRenderingContext2D, rn: () => number) {
  d.lineCap = 'round';
  d.strokeStyle = 'rgba(205,220,240,0.55)';
  d.lineWidth = 2;
  for (let i = 0; i < 74; i++) {
    const x = rn() * SW * 1.2 - SW * 0.1;
    const y = rn() * SH;
    const len = 18 + rn() * 28;
    d.beginPath();
    d.moveTo(x, y);
    d.lineTo(x - len * 0.26, y + len);
    d.stroke();
  }
  d.strokeStyle = 'rgba(238,246,255,0.72)';
  d.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    const x = rn() * SW * 1.2 - SW * 0.1;
    const y = rn() * SH;
    const len = 28 + rn() * 32;
    d.beginPath();
    d.moveTo(x, y);
    d.lineTo(x - len * 0.26, y + len);
    d.stroke();
  }
}

function drawSnow(d: CanvasRenderingContext2D, rn: () => number) {
  d.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 68; i++) {
    d.beginPath();
    d.arc(rn() * SW, rn() * SH, 1.6 + rn() * 1.8, 0, Math.PI * 2);
    d.fill();
  }
  d.fillStyle = 'rgba(255,255,255,0.42)';
  for (let i = 0; i < 12; i++) {
    d.beginPath();
    d.arc(rn() * SW, rn() * SH, 3.4 + rn() * 2.6, 0, Math.PI * 2);
    d.fill();
  }
}

function drawBlocks(d: CanvasRenderingContext2D, rn: () => number) {
  for (let by = 0; by < SH; by += 8) {
    for (let bx = 0; bx < SW; bx += 8) {
      const a = rn() * 0.15;
      if (a < 0.03) continue;
      const v = 118 + (rn() * 24 - 12);
      d.fillStyle = `rgba(${v | 0},${(v + 3) | 0},${(v + 10) | 0},${a.toFixed(3)})`;
      d.fillRect(bx, by, 8, 8);
    }
  }
  d.fillStyle = 'rgba(90,95,105,0.09)';
  for (let i = 0; i < 10; i++) {
    d.fillRect(0, (rn() * SH) | 0, SW, 2 + rn() * 3);
  }
}

function addNoise(d: CanvasRenderingContext2D, rn: () => number) {
  const img = d.getImageData(0, 0, SW, SH);
  const p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    const n = (rn() * 2 - 1) * 20;
    p[i] = clamp255(p[i] + n);
    p[i + 1] = clamp255(p[i + 1] + n * 0.95);
    p[i + 2] = clamp255(p[i + 2] + n * 1.05);
  }
  d.putImageData(img, 0, 0);
  for (let i = 0; i < 105; i++) {
    d.fillStyle = rn() > 0.5 ? 'rgba(255,255,255,0.42)' : 'rgba(20,20,30,0.38)';
    d.fillRect(rn() * SW, rn() * SH, 1.8, 1.8);
  }
}

function buildDegraded(cv: HTMLCanvasElement, active: string[], clean: HTMLCanvasElement) {
  const d = cv.getContext('2d');
  if (!d) return;
  const has = (id: string) => active.includes(id);
  const rn = mulberry32(7717);

  d.setTransform(1, 0, 0, 1, 0, 0);
  d.clearRect(0, 0, SW, SH);

  // 可用滤镜表达的退化：模糊、大气散射、低照度、高光溢出
  const parts: string[] = [];
  if (has('blur')) parts.push('blur(3.4px)');
  if (has('haze')) parts.push('contrast(0.62)', 'brightness(1.10)', 'saturate(0.74)');
  if (has('lowlight')) parts.push('brightness(0.42)', 'saturate(0.72)');
  if (has('overexpose')) parts.push('brightness(1.38)', 'contrast(0.94)');
  d.filter = parts.length ? parts.join(' ') : 'none';
  d.drawImage(clean, 0, 0);
  d.filter = 'none';

  // 需要叠加的退化层
  if (has('haze')) {
    d.fillStyle = 'rgba(216,226,238,0.34)';
    d.fillRect(0, 0, SW, SH);
  }
  if (has('lowlight')) {
    d.fillStyle = 'rgba(10,16,32,0.20)';
    d.fillRect(0, 0, SW, SH);
  }
  if (has('rain')) drawRain(d, rn);
  if (has('snow')) drawSnow(d, rn);
  if (has('artifact')) drawBlocks(d, rn);
  if (has('noise')) addNoise(d, rn);
}

// ---------------------------------------------------------------------------
// 离屏画布缓存（同一页面上所有用到这些影像的组件共用一份，避免重复构建）
// ---------------------------------------------------------------------------

let cleanCv: HTMLCanvasElement | null = null;
let degCv: HTMLCanvasElement | null = null;
let builtKey: string | null = null;

/** 无退化的干净景物。 */
export function getScene(): HTMLCanvasElement {
  if (!cleanCv) {
    cleanCv = document.createElement('canvas');
    cleanCv.width = SW;
    cleanCv.height = SH;
    buildScene(cleanCv);
  }
  return cleanCv;
}

/** 施加了指定退化的景物。同一组因子只构建一次，缓存到因子组合变化为止。 */
export function getDegraded(active: string[]): HTMLCanvasElement {
  const clean = getScene();
  const key = active.join(',');
  if (!degCv) {
    degCv = document.createElement('canvas');
    degCv.width = SW;
    degCv.height = SH;
    builtKey = null;
  }
  if (key !== builtKey) {
    buildDegraded(degCv, active, clean);
    builtKey = key;
  }
  return degCv;
}
