import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 320;
const BAR_X = 55;
const BAR_W = 650;
const C = { bg: '#f5f8f0', blue: '#27446e', green: '#228d5c', orange: '#f07e47', purple: '#7c3aed', route: '#92400e', dark: '#76906a', ink: '#21324a', muted: '#68778f', line: '#d7deea' };
type Filter = 'category' | 'language' | 'modality';
interface Segment { label: string; count: number; color: string; detail: string }
const data: Record<Filter, Segment[]> = {
  category: [
    { label: '生产力', count: 10, color: C.blue, detail: '生产力：10 个任务。' },
    { label: '代码智能', count: 12, color: C.green, detail: '代码智能：12 个任务，是数量最多的一类。' },
    { label: '社交互动', count: 6, color: C.orange, detail: '社交互动：6 个任务。' },
    { label: '检索', count: 11, color: C.purple, detail: '检索：11 个任务。' },
    { label: '创作', count: 11, color: C.route, detail: '创作：11 个任务。' },
    { label: '安全', count: 10, color: C.dark, detail: '安全：10 个任务。' },
  ],
  language: [
    { label: '英文', count: 36, color: C.blue, detail: '英文：36 个任务。' },
    { label: '中文', count: 24, color: C.orange, detail: '中文：24 个任务。' },
  ],
  modality: [
    { label: '纯文本', count: 34, color: C.blue, detail: '纯文本：34 个任务。' },
    { label: '多模态', count: 26, color: C.orange, detail: '多模态占 26/60（43.3%），不是少量点缀。' },
  ],
};
const filterLabels: Record<Filter, string> = { category: '任务类别', language: '语言', modality: '模态' };

export const CoverageExplorer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const [model, setModel] = useState<{ cursor: number; filter: Filter }>({ cursor: 0, filter: 'category' });
  const segments = data[model.filter];
  const selected = segments[model.cursor] ?? segments[0];

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.height = 'auto';
    const render = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.ink; ctx.font = '700 21px "Segoe UI", sans-serif'; ctx.fillText(`${filterLabels[model.filter]}视角`, BAR_X, 48);
      ctx.fillStyle = C.muted; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('拖动分隔线，或聚焦画布后按 ← / →', BAR_X, 73);
      let x = BAR_X;
      let dividerX = BAR_X;
      segments.forEach((segment, index) => {
        const width = BAR_W * segment.count / 60;
        const active = index === model.cursor; const y = active ? 112 : 122; const h = active ? 82 : 62;
        ctx.fillStyle = segment.color; ctx.beginPath(); ctx.roundRect(x + 1, y, Math.max(4, width - 2), h, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `${active ? '700 16px' : '600 14px'} "Segoe UI", sans-serif`; ctx.textAlign = 'center';
        if (width > 64) ctx.fillText(segment.label, x + width / 2, y + 31);
        ctx.fillText(String(segment.count), x + width / 2, y + 54);
        x += width; if (index === model.cursor) dividerX = x;
      });
      ctx.textAlign = 'left'; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dividerX, 94); ctx.lineTo(dividerX, 220); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(dividerX - 8, 94); ctx.lineTo(dividerX + 8, 94); ctx.lineTo(dividerX, 105); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.muted; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('0', BAR_X, 232); ctx.textAlign = 'right'; ctx.fillText('60 个任务', BAR_X + BAR_W, 232); ctx.textAlign = 'left';

      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(744, 32); ctx.lineTo(744, 287); ctx.stroke();
      ctx.fillStyle = selected.color; ctx.beginPath(); ctx.roundRect(790, 66, 220, 56, 28); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 22px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${selected.label} · ${selected.count}`, 900, 102); ctx.textAlign = 'left';
      ctx.fillStyle = C.ink; ctx.font = '700 19px "Segoe UI", sans-serif'; ctx.fillText('当前分段', 790, 158);
      ctx.fillStyle = C.muted; ctx.font = '16px "Segoe UI", sans-serif';
      const lines = selected.detail.length > 22 ? [selected.detail.slice(0, 22), selected.detail.slice(22)] : [selected.detail];
      lines.forEach((line, i) => ctx.fillText(line, 790, 193 + i * 27));
      ctx.fillStyle = C.green; ctx.font = '600 15px "Segoe UI", sans-serif'; ctx.fillText('总计始终为 60', 790, 273);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => {}); return () => disconnect();
  }, [model.cursor, model.filter, segments, selected]);

  const selectFromPointer = (clientX: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect(); const logicalX = (clientX - rect.left) * W / rect.width;
    const countPosition = clamp((logicalX - BAR_X) / BAR_W * 60, 0, 59.999);
    let sum = 0; let next = 0;
    segments.some((segment, index) => { sum += segment.count; if (countPosition < sum) { next = index; return true; } return false; });
    setModel({ filter: model.filter, cursor: next });
  };
  const move = (delta: number) => setModel({ filter: model.filter, cursor: clamp(model.cursor + delta, 0, segments.length - 1) });
  const feedback = model.filter === 'modality' && selected.label === '多模态'
    ? '多模态占 26/60（43.3%），不是少量点缀。'
    : model.filter === 'category' && selected.label === '代码智能'
      ? '代码智能：12 个任务，是数量最多的一类。'
      : `${selected.detail} 三种视角合计都回到同一组 60 个任务。`;
  const feedbackColor = model.filter === 'modality' && selected.label === '多模态'
    ? C.orange
    : model.filter === 'category' && selected.label === '代码智能' ? C.blue : C.green;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} tabIndex={0}
        aria-label={`${filterLabels[model.filter]}覆盖分布，当前为${selected.label}${selected.count}个任务`}
        onPointerDown={(event) => { draggingRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); selectFromPointer(event.clientX); }}
        onPointerMove={(event) => { if (draggingRef.current) selectFromPointer(event.clientX); }}
        onPointerUp={(event) => { draggingRef.current = false; event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { draggingRef.current = false; }}
        onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } }}
      />
      <div className="ctrl" role="group" aria-label="覆盖面视角">
        {(Object.keys(filterLabels) as Filter[]).map((filter) => <button key={filter} type="button" className={`chip ${model.filter === filter ? 'active' : ''}`} aria-pressed={model.filter === filter} onClick={() => setModel({ filter, cursor: 0 })}>{filterLabels[filter]}</button>)}
      </div>
      <div className={`feedback ${feedbackColor === C.green ? 'good' : ''}`} style={{ borderLeftColor: feedbackColor }}>{feedback}</div>
    </div>
  );
};

export default CoverageExplorer;
