import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 9.1：消融对比（完整 / BitFit / BERT-Base / BioBERT 初始化）vs SPECTER 80.0。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', blue: '#27446e' };
type Variant = 'full' | 'bitfit' | 'bert' | 'biobert';
const VARIANTS: Record<Variant, { name: string; score: number; delta: string; fb: string; cls: string }> = {
  full: { name: '完整 SciNCL', score: 81.8, delta: '0.0', fb: '完整模型 81.8，比 SPECTER 高 1.8。', cls: 'good' },
  bitfit: { name: 'BitFit', score: 81.2, delta: '−0.5', fb: 'BitFit 只训练偏置项（0.1% 参数）：81.2，仍高于 SPECTER。', cls: 'good' },
  bert: { name: 'BERT-Base 初始化', score: 81.2, delta: '−0.6', fb: '通用域 BERT-Base 初始化：81.2——领域适配主要来自采样策略（作者解读）。', cls: 'good' },
  biobert: { name: 'BioBERT 初始化', score: 81.4, delta: '−0.4', fb: 'BioBERT 初始化：81.4。', cls: 'good' },
};

export const M91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ variant: 'full' as Variant, t: 0 });
  const [variant, setVariant] = useState<Variant>('full');
  const [fb, setFb] = useState({ text: VARIANTS.full.fb, cls: 'good' });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const x0 = 120, maxW = 560, yTop = 60, rowH = 64;
    const vMin = 56, vMax = 84;
    const wOf = (v: number) => ((v - vMin) / (vMax - vMin)) * maxW;
    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.font = '15px sans-serif'; ctx.textAlign = 'right';
      // 行 1：变体；行 2：SPECTER 参考
      const rows: Array<[string, number, string, boolean]> = [
        [VARIANTS[s.variant].name, VARIANTS[s.variant].score, C.blue, true],
        ['SPECTER（参考）', 80.0, C.red, false],
      ];
      rows.forEach(([label, v, color, hl], i) => {
        const y = yTop + i * rowH;
        ctx.fillStyle = C.text; ctx.fillText(label, x0 - 14, y + 26);
        const w = wOf(v) * (s.t < 1 ? s.t : 1);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
        ctx.fillRect(x0, y, maxW, 36); ctx.strokeRect(x0, y, maxW, 36);
        if (hl) { ctx.fillStyle = color; ctx.fillRect(x0 + 1, y + 1, w * 958 / 960, 34); }
        else { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x0 + 1.5, y + 1.5, w, 33); }
        ctx.fillStyle = C.text; ctx.textAlign = 'left';
        ctx.font = '20px sans-serif';
        ctx.fillText(v.toFixed(1), x0 + maxW + 12, y + 26);
        ctx.font = '15px sans-serif'; ctx.textAlign = 'right';
      });
      // Δ 读数
      ctx.font = '19px sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = C.text;
      ctx.fillText(`Δ vs 完整模型：${VARIANTS[s.variant].delta}`, 740, yTop + 40);
      ctx.font = '14px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText('SCIDOCS 测试集平均分（越高越好）', 740, yTop + 68);
      ctx.fillText('SPECTER = 80.0（虚框）', 740, yTop + 92);
    };
    let raf = 0; let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      stateRef.current.t = Math.min(1, stateRef.current.t + dt * 2);
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const switchTo = (v: Variant) => {
    stateRef.current.variant = v;
    stateRef.current.t = 0;
    setVariant(v);
    setFb({ text: VARIANTS[v].fb, cls: VARIANTS[v].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        {(Object.keys(VARIANTS) as Variant[]).map((v) => (
          <button key={v} className={`chip ${variant === v ? 'active' : ''}`} onClick={() => switchTo(v)}>{VARIANTS[v].name}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M91;
