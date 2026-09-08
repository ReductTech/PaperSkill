import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp } from '../lib/canvasKit';
import {
  PAL,
  clearPanel,
  drawInset,
  drawLegend,
  drawSceneLabel,
  rampSteps,
  wrapText,
  setupCrispCanvas,
  useAutoplay,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 300;

// interpolation line: x (clean) at the lower-left, epsilon (noise) at the upper-right
const XA = 168;
const YA = 208;
const XB = 366;
const YB = 108;
const ARROW_LEN = 92;

interface S {
  tPos: number;
  dragging: boolean;
}

function pointAt(t: number): [number, number] {
  return [XA + (XB - XA) * t, YA + (YB - YA) * t];
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lw: number,
  alpha = 1
): void {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(a - 0.42) * 9, y1 - Math.sin(a - 0.42) * 9);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(a + 0.42) * 9, y1 - Math.sin(a + 0.42) * 9);
  ctx.stroke();
  ctx.restore();
}

export const Ch3M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<S>({ tPos: 0.5, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [tPos, setTPos] = useState(0.5);
  const [feedback, setFeedback] = useState({
    text: 't = 0.50：插值线中段。训练时 t 从 U(0,1) 均匀采样，所以整条线上的每个点都会被学到。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    // unit direction along the line: this is the direction of epsilon - x
    const dx = XB - XA;
    const dy = YB - YA;
    const norm = Math.hypot(dx, dy);
    const ux = dx / norm;
    const uy = dy / norm;

    const render = (s: S) => {
      clearPanel(ctx, W, H);

      // The interpolation line must visibly START at the clean-frame tile and
      // END at the noise tile, otherwise the three parts read as unrelated
      // objects. Extend it past both draggable-range endpoints, up to each
      // tile's edge, drawing the extensions dimmer so the draggable segment
      // XA..XB stays the visually dominant part.
      const L = Math.hypot(XB - XA, YB - YA);
      const ux = (XB - XA) / L;
      const uy = (YB - YA) / L;
      // tile centres sit ON the line, one tile-half beyond each endpoint
      const OUT = 46;
      const TILE_HALF = 24;
      const cleanCx = XA - ux * OUT;
      const cleanCy = YA - uy * OUT;
      const noiseCx = XB + ux * OUT;
      const noiseCy = YB + uy * OUT;
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 2;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(cleanCx + ux * TILE_HALF, cleanCy + uy * TILE_HALF);
      ctx.lineTo(XA, YA);
      ctx.moveTo(XB, YB);
      ctx.lineTo(noiseCx - ux * TILE_HALF, noiseCy - uy * TILE_HALF);
      ctx.stroke();
      ctx.restore();
      // the draggable segment itself
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(XA, YA);
      ctx.lineTo(XB, YB);
      ctx.stroke();

      // three faint reference arrows: identical direction and length at every t
      for (const rt of [0.2, 0.5, 0.8]) {
        const [rx, ry] = pointAt(rt);
        arrow(ctx, rx, ry, rx + ux * ARROW_LEN, ry + uy * ARROW_LEN, PAL.orange, 2, 0.3);
      }

      // End markers as two labelled swatch tiles: an orderly knit on the clean
      // side, scattered loose stitches on the noise side. Same tile size and
      // border weight so the pair reads as one comparison.
      const tile = (
        cx: number,
        cy: number,
        color: string,
        tint: string,
        kind: 'knit' | 'noise'
      ) => {
        const R = 9;
        const TW = 46;
        const TH = 40;
        ctx.fillStyle = tint;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - TW / 2, cy - TH / 2, TW, TH, R * 0.6);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = color;
        if (kind === 'knit') {
          // tidy rows of V stitches
          ctx.lineWidth = 1.6;
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const vx = cx - 14 + c * 14;
              const vy = cy - 11 + r * 11;
              ctx.beginPath();
              ctx.moveTo(vx - 4, vy - 3);
              ctx.lineTo(vx, vy + 3);
              ctx.lineTo(vx + 4, vy - 3);
              ctx.stroke();
            }
          }
        } else {
          // the same stitches, scattered and rotated: structure destroyed
          ctx.lineWidth = 1.5;
          const jit = [
            [-13, -10, 0.9],
            [2, -13, -0.6],
            [13, -6, 0.4],
            [-8, 2, -1.1],
            [5, 4, 1.3],
            [-14, 11, 0.2],
            [11, 10, -0.9],
          ] as const;
          for (const [dx, dy, a] of jit) {
            ctx.save();
            ctx.translate(cx + dx, cy + dy);
            ctx.rotate(a);
            ctx.beginPath();
            ctx.moveTo(-4, -3);
            ctx.lineTo(0, 3);
            ctx.lineTo(4, -3);
            ctx.stroke();
            ctx.restore();
          }
        }
      };

      tile(cleanCx, cleanCy, PAL.green, 'rgba(34,141,92,0.14)', 'knit');
      ctx.fillStyle = PAL.green;
      ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('x', cleanCx, cleanCy + 42);
      ctx.fillStyle = PAL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('干净帧', cleanCx, cleanCy + 60);

      tile(noiseCx, noiseCy, PAL.red, 'rgba(196,63,82,0.12)', 'noise');
      ctx.fillStyle = PAL.red;
      ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('ε', noiseCx, noiseCy - 32);
      ctx.fillStyle = PAL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('噪声', noiseCx, noiseCy - 50);
      ctx.textAlign = 'left';

      // the live arrow at the dragged point: same direction and length always
      const [px, py] = pointAt(s.tPos);
      arrow(ctx, px, py, px + ux * ARROW_LEN, py + uy * ARROW_LEN, PAL.orange, 2.5);

      // the draggable point
      ctx.fillStyle = PAL.paper;
      ctx.strokeStyle = PAL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // inset: the target velocity at this point
      drawInset(ctx, 496, 92, 200, 176, '这一点的目标速度');
      ctx.fillStyle = PAL.orange;
      ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText('目标速度 = ε − x', 510, 132);
      ctx.fillStyle = PAL.ink;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`取点 t = ${s.tPos.toFixed(2)}`, 510, 158);
      ctx.fillStyle = PAL.green;
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillText('方向：恒定', 510, 184);
      ctx.fillText('大小：恒定', 510, 206);
      // residual bar: zero by construction
      ctx.fillStyle = PAL.axis;
      ctx.fillRect(510, 218, 172, 9);
      ctx.fillStyle = PAL.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('‖v−(ε−x)‖ → 0', 510, 244);
      ctx.fillText('训练即最小化这一项', 510, 260);

      drawSceneLabel(ctx, 34, 34, '沿插值线拖动取点');
      drawLegend(ctx, 496, 284, [
        { color: PAL.orange, label: '目标速度（处处相同）' },
        { color: PAL.axis, label: '插值线' },
      ]);
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
      detachCrisp();
    };
  }, []);

  const apply = (t: number) => {
    const v = clamp(t, 0, 1);
    stateRef.current.tPos = v;
    setTPos(v);
    const s = v.toFixed(2);
    if (v < 0.25) {
      setFeedback({
        text: `t = ${s}：靠近干净帧一侧。注意速度箭头的方向和长度和刚才一样——目标速度恒为 ε − x。`,
        cls: '',
      });
    } else if (v > 0.75) {
      setFeedback({
        text: `t = ${s}：靠近纯噪声一侧。速度依然是同一个 ε − x——修正流插值下速度场处处相同。`,
        cls: '',
      });
    } else {
      setFeedback({
        text: `t = ${s}：插值线中段。训练时 t 从 U(0,1) 均匀采样，所以整条线上的每个点都会被学到。`,
        cls: '',
      });
    }
  };

  const tFromEvent = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.tPos;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    return clamp((x - XA) / (XB - XA), 0, 1);
  };

  // Autoplay sweeps t across the whole interpolation line and back. The point is
  // negative evidence: the velocity arrow never changes while t moves, which is
  // easier to trust when the sweep is smooth and hands-off.
  const demo = useAutoplay(
    {
      steps: [...rampSteps(0, 1, 16), ...rampSteps(1, 0, 16).slice(1)],
      intervalMs: 220,
      loop: true,
    },
    (t: number) => apply(t)
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    demo.stop();
    stateRef.current.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(tFromEvent(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    apply(tFromEvent(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          取点位置 t <span className="val">{tPos.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(tPos * 100)}
          onChange={(e) => {
            demo.stop();
            apply(Number(e.target.value) / 100);
          }}
        />
        <button className={demo.btnClass} onClick={demo.toggle}>
          {demo.label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3M1;
