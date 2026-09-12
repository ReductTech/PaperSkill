import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  PALETTE,
  drawScene,
  drawGhostPath,
  drawTarget,
  drawBrush,
  drawLegend,
  drawSceneLabel,
} from './theme-kit';
import type { Pt } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 6.2 你来定落笔点（P6 拖动）：拖动绿环目标（或方向键移动），
// 幽灵路线即时重排：直连 / 遇墨渍绕行。目标压墨渍 → 警告；绕远 → 提示。

const W = 720;
const H = 300;
const MARGIN = 10;
const RING_R = 10;

const S: Pt = { x: 84, y: 150 };
const BLOTS: { x: number; y: number; r: number }[] = [
  { x: 270, y: 95, r: 26 },
  { x: 430, y: 205, r: 28 },
  { x: 560, y: 92, r: 24 },
];

type Fb = { text: string; cls: string };

function segHitsBlot(a: Pt, b: Pt): { blot: { x: number; y: number; r: number } } | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  for (const bl of BLOTS) {
    const t = clamp(((bl.x - a.x) * dx + (bl.y - a.y) * dy) / len2, 0, 1);
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    if (Math.hypot(px - bl.x, py - bl.y) < bl.r + 10) return { blot: bl };
  }
  return null;
}

function computePath(t: Pt): Pt[] {
  const pts: Pt[] = [S, t];
  for (let round = 0; round < 4; round++) {
    let changed = false;
    for (let i = 0; i < pts.length - 1; i++) {
      const hit = segHitsBlot(pts[i], pts[i + 1]);
      if (!hit) continue;
      const a = pts[i];
      const b = pts[i + 1];
      const bl = hit.blot;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      // 两侧候选，选离其他墨渍更远且在画布内的一侧
      const c1 = { x: bl.x + nx * (bl.r + 24), y: bl.y + ny * (bl.r + 24) };
      const c2 = { x: bl.x - nx * (bl.r + 24), y: bl.y - ny * (bl.r + 24) };
      const inBounds = (p: Pt) =>
        p.x > MARGIN + 8 && p.x < W - MARGIN - 8 && p.y > MARGIN + 8 && p.y < H - MARGIN - 8;
      const away = (p: Pt) =>
        Math.min(
          ...BLOTS.filter((o) => o !== bl).map((o) => Math.hypot(p.x - o.x, p.y - o.y))
        );
      let wp = c1;
      if (!inBounds(c1) && inBounds(c2)) wp = c2;
      else if (inBounds(c1) && inBounds(c2)) wp = away(c1) >= away(c2) ? c1 : c2;
      pts.splice(i + 1, 0, wp);
      changed = true;
      break;
    }
    if (!changed) break;
  }
  return pts;
}

function pathLen(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) s += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  return s;
}

export const M62DropPoint: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ target: { x: 620, y: 232 } as Pt, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [fb, setFb] = useState<Fb>({ text: '拖动绿环（或方向键移动）：预演路线即时重排。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.touchAction = 'none';

    const toCanvas = (e: PointerEvent): Pt => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * W) / rect.width,
        y: ((e.clientY - rect.top) * H) / rect.height,
      };
    };

    const updateFb = () => {
      const t = stateRef.current.target;
      const onBlot = BLOTS.some((b) => Math.hypot(t.x - b.x, t.y - b.y) < b.r + RING_R);
      const path = computePath(t);
      const len = pathLen(path);
      const direct = Math.hypot(t.x - S.x, t.y - S.y);
      setFb(
        onBlot
          ? { text: '目标压在墨渍上：这一笔注定废掉，换个落点。', cls: 'bad' }
          : len > 1.5 * direct + 12
          ? { text: '绕远了：路线拉长，墨和时间都要多花。', cls: '' }
          : { text: '落点干净：预演路线畅通。', cls: 'good' }
      );
    };

    const onDown = (e: PointerEvent) => {
      const p = toCanvas(e);
      const t = stateRef.current.target;
      if (Math.hypot(p.x - t.x, p.y - t.y) < RING_R * 1.6) {
        stateRef.current.dragging = true;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s.dragging) {
        const p = toCanvas(e);
        const near = Math.hypot(p.x - s.target.x, p.y - s.target.y) < RING_R * 1.6;
        canvas.style.cursor = near ? 'grab' : 'default';
        return;
      }
      const p = toCanvas(e);
      s.target = {
        x: clamp(p.x, MARGIN + RING_R + 2, W - MARGIN - RING_R - 2),
        y: clamp(p.y, MARGIN + RING_R + 2, H - MARGIN - RING_R - 2),
      };
      updateFb();
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (stateRef.current.dragging) {
        stateRef.current.dragging = false;
        canvas.style.cursor = 'grab';
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    const render = () => {
      const s = stateRef.current;
      const path = computePath(s.target);
      const len = pathLen(path);
      const onBlot = BLOTS.some((b) => Math.hypot(s.target.x - b.x, s.target.y - b.y) < b.r + RING_R);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: MARGIN });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.blue, text: '路线' },
        { color: PALETTE.envDark, text: '障碍' },
      ]);

      // 墨渍
      for (const b of BLOTS) {
        ctx.save();
        ctx.fillStyle = PALETTE.envDark;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r, b.r * 0.82, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.envLight;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(b.x - b.r * 0.3, b.y - b.r * 0.25, b.r * 0.4, b.r * 0.28, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 幽灵路线（绕行段加粗）
      for (let i = 0; i < path.length - 1; i++) {
        drawGhostPath(ctx, [path[i], path[i + 1]], {
          color: PALETTE.blue,
          width: i === 0 || i === path.length - 2 ? 2 : 3.4,
          alpha: 0.7,
        });
      }

      // 目标绿环（拖动时橙描边；压墨渍时红）
      drawTarget(ctx, s.target.x, s.target.y, {
        r: RING_R,
        color: onBlot ? PALETTE.red : PALETTE.green,
      });
      if (s.dragging) {
        ctx.save();
        ctx.strokeStyle = PALETTE.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.target.x, s.target.y, RING_R + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 毛笔（笔尖朝目标方向）
      const d = path[1];
      const ang = Math.atan2(d.x - S.x, -(d.y - S.y));
      drawBrush(ctx, S.x, S.y, ang, 28);

      // 底部路径长度条
      const direct = Math.hypot(s.target.x - S.x, s.target.y - S.y);
      const frac = clamp(len / Math.max(direct * 2.2, 1), 0, 1);
      drawSceneLabel(ctx, 40, H - 26, '路径长度', { size: 12 });
      const bx = 112;
      const bw = 440;
      ctx.fillStyle = PALETTE.grid;
      ctx.fillRect(bx, H - 32, bw, 12);
      ctx.fillStyle = frac > 0.68 ? PALETTE.red : PALETTE.orange;
      ctx.fillRect(bx, H - 32, bw * frac, 12);
      drawSceneLabel(ctx, bx + bw + 10, H - 26, `${Math.round(len)} px`, { size: 12 });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const step = e.shiftKey ? 16 : 8;
    const t = { ...s.target };
    if (e.key === 'ArrowLeft') t.x -= step;
    else if (e.key === 'ArrowRight') t.x += step;
    else if (e.key === 'ArrowUp') t.y -= step;
    else if (e.key === 'ArrowDown') t.y += step;
    else return;
    e.preventDefault();
    s.target = {
      x: clamp(t.x, MARGIN + RING_R + 2, W - MARGIN - RING_R - 2),
      y: clamp(t.y, MARGIN + RING_R + 2, H - MARGIN - RING_R - 2),
    };
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        role="application"
        aria-label="拖动目标绿环，预演路线即时重排"
        onKeyDown={onKey}
      />
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M62DropPoint;
