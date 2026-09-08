import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f7f3ea', counter: '#dcc9ad', cabinet: '#73826a', navy: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', line: '#d7deea', glass: '#a9c7cf', white: '#fffdf8',
};

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 14) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

function sceneBase(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fbf8f0'); g.addColorStop(1, C.bg);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#eee7da'; ctx.fillRect(0, 0, w, h * .45);
  ctx.strokeStyle = 'rgba(115,130,106,.14)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 38) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h * .45); ctx.stroke(); }
  ctx.fillStyle = C.counter; ctx.fillRect(0, h * .67, w, h * .33);
  ctx.fillStyle = '#b79772'; ctx.fillRect(0, h * .67, w, 5);
}

function robot(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, arm?: { x: number; y: number }, color = C.navy) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(33,50,74,.14)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#f8f5ee'; rounded(ctx, -27, -40, 54, 45, 20); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#172033'; rounded(ctx, -20, -32, 40, 23, 11); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(-8, -21, 3, 5, 0, 0, Math.PI * 2); ctx.ellipse(8, -21, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4f0e8'; rounded(ctx, -31, 8, 62, 66, 18); ctx.fill(); ctx.strokeStyle = '#c9c2b8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = color; rounded(ctx, -16, 59, 32, 6, 3); ctx.fill();
  if (arm) {
    const sx = 24, sy = 23, mx = (sx + arm.x) * .52, my = (sy + arm.y) * .35 - 4;
    ctx.strokeStyle = '#c9c2b8'; ctx.lineWidth = 19; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.lineTo(arm.x, arm.y); ctx.stroke();
    ctx.strokeStyle = '#f7f3ea'; ctx.lineWidth = 14; ctx.stroke();
    ctx.fillStyle = '#48515d'; ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#303946'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(arm.x, arm.y); ctx.lineTo(arm.x + 9, arm.y - 7); ctx.moveTo(arm.x, arm.y); ctx.lineTo(arm.x + 10, arm.y + 6); ctx.stroke();
  }
  ctx.restore();
}

function mug(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, active = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(60,25,20,.18)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 4;
  const g = ctx.createLinearGradient(-15, 0, 16, 0); g.addColorStop(0, '#9e2f36'); g.addColorStop(.55, '#c94b50'); g.addColorStop(1, '#8b2730');
  ctx.fillStyle = g; rounded(ctx, -15, -20, 30, 38, 7); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = active ? C.green : '#7c2630'; ctx.lineWidth = active ? 4 : 3; ctx.beginPath(); ctx.arc(18, -3, 10, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.fillStyle = '#60232a'; ctx.beginPath(); ctx.ellipse(0, -18, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function glass(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, danger = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = .88;
  const g = ctx.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(.5, 'rgba(169,199,207,.55)'); g.addColorStop(1, 'rgba(255,255,255,.72)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-12, -21); ctx.lineTo(-9, 18); ctx.quadraticCurveTo(0, 22, 9, 18); ctx.lineTo(12, -21); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = danger ? C.red : '#7599a4'; ctx.lineWidth = danger ? 4 : 2; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -21, 12, 3, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function dishwasher(ctx: CanvasRenderingContext2D, x: number, y: number, w = 88, h = 76, active = false) {
  ctx.fillStyle = '#d8d8d2'; rounded(ctx, x, y, w, h, 7); ctx.fill(); ctx.strokeStyle = active ? C.green : '#79818b'; ctx.lineWidth = active ? 4 : 2; ctx.stroke();
  ctx.fillStyle = '#313944'; rounded(ctx, x + 8, y + 14, w - 16, h - 22, 4); ctx.fill();
  ctx.strokeStyle = '#9aa1a8'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const yy = y + 27 + i * 8; ctx.beginPath(); ctx.moveTo(x + 13, yy); ctx.lineTo(x + w - 13, yy); ctx.stroke(); }
  ctx.fillStyle = active ? '#dff5e9' : '#e7ebed'; rounded(ctx, x + 13, y + 22, w - 26, 18, 3); ctx.fill();
}

function path(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color: string, dashed = false) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dashed ? [8, 7] : []);
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}

type MiniScene = 'identify' | 'detail' | 'modalities' | 'supervision' | 'latent' | 'execute' | 'frontier' | 'bridge' | 'correct' | 'finish';

function drawMini(ctx: CanvasRenderingContext2D, kind: MiniScene, p: number) {
  sceneBase(ctx, 244, 130); dishwasher(ctx, 160, 18, 72, 66, kind === 'finish');
  const t = easeInOutQuad(Math.min(1, p));
  if (kind === 'detail') {
    mug(ctx, 169, 92, .72, true); robot(ctx, 46, 57, .56, { x: 56, y: -5 });
    ctx.fillStyle = 'rgba(217,119,6,.13)'; ctx.beginPath(); ctx.moveTo(78, 44); ctx.lineTo(162, 66); ctx.lineTo(162, 96); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.navy; ctx.font = '700 12px system-ui'; ctx.fillText('保留杯柄细节', 105, 16); return;
  }
  if (kind === 'modalities') {
    robot(ctx, 112, 61, .56, { x: 58, y: 7 }); mug(ctx, 188, 95, .58, true);
    ctx.fillStyle = '#eaf1f7'; rounded(ctx, 18, 18, 62, 31, 10); ctx.fill(); ctx.fillStyle = C.navy; ctx.font = '700 11px system-ui'; ctx.fillText('视觉：红杯', 25, 38);
    ctx.fillStyle = '#f0ebf8'; rounded(ctx, 153, 18, 75, 31, 10); ctx.fill(); ctx.fillStyle = C.purple; ctx.fillText('语言：上层', 160, 38); return;
  }
  if (kind === 'supervision') {
    mug(ctx, 176, 94, .62, true); robot(ctx, 53, 61, .54, { x: 73, y: 12 });
    [['局部', C.navy, 110], ['整体', C.green, 146], ['语言', C.purple, 182]].forEach(([s, c, x], i) => { ctx.fillStyle = c as string; rounded(ctx, x as number, 20 + i * 8, 38, 20, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 10px system-ui'; ctx.fillText(s as string, (x as number) + 8, 34 + i * 8); }); return;
  }
  if (kind === 'latent') {
    mug(ctx, 174, 95, .65, true); robot(ctx, 51, 61, .54, { x: 78, y: 10 });
    ctx.fillStyle = C.orange; rounded(ctx, 116, 47, 34, 34, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 15px system-ui'; ctx.fillText('zᵥ', 124, 69); path(ctx, [[91, 63], [116, 63]], C.navy); path(ctx, [[150, 63], [170, 77]], C.green); return;
  }
  if (kind === 'frontier') {
    robot(ctx, 46, 60, .55, { x: 78 + 18 * t, y: 8 - 7 * t }); mug(ctx, 165, 95, .62, true); glass(ctx, 128, 97, .62, p < .5);
    ctx.strokeStyle = C.orange; ctx.setLineDash([4, 4]); ctx.strokeRect(116, 57, 64, 54); ctx.setLineDash([]); ctx.fillStyle = C.ink; ctx.font = '700 11px system-ui'; ctx.fillText('刚好可学', 121, 51); return;
  }
  if (kind === 'bridge') {
    mug(ctx, 102 + 42 * t, 74 - 8 * t, .62, true); dishwasher(ctx, 160, 18, 72, 66, true); path(ctx, [[102, 72], [139, 52], [176, 48]], C.green);
    ctx.fillStyle = C.navy; ctx.font = '700 11px system-ui'; ctx.fillText('视觉语义', 16, 28); ctx.fillStyle = C.purple; ctx.fillText('语言指令', 16, 48); return;
  }
  if (kind === 'correct') {
    robot(ctx, 44, 61, .54, { x: 74 + 16 * t, y: 6 }); mug(ctx, 176, 93, .62, true); glass(ctx, 133, 96, .62, false);
    path(ctx, [[88, 66], [122, 40], [168, 65]], C.green); path(ctx, [[88, 66], [133, 82], [168, 65]], C.red, true); ctx.fillStyle = C.ink; ctx.font = '700 11px system-ui'; ctx.fillText('就地纠偏', 100, 23); return;
  }
  if (kind === 'finish') {
    mug(ctx, 192, 48, .48, true); glass(ctx, 118, 98, .62, false); robot(ctx, 44, 61, .54, { x: 88, y: -2 }); ctx.fillStyle = C.green; ctx.font = '800 12px system-ui'; ctx.fillText('安全完成 · 仍需复核', 92, 119); return;
  }
  if (kind === 'execute') {
    const x = 103 + 70 * t, y = 82 - 32 * t; robot(ctx, 42, 61, .54, { x: 58 + 45 * t, y: 6 - 10 * t }); mug(ctx, x, y, .58, true); glass(ctx, 125, 98, .6, false); path(ctx, [[103, 79], [137, 50], [181, 46]], C.green); return;
  }
  mug(ctx, 168, 95, .62, true); glass(ctx, 126, 98, .62, kind === 'identify' && p < .45); robot(ctx, 45, 61, .55, { x: 67 + 24 * t, y: 9 - 5 * t });
  if (kind === 'identify') { ctx.strokeStyle = C.green; ctx.lineWidth = 3; rounded(ctx, 148, 61, 46, 50, 9); ctx.stroke(); }
}

function AnimatedKitchen({ kind, label }: { kind: MiniScene; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 244, 130); } catch { return; }
    let raf = 0, started = performance.now(); const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (now: number) => { const q = reduced ? .82 : ((now - started) % 3200) / 3200; const p = q < .72 ? q / .72 : 1; drawMini(ctx, kind, p); canvas.classList.add('is-ready'); if (!reduced) raf = requestAnimationFrame(tick); };
    const start = () => { if (!raf) { started = performance.now(); raf = requestAnimationFrame(tick); } }; const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, [kind]);
  return <canvas ref={ref} width={244} height={130} role="img" aria-label={label} />;
}

export const AnalogyOne: React.FC<WidgetProps> = () => <AnimatedKitchen kind="identify" label="机器人识别红色马克杯，同时避开旁边的玻璃杯。" />;
export const AnalogyTwo: React.FC<WidgetProps> = () => <AnimatedKitchen kind="detail" label="机器人保留红色马克杯杯柄的细粒度视觉。" />;
export const AnalogyThree: React.FC<WidgetProps> = () => <AnimatedKitchen kind="modalities" label="视觉与语言使用专属路径理解红杯和洗碗机上层指令。" />;
export const Analogy4: React.FC<WidgetProps> = () => <AnimatedKitchen kind="supervision" label="机器人用局部、整体和语言三类训练信号锁定目标杯。" />;
export const Analogy5: React.FC<WidgetProps> = () => <AnimatedKitchen kind="latent" label="视觉潜变量把整幅厨房场景连接到红杯指令。" />;
export const Analogy6: React.FC<WidgetProps> = () => <AnimatedKitchen kind="execute" label="机器人沿安全轨迹把红杯移向洗碗机上层。" />;
export const Analogy7: React.FC<WidgetProps> = () => <AnimatedKitchen kind="frontier" label="机械臂练习刚好能成功、又可能失败的避障抓取。" />;
export const Analogy8: React.FC<WidgetProps> = () => <AnimatedKitchen kind="bridge" label="红杯的视觉语义与放入上层的语言指令在模型内连接。" />;
export const Analogy9: React.FC<WidgetProps> = () => <AnimatedKitchen kind="correct" label="教师在机器人实际偏离玻璃杯的轨迹上即时纠偏。" />;
export const Analogy10: React.FC<WidgetProps> = () => <AnimatedKitchen kind="finish" label="红杯安全进入洗碗机上层，玻璃杯保持稳定。" />;

function useCanvas(ref: React.RefObject<HTMLCanvasElement>, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  useEffect(() => { const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, w, h); canvas.style.width = '100%'; canvas.style.height = 'auto'; } catch { return; }
    const render = () => { draw(ctx); canvas.classList.add('is-ready'); }; const disconnect = observeCanvas(canvas, render, () => {}); render(); return disconnect; }, [ref, w, h, draw]);
}

export const KitchenGapStress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [clarity, setClarity] = useState(42); const [plan, setPlan] = useState<0 | 1 | 2>(0); const ref = useRef<HTMLCanvasElement>(null);
  const okVision = clarity >= 70; const success = okVision && plan === 2;
  const planLabels = ['只定位目标', '抓取并避开玻璃杯', '放入洗碗机上层'] as const;
  const feedback = !okVision
    ? `感知缺口：识别框偏向玻璃杯。即使选择“${planLabels[plan]}”，完整计划也会执行在错误目标上。`
    : plan === 0
      ? '行动缺口：红杯已经认对，但计划只到“定位目标”，机械臂还没有抓取和放置。'
      : plan === 1
        ? '行动仍未闭环：机械臂已经安全拿起红杯并绕开玻璃杯，但还没有把它放进洗碗机上层。'
        : '两道条件都满足：红杯识别正确，行动计划也覆盖抓取、避障和上层放置。';
  const draw = useCallback((ctx: CanvasRenderingContext2D) => { sceneBase(ctx, 760, 330); ctx.fillStyle = '#fffdf8'; rounded(ctx, 20, 22, 470, 278, 18); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    dishwasher(ctx, 374, 58, 96, 100, success); mug(ctx, 268, 237, 1, okVision); glass(ctx, 335, 238, 1, !okVision); robot(ctx, 95, 188, 1.08, { x: 128, y: -12 }, success ? C.green : C.navy);
    const targetX = okVision ? 268 : 335; const routeColor = okVision ? C.green : C.red;
    const route: Array<[number, number]> = [[222, 184], [targetX, 173]];
    if (plan >= 1) route.push([305, 132]);
    if (plan >= 2) route.push([370, 112], [421, 105]);
    path(ctx, route, routeColor, !okVision);
    ctx.strokeStyle = routeColor; ctx.lineWidth = 4; rounded(ctx, targetX - 28, 198, 56, 66, 11); ctx.stroke();
    const steps = [{ x: targetX, y: 173, label: '1 定位' }, { x: 305, y: 132, label: '2 避障拿起' }, { x: 421, y: 105, label: '3 放入上层' }];
    steps.forEach((s, i) => { const reached = plan >= i; ctx.fillStyle = reached ? routeColor : '#e5e9ee'; ctx.beginPath(); ctx.arc(s.x, s.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = reached ? '#fff' : C.muted; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), s.x, s.y + 4); ctx.textAlign = 'left'; ctx.fillStyle = reached ? routeColor : C.muted; ctx.font = '700 11px system-ui'; ctx.fillText(s.label.slice(2), s.x - 26, s.y - 19); });
    ctx.fillStyle = '#fffdf8'; rounded(ctx, 515, 22, 225, 278, 18); ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = '800 18px system-ui'; ctx.fillText('任务状态', 540, 58);
    ctx.fillStyle = C.muted; ctx.font = '700 12px system-ui'; ctx.fillText('目标识别', 540, 88); ctx.fillStyle = okVision ? '#e8f6ef' : '#fff1f2'; rounded(ctx, 540, 99, 170, 38, 10); ctx.fill(); ctx.fillStyle = okVision ? C.green : C.red; ctx.font = '800 13px system-ui'; ctx.fillText(okVision ? '✓ 红色马克杯' : '× 偏向玻璃杯', 558, 123);
    ctx.fillStyle = C.muted; ctx.font = '700 12px system-ui'; ctx.fillText('行动计划', 540, 163); ctx.fillStyle = plan === 2 ? '#e8f6ef' : '#fff4df'; rounded(ctx, 540, 174, 170, 48, 10); ctx.fill(); ctx.fillStyle = plan === 2 ? C.green : C.orange; ctx.font = '800 12px system-ui'; ctx.fillText(`${plan + 1}/3  ${planLabels[plan]}`, 552, 203);
    ctx.fillStyle = success ? '#e8f6ef' : '#f2f4f6'; rounded(ctx, 540, 245, 170, 34, 10); ctx.fill(); ctx.fillStyle = success ? C.green : C.muted; ctx.font = '800 13px system-ui'; ctx.fillText(success ? '闭环已接通' : okVision ? '行动尚未完成' : '先修复目标识别', 570, 267);
  }, [clarity, plan, okVision, success]); useCanvas(ref, 760, 330, draw);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={760} height={330} aria-label={feedback} />
    <div className="ctrl"><label>细粒度视觉 <span className="val">{clarity}</span><input type="range" min={0} max={100} step={5} value={clarity} onChange={e => setClarity(+e.target.value)} /></label></div>
    <div className="chip-row" role="group" aria-label="行动计划完整度">{planLabels.map((label, i) => <button type="button" key={label} className={`chip ${plan === i ? 'selected' : ''}`} aria-pressed={plan === i} onClick={() => setPlan(i as 0 | 1 | 2)}>{i + 1}. {label}</button>)}</div>
    <div className={`feedback ${success ? 'good' : !okVision ? 'bad' : ''}`} aria-live="polite">{feedback}</div></div>;
};

export const KitchenGapRepair: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0); const ref = useRef<HTMLCanvasElement>(null); const labels = ['锁定红杯', '规划避障轨迹', '放入上层架'];
  const feedback = ['先确认“刚才喝水的红色马克杯”，排除旁边玻璃杯。', '目标已锁定；现在规划绕开玻璃杯、通往洗碗机上层的轨迹。', '轨迹已通过安全检查；执行抓取与放置。', '红杯进入上层架，玻璃杯未被碰倒。论文实机结果仍只在报告协议内成立。'][step];
  const draw = useCallback((ctx: CanvasRenderingContext2D) => { sceneBase(ctx, 760, 310); dishwasher(ctx, 600, 45, 120, 118, step === 3); glass(ctx, 430, 239, 1.05, false); const cupX = step === 3 ? 650 : 350, cupY = step === 3 ? 99 : 238; mug(ctx, cupX, cupY, step === 3 ? .72 : 1, step >= 1); robot(ctx, 105, 188, 1.08, { x: 150, y: -8 }, step === 3 ? C.green : C.navy);
    path(ctx, [[230, 185], [330, 150], [500, 112], [648, 95]], step >= 2 ? C.green : C.line, step < 2);
    labels.forEach((label, i) => { const x = 235 + i * 165; ctx.fillStyle = step > i ? '#e8f6ef' : step === i ? '#fff4df' : '#eef1f4'; rounded(ctx, x, 24, 140, 36, 12); ctx.fill(); ctx.strokeStyle = step > i ? C.green : step === i ? C.orange : C.line; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = step > i ? C.green : step === i ? C.orange : C.muted; ctx.font = '800 12px system-ui'; ctx.fillText(`${step > i ? '✓ ' : ''}${label}`, x + 14, 47); });
  }, [step]); useCanvas(ref, 760, 310, draw);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={760} height={310} aria-label={feedback} />
    <div className="chip-row" role="group" aria-label="任务闭环步骤">{labels.map((label, i) => <button className={`chip ${step === i ? 'selected' : ''}`} disabled={step < i} key={label} onClick={() => { if (step === i) setStep(i + 1); }}>{step > i ? '✓ ' : ''}{label}</button>)}<button className="chip" onClick={() => setStep(0)}>重置</button></div>
    <div className={`feedback ${step === 3 ? 'good' : ''}`} aria-live="polite">{feedback}</div>
    {step === 3 && <table className="paper"><caption>论文报告的真实机器人成功率（每模型每任务 20 次）</caption><thead><tr><th>模型</th><th>收纳</th><th>堆叠</th><th>挂杯</th></tr></thead><tbody><tr><th>HY</th><td>85%</td><td>80%</td><td>75%</td></tr><tr><th>π₀</th><td>80%</td><td>60%</td><td>45%</td></tr><tr><th>π₀.₅</th><td>85%</td><td>85%</td><td>50%</td></tr></tbody></table>}</div>;
};

type Preset = 'wide' | 'square' | 'portrait'; const presets: Record<Preset, { w: number; h: number; label: string }> = { wide: { w: 896, h: 448, label: '横幅厨房' }, square: { w: 672, h: 672, label: '方形近景' }, portrait: { w: 448, h: 896, label: '竖幅视角' } };
export const KitchenNativeResolution: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [preset, setPreset] = useState<Preset>('wide'); const [detail, setDetail] = useState(12); const ref = useRef<HTMLCanvasElement>(null); const s = presets[preset]; const fw = detail * 224 / s.w, fh = detail * 224 / s.h;
  const feedback = `源图中的杯柄细节约 ${detail} 像素；固定 224×224 示意后约 ${fw.toFixed(1)}×${fh.toFixed(1)} 像素。原生分辨率路径保留输入几何，但不承诺识别必然正确。`;
  const draw = useCallback((ctx: CanvasRenderingContext2D) => { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 760, 330); [['源始厨房画面', 18], ['固定 224×224', 270], ['原生分辨率', 522]].forEach(([label, x], i) => { ctx.fillStyle = '#fffdf8'; rounded(ctx, x as number, 30, 220, 250, 16); ctx.fill(); ctx.strokeStyle = i === 1 ? C.red : i === 2 ? C.green : C.line; ctx.lineWidth = i ? 3 : 2; ctx.stroke(); ctx.fillStyle = C.ink; ctx.font = '800 14px system-ui'; ctx.fillText(label as string, (x as number) + 18, 57); });
    sceneBase(ctx, 202, 190); ctx.save(); ctx.translate(27, 70); mug(ctx, 120, 120, 1, true); glass(ctx, 165, 122, .92); ctx.restore();
    ctx.save(); ctx.translate(300, 85); ctx.scale(1, Math.max(.42, fh / Math.max(fw, .1))); mug(ctx, 80, 105, Math.max(.35, fw / 6), false); ctx.restore(); ctx.fillStyle = C.red; ctx.font = '800 13px system-ui'; ctx.fillText(`${fw.toFixed(1)} × ${fh.toFixed(1)} px`, 318, 257);
    ctx.save(); ctx.translate(552, 82); mug(ctx, 78, 108, 1.2, true); ctx.strokeStyle = C.green; ctx.lineWidth = 4; rounded(ctx, 48, 70, 78, 92, 12); ctx.stroke(); ctx.restore(); ctx.fillStyle = C.green; ctx.fillText('杯柄与宽高关系保留', 553, 257);
    ctx.fillStyle = C.muted; ctx.font = '13px system-ui'; ctx.fillText(`输入：${s.w} × ${s.h}`, 37, 306); ctx.fillStyle = C.orange; ctx.fillText('杯柄是任务关键细节', 302, 306); ctx.fillStyle = C.green; ctx.fillText('原生几何入口', 571, 306);
  }, [s, fw, fh]); useCanvas(ref, 760, 330, draw);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={760} height={330} aria-label={feedback} />
    <div className="chip-row" role="group">{(Object.keys(presets) as Preset[]).map(p => <button className={`chip ${preset === p ? 'selected' : ''}`} key={p} onClick={() => setPreset(p)}>{presets[p].label}</button>)}</div>
    <div className="ctrl"><label>杯柄细节尺寸 <span className="val">{detail} 源像素</span><input type="range" min={4} max={32} step={2} value={detail} onChange={e => setDetail(+e.target.value)} /></label></div>
    <div className="feedback" aria-live="polite">{feedback}</div></div>;
};
