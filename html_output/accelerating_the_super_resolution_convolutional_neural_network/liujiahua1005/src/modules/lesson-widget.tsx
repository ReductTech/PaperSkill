import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearScene, drawSetting, drawSubject, drawTarget, drawSupport, scene } from './photo-scene';

type LessonState = { scale: number; region: number; stage: number; mode: number; layer: number; variant: number; dataset: number; progress: number; running: boolean };
const initial: LessonState = { scale: 3, region: 0, stage: 0, mode: 0, layer: 0, variant: 0, dataset: 0, progress: 0, running: false };
const sets = [
  { name: 'Set5 ×3', values: [32.83, 32.55, 33.06], times: [1.30, 0.010, 0.027] },
  { name: 'Set14 ×3', values: [29.26, 29.08, 29.37], times: [2.80, 0.023, 0.061] },
  { name: 'BSD200 ×3', values: [28.47, 28.32, 28.55], times: [1.70, 0.013, 0.035] },
];
const variants = [
  { name: 'SRCNN-Ex', params: 57184, psnr: 32.83, speed: 1 },
  { name: '过渡结构 2', params: 17088, psnr: 33.01, speed: 30.1 },
  { name: 'FSRCNN (56,12,4)', params: 12464, psnr: 33.06, speed: 41.3 },
];
const layerCopy = [
  '第一段：卷积在低分辨率输入上提取特征，避免先插值。',
  '第二段：收缩到 s 个通道，再用 m 个小卷积映射层处理。',
  '第三段：扩展通道，反卷积一次性恢复高分辨率。',
];

function photo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clarity: number, color: string) {
  drawSetting(ctx, x, y, w, h);
  drawTarget(ctx, x + 16, y + 12, w - 32, h - 24, clarity, color);
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) {
  ctx.fillStyle = scene.border;
  ctx.fillRect(x, y, 350, 22);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, width), 22);
}

function draw(ctx: CanvasRenderingContext2D, id: string, s: LessonState) {
  clearScene(ctx, 1080, 280);
  drawSupport(ctx, 32, 252, 1016);
  if (id === '1.1') {
    photo(ctx, 48, 30, 440, 194, 0.24, scene.red);
    const cell = 18 + (s.scale - 2) * 12;
    ctx.fillStyle = '#e8eee5'; ctx.fillRect(594, 30, 422, 194);
    for (let x = 606; x < 1000; x += cell) for (let y = 42; y < 210; y += cell) {
      const band = Math.sin((x + y) / 48);
      ctx.fillStyle = band > 0 ? '#b6c6ae' : '#8caa9e';
      ctx.fillRect(x, y, cell - 2, cell - 2);
    }
    ctx.strokeStyle = scene.orange; ctx.lineWidth = 4; ctx.strokeRect(667, 74, 238, 110);
    return;
  }
  if (id === '2.1') {
    photo(ctx, 48, 30, 480, 194, 0.34, scene.blue);
    const cx = 105 + s.region * 128;
    ctx.strokeStyle = scene.orange; ctx.lineWidth = 5; ctx.strokeRect(cx, 85, 95, 88);
    ctx.fillStyle = '#e8eee5'; ctx.fillRect(608, 30, 407, 194);
    for (let col = 0; col < 8; col++) for (let row = 0; row < 4; row++) {
      ctx.fillStyle = (col + row + s.region) % 3 === 0 ? '#8eaa9e' : '#c3d1b9';
      ctx.fillRect(622 + col * 47, 43 + row * 43, 43, 39);
    }
    return;
  }
  if (id === '3.1' || id === '5.1') {
    photo(ctx, 38, 40, 372, 170, id === '3.1' ? 0.3 + s.stage * 0.28 : 0.7, id === '3.1' && s.stage < 2 ? scene.blue : scene.green);
    const active = id === '3.1' ? s.stage : s.layer;
    ctx.strokeStyle = scene.border; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(500, 126); ctx.lineTo(967, 126); ctx.stroke();
    ctx.strokeStyle = scene.blue; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(500, 126); ctx.lineTo(560 + active * 185, 126); ctx.stroke();
    [0, 1, 2].forEach((n) => {
      const x = 560 + n * 185;
      ctx.fillStyle = n === active ? scene.orange : n < active ? scene.green : '#e8eee5';
      ctx.strokeStyle = n === active ? scene.blue : scene.border;
      ctx.lineWidth = n === active ? 5 : 2;
      ctx.beginPath(); ctx.arc(x, 126, 47, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = scene.text; ctx.font = '24px sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(['提取', '瓶颈', '上采样'][n], x, 134);
    });
    ctx.textAlign = 'start';
    return;
  }
  if (id === '4.1') {
    photo(ctx, 48, 30, 430, 194, s.mode === 0 ? 0.25 : 0.96, s.mode === 0 ? scene.red : scene.green);
    ctx.fillStyle = '#e8eee5'; ctx.fillRect(575, 30, 435, 194);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(633, 65, 319, 126);
    ctx.strokeStyle = s.mode === 0 ? scene.red : scene.green;
    ctx.lineWidth = 5; ctx.strokeRect(633, 65, 319, 126);
    ctx.strokeStyle = scene.orange; ctx.lineWidth = 4;
    ctx.strokeRect(665, 84, 255, 88);
    bar(ctx, 617, 204, s.mode === 0 ? 250 : 82, s.mode === 0 ? scene.red : scene.green);
    return;
  }
  if (id === '5.2') {
    photo(ctx, 48, 30, 370, 194, 0.5 + s.variant * 0.2, scene.green);
    drawSubject(ctx, 487, 124, 48 + s.variant * 8, s.variant * 0.2, scene.blue);
    const v = variants[s.variant];
    bar(ctx, 640, 64, v.params / 57184 * 350, scene.orange);
    bar(ctx, 640, 142, (v.psnr - 32.4) / 0.7 * 350, scene.green);
    ctx.fillStyle = scene.text; ctx.font = '24px sans-serif';
    ctx.fillText(v.params.toLocaleString(), 640, 58);
    ctx.fillText(v.psnr.toFixed(2), 640, 137);
    return;
  }
  if (id === '6.1') {
    const values = sets[s.dataset].values;
    const colors = [scene.red, scene.blue, scene.green];
    values.forEach((value, index) => {
      const y = 43 + index * 72;
      ctx.fillStyle = scene.border; ctx.fillRect(95, y, 805, 29);
      ctx.fillStyle = colors[index]; ctx.fillRect(95, y, (value / 40) * 805 * s.progress, 29);
      ctx.fillStyle = scene.text; ctx.font = '22px sans-serif';
      ctx.fillText(value.toFixed(2), 925, y + 23);
    });
  }
}

function feedback(id: string, s: LessonState): { text: string; cls: string } {
  if (id === '1.1') return { text: s.scale === 2 ? '低倍率仍会扩大后续计算面积。' : s.scale === 3 ? '三倍放大让每层都处理更大的特征图。' : '倍率越高，先插值的空间开销增长越快。', cls: s.scale === 2 ? '' : 'bad' };
  if (id === '2.1') return { text: ['SRCNN 先插值，再在高分辨率空间卷积。', 'FSRCNN 保持低分辨率特征，计算更省。', '反卷积在末端一次性恢复输出尺寸。'][s.region], cls: s.region === 1 ? 'good' : '' };
  if (id === '3.1') return { text: ['卷积先提取低分辨率特征。', '收缩层把 d 个通道压到 s 个，映射层在瓶颈中工作。', '扩展后交给反卷积恢复图像。'][s.stage], cls: s.stage === 2 ? 'good' : '' };
  if (id === '4.1') return { text: s.mode === 0 ? 'FSRCNN 的训练输入保留在低分辨率空间。' : '反卷积放在末端，直接对齐高分辨率真值。', cls: s.mode === 0 ? 'bad' : 'good' };
  if (id === '5.1') return { text: layerCopy[s.layer], cls: s.layer === 2 ? 'good' : '' };
  if (id === '5.2') return { text: [`${variants[s.variant].name}：${variants[s.variant].params.toLocaleString()} 参数，${variants[s.variant].speed}× 相对速度。`, '收缩和映射减少计算，同时保持更多映射层。', '更小的 FSRCNN 配置也能取得更高 Set5 PSNR。'][s.variant], cls: s.variant === 2 ? 'good' : '' };
  return { text: s.progress === 0 ? `已选 ${sets[s.dataset].name}，比较 PSNR 与测试时间。` : `${sets[s.dataset].name}：FSRCNN ${sets[s.dataset].values[2].toFixed(2)} dB，测试时间 ${sets[s.dataset].times[2].toFixed(3)} 秒。`, cls: s.progress >= 1 ? 'good' : '' };
}

export const LessonWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<LessonState>({ ...initial });
  const [state, setState] = useState<LessonState>({ ...initial });
  const [dragging, setDragging] = useState(false);
  const update = (patch: Partial<LessonState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 1080, 280);
    let raf = 0;
    let active = false;
    let previous = 0;
    const tick = (now: number) => {
      if (moduleId === '6.1' && stateRef.current.running) {
        const elapsed = previous ? (now - previous) / 1400 : 0;
        const progress = Math.min(1, stateRef.current.progress + elapsed);
        stateRef.current = { ...stateRef.current, progress, running: progress < 1 };
        setState(stateRef.current);
      }
      previous = now;
      draw(ctx, moduleId, stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (active) raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!active) { active = true; raf = requestAnimationFrame(tick); } };
    const stop = () => { active = false; cancelAnimationFrame(raf); previous = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [moduleId]);

  const selectCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 1080;
    if (moduleId === '2.1' && x >= 48 && x <= 528) update({ region: Math.max(0, Math.min(2, Math.round((x - 153) / 128))) });
    if (moduleId === '5.1' && x >= 500) update({ layer: Math.max(0, Math.min(2, Math.round((x - 560) / 185))) });
  };

  const choices = (labels: string[], value: number, field: 'region'|'mode'|'layer'|'variant'|'dataset') => <div className="chip-row" role="group" aria-label="可选模式">
    {labels.map((label, index) => <button key={label} type="button" className={`chip ${value === index ? 'selected' : ''}`} aria-pressed={value === index} onClick={() => update(field === 'dataset' ? { dataset: index, progress: 0, running: false } : { [field]: index })}>{label}</button>)}
  </div>;

  return <div className="srcnn-widget">
    <canvas ref={canvasRef} width={1080} height={280} aria-label="随所选参数变化的照片和论文机制示意" onPointerDown={(event) => { setDragging(true); selectCanvas(event); }} onPointerMove={(event) => { if (dragging && moduleId === '2.1') selectCanvas(event); }} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)} />
    {moduleId === '1.1' && <div className="ctrl"><label htmlFor={`${chapterId}-scale`}>放大倍率 <span className="val">{state.scale}×</span></label><input id={`${chapterId}-scale`} type="range" min="2" max="4" step="1" value={state.scale} onChange={(event) => update({ scale: Number(event.target.value) })} /></div>}
    {moduleId === '2.1' && choices(['SRCNN 先插值', 'FSRCNN 低分辨率', '末端上采样'], state.region, 'region')}
    {moduleId === '3.1' && <div className="step-ctrl"><button type="button" className="chip" disabled={state.stage === 0} onClick={() => update({ stage: state.stage - 1 })}>上一段</button><span>第 {state.stage + 1} / 3 段</span><button type="button" className="chip" disabled={state.stage === 2} onClick={() => update({ stage: state.stage + 1 })}>下一段</button></div>}
    {moduleId === '4.1' && choices(['低分辨率输入', '高分辨率目标'], state.mode, 'mode')}
    {moduleId === '5.1' && choices(['特征提取', '非线性映射', '重建'], state.layer, 'layer')}
    {moduleId === '5.2' && <>{choices(variants.map((item) => item.name), state.variant, 'variant')}<div className="srcnn-metrics"><span>卷积权重数 <strong>{variants[state.variant].params.toLocaleString()}</strong></span><span>相对加速 <strong>{variants[state.variant].speed}×</strong></span><span>Set5 ×3 亮度 PSNR <strong>{variants[state.variant].psnr.toFixed(2)} dB</strong></span></div><p className="srcnn-caveat">论文表 1 的参数量不含 PReLU 的少量参数；这里展示论文报告的卷积网络参数量。</p></>}
    {moduleId === '6.1' && <>{choices(sets.map((item) => item.name), state.dataset, 'dataset')}<div className="srcnn-results"><span>SRCNN-Ex <strong>{sets[state.dataset].values[0].toFixed(2)}</strong></span><span>FSRCNN-s <strong>{sets[state.dataset].values[1].toFixed(2)}</strong></span><span>FSRCNN <strong>{sets[state.dataset].values[2].toFixed(2)}</strong></span><span>时间 <strong>{sets[state.dataset].times[2].toFixed(3)}s</strong></span><button type="button" className="chip" onClick={() => update({ progress: 0, running: true })}>开始对照</button></div></>}
    <div className={`feedback ${feedback(moduleId, state).cls}`} role="status">{feedback(moduleId, state).text}</div>
    {moduleId === '6.1' && <p className="srcnn-caveat">上述结果来自论文表 3：91 张图训练、三倍放大、亮度 PSNR（dB）及 Intel i7 4.0 GHz 上的 C++ 测试时间（秒）；图示为教学示意。PSNR 越高越好，时间越短越快。FSRCNN-s 的 24.7 fps 是另一项实时配置。论文还报告跨倍率迁移可加快训练收敛。</p>}
  </div>;
};
