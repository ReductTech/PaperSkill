import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';

export type AlayaMode =
  | 'hero-old' | 'hero-new'
  | 'ana1' | 'ana2' | 'ana3' | 'ana4' | 'ana5' | 'ana6' | 'ana7' | 'ana8' | 'ana9' | 'ana10'
  | 'horizon' | 'compare' | 'camera' | 'revisit' | 'context' | 'control'
  | 'rollout' | 'corruption' | 'architecture' | 'coverage' | 'distill' | 'race';

type Tone = '' | 'good' | 'bad';
type DrawState = { value: number; selected: number; started: boolean; metric: number; time: number };
type Ctx = CanvasRenderingContext2D;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

const ANALOGY_MODES = new Set<AlayaMode>(['hero-old', 'hero-new', 'ana1', 'ana2', 'ana3', 'ana4', 'ana5', 'ana6', 'ana7', 'ana8', 'ana9', 'ana10']);
const DRAG_MODES = new Set<AlayaMode>(['camera', 'control', 'coverage']);

function polyline(ctx: Ctx, pts: Array<[number, number]>, color: string, width = 5, dash: number[] = []) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}

function hiker(ctx: Ctx, x: number, y: number, color: string, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, -26, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 4); ctx.lineTo(-10, 20); ctx.moveTo(0, 4); ctx.lineTo(10, 20); ctx.moveTo(-10, -8); ctx.lineTo(10, -8); ctx.stroke(); ctx.restore();
}

function pin(ctx: Ctx, x: number, y: number, color: string, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.bezierCurveTo(-22, -3, -16, -30, 0, -30); ctx.bezierCurveTo(16, -30, 22, -3, 0, 16); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(0, -17, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function baseMap(ctx: Ctx, w: number, h: number, dim = false) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = dim ? '#e9eee5' : '#eef2e8';
  for (let i = 0; i < 7; i++) ctx.fillRect(40 + i * (w - 80) / 7, 26 + (i % 2) * 20, (w - 100) / 8, h - 70 - (i % 3) * 24);
  polyline(ctx, [[30, h * .72], [w * .24, h * .56], [w * .46, h * .63], [w * .68, h * .38], [w - 30, h * .3]], C.light, 18);
  polyline(ctx, [[35, h * .3], [w * .28, h * .38], [w * .54, h * .28], [w - 35, h * .5]], '#dce5d3', 12);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; for (let x = 60; x < w; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, h); ctx.stroke(); }
}

function chip(ctx: Ctx, x: number, y: number, w: number, h: number, label: string, color: string, active: boolean) {
  ctx.fillStyle = active ? color : C.white; ctx.fillRect(x, y, w, h); ctx.strokeStyle = active ? color : C.line; ctx.lineWidth = active ? 3 : 1.5; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = active ? C.white : C.ink; ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + w / 2, y + h / 2);
}

function drawAnalogy(ctx: Ctx, w: number, h: number, mode: AlayaMode, t: number) {
  baseMap(ctx, w, h);
  const p = (t % 3200) / 3200;
  const x = lerp(70, w - 70, p);
  const y = h * .66 + Math.sin(p * Math.PI * 4) * 8;
  if (mode === 'ana1' || mode === 'hero-old') {
    polyline(ctx, [[70, h * .66], [w - 80, h * .34]], C.route, 4);
    for (let i = 0; i < 6; i++) hiker(ctx, lerp(70, w - 70, p) - i * 20, lerp(h * .66, h * .34, p) + i * 2, i ? C.red : C.ink, .45);
    pin(ctx, w - 60, h * .34, C.green);
  } else if (mode === 'hero-new' || mode === 'ana2') {
    polyline(ctx, [[70, h * .66], [w - 80, h * .34]], C.route, 4);
    for (let i = 0; i < 4; i++) { const q = clamp(p - i * .16, 0, 1); ctx.fillStyle = i === 3 ? C.green : C.blue; ctx.fillRect(lerp(70, w - 80, q) - 5, lerp(h * .66, h * .34, q) - 5, 10, 10); }
    hiker(ctx, x, y, C.ink, .5); pin(ctx, w - 60, h * .34, C.green);
  } else if (mode === 'ana3') {
    polyline(ctx, [[60, h - 34], [180, 58], [340, h - 38], [w - 70, 54]], C.route, 4);
    pin(ctx, 180, 58, C.green); hiker(ctx, p < .5 ? lerp(60, 180, p * 2) : lerp(340, 180, (p - .5) * 2), p < .5 ? lerp(h - 34, 58, p * 2) : lerp(h - 38, 58, (p - .5) * 2), C.blue, .5);
  } else if (mode === 'ana4') {
    const labels = ['锚点', '近史', '空间', '近帧']; ['#27446e', '#7c3aed', '#228d5c', '#f07e47'].forEach((c, i) => chip(ctx, 48 + i * (w - 96) / 4, h / 2 - 28, (w - 96) / 4 - 10, 56, labels[i], c, (Math.floor(p * 4) % 4) === i)); hiker(ctx, x, y, C.ink, .45);
  } else if (mode === 'ana5') {
    hiker(ctx, x, y, C.ink, .5); pin(ctx, w - 68, h * .34, C.green); ctx.save(); ctx.translate(w * .55, h * .5); ctx.rotate(p * Math.PI * 2); polyline(ctx, [[0, 0], [0, -35]], C.blue, 5); ctx.restore(); ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(w - 68, h * .34, 12 + Math.sin(t / 250) * 3, 0, Math.PI * 2); ctx.fill();
  } else if (mode === 'ana6') {
    polyline(ctx, [[60, h - 38], [w - 80, h * .35]], C.route, 4); for (let i = 0; i < 5; i++) { const q = (i + p) / 5; ctx.fillStyle = i < 3 ? C.green : C.blue; ctx.fillRect(lerp(60, w - 80, q), lerp(h - 38, h * .35, q) - 5, 9, 9); } hiker(ctx, x, y, C.ink, .45);
  } else if (mode === 'ana7') {
    polyline(ctx, [[60, h * .66], [w - 80, h * .35]], C.red, 4, [8, 7]); hiker(ctx, x, y, C.red, .5); const wipe = (p * w + 40) % (w + 80); ctx.fillStyle = `rgba(245,248,240,.88)`; ctx.fillRect(Math.max(0, wipe - 70), 0, 70, h); pin(ctx, w - 62, h * .35, C.green);
  } else if (mode === 'ana8') {
    for (let i = 0; i < 4; i++) ctx.strokeRect(45 + i * 14, 25 + i * 13, w - 90 - i * 28, h - 50 - i * 26); hiker(ctx, x, y, C.ink, .45); pin(ctx, w * .68, h * .45, C.purple);
  } else if (mode === 'ana9') {
    polyline(ctx, [[60, h * .7], [w - 80, h * .35]], C.route, 4); for (let i = 0; i < 4; i++) { const q = p; ctx.fillStyle = C.green; ctx.fillRect(lerp(60, w - 80, q) - i * 11, lerp(h * .7, h * .35, q) + i * 5, 8, 8); } hiker(ctx, x, y, C.green, .5);
  } else {
    ctx.fillStyle = C.blue; ctx.fillRect(55, 56, (w - 150) * p, 22); ctx.fillStyle = C.green; ctx.fillRect(55, 92, (w - 150) * clamp(p + .13, 0, 1), 22); hiker(ctx, x, y, C.ink, .4); pin(ctx, w - 58, h * .5, C.orange);
  }
}

function drawModule(ctx: Ctx, w: number, h: number, mode: AlayaMode, s: DrawState) {
  baseMap(ctx, w, h);
  const t = s.time;
  if (mode === 'horizon') {
    const p = s.value / 60; polyline(ctx, [[70, h * .72], [w - 80, h * .3]], C.route, 4); hiker(ctx, lerp(70, w - 80, p), lerp(h * .72, h * .3, p), C.blue, .8); for (let i = 1; i < 7; i++) { ctx.globalAlpha = .15 + i * .11; hiker(ctx, lerp(70, w - 80, p) + i * (s.value / 4), lerp(h * .72, h * .3, p) + i * 5, C.red, .65); } ctx.globalAlpha = 1; pin(ctx, w - 66, h * .3, C.green);
  } else if (mode === 'compare') {
    ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(w / 2, 16); ctx.lineTo(w / 2, h - 16); ctx.stroke(); const p = s.started ? clamp((t % 3200) / 2600, 0, 1) : .24; polyline(ctx, [[60, h * .7], [w * .5 - 30, h * .38]], C.red, 5, [7, 6]); polyline(ctx, [[w / 2 + 30, h * .7], [w - 60, h * .38]], C.green, 5); hiker(ctx, lerp(60, w * .5 - 30, p), lerp(h * .7, h * .38, p), C.red, .65); hiker(ctx, lerp(w / 2 + 30, w - 60, p), lerp(h * .7, h * .38, p), C.green, .65); chip(ctx, 24, 18, 130, 34, '无限历史', C.red, true); chip(ctx, w / 2 + 20, 18, 150, 34, '有界上下文', C.green, true);
  } else if (mode === 'camera' || mode === 'control') {
    const p = s.value / 100; polyline(ctx, [[55, h * .72], [w * .34, h * .58], [w * .62, h * .3], [w - 55, h * .42]], C.route, 4); hiker(ctx, lerp(55, w - 55, p), h * .58 - Math.sin(p * Math.PI) * 65, C.blue, .8); for (let i = 0; i < 5; i++) chip(ctx, 80 + i * 150, h - 48, 100, 28, `块 ${i + 1}`, i === Math.floor(p * 5) ? C.blue : C.line, i === Math.floor(p * 5)); ctx.save(); ctx.translate(w - 92, 82); ctx.rotate(p * Math.PI * 1.4 - .7); polyline(ctx, [[0, 0], [0, -42]], C.orange, 7); ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
  } else if (mode === 'revisit') {
    const p = s.selected / 5; polyline(ctx, [[60, h - 48], [220, 55], [470, h - 44], [w * .7, 60], [w - 65, h - 42]], C.route, 5); pin(ctx, 220, 55, C.green); pin(ctx, 470, h - 44, C.purple); hiker(ctx, lerp(60, w - 65, p), h - 48 - Math.sin(p * Math.PI) * 145, C.blue, .75); for (let i = 0; i <= s.selected; i++) { const x = lerp(60, w - 65, i / 5); ctx.fillStyle = C.blue; ctx.fillRect(x - 4, h - 53 + Math.sin(i) * 2, 8, 8); }
  } else if (mode === 'context') {
    const labels = ['SINK', '近史', '空间', '近帧']; const colors = [C.blue, C.purple, C.green, C.orange]; labels.forEach((x, i) => chip(ctx, 45 + (i % 2) * (w / 2), 54 + Math.floor(i / 2) * 90, w / 2 - 90, 62, x, colors[i], i === s.selected)); polyline(ctx, [[w / 2 - 18, 85], [w / 2 + 18, 85]], C.ink, 3); polyline(ctx, [[w / 2, 116], [w / 2, 144]], C.ink, 3); hiker(ctx, w / 2, h - 32, C.blue, .55);
  } else if (mode === 'rollout') {
    const p = s.selected / 5; for (let i = 0; i < 5; i++) { const active = i === s.selected; chip(ctx, 42 + i * (w - 84) / 5, 42, (w - 84) / 5 - 12, 42, `块 ${i + 1}`, active ? C.blue : C.line, active); ctx.fillStyle = i < s.selected ? C.green : C.line; ctx.fillRect(42 + i * (w - 84) / 5 + 10, 112, 40, 8); } polyline(ctx, [[55, h - 50], [w - 55, h - 50]], C.light, 14); hiker(ctx, lerp(55, w - 55, p), h - 50, C.blue, .72);
  } else if (mode === 'corruption') {
    const kinds = ['噪声', '模糊', '饱和度', '论文方法']; const colors = [C.red, C.red, C.orange, C.green]; kinds.forEach((x, i) => chip(ctx, 50 + i * (w - 100) / 4, 34, (w - 100) / 4 - 12, 36, x, colors[i], i === s.selected)); polyline(ctx, [[60, h * .72], [w - 70, h * .3]], s.selected === 3 ? C.green : C.red, 5, s.selected === 3 ? [] : [7, 7]); hiker(ctx, w * .54, h * .5, s.selected === 3 ? C.green : C.red, .72); if (s.selected < 3) { ctx.fillStyle = 'rgba(118,144,106,.18)'; ctx.fillRect(0, 0, w, h); }
  } else if (mode === 'architecture') {
    const nodes: Array<[string, number, number, string]> = [['SINK', w * .12, h * .5, C.blue], ['历史', w * .31, h * .3, C.purple], ['空间', w * .31, h * .7, C.green], ['近帧', w * .5, h * .5, C.orange], ['目标', w * .72, h * .5, C.ink]]; polyline(ctx, [[w * .12, h * .5], [w * .31, h * .3], [w * .5, h * .5], [w * .72, h * .5]], C.line, 7); polyline(ctx, [[w * .12, h * .5], [w * .31, h * .7], [w * .5, h * .5]], s.selected === 2 ? C.green : C.line, 7); nodes.forEach(([label, x, y, color], i) => chip(ctx, x - 55, y - 24, 110, 48, label, color, i === s.selected)); ctx.fillStyle = C.muted; ctx.font = '12px ui-sans-serif'; ctx.fillText('自注意力前缀', w / 2, h - 24);
  } else if (mode === 'coverage') {
    ctx.fillStyle = C.white; ctx.fillRect(60, 50, w - 120, h - 100); ctx.strokeStyle = C.line; ctx.strokeRect(60, 50, w - 120, h - 100); const n = Math.round(s.value); for (let i = 0; i < 10; i++) { const x = 100 + (i % 5) * ((w - 200) / 4), y = 92 + Math.floor(i / 5) * 92; ctx.fillStyle = i < n ? (i < 6 ? C.green : C.blue) : '#e8ece6'; ctx.fillRect(x - 16, y - 16, 32, 32); } ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(60, 50, (w - 120) * n / 10, h - 100);
  } else if (mode === 'distill') {
    const steps = Math.round(s.value); const p = clamp((30 - steps) / 26, 0, 1); polyline(ctx, [[60, h * .72], [w - 70, h * .32]], C.route, 5); for (let i = 0; i < 30; i++) { ctx.fillStyle = i < steps ? (steps <= 4 ? C.green : C.blue) : '#e7ebe3'; ctx.fillRect(60 + i * (w - 130) / 30, h * .78, 2, 22 - p * 10); } hiker(ctx, lerp(60, w - 70, p), lerp(h * .72, h * .32, p), C.blue, .72); chip(ctx, w - 210, 32, 160, 40, `${steps} 步`, steps <= 4 ? C.green : C.orange, true);
  } else if (mode === 'race') {
    const vals = [[.8871, .8481], [.7985, .7472], [.9492, .8051]][s.metric]; const p = s.started ? clamp((t % 2800) / 2200, 0, 1) : 0; ctx.fillStyle = C.green; ctx.fillRect(80, 80, (w - 190) * vals[0] * p, 32); ctx.fillStyle = C.blue; ctx.fillRect(80, 138, (w - 190) * vals[1] * p, 32); ctx.fillStyle = C.ink; ctx.font = '600 15px ui-sans-serif'; ctx.fillText('AlayaWorld', 80, 66); ctx.fillText('对照方法', 80, 126); pin(ctx, 80 + (w - 190) * vals[0] * p, 96, C.green, .38);
  }
}

function feedback(mode: AlayaMode, value: number, selected: number): { text: string; tone: Tone } {
  if (mode === 'horizon') return value <= 18 ? { text: '短时程仍稳定；继续拉长，漂移会逐渐显形。', tone: 'good' } : value <= 38 ? { text: '漂移开始积累，地标仍可见但位置正在偏移。', tone: '' } : { text: '长时程误差持续累积，旧路线已经明显偏离目标。', tone: 'bad' };
  if (mode === 'compare') return { text: '两侧从同一起点出发；有界上下文保留可回访证据，旧方案则会不断放大偏差。', tone: '' };
  if (mode === 'camera' || mode === 'control') return value >= 35 && value <= 72 ? { text: '相对位姿落在平滑区间，下一块能看到清晰的几何方向。', tone: 'good' } : { text: '转向过快或过缓，块间连续性会变差；调整罗盘回到中间区间。', tone: 'bad' };
  if (mode === 'revisit') return selected >= 4 ? { text: '回访完成：缓存地标与空间覆盖保持一致。', tone: 'good' } : { text: '继续走向旧地标，观察缓存帧如何被重投影回来。', tone: '' };
  if (mode === 'context') return { text: ['Sink 固定全局外观，不让身份随路线漂移。', '时间记忆压缩最近六帧，维持局部动态。', '空间记忆重投影旧观察，支持回访一致。', '最近帧提供最高分辨率的帧间连续。'][selected], tone: selected === 2 ? 'good' : '' };
  if (mode === 'rollout') return selected >= 5 ? { text: '五块完成；每块计算量保持有界，路线可继续滚动。', tone: 'good' } : { text: '当前块只读取过去与当前控制，未来不会被提前泄露。', tone: '' };
  if (mode === 'corruption') return selected === 3 ? { text: '论文方法结合漂移模拟与误差回放，路线恢复到绿色稳定态。', tone: 'good' } : { text: '历史已经被污染；只靠事后修补不足以恢复长期一致。', tone: 'bad' };
  if (mode === 'architecture') return { text: ['Sink 在时间位置 0 固定全局身份。', '时间记忆用最近六帧压缩局部运动。', '空间记忆用位姿与深度对齐长期证据。', '最近帧承担全分辨率 I2V 连续。', '目标块是唯一被去噪并向前推进的部分。'][selected], tone: selected === 2 || selected === 4 ? 'good' : '' };
  if (mode === 'coverage') return value >= 6 ? { text: '覆盖帧数量充足，空洞区域被掩码明确标出。', tone: 'good' } : { text: '覆盖不足：更多区域没有真实证据，不能被当作已观察内容。', tone: 'bad' };
  if (mode === 'distill') return value <= 4 ? { text: '四步学生已对齐教师分布，同时保留相机与记忆栈。', tone: 'good' } : value <= 12 ? { text: '步数减少后速度提升，但仍需监测一致性。', tone: '' } : { text: '教师质量较高，但约三十步对交互响应过慢。', tone: 'bad' };
  if (mode === 'race') return { text: ['记忆对称性越高，回访时世界越一致。', '轨迹准确率越高，生成视角越贴近控制指令。', '亮度一致性越高，长时程曝光越稳定。'][selected], tone: 'good' };
  return { text: '观察路线、地标与证据的变化。', tone: '' };
}

export function AlayaWidget({ mode }: { mode: AlayaMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef(false);
  const startRef = useRef(0);
  const [value, setValue] = useState(mode === 'horizon' ? 12 : mode === 'distill' ? 30 : mode === 'coverage' ? 4 : 50);
  const [selected, setSelected] = useState(0);
  const [started, setStarted] = useState(false);
  const [metric, setMetric] = useState(0);
  const isAnalogy = ANALOGY_MODES.has(mode);
  const fb = feedback(mode, value, selected);

  useEffect(() => { startRef.current = performance.now(); }, []);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const w = isAnalogy ? 560 : 1080; const h = isAnalogy ? 140 : 280;
    const ctx = setupCanvas(canvas, w, h);
    let raf = 0; let running = false;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      if (isAnalogy) drawAnalogy(ctx, w, h, mode, time); else drawModule(ctx, w, h, mode, { value, selected, started, metric, time });
      canvas.classList.add('is-ready');
      if (running) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (running) return; running = true; raf = requestAnimationFrame(draw); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [mode, value, selected, started, metric, isAnalogy]);

  const pointerValue = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width;
    if (mode === 'coverage') setValue(Math.round(clamp(x * 10, 1, 10))); else setValue(Math.round(clamp(x * 100, 0, 100)));
  };

  if (isAnalogy) return <canvas ref={canvasRef} width={560} height={140} aria-label="旧城徒步勘察动画" />;

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={1080}
        height={280}
        tabIndex={0}
        role="img"
        aria-label="旧城徒步勘察交互图"
        style={{ cursor: DRAG_MODES.has(mode) ? 'grab' : mode === 'architecture' ? 'pointer' : 'default' }}
        onPointerDown={(e) => { if (!DRAG_MODES.has(mode)) return; dragRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); pointerValue(e); }}
        onPointerMove={(e) => { if (dragRef.current && DRAG_MODES.has(mode)) pointerValue(e); }}
        onPointerUp={() => { dragRef.current = false; }}
        onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setValue((v) => clamp(v + 5, 0, 100)); if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setValue((v) => clamp(v - 5, 0, 100)); }}
      />
      {(mode === 'horizon' || mode === 'distill') ? (
        <div className="ctrl">
          <label htmlFor={`${mode}-range`}>{mode === 'horizon' ? '时间范围' : '采样步数'}</label>
          <input id={`${mode}-range`} type="range" min={mode === 'horizon' ? 1 : 4} max={mode === 'horizon' ? 60 : 30} step={1} value={value} onInput={(e) => setValue(Number(e.currentTarget.value))} />
          <span className="val">{value}{mode === 'horizon' ? ' 段' : ' 步'}</span>
        </div>
      ) : null}
      {(mode === 'revisit' || mode === 'rollout') ? (
        <div className="step-ctrl">
          <button type="button" className="tiny ghost" onClick={() => setSelected((v) => clamp(v - 1, 0, 5))}>上一步</button>
          <span className="step-label">进度 <b>{selected}/5</b></span>
          <button type="button" className="tiny" onClick={() => setSelected((v) => clamp(v + 1, 0, 5))}>下一步</button>
          <button type="button" className="tiny ghost" onClick={() => setSelected(0)}>重置</button>
        </div>
      ) : null}
      {(mode === 'context') ? (
        <div className="chip-row">
          {['固定锚点', '时间记忆', '空间记忆', '最近帧'].map((x, i) => <button key={x} type="button" className={`chip ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}>{x}</button>)}
        </div>
      ) : null}
      {(mode === 'corruption') ? (
        <div className="chip-row">
          {['噪声', '模糊', '饱和度', '论文方法'].map((x, i) => <button key={x} type="button" className={`chip ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}>{x}</button>)}
        </div>
      ) : null}
      {(mode === 'architecture') ? (
        <div className="chip-row">
          {['Sink', '时间记忆', '空间记忆', '最近帧', '目标块'].map((x, i) => <button key={x} type="button" className={`chip ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}>{x}</button>)}
        </div>
      ) : null}
      {(mode === 'compare') ? <div className="step-ctrl"><button type="button" className="tiny" onClick={() => { setStarted(true); startRef.current = performance.now(); }}>同步试走</button><button type="button" className="tiny ghost" onClick={() => setStarted(false)}>重置</button></div> : null}
      {(mode === 'race') ? (
        <>
          <div className="chip-row">{['记忆对称性', '轨迹准确率', '亮度一致性'].map((x, i) => <button key={x} type="button" className={`chip ${metric === i ? 'selected' : ''}`} onClick={() => setMetric(i)}>{x}</button>)}</div>
          <div className="step-ctrl"><button type="button" className="tiny" onClick={() => { setStarted(false); requestAnimationFrame(() => setStarted(true)); }}>开始对比</button></div>
          <div className="metrics">{[['Memory Symmetry', metric === 0 ? '0.8871' : metric === 1 ? '0.7985' : '0.9492'], ['HY-World 1.5', metric === 0 ? '0.8481' : metric === 1 ? '0.7472' : '0.8051'], ['方向', '越高越好']].map(([l, v]) => <div className="metric" key={l}><div className="l">{l}</div><div className="v">{v}</div></div>)}</div>
        </>
      ) : null}
      {DRAG_MODES.has(mode) ? <div className="ctrl"><span>{mode === 'coverage' ? '覆盖帧' : '相对位姿'}</span><span className="val">{mode === 'coverage' ? Math.round(value) : value}</span></div> : null}
      <div className={`feedback ${fb.tone}`}>{fb.text}</div>
    </div>
  );
}

export const AlayaShared = () => <AlayaWidget mode="horizon" />;
