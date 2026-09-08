import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10 模块 10.1 —— 失败情形（由原 §9.2 “边界”页迁移而来）。
// 两枚芯片切换两类失败：光照突变 / 视角极稀疏；Canvas 放大对应图标并抖动，
// 反馈区用红字说明失败机理。论文 §5 限制。
const W = 560;
const H = 240;

type Case = 'light' | 'sparse';
interface State {
  t: number;
  cs: Case;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.62, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.88, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.88);
  ctx.quadraticCurveTo(w * 0.8, h * 0.96, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export const ModLimitations: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ t: 0, cs: 'light' });
  const rafRef = useRef<number | null>(null);
  const [cs, setCs] = useState<Case>('light');
  const [feedback, setFeedback] = useState({
    text: '光照突变：帧间外观骤变，跨块记忆读到的上下文不一致，位姿与深度会失配。',
    cls: 'bad',
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

    const drawLight = (s: State) => {
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('失败情形 ①：光照突变', 18, 28);

      const shake = Math.sin(s.t * 0.2) * 3;
      const cx = W / 2;
      const cy = 128;
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + shake, cy, 34, 0, Math.PI * 2);
      ctx.stroke();
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + shake + Math.cos(ang) * 40, cy + Math.sin(ang) * 40);
        ctx.lineTo(cx + shake + Math.cos(ang) * 52, cy + Math.sin(ang) * 52);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx + shake - 46, cy - 46);
      ctx.lineTo(cx + shake + 46, cy + 46);
      ctx.stroke();
      ctx.fillStyle = '#c43f52';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('帧间外观骤变 → 上下文不一致', cx - 118, cy + 84);
    };

    const drawSparse = (s: State) => {
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('失败情形 ②：视角极稀疏', 18, 28);

      const shake = Math.sin(s.t * 0.2) * 3;
      const cy = 120;
      [-120, -40, 60, 150].forEach((dx, i) => {
        const jx = W / 2 + dx + (i % 2 === 0 ? shake : -shake);
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(jx, cy + 34);
        ctx.lineTo(jx, cy - 22);
        ctx.stroke();
        ctx.fillStyle = '#c43f52';
        ctx.beginPath();
        ctx.moveTo(jx, cy - 22);
        ctx.lineTo(jx + 12, cy - 17);
        ctx.lineTo(jx, cy - 12);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#c43f52';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('相邻视角重叠太少 → 无公共桩可对齐', W / 2 - 150, cy + 78);
    };

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);
      if (s.cs === 'light') drawLight(s);
      else drawSparse(s);
    };

    const tick = () => {
      stateRef.current.t += 1;
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

  const pick = (v: Case) => {
    stateRef.current.cs = v;
    setCs(v);
    if (v === 'light')
      setFeedback({
        text: '光照突变：帧间外观骤变，跨块记忆读到的上下文不一致，位姿与深度会失配。',
        cls: 'bad',
      });
    else
      setFeedback({
        text: '视角极稀疏：相邻帧重叠不足，重叠带缺少公共桩，块间无法可靠对齐。',
        cls: 'bad',
      });
  };

  const opts: { v: Case; label: string }[] = [
    { v: 'light', label: '光照突变' },
    { v: 'sparse', label: '视角极稀疏' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {opts.map((o) => (
          <button
            key={o.v}
            className={`chip ${cs === o.v ? 'selected' : ''}`}
            onClick={() => pick(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModLimitations;
