import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeInOutQuad,
  easeOutCubic,
} from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawSlide,
  drawSpecimen,
  drawTweezers,
  drawEmbeddingCassette,
  drawMicroscope,
  drawTissueField,
  drawRequestForm,
} from './viz-kit';

// Analogy card animation (560x140) for chapters 1-5 of the
// "one H&E slide on the pathology bench" theme: 取材 / 贴片 / 换倍率 / 圈区域 / 看申请单.
// One component, five concrete bench scenes chosen by `chapterId`.
// Automatic loop 3.0-3.4 s, no learner controls, exactly ONE in-canvas label.

const W = 560;
const H = 140;

type Mag = 1.25 | 5 | 20;

const LOOP_MS: Record<string, number> = {
  'chap-1': 3200,
  'chap-2': 3000,
  'chap-3': 3400,
  'chap-4': 3000,
  'chap-5': 3200,
};

const LABEL: Record<string, string> = {
  'chap-1': '取一小块',
  'chap-2': '贴到玻片',
  'chap-3': '换物镜',
  'chap-4': '圈出要看',
  'chap-5': '按单看片',
};

const LABEL_POS: Record<string, [number, number]> = {
  'chap-1': [24, 132],
  'chap-2': [24, 132],
  'chap-3': [398, 28],
  'chap-4': [24, 132],
  'chap-5': [24, 132],
};

// ---------------------------------------------------------------------------
// local deterministic helpers (no state, no flicker between frames)
// ---------------------------------------------------------------------------

/** Deterministic PRNG: same seed -> same sequence, so shapes never flicker. */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** A recognisable little piece of H&E tissue (eosin body + haematoxylin nuclei). */
function tissueBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number
): void {
  const rand = mulberry(seed);
  const n = 10;
  ctx.beginPath();
  for (let i = 0; i <= n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const wob = 0.74 + rand() * 0.44;
    const px = cx + Math.cos(a) * rx * wob;
    const py = cy + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py);
    else {
      const pa = ((i - 0.5) / n) * Math.PI * 2;
      const pw = 0.9 + rand() * 0.4;
      ctx.quadraticCurveTo(
        cx + Math.cos(pa) * rx * pw,
        cy + Math.sin(pa) * ry * pw,
        px,
        py
      );
    }
  }
  ctx.closePath();
  ctx.fillStyle = SKIN.eosin;
  ctx.fill();
  ctx.strokeStyle = SKIN.eosinDeep;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = SKIN.hema;
  for (let i = 0; i < 8; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(a) * rx * d * 0.66,
      cy + Math.sin(a) * ry * d * 0.66,
      2.4,
      1.8,
      rand() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Circular microscope field drawn with the frozen kit; alpha lets scenes cross-dissolve. */
function drawField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  mag: Mag,
  seed: number,
  alpha: number
): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawTissueField(ctx, x, y, w, h, { seed, magnification: mag, lesion: 'none' });
  ctx.restore();
}

/** Marker pen: nib at (x, y), body along the rotated +x axis. */
function drawMarkerPen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(13, -4.5);
  ctx.lineTo(13, 4.5);
  ctx.closePath();
  ctx.fillStyle = SKIN.blue;
  ctx.fill();
  roundRectPath(ctx, 13, -5.5, 40, 11, 5);
  ctx.fillStyle = SKIN.blue;
  ctx.fill();
  roundRectPath(ctx, 43, -5.5, 12, 11, 5);
  ctx.fillStyle = SKIN.metalDark;
  ctx.fill();
  ctx.restore();
}

/** Blue curved arrow from the request form to the slide. */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): void {
  const cxp = (x1 + x2) / 2 + 10;
  const cyp = Math.min(y1, y2) - 28;
  const u = 1 - t;
  const px = u * u * x1 + 2 * u * t * cxp + t * t * x2;
  const py = u * u * y1 + 2 * u * t * cyp + t * t * y2;
  ctx.save();
  ctx.strokeStyle = SKIN.blue;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cxp, cyp, px, py);
  ctx.stroke();

  const dx = 2 * (u * (cxp - x1) + t * (x2 - cxp));
  const dy = 2 * (u * (cyp - y1) + t * (y2 - cyp));
  const ang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px - Math.cos(ang - 0.42) * 15, py - Math.sin(ang - 0.42) * 15);
  ctx.lineTo(px - Math.cos(ang + 0.42) * 15, py - Math.sin(ang + 0.42) * 15);
  ctx.closePath();
  ctx.fillStyle = SKIN.blue;
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// scenes
// ---------------------------------------------------------------------------

/** chap-1 取材: tweezers bite a small piece out of the gross specimen and drop it into the cassette. */
function sceneChap1(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  // 台面上的大体标本（取材对象）
  drawSpecimen(ctx, 118, 82, 34, 4101);

  // 右侧包埋盒：镊子靠近时开盖，组织放入后合盖
  // （drawTweezers 的 (x, y) 是铰点，两臂沿 angle=0 向下伸出 52px，所以镊尖在 y+52）
  const lidOpen = p < 0.60 || p > 0.88;
  drawEmbeddingCassette(ctx, 402, 74, 106, 56, lidOpen);

  const homeX = 300;
  const homeY = 14;
  const gripX = 132;
  const gripY = 22;
  const dropX = 456;
  const dropY = 4;

  let hx = homeX;
  let hy = homeY;
  let open = 1;
  let carrying = 0;

  if (p < 0.24) {
    const k = easeInOutQuad(p / 0.24);
    hx = lerp(homeX, gripX, k);
    hy = lerp(homeY, gripY, k);
    open = 1 - 0.45 * k;
  } else if (p < 0.34) {
    const k = easeOutCubic(clamp((p - 0.24) / 0.1, 0, 1));
    hx = gripX;
    hy = gripY;
    open = lerp(0.55, 0, k);
    carrying = k;
  } else if (p < 0.66) {
    const k = easeInOutQuad((p - 0.34) / 0.32);
    hx = lerp(gripX, dropX, k);
    hy = lerp(gripY, dropY, k) - Math.sin(k * Math.PI) * 12;
    open = 0;
    carrying = 1;
  } else if (p < 0.78) {
    const k = easeInOutQuad((p - 0.66) / 0.12);
    hx = dropX;
    hy = dropY;
    open = k;
    carrying = 1 - k;
  } else {
    const k = easeInOutQuad((p - 0.78) / 0.22);
    hx = lerp(dropX, homeX, k);
    hy = lerp(dropY, homeY, k);
    open = 0.5 + 0.5 * k;
  }

  // 被夹住的一小块组织（贴在镊尖之间）
  if (carrying > 0.02) {
    ctx.save();
    ctx.globalAlpha = clamp(carrying, 0, 1);
    tissueBlob(ctx, hx + 1, hy + 46, 15, 9, 4402);
    ctx.restore();
  }

  drawTweezers(ctx, hx, hy, 0, open);
  drawLabel(ctx, LABEL_POS['chap-1'][0], LABEL_POS['chap-1'][1], LABEL['chap-1'], SKIN.text, 14);
}

/** chap-2 贴片: a thin section floats down and flattens onto the middle of the slide. */
function sceneChap2(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  const sx = 100;
  const sy = 36;
  const sw = 360;
  const sh = 88;
  // 玻片上的组织块中心（磨砂标签端在左上，组织画在中线偏右）
  const frostW = Math.max(16, sw * 0.24);
  const cx = sx + frostW + (sw - frostW) * 0.5;
  const cy = sy + sh * 0.5;

  const land = 0.42;
  const fall = easeInOutQuad(clamp(p / land, 0, 1));
  const stick = clamp((p - land) / 0.14, 0, 1);

  drawSlide(ctx, sx, sy, sw, sh, { tissue: 'none' });
  if (stick > 0) {
    // 同一张玻片再叠一次：组织随贴合度淡入
    ctx.save();
    ctx.globalAlpha = stick;
    drawSlide(ctx, sx, sy, sw, sh, { tissue: 'section' });
    ctx.restore();
  }

  if (p < land + 0.08) {
    ctx.save();
    ctx.translate(cx, lerp(sy - 48, cy, fall));
    ctx.rotate(lerp(-0.2, 0, fall));
    const sc = lerp(1.22, 1, fall);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(p / 0.1, 0, 1) * (1 - stick) * 0.95;
    tissueBlob(ctx, 0, 0, sw * 0.3, sh * 0.275, 2202);
    ctx.restore();
  }

  // 展片贴合时的一圈涟漪
  const rip = clamp((p - land) / 0.2, 0, 1);
  if (rip > 0 && rip < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - rip) * 0.45;
    ctx.strokeStyle = SKIN.glassEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, lerp(42, 134, rip), lerp(12, 34, rip), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawLabel(ctx, LABEL_POS['chap-2'][0], LABEL_POS['chap-2'][1], LABEL['chap-2'], SKIN.text, 14);
}

/** chap-3 换倍率: the nosepiece swings 4x -> 10x -> 4x, the field dissolve follows. */
function sceneChap3(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  const fx = 152;
  const fy = 16;
  const fw = 214;
  const fh = 98;

  const high = p > 0.38 && p < 0.74;
  // drawMicroscope 的 (x, y) 是整机中心，scale 0.46 时约 74×90，底座落在台面上
  drawMicroscope(ctx, 66, 70, 0.46, { objective: high ? 1 : 0 });

  // 目镜与镜下视野的连线
  ctx.save();
  ctx.strokeStyle = SKIN.metal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 62);
  ctx.lineTo(fx - 6, 64);
  ctx.stroke();
  ctx.restore();

  const toHigh = clamp((p - 0.38) / 0.1, 0, 1);
  const toLow = clamp((p - 0.74) / 0.1, 0, 1);
  const mix = clamp(toHigh - toLow, 0, 1);

  drawField(ctx, fx, fy, fw, fh, 1.25, 7301, 1);
  drawField(ctx, fx, fy, fw, fh, 5, 7301, mix);

  drawLabel(ctx, LABEL_POS['chap-3'][0], LABEL_POS['chap-3'][1], LABEL['chap-3'], SKIN.text, 14);
}

/** chap-4 圈区域: a marker pen rings three small areas of interest on the section. */
function sceneChap4(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  drawSlide(ctx, 92, 30, 378, 88, { tissue: 'section' });

  // 组织块中心约 (326, 74)，三个圈都落在组织上
  const rings: { x: number; y: number; r: number }[] = [
    { x: 280, y: 64, r: 18 },
    { x: 344, y: 86, r: 16 },
    { x: 392, y: 62, r: 20 },
  ];
  const start = 0.06;
  const stride = 0.28;
  const sweep = 0.17;
  const a0 = -Math.PI * 0.5;

  let penX = rings[0].x - 4;
  let penY = rings[0].y - 30;
  let penAng = -0.9;

  for (let i = 0; i < rings.length; i += 1) {
    const local = (p - (start + i * stride)) / sweep;
    if (local <= 0) continue;
    const t = clamp(local, 0, 1);
    const a1 = a0 + t * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(rings[i].x, rings[i].y, rings[i].r, a0, a1);
    ctx.strokeStyle = SKIN.blue;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    const tipX = rings[i].x + Math.cos(a1) * rings[i].r;
    const tipY = rings[i].y + Math.sin(a1) * rings[i].r;
    if (local < 1) {
      penX = tipX;
      penY = tipY;
      penAng = Math.atan2(rings[i].y - tipY, rings[i].x - tipX) + Math.PI;
    } else {
      const nxt = rings[Math.min(rings.length - 1, i + 1)];
      const lift = clamp((local - 1) / 1.1, 0, 1);
      penX = lerp(tipX, nxt.x - 16, lift);
      penY = lerp(tipY, nxt.y - 32, lift);
      penAng = lerp(penAng, -0.9, lift);
    }
  }
  drawMarkerPen(ctx, penX, penY, penAng);
  drawLabel(ctx, LABEL_POS['chap-4'][0], LABEL_POS['chap-4'][1], LABEL['chap-4'], SKIN.text, 14);
}

/** chap-5 看申请单: an arrow leaves the ordered row of the request form, a slide region lights up. */
function sceneChap5(ctx: CanvasRenderingContext2D, p: number): void {
  clearScene(ctx, W, H);

  drawRequestForm(ctx, 24, 12, 208, 100, ['部位 甲状腺', '项目 H&E']);

  // 申请单第一行横线（drawSheet 布局）：y ≈ 40，文字左起 x ≈ 34
  const rowY = 40;
  const hl = clamp((p - 0.05) / 0.16, 0, 1);
  if (hl > 0) {
    ctx.save();
    ctx.globalAlpha = 0.2 * hl;
    ctx.fillStyle = SKIN.blue;
    roundRectPath(ctx, 30, rowY - 13, 196, 26, 5);
    ctx.fill();
    ctx.restore();
  }

  // 玻片上的组织块中心约 (453, 70)
  const ex = 453;
  const ey = 70;
  drawSlide(ctx, 322, 22, 212, 96, { tissue: 'section' });

  const grow = easeOutCubic(clamp((p - 0.26) / 0.3, 0, 1));
  if (grow > 0) drawArrow(ctx, 232, rowY, ex, ey, grow);

  const lit = clamp((p - 0.54) / 0.2, 0, 1);
  if (lit > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
    ctx.save();
    ctx.globalAlpha = 0.16 * lit * (0.6 + 0.4 * pulse);
    ctx.fillStyle = SKIN.blue;
    ctx.beginPath();
    ctx.arc(ex, ey, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9 * lit;
    ctx.strokeStyle = SKIN.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex, ey, 20 + pulse * 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawLabel(ctx, LABEL_POS['chap-5'][0], LABEL_POS['chap-5'][1], LABEL['chap-5'], SKIN.text, 14);
}

function drawScene(ctx: CanvasRenderingContext2D, chapterId: string, p: number): void {
  switch (chapterId) {
    case 'chap-2':
      sceneChap2(ctx, p);
      break;
    case 'chap-3':
      sceneChap3(ctx, p);
      break;
    case 'chap-4':
      sceneChap4(ctx, p);
      break;
    case 'chap-5':
      sceneChap5(ctx, p);
      break;
    default:
      sceneChap1(ctx, p);
      break;
  }
}

export const AnalogySceneA: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const duration = LOOP_MS[chapterId] ?? 3200;
    const started = performance.now();
    let first = true;

    const tick = (): void => {
      const p = ((performance.now() - started) % duration) / duration;
      drawScene(ctx, chapterId, p);
      if (first) {
        first = false;
        canvas.classList.add('is-ready');
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return <canvas id={`cv-${chapterId}-ana`} ref={canvasRef} width={W} height={H} />;
};

export default AnalogySceneA;
