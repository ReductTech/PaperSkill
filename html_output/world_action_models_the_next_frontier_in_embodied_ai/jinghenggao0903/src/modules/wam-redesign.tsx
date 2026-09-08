import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 300;
const ink = '#102442';
const muted = '#69778a';
const line = '#cbd5e1';
const future = '#6d5bd0';
const action = '#df7135';
const teal = '#16856b';
const danger = '#c43f52';
const scene = '#f7f9fc';
const paper = '#ffffff';

type Option = { label: string; value: number };

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke = 'transparent', strokeWidth = 1) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke !== 'transparent') { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); }
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 14, color = ink, align: CanvasTextAlign = 'left', weight = 650) {
  const readableSize = size <= 10.5 ? size + 1.5 : size <= 12.5 ? size + 1.25 : size + 0.75;
  ctx.fillStyle = color; ctx.font = `${weight} ${readableSize}px "Segoe UI", "Microsoft YaHei", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(value, x, y);
}

function node(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, title: string, color: string, subtitle?: string, active = true, height = 64) {
  ctx.save(); ctx.globalAlpha = active ? 1 : 0.34;
  roundedRect(ctx, x, y, width, height, 12, paper, color, active ? 2 : 1);
  text(ctx, title, x + width / 2, y + (subtitle ? 28 : height / 2 + 5), 14, color, 'center', 800);
  if (subtitle) text(ctx, subtitle, x + width / 2, y + 49, 10.5, muted, 'center', 650);
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, alpha = 1, dashed = false) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
  if (dashed) ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9 * Math.cos(angle - 0.44), y2 - 9 * Math.sin(angle - 0.44)); ctx.lineTo(x2 - 9 * Math.cos(angle + 0.44), y2 - 9 * Math.sin(angle + 0.44)); ctx.closePath(); ctx.fill(); ctx.restore();
}

function statusPill(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, color: string) {
  roundedRect(ctx, x, y, width, 30, 15, `${color}16`, `${color}44`); text(ctx, value, x + width / 2, y + 20, 11.5, color, 'center', 800);
}

function useAnimatedCanvas(draw: (ctx: CanvasRenderingContext2D, phase: number) => void, running = true, refresh: number | string = 0) {
  const ref = useRef<HTMLCanvasElement>(null); const drawRef = useRef(draw); drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H); canvas.classList.add('is-ready');
    let frame = 0; let visible = false; let started = performance.now();
    const render = (now: number) => { if (!visible) return; const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; const elapsed = Math.max(0, now - started); const phase = reduced ? 0.68 : (elapsed % 5600) / 5600; ctx.clearRect(0, 0, W, H); drawRef.current(ctx, phase); if (running && !reduced) frame = requestAnimationFrame(render); };
    const start = () => { visible = true; started = performance.now(); cancelAnimationFrame(frame); render(started); };
    const stop = () => { visible = false; cancelAnimationFrame(frame); };
    const disconnect = observeCanvas(canvas, start, stop);
    if (!running) { visible = true; render(performance.now()); }
    return () => { stop(); disconnect(); };
  }, [refresh, running]);
  return ref;
}

function MotionOptions({ label, options, value, onChange }: { label: string; options: Option[]; value: number; onChange: (next: number) => void }) {
  return <div className="motion-options" role="group" aria-label={label}>{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

function CanvasShell({ children, label, running, onToggle, controls, feedback }: { children: React.ReactNode; label?: string; running?: boolean; onToggle?: () => void; controls?: React.ReactNode; feedback?: React.ReactNode }) {
  return <div className="motion-shell"><div className="canvas-frame">{children}</div><span className="canvas-scroll-hint" aria-hidden="true">左右滑动查看完整图</span>{controls}{onToggle ? <button className="motion-toggle" type="button" aria-pressed={!running} onClick={onToggle}>{running ? '暂停动画 Ⅱ' : '继续动画 ▶'}</button> : null}{label ? <span className="motion-label">{label}</span> : null}{feedback ? <p className="motion-feedback">{feedback}</p> : null}</div>;
}

function drawArm(ctx: CanvasRenderingContext2D, baseX: number, baseY: number, gripX: number, gripY: number, color: string) {
  const elbowX = baseX + (gripX - baseX) * 0.48; const elbowY = Math.max(92, Math.min(baseY - 48, gripY - 28));
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(baseX, baseY - 10); ctx.lineTo(elbowX, elbowY); ctx.lineTo(gripX - 12, gripY); ctx.stroke();
  ctx.fillStyle = paper; ctx.strokeStyle = color; ctx.lineWidth = 3;
  [[baseX, baseY - 10, 10], [elbowX, elbowY, 8]].forEach(([x, y, radius]) => { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  roundedRect(ctx, baseX - 20, baseY, 40, 12, 5, color); ctx.restore();
}

function drawGlass(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  ctx.fillStyle = 'rgba(109, 91, 208, 0.13)'; ctx.strokeStyle = future; ctx.lineWidth = 2; ctx.fillRect(x, groundY - 112, 46, 112); ctx.strokeRect(x + 0.5, groundY - 111.5, 45, 111);
}

function drawBasket(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  ctx.fillStyle = '#e7eff9'; ctx.strokeStyle = '#3563a8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 24, groundY - 43); ctx.lineTo(x + 24, groundY - 43); ctx.lineTo(x + 17, groundY); ctx.lineTo(x - 17, groundY); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawTaskPanel(ctx: CanvasRenderingContext2D, x: number, predictive: boolean, phase: number) {
  const width = 326; const groundY = 228; const startX = x + 78; const startY = 190; const glassX = x + 176; const basketX = x + 282; const progress = easeInOutQuad(clamp(phase / 0.82, 0, 1));
  roundedRect(ctx, x, 42, width, 218, 16, paper, predictive ? '#9ed3c3' : '#e7b1ba');
  statusPill(ctx, predictive ? '先预见，再行动' : '看到目标，直接行动', x + 61, 50, 204, predictive ? teal : danger);
  ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 22, groundY); ctx.lineTo(x + width - 22, groundY); ctx.stroke();
  let ballX = startX; let ballY = startY;
  ctx.save(); ctx.strokeStyle = predictive ? teal : danger; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(startX, startY);
  if (predictive) {
    const c1x = x + 134; const c1y = 72; const c2x = x + 248; const c2y = 38; const endX = basketX; const endY = groundY - 52; ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endX, endY); const u = 1 - progress;
    ballX = u*u*u*startX + 3*u*u*progress*c1x + 3*u*progress*progress*c2x + progress*progress*progress*endX;
    ballY = u*u*u*startY + 3*u*u*progress*c1y + 3*u*progress*progress*c2y + progress*progress*progress*endY;
  } else { const endX = glassX - 14; ctx.lineTo(endX, startY); ballX = lerp(startX, endX, progress); }
  ctx.stroke(); ctx.restore(); drawArm(ctx, x + 43, groundY, ballX, ballY, predictive ? teal : '#8a9bb2'); drawGlass(ctx, glassX, groundY); drawBasket(ctx, basketX, groundY); text(ctx, '玻璃障碍', glassX + 23, groundY + 18, 10, future, 'center', 750);
  ctx.fillStyle = danger; ctx.beginPath(); ctx.arc(ballX, ballY, 10, 0, Math.PI * 2); ctx.fill();
  if (!predictive && progress > 0.94) { ctx.strokeStyle = danger; ctx.lineWidth = 2; for (let i = 0; i < 4; i += 1) { const angle = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(ballX + Math.cos(angle) * 14, ballY + Math.sin(angle) * 14); ctx.lineTo(ballX + Math.cos(angle) * 22, ballY + Math.sin(angle) * 22); ctx.stroke(); } }
  text(ctx, predictive ? '路径避开障碍，球进入篮子' : '路径穿过障碍，球被挡住', x + width / 2, 282, 12, predictive ? teal : danger, 'center', 800);
}

export function ForesightAnimation(_: WidgetProps) {
  const [running, setRunning] = useState(true); const ref = useAnimatedCanvas((ctx, phase) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); drawTaskPanel(ctx, 20, false, phase); drawTaskPanel(ctx, 374, true, phase); }, running);
  return <CanvasShell label="同一目标 · 两种决策" running={running} onToggle={() => setRunning((value) => !value)}><canvas ref={ref} aria-label="直接反应与预见后行动的机械臂对比动画" /></CanvasShell>;
}

export function ConceptFlowAnimation(_: WidgetProps) {
  const [running, setRunning] = useState(true); const ref = useAnimatedCanvas((ctx, phase) => {
    ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H);
    const rows = [{ y: 32, name: 'VLA', input: '观察 + 目标', output: '动作', color: action }, { y: 118, name: '世界模型', input: '观察 + 候选动作', output: '未来', color: future }, { y: 204, name: 'WAM', input: '观察 + 目标', output: '未来 ↔ 动作', color: teal }];
    rows.forEach((row, index) => { roundedRect(ctx, 24, row.y, 672, 66, 14, paper, index === 2 ? '#9ed3c3' : '#dbe3ec'); text(ctx, row.name, 52, row.y + 39, 14, row.color, 'left', 850); node(ctx, 154, row.y + 11, 174, row.input, ink, undefined, true, 44); arrow(ctx, 338, row.y + 33, 414, row.y + 33, row.color); node(ctx, 424, row.y + 11, 214, row.output, row.color, undefined, true, 44); const pulse = 346 + ((phase + index * 0.22) % 1) * 58; ctx.fillStyle = row.color; ctx.beginPath(); ctx.arc(pulse, row.y + 33, 5, 0, Math.PI * 2); ctx.fill(); });
  }, running);
  return <CanvasShell label="比较三条信息流" running={running} onToggle={() => setRunning((value) => !value)}><canvas ref={ref} aria-label="VLA、世界模型与 WAM 信息流动画" /></CanvasShell>;
}

const boundaryCandidates = [
  { name: 'VLA', futureState: 'no', coupled: 'no', verdict: '直接建模 p(a|o,l)，不要求未来状态建模目标。' },
  { name: '世界模型', futureState: 'yes', coupled: 'no', verdict: '建模 p(o′|o,a)，但不负责从观察与指令生成动作。' },
  { name: '视频生成骨干策略', futureState: 'maybe', coupled: 'maybe', verdict: '使用视频生成骨干；是否预测未来、是否让未来参与动作生成，取决于具体方法。' },
  { name: 'WAM', futureState: 'yes', coupled: 'yes', verdict: '具有未来状态建模目标，并与动作生成明确耦合。' },
];

export function BoundaryMapAnimation(_: WidgetProps) {
  const [value, setValue] = useState(0); const current = boundaryCandidates[value];
  const ref = useAnimatedCanvas((ctx) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); text(ctx, current.name, 360, 43, 21, ink, 'center', 850); const gates = [{ x: 56, label: '产生/使用未来状态表示', state: current.futureState }, { x: 394, label: '动作与未来状态耦合', state: current.coupled }]; gates.forEach((gate, index) => { const passed = gate.state === 'yes'; const uncertain = gate.state === 'maybe'; const color = passed ? teal : uncertain ? action : danger; const fill = passed ? '#eaf7f2' : uncertain ? '#fff4e9' : '#fdf0f2'; roundedRect(ctx, gate.x, 76, 270, 112, 14, fill, color, 2); text(ctx, `条件 ${index + 1}`, gate.x + 24, 105, 10.5, muted, 'left', 800); text(ctx, gate.label, gate.x + 135, 139, 14, ink, 'center', 800); text(ctx, passed ? '✓ 满足' : uncertain ? '? 不一定' : '× 不满足', gate.x + 135, 170, 13, color, 'center', 850); }); roundedRect(ctx, 74, 216, 572, 52, 12, paper, current.name === 'WAM' ? '#9ed3c3' : line); text(ctx, current.verdict, 360, 248, 13, current.name === 'WAM' ? teal : ink, 'center', 750); }, false, value);
  return <CanvasShell controls={<label className="motion-slider"><span>VLA</span><input aria-label="选择候选系统" type="range" min="0" max="3" step="1" value={value} onChange={(event) => setValue(Number(event.target.value))} /><span>WAM</span></label>}><canvas ref={ref} aria-label="WAM 概念边界的两个必要条件" /></CanvasShell>;
}

export function ConvergenceAnimation(_: WidgetProps) {
  const progressRef = useRef(0); const draggingRef = useRef(false); const [connected, setConnected] = useState(false); const [dragging, setDragging] = useState(false);
  const setConnection = (next: boolean) => { progressRef.current = next ? 1 : 0; setConnected(next); };
  const ref = useAnimatedCanvas((ctx, phase) => {
    const progress = easeInOutQuad(progressRef.current); const coupled = progress > 0.72; const moduleX = lerp(86, 265, progress); const moduleY = lerp(176, 58, progress); ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H);
    node(ctx, 28, 58, 160, '观察 + 目标', ink); ctx.save(); ctx.setLineDash([7, 7]); roundedRect(ctx, 265, 58, 190, 64, 12, '#f4f1ff', future, 2); ctx.restore(); if (!coupled) text(ctx, '预测接口', 360, 96, 13, muted, 'center', 750); node(ctx, 532, 58, 160, '动作选择', action);
    if (!coupled) { arrow(ctx, 198, 90, 522, 90, action, 0.9); text(ctx, '动作旁路', 360, 44, 11, danger, 'center', 800); } else { arrow(ctx, 198, 90, 255, 90, future); arrow(ctx, 465, 90, 522, 90, teal); text(ctx, '预测进入控制回路', 360, 44, 11, teal, 'center', 800); }
    ctx.save(); ctx.shadowColor = 'rgba(109, 91, 208, 0.2)'; ctx.shadowBlur = 14; roundedRect(ctx, moduleX, moduleY, 190, 64, 12, paper, future, 2.5); ctx.shadowBlur = 0; text(ctx, '未来预测', moduleX + 95, moduleY + 26, 14, future, 'center', 850); text(ctx, '直行会碰撞 · 绕行能成功', moduleX + 95, moduleY + 49, 10.5, ink, 'center', 700); ctx.restore();
    const groundY = 267; const startX = 396; const glassX = 520; const basketX = 656; ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(350, groundY); ctx.lineTo(692, groundY); ctx.stroke(); drawGlass(ctx, glassX, groundY); drawBasket(ctx, basketX, groundY); text(ctx, '玻璃障碍', glassX + 23, groundY + 18, 10, future, 'center', 750); const travel = easeInOutQuad(clamp(phase / 0.8, 0, 1)); let ballX = startX; let ballY = groundY - 34; ctx.strokeStyle = coupled ? teal : danger; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(startX, ballY);
    if (coupled) { const c1x = 460; const c1y = 104; const c2x = 600; const c2y = 106; const endY = groundY - 53; ctx.bezierCurveTo(c1x, c1y, c2x, c2y, basketX, endY); const u = 1 - travel; ballX = u*u*u*startX + 3*u*u*travel*c1x + 3*u*travel*travel*c2x + travel*travel*travel*basketX; ballY = u*u*u*ballY + 3*u*u*travel*c1y + 3*u*travel*travel*c2y + travel*travel*travel*endY; } else { const endX = glassX - 13; ctx.lineTo(endX, ballY); ballX = lerp(startX, endX, travel); }
    ctx.stroke(); drawArm(ctx, 372, groundY, ballX, ballY, coupled ? teal : '#8a9bb2'); ctx.fillStyle = danger; ctx.beginPath(); ctx.arc(ballX, ballY, 9, 0, Math.PI * 2); ctx.fill();
  }, true, connected ? 'connected' : 'disconnected');
  const pointerProgress = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); const logicalY = (event.clientY - rect.top) * (H / rect.height); return clamp((226 - logicalY) / 154, 0, 1); };
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); const logicalX = (event.clientX - rect.left) * (W / rect.width); const logicalY = (event.clientY - rect.top) * (H / rect.height); const progress = easeInOutQuad(progressRef.current); const currentX = lerp(86, 265, progress); const currentY = lerp(176, 58, progress); if (logicalX < currentX - 16 || logicalX > currentX + 206 || logicalY < currentY - 16 || logicalY > currentY + 80) return; draggingRef.current = true; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); };
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!draggingRef.current) return; progressRef.current = pointerProgress(event); };
  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!draggingRef.current) return; setConnection(progressRef.current >= 0.62); draggingRef.current = false; setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => { if (!['Enter', ' ', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? false : event.key === 'ArrowUp' || event.key === 'ArrowRight' ? true : !connected; setConnection(next); };
  return <div className="motion-shell"><div className="canvas-frame"><canvas ref={ref} className={dragging ? 'is-ready is-dragging' : 'is-ready'} role="switch" tabIndex={0} aria-checked={connected} aria-label="将未来预测接入动作回路" aria-describedby="wam-coupling-instruction" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointer} onPointerCancel={finishPointer} onKeyDown={handleKeyDown} /></div><span className="canvas-scroll-hint" aria-hidden="true">左右滑动查看完整图</span><p className="motion-drag-status" id="wam-coupling-instruction" data-connected={connected}><span>{connected ? '已经接入控制回路' : '把“未来预测”拖到上方预测接口'}</span><strong>{connected ? '未来正在改变动作' : '预测与动作仍然分离'}</strong></p></div>;
}

function drawCascadeEndpoint(ctx: CanvasRenderingContext2D, x: number, title: string, subtitle: string, color: string) {
  roundedRect(ctx, x, 92, 148, 88, 14, paper, color, 2);
  text(ctx, title, x + 74, 126, 14, color, 'center', 850);
  text(ctx, subtitle, x + 74, 151, 10.5, muted, 'center', 650);
}

function drawFutureFrame(ctx: CanvasRenderingContext2D, x: number, y: number, stage: number, active: boolean) {
  roundedRect(ctx, x, y, 66, 58, 8, active ? '#f4f1ff' : paper, active ? future : '#cbd5e1', active ? 2.5 : 1);
  ctx.strokeStyle = '#aab6c7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 7, y + 45); ctx.lineTo(x + 59, y + 45); ctx.stroke();
  ctx.fillStyle = 'rgba(109, 91, 208, 0.12)'; ctx.strokeStyle = future; ctx.lineWidth = 1.2; ctx.fillRect(x + 31, y + 18, 9, 27); ctx.strokeRect(x + 31.5, y + 18.5, 8, 26);
  ctx.strokeStyle = '#3563a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 51, y + 34); ctx.lineTo(x + 61, y + 34); ctx.lineTo(x + 59, y + 45); ctx.lineTo(x + 53, y + 45); ctx.closePath(); ctx.stroke();
  const positions = [{ x: 15, y: 38 }, { x: 34, y: 10 }, { x: 56, y: 31 }]; const ball = positions[stage]; ctx.fillStyle = action; ctx.beginPath(); ctx.arc(x + ball.x, y + ball.y, 4.5, 0, Math.PI * 2); ctx.fill();
  text(ctx, `0${stage + 1}`, x + 9, y + 13, 8.5, active ? future : muted, 'left', 800);
}

function drawExplicitFuture(ctx: CanvasRenderingContext2D, phase: number) {
  roundedRect(ctx, 206, 52, 308, 174, 16, '#ffffff', future, 2.5);
  text(ctx, '可直接观看的未来', 360, 80, 16, future, 'center', 850);
  text(ctx, '系统生成连续场景帧', 360, 100, 10.5, muted, 'center', 650);
  const activeFrame = Math.min(2, Math.floor((phase * 3) % 3));
  for (let index = 0; index < 3; index += 1) drawFutureFrame(ctx, 246 + index * 78, 118, index, index === activeFrame);
  text(ctx, '能逐帧检查：球是否碰撞、轨迹是否合理', 360, 210, 10.5, future, 'center', 750);
}

function drawHiddenEye(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.strokeStyle = '#d9e2f2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x, y - 12, x + 14, y); ctx.quadraticCurveTo(x, y + 12, x - 14, y); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = action; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 16, y - 14); ctx.lineTo(x + 16, y + 14); ctx.stroke(); ctx.restore();
}

function drawImplicitFuture(ctx: CanvasRenderingContext2D, phase: number) {
  roundedRect(ctx, 206, 52, 308, 174, 16, '#17233f', future, 2.5);
  text(ctx, '未来被压缩为潜变量', 360, 80, 16, paper, 'center', 850);
  text(ctx, '没有可以直接播放的场景画面', 360, 101, 10.5, '#aebbd0', 'center', 650);
  roundedRect(ctx, 242, 118, 236, 62, 12, '#0f1930', '#8f7ee7', 1.5);
  drawHiddenEye(ctx, 271, 149);
  const bars = [16, 29, 21, 35, 25, 14, 31]; bars.forEach((height, index) => { const pulse = (index + Math.floor(phase * 7)) % 7 === 0; roundedRect(ctx, 306 + index * 20, 165 - height, 8, height, 4, pulse ? action : '#9b8cec'); });
  text(ctx, 'z_future', 458, 174, 9.5, '#d9e2f2', 'right', 800);
  text(ctx, '只能通过解码器或动作结果间接验证', 360, 210, 10.5, '#d9e2f2', 'center', 750);
}

export function CascadeAnimation(_: WidgetProps) {
  const [mode, setMode] = useState(0); const ref = useAnimatedCanvas((ctx, phase) => {
    ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H);
    text(ctx, mode === 0 ? '阶段 1 · 生成可见未来' : '阶段 1 · 编码隐藏未来', 360, 34, 10.5, mode === 0 ? future : ink, 'center', 800);
    drawCascadeEndpoint(ctx, 26, '观察 + 目标', '当前场景与任务', ink);
    drawCascadeEndpoint(ctx, 546, '提取动作', mode === 0 ? '从未来画面得到控制' : '从潜变量读出控制', action);
    arrow(ctx, 184, 136, 196, 136, future); arrow(ctx, 524, 136, 536, 136, action);
    if (mode === 0) drawExplicitFuture(ctx, phase); else drawImplicitFuture(ctx, phase);
    roundedRect(ctx, 82, 246, 556, 36, 18, paper, mode === 0 ? '#c9bff5' : '#8190aa');
    text(ctx, mode === 0 ? '显式：未来是可观察的画面序列，错误位置可以直接定位' : '隐式：未来存在于内部表征中，紧凑但不可直接解释', 360, 269, 11.5, mode === 0 ? future : ink, 'center', 760);
  }, true, mode);
  return <CanvasShell controls={<MotionOptions label="选择级联式未来表示" value={mode} onChange={setMode} options={[{ label: '显式未来 · 看得见', value: 0 }, { label: '隐式未来 · 看不见', value: 1 }]} />}><canvas ref={ref} aria-label="级联式世界动作模型的显式与隐式未来" /></CanvasShell>;
}

export function JointAnimation(_: WidgetProps) {
  const [mode, setMode] = useState(0); const ref = useAnimatedCanvas((ctx) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); node(ctx, 34, 112, 150, '共同条件', ink, '观察 + 目标'); if (mode === 0) { node(ctx, 274, 46, 180, '世界流', future, '预测未来'); node(ctx, 274, 176, 180, '动作流', action, '生成控制'); arrow(ctx, 194, 144, 264, 78, future); arrow(ctx, 194, 144, 264, 208, action); arrow(ctx, 364, 120, 364, 166, teal); arrow(ctx, 374, 166, 374, 120, teal); node(ctx, 536, 112, 150, '一致输出', teal, '两条流相互校正'); arrow(ctx, 464, 78, 526, 132, future); arrow(ctx, 464, 208, 526, 156, action); } else { arrow(ctx, 194, 144, 248, 144, teal); roundedRect(ctx, 258, 78, 238, 132, 16, '#eef8f4', teal, 2.5); text(ctx, '共享生成空间', 377, 121, 17, teal, 'center', 850); statusPill(ctx, '未来 + 动作', 307, 145, 140, teal); node(ctx, 536, 112, 150, '共同输出', teal, '一次生成'); arrow(ctx, 506, 144, 526, 144, teal); } roundedRect(ctx, 92, 244, 536, 34, 17, paper, line); text(ctx, mode === 0 ? '多流：保留各自计算路径，再交换信息' : '统一流：在同一表示空间共同建模', 360, 266, 12, mode === 0 ? future : teal, 'center', 800); }, false, mode);
  return <CanvasShell controls={<MotionOptions label="选择联合式计算结构" value={mode} onChange={setMode} options={[{ label: '多流交换', value: 0 }, { label: '统一生成', value: 1 }]} />}><canvas ref={ref} aria-label="联合式世界动作模型的多流与统一流" /></CanvasShell>;
}

const dataSources = [
  { name: '机器人遥操作', traits: [{ label: '动作监督', value: '原生机器人动作', color: action }, { label: '规模特征', value: '依赖人工采集，成本较高', color: future }, { label: '场景覆盖', value: '真实，但受机器人平台与场地限制', color: teal }, { label: '主要落差', value: '采集成本与硬件覆盖', color: danger }], note: '优势是动作与机器人直接对齐；短板主要来自采集成本，而非能力分数。' },
  { name: '便携式人类示范', traits: [{ label: '动作监督', value: '需要重定向为机器人动作', color: action }, { label: '规模特征', value: '比固定机器人采集更灵活', color: future }, { label: '场景覆盖', value: '可进入更多真实环境', color: teal }, { label: '主要落差', value: '人与机器人的身体差异', color: danger }], note: '它拓宽真实场景，但“人怎么做”不能直接等同于“机器人怎么动”。' },
  { name: '仿真数据', traits: [{ label: '动作监督', value: '精确、可控的合成动作', color: action }, { label: '规模特征', value: '可自动生成与重复采样', color: future }, { label: '场景覆盖', value: '由仿真资产和物理设定决定', color: teal }, { label: '主要落差', value: 'Sim-to-Real 迁移', color: danger }], note: '规模和可控性突出，但真实价值取决于仿真与现实的差距。' },
  { name: '人类视频', traits: [{ label: '动作监督', value: '通常没有机器人动作标签', color: action }, { label: '规模特征', value: '可利用互联网级视频', color: future }, { label: '场景覆盖', value: '开放世界与长尾行为丰富', color: teal }, { label: '主要落差', value: '从视频理解落到机器人控制', color: danger }], note: '它提供广泛的世界知识，却不能单独解决机器人的可执行控制。' },
];

export function DataLandscapeAnimation(_: WidgetProps) {
  const [value, setValue] = useState(0); const current = dataSources[value]; const ref = useAnimatedCanvas((ctx) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); text(ctx, current.name, 360, 42, 20, ink, 'center', 850); current.traits.forEach((trait, index) => { const y = 70 + index * 43; text(ctx, trait.label, 146, y + 21, 11.5, muted, 'right', 750); roundedRect(ctx, 166, y, 430, 30, 9, `${trait.color}10`, `${trait.color}55`); ctx.fillStyle = trait.color; ctx.beginPath(); ctx.arc(185, y + 15, 4, 0, Math.PI * 2); ctx.fill(); text(ctx, trait.value, 201, y + 20, 11.5, ink, 'left', 720); }); roundedRect(ctx, 74, 250, 572, 36, 18, paper, line); text(ctx, current.note, 360, 273, 10.8, ink, 'center', 700); }, false, value);
  return <CanvasShell controls={<MotionOptions label="选择训练数据来源" value={value} onChange={setValue} options={dataSources.map((item, index) => ({ label: item.name, value: index }))} />}><canvas ref={ref} aria-label="四类 WAM 训练数据的能力权衡" /></CanvasShell>;
}

export function TransferAnimation(_: WidgetProps) {
  const [running, setRunning] = useState(true); const ref = useAnimatedCanvas((ctx, phase) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); const stages = [{ x: 36, title: '观看人类视频', subtitle: '学习物体如何变化', color: future }, { x: 286, title: '身体与动作校准', subtitle: '映射到机器人控制', color: teal }, { x: 536, title: '机器人执行', subtitle: '在真实约束下行动', color: action }]; stages.forEach((stage, index) => { const activeStage = Math.min(2, Math.floor(phase * 3)); roundedRect(ctx, stage.x, 68, 148, 128, 16, paper, index === activeStage ? stage.color : line, index === activeStage ? 3 : 1); statusPill(ctx, `0${index + 1}`, stage.x + 49, 82, 50, stage.color); text(ctx, stage.title, stage.x + 74, 139, 14, stage.color, 'center', 850); text(ctx, stage.subtitle, stage.x + 74, 168, 10.5, muted, 'center', 650); if (index < stages.length - 1) arrow(ctx, stage.x + 158, 132, stage.x + 240, 132, index === 0 ? future : action); }); const segmentProgress = (phase * 2) % 1; const segment = Math.min(1, Math.floor(phase * 2)); const startX = segment === 0 ? 194 : 444; const endX = segment === 0 ? 276 : 526; const tokenX = lerp(startX, endX, easeInOutQuad(segmentProgress)); ctx.fillStyle = segment === 0 ? future : action; ctx.beginPath(); ctx.arc(tokenX, 132, 7, 0, Math.PI * 2); ctx.fill(); statusPill(ctx, phase < 0.34 ? '先学世界如何变化' : phase < 0.68 ? '再做跨身体校准' : '最后落到可执行动作', 214, 232, 292, phase < 0.34 ? future : phase < 0.68 ? teal : action); }, running);
  return <CanvasShell label="跨身体迁移" running={running} onToggle={() => setRunning((value) => !value)}><canvas ref={ref} aria-label="知识从人类视频迁移到机器人动作的动画" /></CanvasShell>;
}

const evaluationSteps = [
  { name: '视觉保真', color: '#8296ae', note: '检查画面质量与时间一致性，属于世界建模评价。' },
  { name: '物理常识', color: future, note: '检查物体连续性、接触、运动与物理约束。' },
  { name: '动作可推断', color: action, note: '检查预测是否保留足够信息，可恢复可执行控制。' },
  { name: '策略任务表现', color: teal, note: '另一条评价轴：动作是否精准、稳健并完成任务。' },
];

export function EvaluationAnimation(_: WidgetProps) {
  const [value, setValue] = useState(1); const ref = useAnimatedCanvas((ctx) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); text(ctx, '当前评估分成两条轴，尚无统一总分', 360, 40, 17, ink, 'center', 850); text(ctx, '世界建模能力', 281, 76, 11.5, future, 'center', 850); text(ctx, '动作策略能力', 611, 76, 11.5, teal, 'center', 850); ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(526, 72); ctx.lineTo(526, 205); ctx.stroke(); ctx.restore(); evaluationSteps.forEach((step, index) => { const x = 26 + index * 170; const reached = index <= value; const selected = index === value; roundedRect(ctx, x, 92, 150, 104, 14, reached ? `${step.color}14` : paper, reached ? step.color : line, selected ? 3 : 1); statusPill(ctx, `0${index + 1}`, x + 50, 108, 50, reached ? step.color : muted); text(ctx, step.name, x + 75, 166, 14, reached ? step.color : muted, 'center', 850); if (index < 2) arrow(ctx, x + 156, 144, x + 164, 144, reached && index < value ? evaluationSteps[index + 1].color : line, reached ? 1 : 0.45); }); roundedRect(ctx, 74, 232, 572, 44, 12, paper, evaluationSteps[value].color); text(ctx, evaluationSteps[value].note, 360, 259, 12.5, evaluationSteps[value].color, 'center', 800); }, false, value);
  return <CanvasShell controls={<label className="motion-slider"><span>世界建模</span><input aria-label="扩展评价范围" type="range" min="0" max="3" step="1" value={value} onChange={(event) => setValue(Number(event.target.value))} /><span>策略表现</span></label>}><canvas ref={ref} aria-label="世界建模与动作策略的两轴评价" /></CanvasShell>;
}

const couplingModes = [
  { title: '分开评价', world: '世界预测指标', actionText: '策略成功率', bridge: '彼此独立', note: '两个分数都高，也不能证明动作使用了预测。' },
  { title: '联合观察', world: '预测未来', actionText: '输出动作', bridge: '同场比较', note: '能看见相关性，但仍可能存在绕过预测的策略旁路。' },
  { title: '反事实一致性（候选）', world: '改变动作 → 未来改变', actionText: '未来变化 → 动作调整', bridge: '同一干预', note: '论文提出的候选方向：检验两侧是否对同一变化一致响应。' },
];

export function CouplingGapAnimation(_: WidgetProps) {
  const [value, setValue] = useState(0); const current = couplingModes[value]; const ref = useAnimatedCanvas((ctx) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); text(ctx, current.title, 360, 44, 20, value === 2 ? teal : ink, 'center', 850); node(ctx, 46, 96, 232, current.world, future, '检查世界预测'); node(ctx, 442, 96, 232, current.actionText, action, '检查动作结果'); const connected = value > 0; arrow(ctx, 290, 128, 430, 128, connected ? teal : danger, 1, !connected); statusPill(ctx, current.bridge, 306, 154, 108, connected ? teal : danger); roundedRect(ctx, 78, 226, 564, 48, 12, paper, value === 2 ? teal : line); text(ctx, current.note, 360, 256, 12.5, value === 2 ? teal : ink, 'center', 750); }, false, value);
  return <CanvasShell controls={<MotionOptions label="选择联合评价方式" value={value} onChange={setValue} options={couplingModes.map((item, index) => ({ label: item.title, value: index }))} />}><canvas ref={ref} aria-label="世界预测与动作策略的联合评价缺口" /></CanvasShell>;
}

const challengeItems = [
  { name: '物理状态表示', short: '表示', note: 'RGB 看不见触觉、力、接触和本体感觉，未来状态需要走向多模态。' },
  { name: '架构耦合', short: '耦合', note: '仍缺少统一条件下的系统比较，不清楚怎样的未来—动作耦合最有效。' },
  { name: '数据迁移', short: '数据', note: '不同数据能提供什么知识、哪些知识能跨身体迁移，仍没有通用答案。' },
  { name: '长时域与效率', short: '效率', note: '预测越长，漂移、延迟和计算成本越明显。' },
  { name: '评价与安全', short: '评价/安全', note: '联合评价尚未建立；错误但自信的未来还会放大真实执行风险。' },
];

export function ChallengeMapAnimation(_: WidgetProps) {
  const [value, setValue] = useState(0); const current = challengeItems[value]; const ref = useAnimatedCanvas((ctx) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); const positions = [{ x: 34, y: 42 }, { x: 285, y: 24 }, { x: 536, y: 42 }, { x: 34, y: 208 }, { x: 536, y: 208 }]; const centerX = 360; const centerY = 154; positions.forEach((position, index) => { const nodeCenterX = position.x + 75; const nodeCenterY = position.y + 28; ctx.strokeStyle = index === value ? future : line; ctx.lineWidth = index === value ? 3 : 1.5; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(nodeCenterX, nodeCenterY); ctx.stroke(); }); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(centerX, centerY, 49, 0, Math.PI * 2); ctx.fill(); text(ctx, '可靠行动', centerX, centerY + 5, 14, paper, 'center', 850); positions.forEach((position, index) => { const selected = index === value; roundedRect(ctx, position.x, position.y, 150, 56, 12, selected ? '#f2efff' : paper, selected ? future : line, selected ? 3 : 1); text(ctx, challengeItems[index].name, position.x + 75, position.y + 34, 11.5, selected ? future : muted, 'center', selected ? 850 : 700); }); }, false, value);
  return <CanvasShell controls={<MotionOptions label="选择开放挑战" value={value} onChange={setValue} options={challengeItems.map((item, index) => ({ label: item.short, value: index }))} />} feedback={current.note}><canvas ref={ref} aria-label="WAM 开放挑战研究地图" /></CanvasShell>;
}

export function EssenceAnimation(_: WidgetProps) {
  const [running, setRunning] = useState(true); const ref = useAnimatedCanvas((ctx, phase) => { ctx.fillStyle = scene; ctx.fillRect(0, 0, W, H); const stages = [{ x: 24, title: '理解现在', color: ink }, { x: 199, title: '预见后果', color: future }, { x: 374, title: '选择动作', color: action }, { x: 549, title: '结果校正', color: teal }]; const segment = Math.min(3, Math.floor(phase * 4)); const local = easeInOutQuad((phase * 4) % 1); stages.forEach((stage, index) => { roundedRect(ctx, stage.x, 92, 146, 96, 16, paper, index === segment ? stage.color : line, index === segment ? 3 : 1); statusPill(ctx, `0${index + 1}`, stage.x + 48, 106, 50, stage.color); text(ctx, stage.title, stage.x + 73, 164, 14, stage.color, 'center', 850); if (index < stages.length - 1) arrow(ctx, stage.x + 152, 140, stage.x + 169, 140, stages[index + 1].color); }); ctx.save(); ctx.strokeStyle = teal; ctx.lineWidth = 2.5; ctx.setLineDash([7, 7]); ctx.beginPath(); ctx.moveTo(622, 198); ctx.bezierCurveTo(622, 274, 97, 274, 97, 198); ctx.stroke(); ctx.restore(); text(ctx, '真实结果回到下一次预测', 360, 268, 11.5, teal, 'center', 800); let tokenX: number; let tokenY: number; if (segment < 3) { tokenX = lerp(stages[segment].x + 152, stages[segment].x + 169, local); tokenY = 140; } else { const u = 1 - local; tokenX = u*u*u*622 + 3*u*u*local*622 + 3*u*local*local*97 + local*local*local*97; tokenY = u*u*u*198 + 3*u*u*local*274 + 3*u*local*local*274 + local*local*local*198; } ctx.fillStyle = segment === 0 ? future : segment === 1 ? action : teal; ctx.beginPath(); ctx.arc(tokenX, tokenY, 7, 0, Math.PI * 2); ctx.fill(); }, running);
  return <CanvasShell label="预测—行动—校正闭环" running={running} onToggle={() => setRunning((value) => !value)}><canvas ref={ref} aria-label="世界动作模型核心闭环动画" /></CanvasShell>;
}
