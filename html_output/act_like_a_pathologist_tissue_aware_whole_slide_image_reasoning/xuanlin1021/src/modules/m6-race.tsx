import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT, clearPlate, drawTag, usePlate } from './scene-kit';

// §6 模块 6.1：五个任务列，两套方法。
// 所有数值来自 Table 1（accuracy，%），同一数据划分、同一批任务列；
// 并列与「不是每列都拉开差距」必须写清楚，不能只报平均值。

const W = 1080;
const H = 280;
const COLS = [
  { key: '显微', old: 83.15, neo: 84.62 },
  { key: '诊断', old: 71.36, neo: 73.09 },
  { key: '形态', old: 91.34, neo: 94.57 },
  { key: '治疗', old: 93.75, neo: 97.92 },
  { key: '卵巢', old: 69.33, neo: 73.33 },
];
const AVG = { old: 80.88, neo: 83.8 };
const DUR = 2400;

type Phase = 'idle' | 'running' | 'done';
type View = 'cols' | 'avg';

export const M6Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [phase, setPhase] = useState<Phase>('idle');
  const [view, setView] = useState<View>('cols');
  const [p, setP] = useState(0);

  const render = useCallback(
    (prog: number) => {
      const canvas = ref.current;
      const ctx = plate(canvas);
      if (!ctx) return;
      clearPlate(ctx, W, H);

      const items = view === 'cols' ? COLS : [{ key: 'Average', old: AVG.old, neo: AVG.neo }];
      const groupW = view === 'cols' ? 192 : 320;
      const x0 = view === 'cols' ? 52 : 300;
      const barW = view === 'cols' ? 156 : 260;
      const baseY = 236;
      const scale = 200 / 100;

      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      for (const tick of [0, 25, 50, 75, 100]) {
        const y = baseY - tick * scale;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x0 - 22, y);
        ctx.lineTo(x0 + items.length * groupW + 30, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.muted;
        ctx.font = `11px ${FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText(String(tick), x0 - 28, y + 4);
      }

      items.forEach((it, i) => {
        const gx = x0 + i * groupW;
        const oldH = it.old * scale * prog;
        const neoH = it.neo * scale * prog;
        // 空槽：即使还没开始，也能看出两套方法的占位。
        ctx.fillStyle = '#eceee7';
        ctx.fillRect(gx, baseY - 100 * scale, barW / 2 - 4, 100 * scale);
        ctx.fillRect(gx + barW / 2 + 4, baseY - 100 * scale, barW / 2 - 4, 100 * scale);
        ctx.fillStyle = C.red;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(gx, baseY - oldH, barW / 2 - 4, oldH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.green;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(gx + barW / 2 + 4, baseY - neoH, barW / 2 - 4, neoH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.text;
        ctx.font = '600 12px "Segoe UI","Microsoft YaHei",sans-serif';
        ctx.textAlign = 'center';
        if (prog > 0.15) {
          ctx.fillText(it.old.toFixed(2), gx + (barW / 2 - 4) / 2, baseY - oldH - 6);
          ctx.fillText(it.neo.toFixed(2), gx + barW / 2 + 4 + (barW / 2 - 4) / 2, baseY - neoH - 6);
        }
        ctx.fillStyle = C.muted;
        ctx.font = `12px ${FONT}`;
        ctx.fillText(it.key, gx + barW / 2, baseY + 16);
      });
      drawTag(ctx, '准确率 %', x0 - 10, 34, { size: 12, color: C.muted });

      if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    },
    [view, plate]
  );

  useEffect(() => {
    render(p);
  }, [render, p]);

  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const v = Math.min(1, (t - t0) / DUR);
      setP(v);
      if (v >= 1) {
        setPhase('done');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const start = () => {
    setP(0);
    setPhase('running');
  };

  const fb =
    phase === 'idle'
      ? { text: '按一次开始比较：红条是论文之前的最好结果（SlideChat），绿条是 HistoSelect。', cls: '' }
      : phase === 'running'
      ? { text: '同一条刻度、同一个基线。', cls: '' }
      : view === 'cols'
      ? { text: '形态题 91.34% → 94.57%；治疗题 97.92% 与 Quilt-LLaVA 并列，并非独自最好——也不是每一列都拉开差距。', cls: 'good' }
      : { text: '七列平均 80.88% → 83.80%，高 2.92 个百分点；这是多列汇总，不是逐案例结论。', cls: 'good' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" onClick={start} disabled={phase === 'running'}>
          {phase === 'done' ? '重新比较' : '开始比较'}
        </button>
        <div className="chip-row" style={{ marginLeft: 8 }}>
          <button
            type="button"
            className={`chip${view === 'cols' ? ' selected' : ''}`}
            onClick={() => {
              setView('cols');
              setP(0);
              setPhase('idle');
            }}
          >
            看单列
          </button>
          <button
            type="button"
            className={`chip${view === 'avg' ? ' selected' : ''}`}
            onClick={() => {
              setView('avg');
              setP(0);
              setPhase('idle');
            }}
          >
            看平均
          </button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M6Race;
