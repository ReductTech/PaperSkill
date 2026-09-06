import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Mode = 'generation' | 'editing';
const W = 760;
const H = 360;
const C = {
  field: '#f5f0e8', paper: '#faf9f5', light: '#d8c9b0', support: '#8a5a33',
  blue: '#cc785c', green: '#5db872', orange: '#e8a55a', purple: '#5db8a6',
  ink: '#252523', muted: '#6c6a64', axis: '#e6dfd8',
};

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, stroke = C.axis) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = stroke === C.axis ? 1.5 : 2.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 5);
  ctx.textAlign = 'left';
}

function path(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9, y2 - 5); ctx.lineTo(x2 - 9, y2 + 5); ctx.closePath(); ctx.fill();
}

export const ConditioningLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mode, setMode] = useState<Mode>('generation');
  const editing = mode === 'editing';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%'; canvas.style.height = 'auto'; canvas.style.maxWidth = `${W}px`;
    ctx.fillStyle = C.field; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.ink; ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText(editing ? '指令编辑：源图与目标分帧' : '文生图：文字条件指向目标', 24, 42);

    // Stable regions.
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
    ctx.fillRect(24, 72, 240, 220); ctx.strokeRect(24, 72, 240, 220);
    ctx.fillRect(286, 72, 190, 220); ctx.strokeRect(286, 72, 190, 220);
    ctx.fillRect(500, 72, 236, 220); ctx.strokeRect(500, 72, 236, 220);

    // Poster-desk view.
    ctx.fillStyle = C.paper; ctx.strokeStyle = C.light; ctx.lineWidth = 2;
    ctx.fillRect(60, 116, 166, 126); ctx.strokeRect(60, 116, 166, 126);
    ctx.fillStyle = C.blue; ctx.fillRect(80, 140, 126, 24);
    ctx.fillStyle = editing ? C.purple : C.light;
    ctx.fillRect(80, 178, 82, 42);
    if (editing) {
      ctx.strokeStyle = C.purple; ctx.lineWidth = 2.5; ctx.strokeRect(42, 92, 72, 52);
      ctx.fillStyle = C.purple; ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.fillText('源图参考', 50, 112);
      path(ctx, 112, 126, 148, 150, C.purple);
    } else {
      box(ctx, 44, 88, 92, 38, '文字提示 τ', C.blue);
    }
    ctx.strokeStyle = C.green; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(196, 224); ctx.lineTo(218, 224); ctx.moveTo(207, 213); ctx.lineTo(207, 235); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('同一张目标海报', 80, 266);

    // Conditioning nodes.
    if (editing) {
      box(ctx, 306, 92, 150, 48, '源图+指令 τ', C.blue);
      box(ctx, 306, 154, 150, 42, '源图 z_src · f=源', C.purple);
      box(ctx, 306, 210, 150, 48, '带噪目标 z_tgt · f=目标', C.orange);
    } else {
      box(ctx, 306, 112, 150, 48, '文本 τ', C.blue);
      box(ctx, 306, 194, 150, 48, '带噪目标 z_tgt', C.orange);
      ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('文生图没有源图帧', 323, 278);
    }

    // Backbone and active paths.
    box(ctx, 536, 126, 164, 72, 'NR-MMDiT', C.blue);
    box(ctx, 550, 222, 136, 42, editing ? '位置 (h,w,f)' : '位置 (h,w)', C.orange);
    if (editing) {
      path(ctx, 456, 116, 536, 146, C.blue);
      path(ctx, 456, 175, 536, 163, C.purple);
      path(ctx, 456, 234, 536, 181, C.blue);
    } else {
      path(ctx, 456, 136, 536, 150, C.blue);
      path(ctx, 456, 218, 536, 178, C.blue);
    }
    ctx.strokeStyle = C.green; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(520, 276); ctx.lineTo(708, 276); ctx.stroke();
    ctx.fillStyle = C.green; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('损失仅监督目标 token', 540, 290);

    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.fillRect(24, 306, 712, 36); ctx.strokeRect(24, 306, 712, 36);
    ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(editing ? '蓝：当前条件  紫：源图辅助条件  橙：帧坐标  绿：目标监督' : '蓝：文本条件与活动路径  橙：二维位置  绿：目标监督', 40, 329);
    canvas.classList.add('is-ready');
  }, [editing]);

  const selectMode = (next: Mode) => setMode(next);
  const onChipKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : event.key === 'ArrowRight' ? (index + 1) % 2 : (index + 1) % 2;
    const nextMode: Mode = nextIndex === 0 ? 'generation' : 'editing';
    selectMode(nextMode);
    chipRefs.current[nextIndex]?.focus();
  };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="任务模式">
        {(['generation', 'editing'] as const).map((item, index) => (
          <button
            key={item}
            ref={(element) => { chipRefs.current[index] = element; }}
            type="button"
            className={`chip ${mode === item ? 'selected' : ''}`}
            aria-pressed={mode === item}
            onClick={() => selectMode(item)}
            onKeyDown={(event) => onChipKey(event, index)}
          >
            {item === 'generation' ? '文生图' : '指令编辑'}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-hidden="true" />
      <div className="step-desc">
        当前条件：{editing ? 'τ（源图+编辑指令）+ z_src + 带噪 z_tgt；位置 (h,w,f)' : '文本 τ + 带噪 z_tgt；位置 (h,w)'}。两种模式都只监督目标 token。
      </div>
      <div className={`feedback ${editing ? 'good' : ''}`} aria-live="polite">
        {editing ? '✓ 额外帧坐标区分源图与目标，损失仍只监督目标 token。' : '→ 文本条件引导目标潜变量生成。'}
      </div>
    </div>
  );
};

export default ConditioningLab;
