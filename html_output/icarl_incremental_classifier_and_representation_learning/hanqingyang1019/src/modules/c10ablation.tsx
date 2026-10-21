import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, legend, type WidgetProps } from './kit';

// Chapter 10.2 — component ablation on iCIFAR-100 (Table 1a).
const BATCHES = [2, 5, 10, 20, 50];
const BASE = [57.0, 61.2, 64.1, 67.2, 68.6];
const VARIANTS: Record<string, { label: string; v: number[]; note: string }> = {
  hybrid1: { label: 'hybrid1：不用原型分类', v: [36.6, 50.9, 59.3, 65.6, 68.2], note: '保留样本与蒸馏，但用网络输出分类；批次越小，缺原型的损失越大。' },
  hybrid2: { label: 'hybrid2：去掉蒸馏', v: [57.6, 57.9, 59.9, 63.2, 65.3], note: '保留原型与样本复现，但去掉蒸馏项。' },
  hybrid3: { label: 'hybrid3：去掉蒸馏与原型', v: [57.0, 56.7, 58.1, 60.5, 61.5], note: '只保留样本复现，其余两项都关掉。' },
};

export const C10Ablation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState('hybrid1');
  const [bi, setBi] = useState(2);
  const hv = VARIANTS[key].v[bi];
  const base = BASE[bi];
  const delta = hv - base;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const rows = [
      { y: 92, v: BASE[bi], color: C.green, label: 'iCaRL' },
      { y: 172, v: hv, color: C.red, label: '变体' },
    ];
    rows.forEach((r) => {
      ctx.fillStyle = 'rgba(215,222,234,0.55)';
      ctx.fillRect(190, r.y - 16, 720, 32);
      ctx.fillStyle = r.color;
      ctx.fillRect(190, r.y - 16, (r.v / 70) * 720, 32);
      txt(ctx, r.v.toFixed(1), 190 + (r.v / 70) * 720 + 12, r.y, r.color, 22, 'left', '700');
    });
    txt(ctx, (delta >= 0 ? '+' : '') + delta.toFixed(1), 960, 232, delta >= 0 ? C.green : C.red, 26, 'right', '700');
    legend(ctx, [
      { label: 'iCaRL', color: C.green },
      { label: '关闭部件', color: C.red },
    ], 700, 40);
    c.classList.add('is-ready');
  }, [key, bi, hv, base, delta]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {Object.entries(VARIANTS).map(([k, v]) => (
            <button key={k} className={`chip ${key === k ? 'selected' : ''}`} onClick={() => setKey(k)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ctrl">
        <label>
          每批类数 <span className="val">{BATCHES[bi]}</span>
        </label>
        <input type="range" min={0} max={4} step={1} value={bi} onChange={(e) => setBi(Number(e.target.value))} />
        <span className="val">差值 {delta >= 0 ? '+' : ''}{delta.toFixed(1)}</span>
      </div>
      <div className={`feedback ${delta > 0 ? 'bad' : ''}`}>
        {delta > 0
          ? `${VARIANTS[key].label} 在每批 ${BATCHES[bi]} 类时反而高 ${delta.toFixed(1)} 个百分点：小批次、频繁更新时，蒸馏的约束可能拖累新类的学习。`
          : `${VARIANTS[key].label} 比 iCaRL 低 ${Math.abs(delta).toFixed(1)} 个百分点。${VARIANTS[key].note}`}
      </div>
    </div>
  );
};

export default C10Ablation;
