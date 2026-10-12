import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5.1（P4 chips，hybrid，1080×280）：左 560px 生活场景（锚点+攀岩者+绳子），
// λ 过小=绳深深下垂（红）、适中=柔和弧线（橙）、过大=绷直且攀岩者被钉住（蓝）；
// 右 440px 内嵌图：「任务A保持率」「任务B学习率」两根水平柱 + 裸数字（方向性示意）。
// 切换 chip 时绳子与柱状做 1.2s 缓动过渡，反馈即时更新。
const W = 1080;
const H = 280;

type Mode = 'small' | 'mid' | 'large';

const C = {
  bg: '#f5f8f0',
  rockL: '#b8c9a7',
  rockD: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  mute: '#68778f',
  border: '#d7deea',
};

const TARGETS: Record<Mode, { t: number; a: number; b: number }> = {
  small: { t: 0, a: 0.35, b: 0.95 },
  mid: { t: 0.5, a: 0.9, b: 0.85 },
  large: { t: 1, a: 0.98, b: 0.3 },
};

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  small: { text: 'λ 太小：绳子形同虚设，新任务学会了，旧任务表现崩掉。', cls: 'bad' },
  mid: { text: 'λ 适中：重要权重被拉住，其余照常更新——新旧两全。', cls: 'good' },
  large: { text: 'λ 太大：所有权重都被锁死，旧任务完好但新任务学不动。', cls: 'bad' },
};

function mix(c1: string, c2: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const a = p(c1);
  const b = p(c2);
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(
    lerp(a[2], b[2], k)
  )})`;
}

function easeInOut(k: number): number {
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    vis: { t: number; a: number; b: number };
    anim: null | {
      start: number;
      from: { t: number; a: number; b: number };
      to: { t: number; a: number; b: number };
    };
  }>({
    vis: { t: 0.5, a: 0.9, b: 0.85 },
    anim: null,
  });
  const [mode, setMode] = useState<Mode>('mid');
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>({
    text: FEEDBACK.mid.text,
    cls: FEEDBACK.mid.cls,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();

    const drawHold = (x: number, y: number, s: number): void => {
      ctx.fillStyle = C.blue;
      rr(ctx, x - s / 2, y - s / 2, s, s, s / 3);
      ctx.fill();
    };

    const drawAnchor = (x: number, y: number): void => {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y - 8, 6, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawClimber = (x: number, tension: number, time: number): void => {
      const sway = Math.sin(time / 700) * 2 * (1 - tension);
      const hx = x + sway - tension * 4;
      const handL = { x: lerp(x - 16, x - 6, tension) + sway, y: lerp(196, 212, tension) };
      const handR = { x: lerp(x + 16, x + 6, tension) + sway, y: lerp(196, 212, tension) };
      const footL = { x: lerp(x - 10, x - 4, tension) + sway, y: 226 };
      const footR = { x: lerp(x + 10, x + 4, tension) + sway, y: 226 };
      ctx.strokeStyle = C.ink;
      ctx.fillStyle = C.ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + sway, 216);
      ctx.lineTo(footL.x, footL.y);
      ctx.moveTo(x + sway, 216);
      ctx.lineTo(footR.x, footR.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + sway, 216);
      ctx.lineTo(hx, 192);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, 194);
      ctx.lineTo(handL.x, handL.y);
      ctx.moveTo(hx, 194);
      ctx.lineTo(handR.x, handR.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, 186, 7, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawScene = (tension: number, time: number): void => {
      // rock band
      ctx.fillStyle = C.rockL;
      ctx.fillRect(0, 150, 560, H - 150);
      ctx.strokeStyle = C.rockD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(560, 150);
      ctx.stroke();
      drawHold(210, 200, 10);
      drawHold(330, 236, 10);
      drawHold(150, 236, 10);
      drawAnchor(120, 158);
      const climberX = lerp(430, 392, tension);
      const harnessX = climberX - 12;
      const harnessY = 200;
      const ropeColor =
        tension < 0.5
          ? mix(C.red, C.orange, tension * 2)
          : mix(C.orange, C.blue, (tension - 0.5) * 2);
      const sag = lerp(76, 0, tension);
      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 3 + tension;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(120, 158);
      ctx.quadraticCurveTo((120 + harnessX) / 2, (158 + harnessY) / 2 + sag, harnessX, harnessY);
      ctx.stroke();
      drawClimber(climberX, tension, time);
    };

    const drawInset = (a: number, b: number): void => {
      // white panel
      ctx.fillStyle = '#ffffff';
      rr(ctx, 580, 26, 440, 228, 10);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 580, 26, 440, 228, 10);
      ctx.stroke();
      // bar A: 任务A保持率
      text(ctx, '任务A保持率', 600, 74, C.ink, 15);
      ctx.fillStyle = 'rgba(184,201,167,0.4)';
      rr(ctx, 600, 88, 380, 20, 10);
      ctx.fill();
      ctx.fillStyle = C.green;
      rr(ctx, 600, 88, Math.max(8, 380 * a), 20, 10);
      ctx.fill();
      text(ctx, a.toFixed(2), Math.min(600 + 380 * a + 8, 984), 104, C.green, 15);
      // bar B: 任务B学习率
      text(ctx, '任务B学习率', 600, 144, C.ink, 15);
      ctx.fillStyle = 'rgba(184,201,167,0.4)';
      rr(ctx, 600, 158, 380, 20, 10);
      ctx.fill();
      ctx.fillStyle = C.orange;
      rr(ctx, 600, 158, Math.max(8, 380 * b), 20, 10);
      ctx.fill();
      text(ctx, b.toFixed(2), Math.min(600 + 380 * b + 8, 984), 174, C.orange, 15);
    };

    const render = (now: number): void => {
      const s = stateRef.current;
      let v = s.vis;
      if (s.anim) {
        const k = clamp((now - s.anim.start) / 1200, 0, 1);
        const e = easeInOut(k);
        v = {
          t: lerp(s.anim.from.t, s.anim.to.t, e),
          a: lerp(s.anim.from.a, s.anim.to.a, e),
          b: lerp(s.anim.from.b, s.anim.to.b, e),
        };
        s.vis = v;
        if (k >= 1) {
          s.vis = { ...s.anim.to };
          s.anim = null;
        }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      drawScene(v.t, now - t0);
      drawInset(v.a, v.b);
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = (): void => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (m: Mode): void => {
    setMode(m);
    setFeedback({ text: FEEDBACK[m].text, cls: FEEDBACK[m].cls });
    const s = stateRef.current;
    s.anim = { start: performance.now(), from: { ...s.vis }, to: TARGETS[m] };
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button
          type="button"
          className={`chip${mode === 'small' ? ' selected' : ''}`}
          onClick={() => select('small')}
        >
          λ 过小
        </button>
        <button
          type="button"
          className={`chip${mode === 'mid' ? ' selected' : ''}`}
          onClick={() => select('mid')}
        >
          λ 适中
        </button>
        <button
          type="button"
          className={`chip${mode === 'large' ? ' selected' : ''}`}
          onClick={() => select('large')}
        >
          λ 过大
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
