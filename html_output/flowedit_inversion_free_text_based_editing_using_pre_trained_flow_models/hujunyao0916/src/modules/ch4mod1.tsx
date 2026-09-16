import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', purple: '#7c3aed',
  text: '#21324a', muted: '#68778f', border: '#d7deea',
};

function arrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  w = 2
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const ang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 9 * Math.cos(ang - 0.4), y + dy - 9 * Math.sin(ang - 0.4));
  ctx.lineTo(x + dx - 9 * Math.cos(ang + 0.4), y + dy - 9 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

/** P1：滑块 t，技术平面上显示 VΔ = Vtar − Vsrc */
export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0.55 });
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(0.55);
  const [feedback, setFeedback] = useState({
    text: '拖动 t，观察速度差如何指向编辑方向。',
    cls: '',
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

    const render = () => {
      const tv = stateRef.current.t;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // life: photo on table
      ctx.fillStyle = C.light;
      ctx.fillRect(40, 40, 360, 200);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(40, 40, 360, 200);
      const px = lerp(100, 320, tv);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(px - 28, 120, 56, 44);
      ctx.strokeRect(px - 28, 120, 56, 44);
      ctx.fillStyle = C.text;
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('灯箱时刻 t', 60, 70);

      // technical plane
      const ox = 520;
      const oy = 200;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.border;
      ctx.fillRect(440, 40, 580, 200);
      ctx.strokeRect(440, 40, 580, 200);
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(ox, 60);
      ctx.lineTo(ox, 220);
      ctx.moveTo(470, oy);
      ctx.lineTo(980, oy);
      ctx.stroke();

      const vSrc = { dx: 80 + tv * 40, dy: -50 + tv * 20 };
      const vTar = { dx: 120 + tv * 30, dy: -90 - tv * 10 };
      const vD = { dx: vTar.dx - vSrc.dx, dy: vTar.dy - vSrc.dy };
      arrow(ctx, ox, oy, vSrc.dx, vSrc.dy, C.blue, 2);
      arrow(ctx, ox, oy, vTar.dx, vTar.dy, C.orange, 2);
      arrow(ctx, ox, oy, vD.dx * 2.2, vD.dy * 2.2, C.green, 3.5);

      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('Vsrc', ox + vSrc.dx + 6, oy + vSrc.dy);
      ctx.fillText('Vtar', ox + vTar.dx + 6, oy + vTar.dy);
      ctx.fillStyle = C.green;
      ctx.fillText('VΔ', ox + vD.dx * 2.2 + 8, oy + vD.dy * 2.2);
      canvas.classList.add('is-ready');
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
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.t = v;
    setT(v);
    setFeedback({
      text:
        v > 0.7
          ? '靠近目标端：VΔ 更强调风格变化。'
          : v < 0.3
          ? '靠近源端：结构约束更强，编辑偏弱。'
          : '中间时刻：速度差构成直接编辑方向。',
      cls: v >= 0.3 && v <= 0.75 ? 'good' : '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          时刻 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
