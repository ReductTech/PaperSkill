import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.1（1080×280）：照片上有三个热区（纹理 / 边缘 / 颜色），点击热区
// （或按 1/2/3、点 chip）切换选中区，右侧细节窗同步显示该区域的像素块阵列
// 与三条特征条 —— 不同损坏破坏不同的图像线索。

const W = 1080;
const H = 280;

type Region = 'texture' | 'edge' | 'color';

const PHOTO = { x: 80, y: 40, w: 300, h: 200 };
const FACE = { cx: 230, cy: 140, r: 46 };
const PANEL = { x: 528, y: 34, w: 482, h: 206 };
const BLOCKS = { x: 548, y: 56, w: 442, h: 96, cols: 8, rows: 6 };
const BARS = { x: 576, max: 304, y: 172, gap: 27, h: 12 };

// 三个热区：纹理 = 中上部方块，颜色 = 天空块，边缘 = 人像轮廓线
const HOT_TEXTURE = { x: 160, y: 52, w: 110, h: 72 };
const HOT_COLOR = { x: 84, y: 52, w: 66, h: 72 };

const REGIONS: { key: Region; label: string }[] = [
  { key: 'texture', label: '纹理' },
  { key: 'edge', label: '边缘' },
  { key: 'color', label: '颜色' },
];

// 选中该区域时，三条特征条（纹理 / 边缘 / 颜色）的保留度；own 指向自身线索那条
const DETAIL: Record<Region, { label: string; bars: number[]; own: number }> = {
  texture: { label: '纹理', bars: [0.31, 0.66, 0.78], own: 0 },
  edge: { label: '边缘', bars: [0.58, 0.29, 0.61], own: 1 },
  color: { label: '颜色', bars: [0.63, 0.52, 0.34], own: 2 },
};

const PICK_FEEDBACK: Record<Region, string> = {
  texture: '纹理被抹平：模型分不清材质与细节',
  edge: '边缘断裂：物体轮廓不再可靠',
  color: '颜色漂移：语义线索（红车/蓝车）可能被改写',
};

function pickRegion(x: number, y: number): Region | null {
  if (
    x >= HOT_TEXTURE.x &&
    x <= HOT_TEXTURE.x + HOT_TEXTURE.w &&
    y >= HOT_TEXTURE.y &&
    y <= HOT_TEXTURE.y + HOT_TEXTURE.h
  ) {
    return 'texture';
  }
  if (
    x >= HOT_COLOR.x &&
    x <= HOT_COLOR.x + HOT_COLOR.w &&
    y >= HOT_COLOR.y &&
    y <= HOT_COLOR.y + HOT_COLOR.h
  ) {
    return 'color';
  }
  const d = Math.hypot(x - FACE.cx, y - FACE.cy);
  if (d >= FACE.r * 0.5 && d <= FACE.r * 1.35) return 'edge';
  return null;
}

// ---------- drawing kit (local helpers, fixed signatures) ----------
type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Deterministic PRNG: 斑点位置每帧一致，只有数量随 damage 变化。
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawPhoto(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
) {
  const d = clamp(damage, 0, 1);
  const rng = makeRng(90210);
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w;
    const sy = y + rng() * h;
    const s = 1 + rng() * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }
  const nc = Math.round(2 + 2 * d);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < nc; i++) {
    let px = x + rng() * w;
    let py = y + rng() * h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 0; k < 3; k++) {
      px += (rng() - 0.5) * 26;
      py += (rng() - 0.5) * 26;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = stateColor ?? '#d7deea';
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx: Ctx, cx: number, cy: number, r: number, clarity: number) {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.85 * c;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.36, cy - r * 0.18, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.18, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.restore();

  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 14, 9, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSceneLabel(ctx: Ctx, text: string, x: number, y: number) {
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#21324a';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ region: Region }>({ region: 'texture' });
  const [region, setRegion] = useState<Region>('texture');
  const [feedback, setFeedback] = useState({
    text: '选中纹理区域：压缩伪影抹平了局部细节',
    cls: '',
  });

  const select = (r: Region) => {
    stateRef.current.region = r;
    setRegion(r);
    setFeedback({ text: PICK_FEEDBACK[r], cls: '' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const sel = stateRef.current.region;
      const pulse = 0.5 + 0.5 * Math.sin(now / 380);

      clearScene(ctx, W, H);

      // 左区：照片（中度损坏）与人像
      drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 0.35);
      drawFace(ctx, FACE.cx, FACE.cy, FACE.r, 0.5);

      // 三个热区轮廓：未选中为浅色虚线
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      roundRect(ctx, HOT_TEXTURE.x, HOT_TEXTURE.y, HOT_TEXTURE.w, HOT_TEXTURE.h, 6);
      ctx.stroke();
      roundRect(ctx, HOT_COLOR.x, HOT_COLOR.y, HOT_COLOR.w, HOT_COLOR.h, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(FACE.cx, FACE.cy, FACE.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 选中区：橙色虚线框 + 微脉冲
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 2.5 + 1.5 * pulse;
      ctx.globalAlpha = 0.55 + 0.45 * pulse;
      if (sel === 'texture') {
        roundRect(ctx, HOT_TEXTURE.x, HOT_TEXTURE.y, HOT_TEXTURE.w, HOT_TEXTURE.h, 6);
      } else if (sel === 'color') {
        roundRect(ctx, HOT_COLOR.x, HOT_COLOR.y, HOT_COLOR.w, HOT_COLOR.h, 6);
      } else {
        ctx.beginPath();
        ctx.arc(FACE.cx, FACE.cy, FACE.r, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();

      // 右区：白色内衬细节窗
      ctx.save();
      roundRect(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d7deea';
      ctx.stroke();
      ctx.restore();

      // 上半：8×6 像素块阵列，按区域变化
      const rng = makeRng(4242);
      const bw = BLOCKS.w / BLOCKS.cols;
      const bh = BLOCKS.h / BLOCKS.rows;
      for (let row = 0; row < BLOCKS.rows; row++) {
        for (let col = 0; col < BLOCKS.cols; col++) {
          const bx = BLOCKS.x + col * bw;
          const by = BLOCKS.y + row * bh;
          const cw = bw - 2;
          const ch = bh - 2;
          const tone = (col + row) % 2 === 0 ? '#d7deea' : '#b8c9a7';
          if (sel === 'edge') {
            const diag = Math.abs(row / (BLOCKS.rows - 1) - col / (BLOCKS.cols - 1));
            if (diag < 0.22) {
              // 边缘：块沿对角线断裂，整块塌掉只剩两端
              ctx.fillStyle = '#f5f8f0';
              ctx.fillRect(bx, by, cw, ch);
              ctx.strokeStyle = '#76906a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(bx, by + ch * 0.5);
              ctx.lineTo(bx + cw * 0.34, by + ch * 0.5);
              ctx.moveTo(bx + cw * 0.66, by + ch * 0.5);
              ctx.lineTo(bx + cw, by + ch * 0.5);
              ctx.stroke();
              continue;
            }
            ctx.fillStyle = tone;
            ctx.fillRect(bx, by, cw, ch);
          } else if (sel === 'color') {
            // 颜色：整块被色偏覆盖
            ctx.fillStyle = tone;
            ctx.fillRect(bx, by, cw, ch);
            ctx.fillStyle = 'rgba(39,68,110,0.32)';
            ctx.fillRect(bx, by, cw, ch);
          } else {
            // 纹理：方块内部被抹平，只剩随机噪点
            ctx.fillStyle = tone;
            ctx.fillRect(bx, by, cw, ch);
            for (let k = 0; k < 5; k++) {
              ctx.fillStyle = rng() > 0.5 ? '#76906a' : '#f5f8f0';
              ctx.fillRect(bx + rng() * (cw - 3), by + rng() * (ch - 3), 2, 2);
            }
          }
        }
      }

      // 下半：三条特征条（纹理 / 边缘 / 颜色），长度随损坏下降
      const info = DETAIL[sel];
      for (let i = 0; i < 3; i++) {
        const y = BARS.y + i * BARS.gap;
        const owned = i === info.own;
        ctx.save();
        ctx.fillStyle = owned ? '#f07e47' : '#27446e';
        ctx.fillRect(BARS.x - 22, y, 12, BARS.h);
        roundRect(ctx, BARS.x, y, BARS.max, BARS.h, 6);
        ctx.fillStyle = '#f5f8f0';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#d7deea';
        ctx.stroke();
        const barW = lerp(6, BARS.max, clamp(info.bars[i], 0, 1));
        roundRect(ctx, BARS.x, y, barW, BARS.h, 6);
        ctx.fillStyle = owned ? '#f07e47' : '#27446e';
        ctx.fill();
        ctx.restore();
      }

      // 图内两个短标签：选中区域名 + 该线索的裸数字保留度
      drawSceneLabel(ctx, info.label, PHOTO.x + 4, 30);
      drawSceneLabel(ctx, info.bars[info.own].toFixed(2), 905, 232);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const hit = pickRegion(x, y);
    if (hit) select(hit);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '1') select('texture');
    else if (e.key === '2') select('edge');
    else if (e.key === '3') select('color');
  };

  return (
    <div>
      <div tabIndex={0} onKeyDown={onKeyDown}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          onClick={onCanvasClick}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <div className="ctrl">
        {REGIONS.map((r) => (
          <button
            key={r.key}
            type="button"
            className={region === r.key ? 'chip selected' : 'chip'}
            onClick={() => select(r.key)}
            aria-pressed={region === r.key}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
