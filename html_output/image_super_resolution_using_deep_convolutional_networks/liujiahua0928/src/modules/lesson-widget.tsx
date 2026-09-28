import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearScene, drawSetting, drawSubject, drawTarget, drawSupport, scene } from './photo-scene';

type LessonState = { scale: number; region: number; stage: number; mode: number; layer: number; variant: number; dataset: number; progress: number; running: boolean };
const initial: LessonState = { scale: 3, region: 0, stage: 0, mode: 0, layer: 0, variant: 0, dataset: 0, progress: 0, running: false };
const sets = [
  { name: 'Set5', values: [30.39, 32.59, 32.75] },
  { name: 'Set14', values: [27.54, 29.13, 29.30] },
  { name: 'BSD200', values: [25.94, 27.05, 27.18] },
];
const variants = [
  { name: '9-1-5', params: 8032, psnr: 32.52 },
  { name: '9-3-5', params: 24416, psnr: 32.66 },
  { name: '9-5-5', params: 57184, psnr: 32.75 },
];
const layerCopy = [
  '第一层：9×9 卷积与 ReLU 提取局部特征，亮度输入 c=1 时输出 64 通道。',
  '第二层：1×1 卷积与 ReLU 把 64 通道映射为 32 通道。',
  '第三层：5×5 线性卷积聚合特征，输出重建图像。',
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
      ctx.textAlign = 'center'; ctx.fillText(['9×9', '1×1', '5×5'][n], x, 134);
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
    bar(ctx, 640, 142, (v.psnr - 32.4) / 0.4 * 350, scene.green);
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
  if (id === '1.1') return { text: s.scale === 2 ? '插值扩大了图像，缺失的边缘信息仍无法唯一找回。' : s.scale === 3 ? '三倍放大让模糊边缘更明显；需要利用训练得到的图像先验。' : '倍率越高，单靠已有像素越难推断可靠细节。', cls: s.scale === 2 ? '' : 'bad' };
  if (id === '2.1') return { text: ['双三次插值只估计平滑像素，不保证真实纹理。', '相同尺寸的 Y 与 X，边缘锐度仍可能不同。', '训练配对将插值输入 Y 与真值 X 对齐。'][s.region], cls: '' };
  if (id === '3.1') return { text: ['第一层卷积与 ReLU 提取局部特征图。', '第二层将 64 维特征映射到 32 维表示；1×1 仅逐位置混合通道。', '最后一层线性卷积聚合表示，输出重建图像。'][s.stage], cls: s.stage === 2 ? 'good' : '' };
  if (id === '4.1') return { text: s.mode === 0 ? '训练样本先模糊、降采样，再插值成网络输入。' : '无填充卷积使输出变小；损失只比较对齐的中心区域。', cls: s.mode === 0 ? 'bad' : 'good' };
  if (id === '5.1') return { text: layerCopy[s.layer], cls: s.layer === 2 ? 'good' : '' };
  if (id === '5.2') return { text: ['基础核参数最少，质量是该实验的起点。', '3×3 映射核利用邻域线索，也增加参数。', '5×5 在该设置最高，但比 9-3-5 多很多参数，增益较小。'][s.variant], cls: s.variant === 2 ? 'good' : '' };
  return { text: s.progress === 0 ? `已选 ${sets[s.dataset].name}，三倍放大亮度通道 PSNR，越高越好。` : `${sets[s.dataset].name}：SRCNN ${sets[s.dataset].values[2].toFixed(2)} dB，高于本表中的 A+ 与双三次插值。`, cls: s.progress >= 1 ? 'good' : '' };
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
    {moduleId === '2.1' && choices(['区域一', '区域二', '区域三'], state.region, 'region')}
    {moduleId === '3.1' && <div className="step-ctrl"><button type="button" className="chip" disabled={state.stage === 0} onClick={() => update({ stage: state.stage - 1 })}>上一层</button><span>第 {state.stage + 1} / 3 层</span><button type="button" className="chip" disabled={state.stage === 2} onClick={() => update({ stage: state.stage + 1 })}>下一层</button></div>}
    {moduleId === '4.1' && choices(['插值输入', '对照真值'], state.mode, 'mode')}
    {moduleId === '5.1' && choices(['特征提取', '非线性映射', '重建'], state.layer, 'layer')}
    {moduleId === '5.2' && <>{choices(variants.map((item) => item.name), state.variant, 'variant')}<div className="srcnn-metrics"><span>卷积权重数 <strong>{variants[state.variant].params.toLocaleString()}</strong></span><span>Set5 ×3 亮度 PSNR <strong>{variants[state.variant].psnr.toFixed(2)} dB</strong></span></div><p className="srcnn-caveat">论文 §4.3.2 称上述数量为“参数量”；这里按卷积权重统计，未计入偏置。</p></>}
    {moduleId === '6.1' && <>{choices(sets.map((item) => item.name), state.dataset, 'dataset')}<div className="srcnn-results"><span>双三次插值 <strong>{sets[state.dataset].values[0].toFixed(2)}</strong></span><span>A+ <strong>{sets[state.dataset].values[1].toFixed(2)}</strong></span><span>SRCNN <strong>{sets[state.dataset].values[2].toFixed(2)}</strong></span><button type="button" className="chip" onClick={() => update({ progress: 0, running: true })}>开始对照</button></div></>}
    <div className={`feedback ${feedback(moduleId, state).cls}`} role="status">{feedback(moduleId, state).text}</div>
    {moduleId === '6.1' && <p className="srcnn-caveat">上述三组分数均为三倍放大、亮度通道 PSNR（dB，越高越好）；SRCNN 为 ImageNet 训练的 9-5-5 网络。另一个独立的 Set5 彩色实验使用 91 张图训练：RGB 联合训练的整幅彩色图像 PSNR 为 36.44 dB，Y-only 为 36.37 dB，不能与上图混为同一协议。论文测试的更深结构也没有稳定优于三层结构。原论文：Dong 等，<a href="https://arxiv.org/abs/1501.00092" target="_blank" rel="noreferrer">Image Super-Resolution Using Deep Convolutional Networks</a>，§4.3–4.5、表 2–5。</p>}
  </div>;
};
