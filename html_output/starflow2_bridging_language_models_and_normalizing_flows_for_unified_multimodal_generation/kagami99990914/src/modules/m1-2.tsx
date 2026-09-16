import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// m1-2 — 三条路线的代价（1080×280，P4 模式 chips）。
// 左侧同一台织机的生活视图 + 右侧 D1/D2/D3 三格状态灯。

const W = 1080;
const H = 280;

const SCENE_BG = '#f5f8f0';
const C_WARP = '#b8c9a7';
const C_WARP_DEEP = '#76906a';
const C_LOOM = '#92400e';
const C_WEAVE = '#27446e';
const C_CROSS = '#7c3aed';
const C_SHUTTLE = '#f07e47';
const C_DONE = '#228d5c';
const C_BAD = '#c43f52';
const C_INSET = '#ffffff';
const C_MUTED = '#68778f';
const C_AXIS = '#d7deea';
const C_LABEL = '#21324a';

type XY = [number, number];
type WarpMark = 'normal' | 'dim' | 'broken';
type WarpState = (i: number) => WarpMark;

// ── Reusable Canvas drawing kit (defined locally in every widget file) ──────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = SCENE_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_AXIS;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C_WARP;
  ctx.lineWidth = 1.5;
  for (let x = 60; x <= w - 60; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  }
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: WarpState
): void {
  ctx.strokeStyle = C_LOOM;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 12, w - 28, h - 24);
  if (warpCount <= 0) return;
  const from = 60;
  const to = w - 60;
  const step = warpCount > 1 ? (to - from) / (warpCount - 1) : 0;
  for (let i = 0; i < warpCount; i++) {
    const x = from + i * step;
    const st = warpState ? warpState(i) : 'normal';
    ctx.strokeStyle = st === 'broken' ? C_BAD : st === 'dim' ? C_AXIS : C_WARP;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
    if (st === 'broken') {
      ctx.strokeStyle = C_BAD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, h / 2);
      ctx.lineTo(x + 6, h / 2);
      ctx.stroke();
    }
  }
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string,
  flip = false
): void {
  const bw = 46 * scale;
  const bh = 18 * scale;
  const dir = flip ? -1 : 1;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - dir * bw * 2.4, y);
  ctx.lineTo(x - dir * bw * 0.5, y);
  ctx.stroke();
  roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 6 * scale);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * bw * 0.5, y - bh / 2);
  ctx.lineTo(x + dir * (bw * 0.5 + 9 * scale), y);
  ctx.lineTo(x + dir * bw * 0.5, y + bh / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: XY[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'corner' | 'band'
): void {
  ctx.strokeStyle = C_DONE;
  ctx.lineWidth = 2.5;
  if (mode === 'band') {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - w, y - w);
    ctx.lineTo(x, y - w);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'label' | 'muted'
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = variant === 'muted' ? C_MUTED : C_LABEL;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; text: string }[]
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 10, 12, 12);
    ctx.fillStyle = C_MUTED;
    ctx.fillText(it.text, cx + 17, y);
    cx += 17 + ctx.measureText(it.text).width + 22;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: XY,
  to: XY,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = C_INSET;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C_AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = C_LABEL;
    ctx.fillText(title, x + 10, y + 20);
  }
}

// ── Widget ─────────────────────────────────────────────────────────────────────

type Route = 'none' | 'token' | 'diffusion' | 'vlmAdapter';
type Gate = 'ok' | 'broken';

interface M12State {
  route: Route;
}

const ROUTES: { key: Route; label: string }[] = [
  { key: 'token', label: '离散分词' },
  { key: 'diffusion', label: '扩散混合' },
  { key: 'vlmAdapter', label: '适配 VLM' },
];

function gates(route: Route): { d1: Gate; d2: Gate; d3: Gate } {
  return {
    d1: route === 'vlmAdapter' ? 'broken' : 'ok',
    d2: route === 'token' ? 'broken' : 'ok',
    d3: route === 'diffusion' ? 'broken' : 'ok',
  };
}

function feedbackFor(route: Route): { text: string; cls: string } {
  switch (route) {
    case 'token':
      return { text: '离散分词丢掉了连续性，D2 变红。', cls: 'bad' };
    case 'diffusion':
      return { text: '扩散混合让图像不能直接进 KV 缓存，D3 变红。', cls: 'bad' };
    case 'vlmAdapter':
      return { text: '为生成改动 VLM，预训练理解被损伤，D1 变红。', cls: 'bad' };
    default:
      return { text: '三格都亮着，这才是真正统一要同时守住的三件事。', cls: '' };
  }
}

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<M12State>({ route: 'none' });
  const rafRef = useRef<number | null>(null);
  const [route, setRoute] = useState<Route>('none');
  const [feedback, setFeedback] = useState(feedbackFor('none'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: M12State) => {
      clearScene(ctx, W, H);
      if (s.route === 'vlmAdapter') {
        drawSetting(ctx, W, H, 41, (i) => (i % 10 === 3 ? 'broken' : 'normal'));
      } else {
        drawSetting(ctx, W, H, 0);
      }

      // 左 620px：织机视图
      const rowY = 172;
      const rx0 = 60;
      const rx1 = 560;

      if (s.route === 'token') {
        const n = 8;
        const gap = 6;
        const segW = (rx1 - rx0 - (n - 1) * gap) / n;
        for (let i = 0; i < n; i++) {
          const x = rx0 + i * (segW + gap);
          ctx.strokeStyle = C_WEAVE;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, rowY);
          ctx.lineTo(x + segW, rowY);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = C_WEAVE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rx0, rowY);
        ctx.lineTo(rx1, rowY);
        ctx.stroke();
        ctx.fillStyle = C_WEAVE;
        ctx.globalAlpha = 0.16;
        ctx.fillRect(rx0, rowY + 8, rx1 - rx0, 14);
        ctx.globalAlpha = 1;
      }

      if (s.route === 'diffusion') {
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = C_BAD;
        ctx.lineWidth = 2;
        for (let g = 0; g < 3; g++) {
          const yy = rowY - 14 - g * 13;
          ctx.beginPath();
          ctx.moveTo(rx0 + 180, yy);
          ctx.lineTo(rx1 + 30, yy);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // 唯一独立运动的主体
      drawSubject(ctx, 108, rowY, 0.62, C_SHUTTLE);

      // 右 420px：D1/D2/D3 状态灯
      const ix = 640;
      const iy = 40;
      const iw = 400;
      const ih = 200;
      drawInsetFrame(ctx, ix, iy, iw, ih);
      const g = gates(s.route);
      // 三行「圆点 + 名称」构成本模块唯一的图例（共 3 项），因此三行都必须有文字；
      // 每个名称控制在 8 个字符以内（D3 用论文原词“结构统一”）。
      const rows: { label: string; ok: boolean }[] = [
        { label: 'D1 保留理解', ok: g.d1 === 'ok' },
        { label: 'D2 连续保真', ok: g.d2 === 'ok' },
        { label: 'D3 结构统一', ok: g.d3 === 'ok' },
      ];
      rows.forEach((r, i) => {
        const y = iy + 52 + i * 46;
        if (i > 0) {
          ctx.strokeStyle = C_AXIS;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ix + 20, y - 24);
          ctx.lineTo(ix + iw - 20, y - 24);
          ctx.stroke();
        }
        ctx.fillStyle = r.ok ? C_DONE : C_BAD;
        ctx.beginPath();
        ctx.arc(ix + 42, y, 9, 0, Math.PI * 2);
        ctx.fill();
        if (!r.ok) {
          ctx.strokeStyle = C_BAD;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ix + 42, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawSceneLabel(ctx, ix + 62, y + 5, r.label, 'label');
      });
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const pick = (key: Route) => {
    const next: Route = route === key ? 'none' : key;
    stateRef.current.route = next;
    setRoute(next);
    setFeedback(feedbackFor(next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span>路线</span>
        {ROUTES.map((r) => (
          <button
            key={r.key}
            className={`chip ${route === r.key ? 'selected' : ''}`}
            aria-pressed={route === r.key}
            onClick={() => pick(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M12;
