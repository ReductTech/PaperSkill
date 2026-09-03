import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = { bg: '#f5f8f0', paper: '#ffffff', ink: '#21324a', muted: '#68778f', line: '#d7deea', blue: '#27446e', blueSoft: '#dce8f4', green: '#228d5c', greenSoft: '#dff3e9', red: '#c43f52', orange: '#d97706', orangeSoft: '#fff0d6', purple: '#7c3aed', purpleSoft: '#eee8f7' };
const card: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 14, background: C.paper, padding: 14 };
const chip = (on: boolean, color = C.blue): React.CSSProperties => ({ border: `1px solid ${on ? color : C.line}`, borderRadius: 999, background: on ? color : C.paper, color: on ? C.paper : C.ink, padding: '7px 11px', fontWeight: 800, cursor: 'pointer' });

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = C.ink, size = 11, weight = 650) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px "Microsoft YaHei", sans-serif`; ctx.fillText(value, x, y);
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = C.paper, stroke = C.line, radius = 9, width = 1.3) {
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); ctx.stroke();
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.line, width = 2, dash: number[] = []) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue, width = 2) {
  line(ctx, x1, y1, x2, y2, color, width); const a = Math.atan2(y2 - y1, x2 - x1); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8 * Math.cos(a - .45), y2 - 8 * Math.sin(a - .45)); ctx.lineTo(x2 - 8 * Math.cos(a + .45), y2 - 8 * Math.sin(a + .45)); ctx.closePath(); ctx.fill();
}
function frame(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color = C.line, fill = C.paper, crisp = true) {
  round(ctx, x, y, 62, 45, fill, color, 6, 1.2); ctx.fillStyle = crisp ? C.blueSoft : '#dfe4df'; ctx.fillRect(x + 8, y + 8, 46, 21); ctx.fillStyle = crisp ? C.green : '#9aa69c'; ctx.fillRect(x + 25, y + 13, crisp ? 13 : 17, crisp ? 13 : 9); text(ctx, label, x + 23, y + 40, color === C.line ? C.muted : color, 9, 750);
}
function useAnimatedCanvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, time: number) => void, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height); let raf = 0; let running = false;
    const render = (time: number) => { if (!running) return; draw(ctx, time); canvas.classList.add('is-ready'); raf = requestAnimationFrame(render); };
    const stop = observeCanvas(canvas, () => { if (!running) { running = true; raf = requestAnimationFrame(render); } }, () => { running = false; cancelAnimationFrame(raf); });
    return () => { running = false; cancelAnimationFrame(raf); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const pipelineSteps = [
  { title: '1 · Trajectory Replay', short: '轨迹重放', color: C.blue, does: '沿原规划轨迹重新渲染更高分辨率观测。', keeps: '行为、动作值与动作时间戳均不改变。' },
  { title: '2 · Overlapping Clip Sampling', short: '重叠片段采样', color: C.orange, does: '滑动窗口保留切片边界两侧的连续转移。', keeps: '每个观测仍与原动作使用同一时间索引。' },
  { title: '3 · Initial-Observation Enhancement', short: '初始观察增强', color: C.green, does: '推理前仅用 SeedVR-2 恢复固定初始环境观察。', keeps: '不改动态历史、未来动作或训练时间轴。' },
];

function drawPipeline(ctx: CanvasRenderingContext2D, step: number, replayable: boolean, time: number) {
  ctx.clearRect(0, 0, 820, 330); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 820, 330);
  pipelineSteps.forEach((item, index) => { const x = 18 + index * 266; const active = index === step; round(ctx, x, 16, 250, 45, active ? `${item.color}18` : C.paper, active ? item.color : C.line, 9, active ? 2 : 1.2); text(ctx, item.title, x + 13, 43, active ? item.color : C.muted, 11, 800); });
  text(ctx, '观测轨', 22, 91, C.ink, 10, 800); text(ctx, '动作轨（锁定）', 22, 264, C.orange, 10, 800);
  const pulse = .5 + .5 * Math.sin(time / 330);
  if (step === 0) {
    text(ctx, replayable ? '同一轨迹：低分辨率观测 → 高分辨率重渲染' : '当前环境不可回放：该步骤被禁用', 132, 91, replayable ? C.blue : C.red, 11, 800);
    for (let i = 0; i < 8; i++) { const x = 128 + i * 78; frame(ctx, x, 104, `x${i}`, replayable ? C.line : C.red, replayable ? C.paper : '#f5e8e8', false); if (replayable) { arrow(ctx, x + 31, 153, x + 31, 181, C.blue, 1.7); frame(ctx, x, 187, `x${i}`, C.blue, C.paper, true); } }
  } else if (step === 1) {
    text(ctx, '窗口 A 与窗口 B 共享边界画格；接触事件不会被硬切断', 132, 91, C.orange, 11, 800);
    for (let i = 0; i < 8; i++) frame(ctx, 128 + i * 78, 112, `x${i}`, i === 4 ? C.orange : C.line, i === 4 ? C.orangeSoft : C.paper, true);
    round(ctx, 121, 171, 340, 28, `${C.blue}12`, C.blue, 7); text(ctx, '片段 A：x₀ … x₄', 135, 190, C.blue, 10, 800);
    round(ctx, 354, 205, 340, 28, `${C.orange}12`, C.orange, 7); text(ctx, '片段 B：x₃ … x₇', 368, 224, C.orange, 10, 800);
    const markerX = 128 + 4 * 78 + 31; line(ctx, markerX, 100, markerX, 242, `rgba(217,119,6,${.45 + pulse * .45})`, 3, [5, 4]); text(ctx, '接触边界', markerX - 25, 102, C.orange, 9, 800);
  } else {
    text(ctx, '只增强 rollout 的固定初始观察 x₀；后续画格保持原职责', 132, 91, C.green, 11, 800);
    frame(ctx, 138, 120, '原 x₀', C.red, '#f5e8e8', false); arrow(ctx, 210, 142, 279, 142, C.green, 2.5); round(ctx, 224, 110, 45, 22, C.greenSoft, C.green, 11); text(ctx, '恢复', 235, 125, C.green, 9, 800); frame(ctx, 292, 120, '增强 x₀', C.green, C.paper, true);
    for (let i = 1; i < 6; i++) frame(ctx, 370 + (i - 1) * 78, 120, `x${i}`, C.line, C.paper, true);
    round(ctx, 131, 187, 231, 38, C.greenSoft, C.green, 8); text(ctx, 'SeedVR-2：固定初始观察恢复', 147, 211, C.green, 10, 800);
    text(ctx, '不是：逐帧视频增强 / 动作修正 / 数据增广', 385, 211, C.red, 10, 750);
  }
  line(ctx, 128, 276, 745, 276, C.orange, 3); for (let i = 0; i < 8; i++) { const x = 128 + i * 78; ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(x + 31, 276, 4, 0, Math.PI * 2); ctx.fill(); text(ctx, `a${i}`, x + 23, 300, C.orange, 9, 800); line(ctx, x + 31, 258, x + 31, 268, C.orange, 1.2); }
  round(ctx, 263, 307, 294, 19, C.blueSoft, C.blue, 10); text(ctx, '🔒 不变量：所有处理都不改变动作时间索引', 282, 321, C.blue, 10, 800);
}

function PipelineExplorer() {
  const [step, setStep] = useState(0); const [replayable, setReplayable] = useState(true); const [seedOpen, setSeedOpen] = useState(false);
  const ref = useAnimatedCanvas(820, 330, (ctx, time) => drawPipeline(ctx, step, replayable, time), [step, replayable]);
  const select = (next: number) => { if (next === 0 && !replayable) return; setStep(next); setSeedOpen(false); };
  const active = pipelineSteps[step];
  return <div style={{ display: 'grid', gap: 13 }}>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{pipelineSteps.map((item, index) => <button key={item.short} type="button" disabled={index === 0 && !replayable} onClick={() => select(index)} style={{ ...chip(step === index, item.color), opacity: index === 0 && !replayable ? .45 : 1 }}>{item.short}</button>)}<button type="button" onClick={() => { setReplayable((v) => { if (v && step === 0) setStep(1); return !v; }); }} style={chip(replayable, replayable ? C.blue : C.red)}>可回放模拟器：{replayable ? '开' : '关'}</button></div>
    <div style={{ overflowX: 'auto' }}><canvas ref={ref} width={820} height={330} aria-label="BWM 三步数据管线时间线" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} /></div>
    <div style={{ ...card, display: 'grid', gridTemplateColumns: 'minmax(150px,.45fr) 1fr 1fr', gap: 14, borderColor: active.color }}>
      <div><small style={{ color: active.color, fontWeight: 850 }}>当前步骤 {step + 1}/3</small><h4 style={{ margin: '5px 0', color: C.ink }}>{active.short}</h4>{step === 2 && <button type="button" onClick={() => setSeedOpen((v) => !v)} style={{ ...chip(seedOpen, C.green), marginTop: 5 }}>SeedVR-2 边界</button>}</div>
      <div><b style={{ color: active.color, fontSize: 12 }}>画面发生什么</b><p style={{ margin: '6px 0 0', color: C.ink, lineHeight: 1.6 }}>{active.does}</p></div>
      <div><b style={{ color: C.blue, fontSize: 12 }}>始终没有改变什么</b><p style={{ margin: '6px 0 0', color: C.ink, lineHeight: 1.6 }}>{active.keeps}</p></div>
    </div>
    {seedOpen && <div style={{ ...card, borderColor: C.green, background: C.greenSoft, color: C.ink, lineHeight: 1.65 }}><b style={{ color: C.green }}>SeedVR-2 的使用边界</b>：论文把它用于推理时固定初始环境观察的恢复；这里不能把它扩写成整段 rollout 的逐帧增强器。</div>}
    {!replayable && <div className="feedback" style={{ borderLeftColor: C.red }}>不可回放时，Trajectory Replay 被禁用；仍可检查重叠片段采样与推理时的初始观察增强。</div>}
  </div>;
}

type ArchNode = 'norm' | 'encoder' | 'cross' | 'group' | 'adaln' | 'denoise';
type Route = 'frame' | 'latent' | 'both';
const nodeInfo: Record<ArchNode, { title: string; input: string; operation: string; output: string; color: string }> = {
  norm: { title: '动作归一化', input: '每一维绝对 EEF 位姿动作', operation: '按训练集第 1/99 百分位裁剪并映射到 [ℓₐ,uₐ]', output: '尺度统一的 dₐ=14 动作', color: C.orange },
  encoder: { title: 'Action Encoder', input: '归一化后的逐动作向量', operation: '把每个动作编码成动作 token', output: '保留细时间索引的 token 序列', color: C.blue },
  cross: { title: '帧级 Cross-Attention', input: '逐动作 token + DiT 隐状态', operation: '让每个视频时间位置读取对应动作条件', output: '细粒度动作响应', color: C.blue },
  group: { title: '边界前置与 G=4 分组', input: 'P=3 个边界动作 + 当前动作块', operation: '按 latent 时间分辨率聚合动作', output: '每组动作嵌入', color: C.purple },
  adaln: { title: '潜变量级 AdaLN', input: '分组动作嵌入 + timestep embedding', operation: '调制去噪块的归一化参数', output: '压缩时间尺度的整体动作节拍', color: C.purple },
  denoise: { title: 'DiT 去噪块', input: '视频 latent + 两路动作条件', operation: 'Self-Attn、Cross-Attn、AdaLN 与 FFN 协同更新', output: '动作条件未来 latent', color: C.green },
};
function node(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, active: boolean, color: string, pulse: number) {
  round(ctx, x, y, w, h, active ? `${color}20` : C.paper, active ? color : C.line, 9, active ? 2.5 + pulse : 1.2); text(ctx, label, x + 11, y + h / 2 + 4, active ? color : C.ink, 10, active ? 850 : 700);
}
function routeOn(route: Route, kind: 'frame' | 'latent') { return route === 'both' || route === kind; }
function drawArchitecture(ctx: CanvasRenderingContext2D, active: ArchNode, route: Route, time: number) {
  ctx.clearRect(0, 0, 820, 350); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 820, 350); const pulse = .35 + .35 * Math.sin(time / 260);
  text(ctx, '动作块 aₜ₊₁:ₜ₊K', 24, 28, C.orange, 11, 850); for (let i = 0; i < 7; i++) { round(ctx, 24 + i * 43, 41, 34, 26, C.orangeSoft, C.orange, 6); text(ctx, `a${i}`, 33 + i * 43, 59, C.orange, 9, 800); }
  node(ctx, 340, 35, 105, 42, '归一化', active === 'norm', C.orange, pulse); arrow(ctx, 319, 54, 338, 54, C.orange);
  node(ctx, 480, 35, 128, 42, 'Action Encoder', active === 'encoder', C.blue, pulse); arrow(ctx, 445, 54, 478, 54, C.blue);
  text(ctx, '帧级路径：保留逐动作 token', 28, 111, C.blue, 11, 850); line(ctx, 28, 122, 788, 122, routeOn(route, 'frame') ? C.blue : C.line, routeOn(route, 'frame') ? 3 : 1.5);
  node(ctx, 213, 139, 156, 48, 'Cross-Attention', active === 'cross', C.blue, pulse); arrow(ctx, 544, 78, 366, 139, routeOn(route, 'frame') ? C.blue : C.line); arrow(ctx, 369, 163, 610, 163, routeOn(route, 'frame') ? C.blue : C.line, routeOn(route, 'frame') ? 2.5 : 1.3);
  text(ctx, 'latent 级路径：P=3 边界动作 + G=4 分组', 28, 222, C.purple, 11, 850); line(ctx, 28, 233, 788, 233, routeOn(route, 'latent') ? C.purple : C.line, routeOn(route, 'latent') ? 3 : 1.5);
  node(ctx, 132, 251, 170, 48, '前置 P=3 · 分组 G=4', active === 'group', C.purple, pulse); node(ctx, 356, 251, 135, 48, 'AdaLN 调制', active === 'adaln', C.purple, pulse); arrow(ctx, 302, 275, 354, 275, routeOn(route, 'latent') ? C.purple : C.line); arrow(ctx, 491, 275, 610, 205, routeOn(route, 'latent') ? C.purple : C.line, routeOn(route, 'latent') ? 2.5 : 1.3);
  round(ctx, 610, 131, 177, 102, active === 'denoise' ? C.greenSoft : C.paper, active === 'denoise' ? C.green : C.line, 12, active === 'denoise' ? 3 : 1.5); text(ctx, 'DiT 去噪块', 648, 157, active === 'denoise' ? C.green : C.ink, 13, 850); text(ctx, 'Self-Attn', 629, 181, C.muted, 9, 700); text(ctx, 'Cross-Attn', 697, 181, routeOn(route, 'frame') ? C.blue : C.muted, 9, 800); text(ctx, 'AdaLN + FFN', 656, 207, routeOn(route, 'latent') ? C.purple : C.muted, 9, 800);
  arrow(ctx, 787, 182, 808, 182, C.green, 2.5); text(ctx, '未来 latent', 695, 249, C.green, 10, 850);
  round(ctx, 24, 315, 763, 23, C.paper, C.line, 10); text(ctx, route === 'both' ? '两条路径同时激活：细时间控制 + latent 尺度调制' : route === 'frame' ? '仅观察帧级路线：逐动作 token 进入 Cross-Attention' : '仅观察 latent 路线：分组动作嵌入调制 AdaLN', 235, 331, route === 'both' ? C.green : route === 'frame' ? C.blue : C.purple, 10, 850);
}
function ArchitectureExplorer() {
  const [active, setActive] = useState<ArchNode>('encoder'); const [route, setRoute] = useState<Route>('both'); const info = nodeInfo[active];
  const ref = useAnimatedCanvas(820, 350, (ctx, time) => drawArchitecture(ctx, active, route, time), [active, route]);
  return <div style={{ display: 'grid', gap: 13 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(['frame', 'latent', 'both'] as Route[]).map((value) => <button key={value} type="button" onClick={() => setRoute(value)} style={chip(route === value, value === 'latent' ? C.purple : value === 'both' ? C.green : C.blue)}>{value === 'frame' ? '只看帧级路径' : value === 'latent' ? '只看 latent 路径' : '两路同时追踪'}</button>)}</div><span style={{ color: C.muted, fontSize: 11, alignSelf: 'center' }}>路径开关用于讲解结构，不等同于论文消融配置</span></div>
    <div style={{ overflowX: 'auto' }}><canvas ref={ref} width={820} height={350} aria-label="BWM 双路径动作注入架构" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} /></div>
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(Object.keys(nodeInfo) as ArchNode[]).map((id) => <button key={id} type="button" onClick={() => setActive(id)} style={chip(active === id, nodeInfo[id].color)}>{nodeInfo[id].title}</button>)}</div>
    <div style={{ ...card, borderColor: info.color, display: 'grid', gridTemplateColumns: 'minmax(140px,.45fr) 1fr 1fr', gap: 14 }}><div><small style={{ color: info.color, fontWeight: 850 }}>当前节点</small><h4 style={{ margin: '5px 0', color: C.ink }}>{info.title}</h4></div><div><b style={{ color: C.muted, fontSize: 11 }}>输入 → 操作</b><p style={{ margin: '5px 0 0', lineHeight: 1.6 }}>{info.input}<br /><span style={{ color: info.color }}>{info.operation}</span></p></div><div><b style={{ color: C.muted, fontSize: 11 }}>输出 / 作用</b><p style={{ margin: '5px 0 0', lineHeight: 1.6 }}>{info.output}</p></div></div>
    <div className="feedback" style={{ borderLeftColor: route === 'both' ? C.green : route === 'frame' ? C.blue : C.purple }}>报告配置：dₐ=14、P=3、G=4。两条路径分别服务细粒度时间控制与 latent 时间尺度调制。</div>
  </div>;
}

type Config = 'adaln' | 'cross' | 'both';
const configs: Record<Config, { name: string; ewm: number; traj: number; frame: boolean; latent: boolean; color: string; note: string }> = {
  adaln: { name: '仅 AdaLN', ewm: 61.12, traj: 49.16, frame: false, latent: true, color: C.purple, note: '保留 latent 级调制，缺少逐动作 Cross-Attention。' },
  cross: { name: '仅 Cross-Attention', ewm: 59.54, traj: 43.42, frame: true, latent: false, color: C.blue, note: '保留逐动作 token 条件，缺少分组 AdaLN 调制。' },
  both: { name: '两者结合', ewm: 63.51, traj: 64.36, frame: true, latent: true, color: C.green, note: '两路互补，在论文报告的 WorldArena 消融中取得最高两项结果。' },
};
function metricBar(ctx: CanvasRenderingContext2D, label: string, value: number, y: number, color: string) { text(ctx, label, 462, y + 14, C.ink, 10, 800); ctx.fillStyle = '#e7ece7'; ctx.fillRect(575, y, 178, 18); ctx.fillStyle = color; ctx.fillRect(575, y, 178 * value / 70, 18); text(ctx, value.toFixed(2), 760, y + 14, color, 10, 850); }
function drawAblation(ctx: CanvasRenderingContext2D, selected: Config, time: number) {
  const cfg = configs[selected]; ctx.clearRect(0, 0, 820, 300); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 820, 300); const pulse = .3 + .3 * Math.sin(time / 280);
  text(ctx, '动作条件的两条注入路线', 24, 28, C.ink, 12, 850); round(ctx, 24, 48, 365, 98, cfg.frame ? C.blueSoft : C.paper, cfg.frame ? C.blue : C.line, 10, cfg.frame ? 2 + pulse : 1.2); text(ctx, '帧级 Cross-Attention', 43, 76, cfg.frame ? C.blue : C.muted, 12, 850); text(ctx, '逐动作 token · 细时间控制', 43, 100, C.muted, 10, 700); text(ctx, cfg.frame ? '已接入去噪块' : '本配置关闭', 43, 126, cfg.frame ? C.blue : C.red, 10, 850);
  round(ctx, 24, 158, 365, 98, cfg.latent ? C.purpleSoft : C.paper, cfg.latent ? C.purple : C.line, 10, cfg.latent ? 2 + pulse : 1.2); text(ctx, '潜变量级 AdaLN', 43, 186, cfg.latent ? C.purple : C.muted, 12, 850); text(ctx, 'P=3 · G=4 · latent 时间尺度', 43, 210, C.muted, 10, 700); text(ctx, cfg.latent ? '已接入去噪块' : '本配置关闭', 43, 236, cfg.latent ? C.purple : C.red, 10, 850);
  text(ctx, `${cfg.name} · WorldArena 消融`, 462, 54, cfg.color, 12, 850); metricBar(ctx, 'EWMScore ↑', cfg.ewm, 79, cfg.color); metricBar(ctx, 'TrajA ↑', cfg.traj, 130, cfg.color);
  round(ctx, 452, 181, 337, 75, selected === 'both' ? C.greenSoft : C.paper, cfg.color, 10); text(ctx, cfg.note, 469, 211, cfg.color, 10, 800); text(ctx, '数值来源：论文 Tables 9–10', 469, 237, C.muted, 9, 700);
  text(ctx, '↑ 越高越好；只在该消融协议内比较', 487, 284, C.muted, 9, 700);
}
function AblationExplorer() {
  const [selected, setSelected] = useState<Config>('both'); const cfg = configs[selected];
  const ref = useAnimatedCanvas(820, 300, (ctx, time) => drawAblation(ctx, selected, time), [selected]);
  return <div style={{ display: 'grid', gap: 13 }}>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(Object.keys(configs) as Config[]).map((id) => <button key={id} type="button" onClick={() => setSelected(id)} style={chip(selected === id, configs[id].color)}>{configs[id].name}</button>)}</div>
    <div style={{ overflowX: 'auto' }}><canvas ref={ref} width={820} height={300} aria-label="BWM 动作注入消融对比" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} /></div>
    <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(140px,1fr))', gap: 10 }}><div><small style={{ color: C.muted }}>激活路径</small><b style={{ display: 'block', color: cfg.color, marginTop: 4 }}>{cfg.frame && cfg.latent ? 'Cross-Attention + AdaLN' : cfg.frame ? 'Cross-Attention' : 'AdaLN'}</b></div><div><small style={{ color: C.muted }}>EWMScore ↑</small><b style={{ display: 'block', color: cfg.color, fontSize: 20 }}>{cfg.ewm.toFixed(2)}</b></div><div><small style={{ color: C.muted }}>TrajA ↑</small><b style={{ display: 'block', color: cfg.color, fontSize: 20 }}>{cfg.traj.toFixed(2)}</b></div></div>
    <div className="feedback" style={{ borderLeftColor: cfg.color }}>{cfg.note} 该结论仅限论文 Tables 9–10 的 WorldArena 消融，不能外推为所有任务的普适最优。</div>
  </div>;
}

export const BwmCoreMechanics: React.FC<WidgetProps> = ({ moduleId }) => moduleId === '4.1' ? <PipelineExplorer /> : moduleId === '5.1' ? <ArchitectureExplorer /> : <AblationExplorer />;
export default BwmCoreMechanics;
