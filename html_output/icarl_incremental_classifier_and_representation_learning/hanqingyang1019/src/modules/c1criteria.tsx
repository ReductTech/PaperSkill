import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, rr, legend, type WidgetProps } from './kit';

// Chapter 1.2 — the three class-incremental requirements, checked per method.
type Method = 'retrain' | 'finetune' | 'icarl';

const METHODS: { id: Method; label: string; ok: [boolean, boolean, boolean]; note: string }[] = [
  {
    id: 'retrain',
    label: '全量重训',
    ok: [true, true, false],
    note: '能流式接收数据，也能随时给出有竞争力的分类器；但要保存全部样本并整体重训，内存与计算随类别数线性膨胀，违反 ⅲ（有界性）。',
  },
  {
    id: 'finetune',
    label: '纯微调',
    ok: [true, false, true],
    note: '内存有界、也能接收新类，但新类梯度覆盖旧类，旧类准确率迅速崩溃，违反 ⅱ（对已见类保持竞争力）。',
  },
  {
    id: 'icarl',
    label: 'iCaRL',
    ok: [true, true, true],
    note: '三条同时满足：流式学习（ⅰ）、随时可分类（ⅱ）、样本内存被 K 封顶（ⅲ）。',
  },
];

export const C1Criteria: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState<Method>('retrain');
  const cur = METHODS.find((x) => x.id === m)!;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const startX = 210;
    const gap = 220;
    for (let i = 0; i < 3; i++) {
      const x = startX + i * gap;
      const y = 62;
      const ok = cur.ok[i];
      rr(ctx, x, y, 170, 140, 16, ok ? 'rgba(34,141,92,0.12)' : 'rgba(196,63,82,0.12)', ok ? C.green : C.red, 2);
      txt(ctx, ok ? '✓' : '✕', x + 85, y + 66, ok ? C.green : C.red, 56, 'center', '700');
      txt(ctx, ['ⅰ', 'ⅱ', 'ⅲ'][i], x + 85, y + 118, C.muted, 20, 'center', '600');
    }

    legend(ctx, [
      { label: '满足', color: C.green },
      { label: '违反', color: C.red },
    ], 800, 52);
    c.classList.add('is-ready');
  }, [cur]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {METHODS.map((x) => (
            <button key={x.id} className={`chip ${m === x.id ? 'selected' : ''}`} onClick={() => setM(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${m === 'icarl' ? 'good' : 'bad'}`}>{cur.note}</div>
    </div>
  );
};

export default C1Criteria;
