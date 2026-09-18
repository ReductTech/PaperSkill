import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './river-kit';

// §8 Module 8.1: run Algorithm 1 on a 1D quadratic — click the three nodes to
// inspect each line, step "next" to iterate for real (eq (1), Algorithm 1).

const W = 1080;
const H = 280;
const ALPHA = 0.5; // GD step (example)
const GAMMA = 0.9;
const BETA = 0.5;

const LINE_INFO: Record<string, { title: string; body: string }> = {
  lookahead: { title: '前瞻位置 y = x + β·m', body: '从当前位置沿 EMA 方向前探（每次迭代都前瞻：频率 1，见表1）。' },
  optimizer: { title: '基础优化器 x = A_t(y)', body: '在前瞻位置处走一步：示例用梯度下降 A(y)=y−α·f′(y)；可换成 Adam/SOAP/Muon。' },
  ema: { title: 'EMA 更新 m = γ·m + (1−γ)·Δx', body: 'm 是对位移的 EMA，不是对梯度的 EMA（论文 C.5 辨析：Muon 的 Nesterov 实为梯度 EMA）。' },
};

export const W8Algoloop: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: -8, m: 0, t: 0, sel: null as string | null });
  const [tick, setTick] = useState(0);
  const [fb, setFb] = useState({ text: '点击节点查看每一行的作用，或按「下一步」真实迭代算法 1。', cls: '' });

  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const s = stateRef.current;
    clearScene(ctx, W, H);
    // top: quadratic f(x) = x^2/200 with x marker and lookahead point y
    const fx = (v: number) => (v * v) / 200;
    const cx0 = W * 0.05;
    const cw = W * 0.52;
    const toPx = (v: number) => cx0 + ((v + 10) / 20) * cw;
    const toPy = (fv: number) => H * 0.52 - (fv / 0.5) * (H * 0.36);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx0, 24, cw, H * 0.6);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const v = -10 + (i / 200) * 20;
      const X = toPx(v);
      const Y = toPy(fx(v));
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    const y = s.x + BETA * s.m;
    // lookahead point (hollow)
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(toPx(y), toPy(fx(y)), 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toPx(s.x), toPy(fx(s.x)));
    ctx.lineTo(toPx(y), toPy(fx(y)));
    ctx.stroke();
    ctx.setLineDash([]);
    // current x as canoe marker
    drawLabel(ctx, 'x', toPx(s.x) - 5, toPy(fx(s.x)) - 14, C.blue, 15);
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(toPx(s.x), toPy(fx(s.x)), 7, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, `f(x)=${fx(s.x).toFixed(3)}`, cx0 + 12, 44, C.text, 14);
    drawLabel(ctx, '一维示例目标（κ 视曲率而定）', cx0 + 12, H * 0.78, C.muted, 12);
    // bottom: three nodes with circular data flow
    const nodes: Array<{ id: string; label: string; x: number; y: number }> = [
      { id: 'lookahead', label: '前瞻 y=x+β·m', x: W * 0.68, y: 70 },
      { id: 'optimizer', label: '优化器 A_t', x: W * 0.87, y: 130 },
      { id: 'ema', label: 'EMA 更新 m', x: W * 0.68, y: 190 },
    ];
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(nodes[0].x + 60, nodes[0].y);
    ctx.quadraticCurveTo(W * 0.96, 100, nodes[1].x + 46, nodes[1].y - 12);
    ctx.moveTo(nodes[1].x + 40, nodes[1].y + 12);
    ctx.quadraticCurveTo(W * 0.9, 180, nodes[2].x + 56, nodes[2].y);
    ctx.moveTo(nodes[2].x - 56, nodes[2].y);
    ctx.quadraticCurveTo(W * 0.6, 130, nodes[0].x - 60, nodes[0].y);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const n of nodes) {
      const active = s.sel === n.id;
      ctx.fillStyle = active ? '#ffffff' : '#f4f7fb';
      ctx.strokeStyle = active ? C.orange : C.border;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.fillRect(n.x - 62, n.y - 18, 124, 36);
      ctx.strokeRect(n.x - 62, n.y - 18, 124, 36);
      ctx.fillStyle = C.text;
      ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(n.label, n.x - 55, n.y + 5);
    }
    drawLabel(ctx, `t=${s.t}　x=${s.x.toFixed(3)}　m=${s.m.toFixed(3)}　y=${y.toFixed(3)}`, W * 0.6, 32, C.text, 15);
    if (s.sel) {
      drawLabel(ctx, LINE_INFO[s.sel].title, W * 0.6, 232, C.text, 14);
      drawLabel(ctx, LINE_INFO[s.sel].body.slice(0, 34), W * 0.6, 252, C.muted, 12);
    }
  };

  const step = () => {
    const s = stateRef.current;
    const y = s.x + BETA * s.m;
    const grad = y / 100; // f'(y) = y/100 for f = y^2/200
    const xNew = y - ALPHA * grad;
    s.m = GAMMA * s.m + (1 - GAMMA) * (xNew - s.x);
    s.x = xNew;
    s.t += 1;
    setTick((t) => t + 1);
    setFb({ text: `t=${s.t}：y=${y.toFixed(3)}，x=${s.x.toFixed(3)}，m=${s.m.toFixed(3)}。`, cls: '' });
  };

  const reset = () => {
    stateRef.current = { x: -8, m: 0, t: 0, sel: null };
    setTick((t) => t + 1);
    setFb({ text: '已重置：x=−8，m=0，t=0。', cls: '' });
  };

  const pick = (id: string) => {
    stateRef.current.sel = id;
    setTick((t) => t + 1);
    if (id === 'ema') setFb({ text: LINE_INFO.ema.body, cls: 'good' });
    else if (id === 'lookahead') setFb({ text: LINE_INFO.lookahead.body, cls: '' });
    else setFb({ text: LINE_INFO.optimizer.body, cls: '' });
  };

  return (
    <div>
      <canvas
        ref={(el) => {
          (canvasRef as { current: HTMLCanvasElement | null }).current = el;
          if (el) requestAnimationFrame(render);
        }}
        width={W}
        height={H}
        style={{ maxWidth: '100%' }}
      />
      <div className="ctrl">
        <button onClick={() => pick('lookahead')}>前瞻</button>
        <button onClick={() => pick('optimizer')}>优化器</button>
        <button onClick={() => pick('ema')}>EMA</button>
        <button onClick={reset}>重置</button>
        <button onClick={step}>下一步</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W8Algoloop;
