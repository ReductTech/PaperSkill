import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, bars, label, EMPH, OK, GUIDE, MUTED, WHEEL } from './clayKit';

// 模块 9.1：泥料（嵌入方案）与泥量（训练词元）配方台。
const W = 1080;
const H = 300;
const RECIPES: { id: string; label: string }[] = [
  { id: 'pretrained-ctx', label: '预训练上下文' },
  { id: 'scratch-ctx', label: '从零训练编码器' },
  { id: 'learnable', label: '可学习嵌入' },
];

export const Ch9Budget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef({ recipe: 'pretrained-ctx', tokens: 45 });
  const [recipe, setRecipe] = useState('pretrained-ctx');
  const [tokens, setTokens] = useState(45);
  const [fb, setFb] = useState({ text: '选择嵌入方案并拖动训练词元预算，比较与基线 500B 的差距。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      const ui = uiRef.current;
      const r = ui.tokens <= 100 ? 30 : ui.tokens <= 300 ? 26 : 22;
      field(ctx, W, H);
      clay(ctx, 200, 190, r, 0.2, now / 600, WHEEL);
      if (ui.recipe === 'pretrained-ctx') label(ctx, '好泥料', 176, 96, OK);
      bars(ctx, 520, 90, 430, [
        { label: '本次配方 ' + ui.tokens + 'B', value: ui.tokens / 600, color: OK },
        { label: '基线约 500B', value: 500 / 600, color: GUIDE },
      ]);
      label(ctx, ui.recipe === 'learnable' ? '最差配方' : '推荐配方', 526, 78, ui.recipe === 'learnable' ? EMPH : MUTED);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    uiRef.current.recipe = id;
    setRecipe(id);
    setFb(
      id === 'learnable'
        ? { text: '可学习嵌入与去噪器互相拖累，是最差配方。', cls: 'bad' }
        : { text: '上下文嵌入取得更好的困惑度-熵权衡。', cls: 'good' }
    );
  };

  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(event.target.value);
    uiRef.current.tokens = v;
    setTokens(v);
    setFb(
      v <= 60
        ? { text: 'ELF 约用 45B 训练词元，而基线常超过 500B。', cls: 'good' }
        : { text: '论文报告训练更多词元并没有带来进一步提升。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          训练词元 <span className="val">{tokens}B</span>
        </label>
        <input type="range" min={10} max={600} value={tokens} onChange={change} />
      </div>
      <div className="chip-row">
        {RECIPES.map((r) => (
          <button key={r.id} className={`chip ${recipe === r.id ? 'selected' : ''}`} onClick={() => pick(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch9Budget;
