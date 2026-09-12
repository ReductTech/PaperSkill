import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawDog,
  drawSofa,
  drawTracker,
  drawLegend,
  drawSceneLabel,
  drawValueChip,
} from './dogKit';
import type { WidgetProps } from './registry';

// §8 module 8.2 逐层注意力 — step through layers 14 → 15 → 16. The radial heat
// blob (blue halo → orange core) tightens and drifts from the frame-0 nose
// position onto the moved dog's nose, locking with a green ring at layer 16.
// Right panel: verified attention mass g₅ 29.0% vs g₁ 7.5% / g₃ 8.1% / g₇ 4.0%.
const W = 1080;
const H = 280;
const SPLIT = 702; // left 65% frame view | right 35% evidence panel
const LAYERS = [14, 15, 16];
const OLD = { x: 240, y: 212 };
const NEW = { x: 583, y: 212 };
const TARGETS: Record<number, { t: number; r: number }> = {
  14: { t: 0.35, r: 110 }, // wide, between old/new position
  15: { t: 0.72, r: 74 }, // tightening, drifting
  16: { t: 1.0, r: 42 }, // locked on the new nose position
};
const EVIDENCE = [
  { sym: 'g₅', v: 29.0 },
  { sym: 'g₁', v: 7.5 },
  { sym: 'g₃', v: 8.1 },
  { sym: 'g₇', v: 4.0 },
];

interface Blob {
  x: number;
  y: number;
  r: number;
  ring: number;
}

export const Ch8Layers: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ layer: number }>({ layer: 14 });
  const blobRef = useRef<Blob>({
    x: OLD.x + TARGETS[14].t * (NEW.x - OLD.x),
    y: OLD.y,
    r: TARGETS[14].r,
    ring: 0,
  });
  const [layer, setLayer] = useState(14);
  const [fb, setFb] = useState({ text: '按下一步，看注意力逐层聚焦。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (b: Blob, s: { layer: number }, ms: number) => {
      ctx.clearRect(0, 0, W, H);
      // ---- left 65%: frame view (dog moved right, sofa present) ----
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SPLIT, H);
      ctx.clip();
      drawSceneBg(ctx, SPLIT, H);
      drawSofa(ctx, 420, 246, 0.95);
      // frame-0 nose position (dashed ghost marker)
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(OLD.x, OLD.y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawDog(ctx, 552, 246, 1.35, { mood: 'idle', t: ms / 700 });
      drawTracker(ctx, NEW.x, NEW.y, 5.5);
      // attention heat blob: blue halo → orange core
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, 'rgba(240, 126, 71, 0.55)');
      grad.addColorStop(0.35, 'rgba(240, 126, 71, 0.30)');
      grad.addColorStop(0.7, 'rgba(39, 68, 110, 0.22)');
      grad.addColorStop(1, 'rgba(39, 68, 110, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(240, 126, 71, 0.85)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(6, b.r * 0.14), 0, Math.PI * 2);
      ctx.fill();
      // locked green target ring (layer 16)
      if (b.ring > 0.02) {
        ctx.save();
        ctx.globalAlpha = b.ring;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(NEW.x, NEW.y, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      drawSceneLabel(ctx, '旧位置', 200, 182, { color: C.muted });
      ctx.restore();

      // divider
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(SPLIT, 14);
      ctx.lineTo(SPLIT, H - 14);
      ctx.stroke();

      // ---- right 35%: evidence panel (constant, verified values) ----
      const baseY = 218;
      ctx.strokeStyle = C.muted;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(732, baseY);
      ctx.lineTo(W - 28, baseY);
      ctx.stroke();
      ctx.globalAlpha = 1;
      EVIDENCE.forEach((ev, i) => {
        const bx = 748 + i * 84;
        const bh = (ev.v / 30) * 130;
        ctx.fillStyle = i === 0 ? C.green : C.blue;
        ctx.globalAlpha = i === 0 ? 1 : 0.8;
        ctx.beginPath();
        ctx.roundRect(bx, baseY - bh, 46, bh, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        drawValueChip(ctx, bx + 23, baseY - bh - 14, `${ev.v.toFixed(1)}%`, i === 0 ? C.green : C.blue);
        drawSceneLabel(ctx, ev.sym, bx + 23, baseY + 16, { color: C.muted, align: 'center' });
      });
      drawSceneLabel(ctx, `Layer ${s.layer}`, 748, 40);
      drawLegend(ctx, [['时间对齐', C.green], ['其他时刻', C.blue]], 748, H - 16);
    };

    const tick = (ms: number) => {
      const s = stateRef.current;
      const tg = TARGETS[s.layer];
      const b = blobRef.current;
      const tx = OLD.x + tg.t * (NEW.x - OLD.x);
      b.x += (tx - b.x) * 0.09;
      b.y += (NEW.y - b.y) * 0.09;
      b.r += (tg.r - b.r) * 0.09;
      b.ring += ((s.layer === 16 ? 1 : 0) - b.ring) * 0.09;
      render(b, s, ms);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const s = stateRef.current;
    const i = LAYERS.indexOf(s.layer);
    const ni = Math.min(LAYERS.length - 1, Math.max(0, i + dir));
    const nl = LAYERS[ni];
    s.layer = nl;
    setLayer(nl);
    setFb(
      nl === 14
        ? { text: '浅层注意力还比较散。', cls: '' }
        : nl === 15
        ? { text: '逐层收窄、向目标位置移动。', cls: '' }
        : { text: '深层注意力锁定运动后的同一物理点——稠密对应在此建立。', cls: 'good' }
    );
  };

  const reset = () => {
    stateRef.current.layer = 14;
    setLayer(14);
    setFb({ text: '已回到 Layer 14——按下一步，看注意力逐层聚焦。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-label">
          Layer <b>{layer}</b>
        </span>
        <button className="tiny ghost" disabled={layer === 14} onClick={() => go(-1)}>
          上一步
        </button>
        <button className="tiny" disabled={layer === 16} onClick={() => go(1)}>
          下一步
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Layers;
