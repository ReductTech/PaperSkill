import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 270;
const CX = 280;
const CY = 206;
const R = 142;
const ALPHA = 0.5;
const ACTIONS = ['F', 'L', 'F', 'Stop'];

export const DaggerDial: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ u: 0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [u, setUState] = useState(0);
  const [feedback, setFeedback] = useState({ text: 't/T=0：老师几乎全程演示，学生先观察。转动刻度盘沿轨迹前进。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { u: number }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, 'DAgger 教学交接刻度盘', W / 2, 20, 13, C.ink);
      const beta = 1 - ALPHA * s.u;
      // dial arc
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(CX, CY, R, Math.PI, Math.PI * 2);
      ctx.stroke();
      // teacher fraction (left side, from angle pi to pi + beta*pi)
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(CX, CY, R, Math.PI, Math.PI + beta * Math.PI);
      ctx.stroke();
      // pointer
      const a = Math.PI + s.u * Math.PI;
      const px = CX + Math.cos(a) * R;
      const py = CY + Math.sin(a) * R;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      // center probability gauge: teacher fraction beta vs student fraction 1-beta
      const gaugeX = CX - 46;
      const gaugeY = CY - 58;
      const gaugeW = 92;
      const gaugeH = 18;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 9);
      ctx.fill();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.roundRect(gaugeX, gaugeY, gaugeW * beta, gaugeH, 9);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 9);
      ctx.stroke();
      label(ctx, `P(老师)=${beta.toFixed(2)}`, CX, CY - 70, 11, C.green);
      // labels
      label(ctx, 'Oracle 老师', 102, 178, 11, C.green);
      label(ctx, '学生策略', 458, 178, 11, C.blue);
      label(ctx, `β_t = ${beta.toFixed(2)}`, 96, 42, 13, C.green);
      label(ctx, `1−β_t = ${(1 - beta).toFixed(2)}`, 454, 42, 13, C.blue);
      // oracle action chunk supervision
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(214, 128, 132, 34);
      ctx.strokeStyle = C.green;
      ctx.strokeRect(214, 128, 132, 34);
      label(ctx, '监督目标：未来 4 步 oracle 动作块', CX, 118, 10, C.green);
      ACTIONS.forEach((act, i) => {
        ctx.fillStyle = C.blue;
        ctx.fillRect(222 + i * 31, 136, 25, 18);
        label(ctx, act, 234 + i * 31, 145, 8, '#ffffff');
      });
      label(ctx, `t/T = ${s.u.toFixed(2)}`, CX, 238, 11, C.orange);
      label(ctx, '每个访问状态都保留动作块训练标签', CX, 254, 9, C.muted);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const updateU = (v: number) => {
    const n = clamp(v, 0, 1);
    stateRef.current.u = n;
    setUState(n);
    const beta = 1 - ALPHA * n;
    if (n < 0.05) setFeedback({ text: '轨迹开始：β_t≈1，老师几乎必然演示，学生先观察正确动作。', cls: '' });
    else if (n < 0.5) setFeedback({ text: `β_t=${beta.toFixed(2)}：老师仍占主导，学生开始偶尔自己执行，从而暴露错误状态。`, cls: '' });
    else if (n < 0.95) setFeedback({ text: `β_t=${beta.toFixed(2)}：学生执行概率继续增加；无论当前访问状态由谁到达，都保存未来 4 步 oracle 动作块作为训练标签（不一定实际执行）。`, cls: 'good' });
    else setFeedback({ text: '轨迹末端：β_t=0.50，老师与学生各有一半执行概率；这些访问状态覆盖了学生自己走出来的偏差分布。注意论文正文对 DAgger 调度方向的文字描述与公式相反，本页按公式解释。', cls: 'good' });
  };

  const fromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    let a = Math.atan2(y - CY, x - CX);
    if (a < 0) a += Math.PI * 2;
    // Pointer is drawn at angle π when u=0 and angle 2π when u=1.
    // For the top semicircle, π=left, 1.5π=top, 2π=right.
    if (a <= Math.PI / 2) return 1;
    return clamp((a - Math.PI) / Math.PI, 0, 1);
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); stateRef.current.dragging = true; updateU(fromPointer(e)); }}
        onPointerMove={(e) => { if (stateRef.current.dragging) updateU(fromPointer(e)); }}
        onPointerUp={() => { stateRef.current.dragging = false; }}
        onPointerCancel={() => { stateRef.current.dragging = false; }}
      />
      <div className="ctrl">
        <label>轨迹进度 <span className="val">t/T = {u.toFixed(2)}</span></label>
        <button className="chip" onClick={() => updateU(0)}>轨迹开始</button>
        <button className="chip" onClick={() => updateU(1)}>轨迹结束</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default DaggerDial;
