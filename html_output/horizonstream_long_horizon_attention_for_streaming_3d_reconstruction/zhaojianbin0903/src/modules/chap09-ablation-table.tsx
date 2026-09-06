import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

const LENGTHS = [80, 200, 1000] as const;
type Length = (typeof LENGTHS)[number];
type VariantKey = 'full' | 'linear' | 'local';

const VARIANTS: Record<VariantKey, { label: string; values: Record<Length, number> }> = {
  full: { label: '完整模型', values: { 80: 0.42, 200: 0.71, 1000: 1.2 } },
  linear: { label: '去掉几何线性注意力', values: { 80: 0.83, 200: 2.06, 1000: 5.38 } },
  local: { label: '去掉几何局部注意力', values: { 80: 0.78, 200: 2.64, 1000: 7.46 } },
};

export const Chap09AblationTable: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [length, setLength] = useState<Length>(1000);
  const [variant, setVariant] = useState<VariantKey>('linear');
  const [auto, setAuto] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selected = VARIANTS[variant].values[length];
  const baseline = VARIANTS.full.values[length];

  useEffect(() => {
    if (!auto || (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const lengths = [...LENGTHS];
    const variants: VariantKey[] = ['full', 'linear', 'local'];
    let index = 2;
    const timer = window.setInterval(() => {
      index = (index + 1) % variants.length;
      setVariant(variants[index]);
      setLength(lengths[index % lengths.length]);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [auto]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 210);
    canvas.classList.add('is-ready', 'hs-route-canvas');
    const root = getComputedStyle(document.documentElement);
    const ink = root.getPropertyValue('--ink').trim() || '#17202b';
    const muted = root.getPropertyValue('--slate').trim() || '#667085';
    const green = root.getPropertyValue('--green').trim() || '#16875b';
    const red = root.getPropertyValue('--red').trim() || '#c43d37';
    const blue = root.getPropertyValue('--blue').trim() || '#1455d9';
    ctx.clearRect(0, 0, 560, 210);
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, 560, 210);

    ctx.strokeStyle = '#d5dbe3';
    ctx.lineWidth = 1;
    for (let x = 32; x < 560; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 26);
      ctx.lineTo(x, 180);
      ctx.stroke();
    }

    const drawRoute = (color: string, offset: number, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(40, 145);
      ctx.bezierCurveTo(130, 75 + offset * 0.2, 205, 165 - offset * 0.2, 285, 95 + offset * 0.45);
      ctx.bezierCurveTo(360, 35 + offset * 0.75, 432, 132 - offset * 0.35, 520, 64 + offset);
      ctx.stroke();
    };

    drawRoute(green, 0, 5);
    const deviation = variant === 'full' ? 0 : clamp(((selected - baseline) / 7) * 55, 4, 55);
    drawRoute(variant === 'full' ? blue : red, deviation, 3);

    ctx.fillStyle = ink;
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText(`${length} 帧 · ATE ↓`, 26, 28);
    ctx.fillStyle = variant === 'full' ? green : red;
    ctx.font = '800 30px "Cascadia Code", monospace';
    ctx.fillText(selected.toFixed(2), 26, 66);
    ctx.fillStyle = muted;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('绿色：完整模型路线', 26, 194);
    ctx.fillText(`${variant === 'full' ? '蓝色' : '红色'}：当前选择（路线偏移仅为机制示意）`, 190, 194);
  }, [length, variant, selected, baseline]);

  const delta = selected - baseline;

  return (
    <div className="hs-ablation-lab">
      <div className="chip-row" role="group" aria-label="选择评测帧数">
        {LENGTHS.map((value) => (
          <button key={value} type="button" className={`chip ${length === value ? 'selected' : ''}`} aria-pressed={length === value} onClick={() => { setAuto(false); setLength(value); }}>{value} 帧</button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="选择消融设置">
        {(Object.keys(VARIANTS) as VariantKey[]).map((key) => (
          <button key={key} type="button" className={`chip ${variant === key ? 'selected' : ''}`} aria-pressed={variant === key} onClick={() => { setAuto(false); setVariant(key); }}>{VARIANTS[key].label}</button>
        ))}
      </div>

      <div className="step-ctrl">
        <button type="button" className={`tiny ${auto ? '' : 'ghost'}`} aria-pressed={auto} onClick={() => setAuto((value) => !value)}>
          {auto ? '暂停自动演示' : '自动演示'}
        </button>
        <span className="step-label">同一列内比较 ATE，数值越低越好</span>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={560} height={210} aria-label="选中消融设置与完整模型的概念路线对比" />

      <div className={`feedback ${variant === 'full' ? 'good' : 'bad'}`} aria-live="polite">
        {VARIANTS[variant].label}：{length} 帧 ATE = <strong>{selected.toFixed(2)}</strong>。
        {variant === 'full' ? '这是该列完整模型值。' : `比完整模型 ${baseline.toFixed(2)} 高 ${delta.toFixed(2)}。`}
      </div>

      <div className="hs-table-source">
        <img src={assetPath('images/table-6-vkitti2-ablation.png')} alt="原论文 Table 6 vKITTI2 ATE 消融表" />
        <div>
          <strong>原论文 Table 6 · vKITTI2 · ATE 越低越好</strong>
          <p>所有交互数值都来自这张表；只在相同帧数列内比较设置。</p>
        </div>
      </div>

      <style>{`
        .hs-ablation-lab{display:grid;gap:12px}.hs-ablation-lab canvas.hs-route-canvas{width:100%!important;height:auto!important;aspect-ratio:560/210;margin:0}.hs-table-source{display:grid;grid-template-columns:minmax(220px,42%) 1fr;gap:16px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:8px;background:var(--paper-2)}.hs-table-source img{display:block;width:100%;max-height:240px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px}.hs-table-source strong{color:var(--ink)}.hs-table-source p{margin:5px 0 0!important;color:var(--ink-2)!important;font-size:14px;line-height:1.55}@media(max-width:720px){.hs-table-source{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
};

export default Chap09AblationTable;
