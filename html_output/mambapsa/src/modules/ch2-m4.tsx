import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.4：C2PSA 块：CSP 外壳里装的是自注意力。
// 注意力“怎么算”（Q/K/V → 打分 → 加权求和）在下一模块 2.5 单独讲。
const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.35), y2 - 9 * Math.sin(ang - 0.35));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.35), y2 - 9 * Math.sin(ang + 0.35));
  ctx.closePath(); ctx.fill();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string, lw: number) {
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

const W = 560, H = 240;

const STEPS = [
  {
    key: 'input',
    title: '输入：一整段深层特征',
    desc: 'C2PSA 在主干末尾，输入是 20×20×512 的深层特征（示意 C×H×W）。它做的是全局聚合——让每个位置都能参考整块特征。',
    tensor: '输入 x：C×H×W',
  },
  {
    key: 'split',
    title: '拆两半：和 C3k2 一样的 CSP 外壳',
    desc: '先做一次 1×1 卷积，把通道拆成 a、b 两半——这个外壳和 C3k2 完全一样，区别只在内部放什么。',
    tensor: 'a、b：各 (C/2)×H×W',
  },
  {
    key: 'branch',
    title: 'a 过 PSA 全局聚合，b 恒等',
    desc: 'a 分支放位置敏感自注意力（PSA）做全局聚合——每个位置都参考整块特征，代价随 token 数平方增长（O(N²)）；b 分支恒等、原样保留。注意力的具体算法见下一模块。',
    tensor: 'a → PSA（O(N²)）· b → 恒等',
  },
  {
    key: 'merge',
    title: '拼回并投影成输出',
    desc: '把 a、b 沿通道方向拼接，再做一次 1×1 卷积投影回 C 通道，输出与输入同尺寸。',
    tensor: 'Concat → 1×1 → 输出：C×H×W',
  },
] as const;

export const Ch2M4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: 'C2PSA 是主干末尾的自注意力块：CSP 外壳里，a 分支放位置敏感自注意力（PSA）、b 分支恒等。用上一步/下一步走一遍块结构。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { step: number }) => {
      clearScene(ctx, W, H);
      const active = STEPS[s.step];
      ctx.textAlign = 'center';

      box(ctx, 14, 92, 76, 56, active.key === 'input' ? 'rgba(39,68,110,0.14)' : '#fff', active.key === 'input' ? C.blue : C.line, active.key === 'input' ? 2.2 : 1.2);
      ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif'; ctx.fillText('输入 x', 52, 118);
      ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText('C×H×W', 52, 134);
      ctx.textAlign = 'left';
      arrow(ctx, 90, 120, 118, 120, C.line);

      box(ctx, 118, 100, 70, 40, active.key === 'split' ? 'rgba(39,68,110,0.14)' : '#fff', active.key === 'split' ? C.blue : C.line, active.key === 'split' ? 2.2 : 1.2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('1×1 拆分', 153, 124);
      ctx.textAlign = 'left';

      arrow(ctx, 188, 104, 222, 76, C.line);
      arrow(ctx, 188, 136, 222, 168, C.line);

      // A 分支：PSA（红，始终标记）
      box(ctx, 222, 52, 128, 48, active.key === 'branch' ? 'rgba(196,63,82,0.16)' : 'rgba(196,63,82,0.05)', C.red, active.key === 'branch' ? 2.4 : 1.6);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('A · PSA 自注意力', 286, 74);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText('全局聚合 · O(N²)', 286, 92);
      ctx.textAlign = 'left';

      // B 分支：恒等（绿）
      box(ctx, 222, 144, 128, 40, active.key === 'branch' ? 'rgba(34,141,92,0.12)' : '#fff', C.green, active.key === 'branch' ? 2.2 : 1.4);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('B · 恒等', 286, 168);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText('原样保留', 286, 182);
      ctx.textAlign = 'left';

      arrow(ctx, 350, 76, 384, 110, C.line);
      arrow(ctx, 350, 164, 384, 130, C.line);

      box(ctx, 384, 100, 76, 40, active.key === 'merge' ? 'rgba(39,68,110,0.14)' : '#fff', active.key === 'merge' ? C.blue : C.line, active.key === 'merge' ? 2.2 : 1.2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('拼接+1×1', 422, 124);
      ctx.textAlign = 'left';
      arrow(ctx, 460, 120, 488, 120, C.line);

      box(ctx, 488, 92, 58, 56, active.key === 'merge' ? 'rgba(34,141,92,0.14)' : '#fff', active.key === 'merge' ? C.green : C.line, active.key === 'merge' ? 2.2 : 1.2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif'; ctx.fillText('输出', 517, 118);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText('C×H×W', 517, 134);
      ctx.textAlign = 'left';

      // 底部细节条
      ctx.fillStyle = '#ffffff'; rr(ctx, 14, 196, W - 28, 34, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(active.tensor, 28, 218);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (i: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, i));
    stateRef.current.step = s; setStep(s);
    const st = STEPS[s];
    setFeedback(
      s === STEPS.length - 1
        ? { text: 'C2PSA = CSP 外壳 + 自注意力核心。贵的在 a 分支（O(N²)）；第8章的 MambaPSA 正是把 a 分支换成 Mamba，外壳原样保留。注意力怎么算，见下一模块。', cls: 'good' }
        : { text: st.desc, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>上一步</button>
        <div className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步
        </div>
        <button className="tiny" disabled={step === STEPS.length - 1} onClick={() => go(step + 1)}>下一步</button>
      </div>
      <div className="step-desc">{STEPS[step].title}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
