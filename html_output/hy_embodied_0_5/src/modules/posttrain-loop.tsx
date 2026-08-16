import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type LoopStep = 'rl' | 'rft' | 'opd';
const W = 244, H = 130;
const order: LoopStep[] = ['rl', 'rft', 'opd'];
const meta = {
  rl: { label: 'RL', color: '#27446e', feedback: 'RL：在部分成功样本上探索，扩展当前能力边界。', detail: '每阶段新构造 5 万样本；全对与全错被过滤。' },
  rft: { label: 'RFT', color: '#d97706', feedback: 'RFT：教师筛选高质量成功轨迹，把发现固化为正监督。', detail: '报告设置：约 100 万候选 → 约 30 万高质量轨迹。' },
  opd: { label: 'OPD', color: '#228d5c', feedback: 'OPD：教师在学生自己生成的前缀上指导下一标记分布。', detail: 'y ~ π_s；在同一学生前缀上计算 KL(π_t ‖ π_s)。' },
};

function draw(ctx: CanvasRenderingContext2D, step: LoopStep, round: number) {
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#b8c9a7'; ctx.lineWidth = 2; ctx.strokeRect(8, 10, 228, 91);
  const xs = [46, 122, 198];
  ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xs[0], 62); ctx.lineTo(xs[2], 62); ctx.stroke();
  order.forEach((s, i) => { const active = s === step; ctx.fillStyle = active ? meta[s].color : '#ffffff'; ctx.strokeStyle = active ? meta[s].color : '#68778f'; ctx.lineWidth = active ? 4 : 2; ctx.beginPath(); ctx.arc(xs[i], 62, active ? 16 : 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = active ? '#ffffff' : '#21324a'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(meta[s].label, xs[i], 66); });
  const idx = order.indexOf(step); ctx.strokeStyle = meta[step].color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xs[idx] - 18, 42); ctx.lineTo(xs[idx], 25); ctx.lineTo(xs[idx] + 18, 42); ctx.stroke();
  ctx.fillStyle = '#21324a'; ctx.font = '11px system-ui'; ctx.fillText(`第 ${round} 轮`, 122, 118); ctx.textAlign = 'left';
}

export const PosttrainLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<{ loopStep: LoopStep; roundIndex: number }>({ loopStep: 'rl', roundIndex: 1 });
  useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; } const render = () => { draw(ctx, state.loopStep, state.roundIndex); canvas.classList.add('is-ready'); }; const disconnect = observeCanvas(canvas, render, () => {}); render(); return disconnect; }, [state]);
  const advance = () => setState(current => { const i = order.indexOf(current.loopStep); return i === 2 ? { loopStep: 'rl', roundIndex: current.roundIndex + 1 } : { ...current, loopStep: order[i + 1] }; });
  const chooseStage = (target: LoopStep) => {
    const currentIndex = order.indexOf(state.loopStep);
    const targetIndex = order.indexOf(target);
    if (targetIndex === currentIndex) return;
    if (targetIndex === currentIndex + 1) setState(current => ({ ...current, loopStep: target }));
    if (state.loopStep === 'opd' && target === 'rl') setState(current => ({ loopStep: 'rl', roundIndex: current.roundIndex + 1 }));
  };
  const chooseFromCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * W / rect.width;
    const target = x < 84 ? 'rl' : x < 160 ? 'rft' : 'opd';
    chooseStage(target);
  };
  return <div onKeyDown={(e) => { if (e.key === 'ArrowRight') advance(); if (e.key === 'Home') setState({ loopStep: 'rl', roundIndex: 1 }); }}>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onPointerDown={chooseFromCanvas} role="img" aria-label={`后训练循环第 ${state.roundIndex} 轮，当前阶段 ${meta[state.loopStep].label}：${meta[state.loopStep].detail}`} />
    <ol className="chip-row" aria-label="后训练阶段" style={{ listStyle: 'none' }}>{order.map(s => { const current = order.indexOf(state.loopStep); const target = order.indexOf(s); const reachable = target === current || target === current + 1 || (state.loopStep === 'opd' && s === 'rl'); return <li key={s}><button className={`chip ${state.loopStep === s ? 'selected' : ''}`} aria-current={state.loopStep === s ? 'step' : undefined} disabled={!reachable} aria-describedby={!reachable ? 'posttrain-order-hint' : undefined} onClick={() => chooseStage(s)}>{meta[s].label}</button></li>; })}</ol>
    <p id="posttrain-order-hint" className="step-desc">阶段必须依次推进；尚不可达的阶段已禁用。</p>
    <div className="step-ctrl"><button className="tiny" onClick={advance}>推进一步</button><button className="chip" onClick={() => setState({ loopStep: 'rl', roundIndex: 1 })}>重新开始</button><span className="step-label">第 <b>{state.roundIndex}</b> 轮</span></div>
    <div className="feedback good" aria-live="polite">{meta[state.loopStep].feedback}</div>
    <div className="feedback">{meta[state.loopStep].detail}</div>
  </div>;
};

export default PosttrainLoop;
