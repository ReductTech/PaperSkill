import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Variant = 'base' | 'aligned' | 'turbo';
const W = 780;
const H = 390;
const TOTAL: Record<Variant, 30 | 20 | 4> = { base: 30, aligned: 20, turbo: 4 };
const LABEL: Record<Variant, string> = { base: '基础版', aligned: '对齐版', turbo: '极速版' };
const C = {
  field: '#f5f0e8', paper: '#faf9f5', light: '#d8c9b0', blue: '#cc785c',
  green: '#5db872', orange: '#e8a55a', ink: '#252523', muted: '#6c6a64', axis: '#e6dfd8',
};

function drawPoster(ctx: CanvasRenderingContext2D, progress: number) {
  ctx.fillStyle = C.paper; ctx.strokeStyle = C.light; ctx.lineWidth = 2;
  ctx.fillRect(68, 110, 220, 154); ctx.strokeRect(68, 110, 220, 154);
  ctx.fillStyle = `rgba(39,68,110,${0.16 + progress * 0.62})`; ctx.fillRect(92, 134, 172, 30);
  ctx.fillStyle = `rgba(34,141,92,${0.10 + progress * 0.72})`; ctx.fillRect(92, 180, 112, 54);
  ctx.strokeStyle = `rgba(104,119,143,${0.75 - progress * 0.62})`; ctx.lineWidth = 1.5;
  const count = Math.round(24 - progress * 20);
  for (let i = 0; i < count; i += 1) {
    const x = 76 + ((i * 37) % 198); const y = 120 + ((i * 29) % 126);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y + 7); ctx.stroke();
  }
  if (progress === 1) {
    ctx.strokeStyle = C.green; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(254, 246); ctx.lineTo(278, 246); ctx.moveTo(266, 234); ctx.lineTo(266, 258); ctx.stroke();
  }
}

export const InferenceFamilyLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const variantRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [variant, setVariant] = useState<Variant>('base');
  const [step, setStep] = useState(0);
  const total = TOTAL[variant];
  const progress = clamp(step / total, 0, 1);
  const completed = step === total;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%'; canvas.style.height = 'auto'; canvas.style.maxWidth = `${W}px`;
    ctx.fillStyle = C.field; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.ink; ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText(`${LABEL[variant]} · ${step} / ${total} 步`, 24, 42);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
    ctx.fillRect(24, 80, 300, 238); ctx.strokeRect(24, 80, 300, 238);
    ctx.fillRect(350, 80, 406, 150); ctx.strokeRect(350, 80, 406, 150);
    ctx.fillRect(350, 246, 406, 72); ctx.strokeRect(350, 246, 406, 72);
    drawPoster(ctx, progress);
    ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('逐步清晰度是机制示意，不是论文质量曲线', 52, 296);

    // Compressed sampling track.
    const x1 = 386; const x2 = 720; const y = 154;
    ctx.strokeStyle = C.axis; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + (x2 - x1) * progress, y); ctx.stroke();
    const ticks = variant === 'turbo' ? 4 : 6;
    for (let i = 0; i <= ticks; i += 1) {
      const x = x1 + (x2 - x1) * (i / ticks);
      ctx.strokeStyle = i / ticks <= progress ? C.blue : C.axis; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
    }
    const cursorX = x1 + (x2 - x1) * progress;
    ctx.fillStyle = completed ? C.green : C.orange; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cursorX, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText(variant === 'turbo' ? '四个采样位置' : `按比例显示 ${total} 步`, 386, 116);
    ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`当前第 ${step} 步，共 ${total} 步`, 386, 196);

    // Evidence region deliberately keeps packed-CFG and Turbo protocols separate.
    if (variant === 'aligned' && completed) {
      ctx.fillStyle = C.ink; ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.fillText('A100 · Mage-Flow · 20 步 · 越低越好', 370, 267);
      const max = 5.4;
      const separate = 5.0076 / max * 230;
      const packed = 4.3680 / max * 230;
      ctx.fillStyle = C.axis; ctx.fillRect(500, 277, 230, 10); ctx.fillRect(500, 298, 230, 10);
      ctx.fillStyle = C.blue; ctx.fillRect(500, 277, separate, 10);
      ctx.fillStyle = C.green; ctx.fillRect(500, 298, packed, 10);
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('独立 CFG 5.0076s', 370, 286); ctx.fillText('打包式 CFG 4.3680s', 370, 307);
    } else if (variant === 'turbo' && completed) {
      ctx.fillStyle = C.orange; ctx.font = '700 16px "Segoe UI", sans-serif'; ctx.fillText('四步 Turbo：0.59s', 370, 278);
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('单张 A100 · 1024×1024 · 端到端生成', 370, 301);
      ctx.fillStyle = C.muted; ctx.fillText('此值不是 packed CFG 的前后对比值', 584, 278);
    } else {
      ctx.fillStyle = C.ink; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText(variant === 'base' ? '基础版：30 步家族起点' : variant === 'aligned' ? '对齐版：20 步；完成后查看 CFG 证据' : '极速版：四步蒸馏路径', 370, 278);
      ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('逐步推进只表达采样进度，不伪造逐步质量数值。', 370, 302);
    }

    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.fillRect(24, 334, 732, 38); ctx.strokeRect(24, 334, 732, 38);
    ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('协议边界：4.3680s 是 20 步打包式 CFG；0.59s 是四步 Turbo 的 A100 端到端结果。', 40, 358);
    canvas.classList.add('is-ready');
  }, [variant, step, total, progress, completed]);

  const chooseVariant = (next: Variant) => { setVariant(next); setStep(0); };
  const onVariantKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items: Variant[] = ['base', 'aligned', 'turbo'];
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : event.key === 'ArrowRight' ? (index + 1) % 3 : (index + 2) % 3;
    chooseVariant(items[nextIndex]); variantRefs.current[nextIndex]?.focus();
  };

  const feedback = variant === 'base'
    ? '基础版以 30 步提供模型家族的生成起点。'
    : variant === 'aligned'
      ? completed
        ? '在单张 A100、20 步设置下，打包式 CFG 将 5.0076 秒降至 4.3680 秒，轨迹保持不变。'
        : '对齐版默认用 20 步采样，目标是改善偏好与指令对齐。'
      : completed
        ? '四步换取低延迟，但不是所有指标都超过对齐版。'
        : '极速版只需四步；继续推进即可看到低步数路径。';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="模型版本">
        {(['base', 'aligned', 'turbo'] as const).map((item, index) => (
          <button
            key={item}
            ref={(element) => { variantRefs.current[index] = element; }}
            type="button"
            className={`chip ${variant === item ? 'selected' : ''}`}
            aria-pressed={variant === item}
            onClick={() => chooseVariant(item)}
            onKeyDown={(event) => onVariantKey(event, index)}
          >{LABEL[item]}</button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-hidden="true" />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => setStep(0)} disabled={step === 0}>重置</button>
        <div className="step-label" aria-live="polite">第 <b>{step}</b> 步，共 {total} 步</div>
        <button type="button" className="tiny" onClick={() => setStep((value) => Math.min(value + 1, total))} disabled={completed}>
          {completed ? '已完成' : '下一步'}
        </button>
      </div>
      <div className="step-desc">
        {variant === 'aligned' && completed
          ? '打包式 CFG：单张 A100、Mage-Flow 20 步，独立 5.0076s → 打包 4.3680s。'
          : variant === 'turbo' && completed
            ? 'Turbo：单张 A100、1024×1024、四步端到端生成 0.59s；不是 packed CFG 数字。'
            : `${LABEL[variant]}当前采样进度 ${step}/${total}；画面清晰度仅为机制示意。`}
      </div>
      <div className={`feedback ${completed ? 'good' : ''}`} style={variant === 'turbo' ? { borderLeftColor: C.orange } : undefined} aria-live="polite">
        {completed ? '✓ ' : '→ '}{feedback}
      </div>
    </div>
  );
};

export default InferenceFamilyLab;
