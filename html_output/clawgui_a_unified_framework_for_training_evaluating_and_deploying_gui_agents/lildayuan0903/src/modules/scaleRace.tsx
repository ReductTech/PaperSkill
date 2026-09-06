import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, line } from './kit';

/* ============================================================================
   5.2 跨规模成绩赛跑（论文表 1）

   MobileWorld GUI-Only 成功率，11 个端到端模型同场竞速。
   两种排序：按成绩 / 按参数规模——切到「按规模」就能看出，
   规模和成绩根本不是正相关：2B 的 ClawGUI-2B 越过了 32B、72B、235B。

   智能体框架（闭源前沿模型 + 定位模型）是另一套范式，不进入这场赛跑。
   ============================================================================ */

interface Row {
  name: string;
  v: number;
  /** 参数规模（B）；-1 表示官方未公开 */
  size: number;
  ours?: boolean;
  /** ClawGUI-2B 明确越过的更大规模模型 */
  beaten?: boolean;
}

const ROWS: Row[] = [
  { name: 'GUI-Owl-7B', v: 7.7, size: 7 },
  { name: 'GUI-Owl-32B', v: 8.5, size: 32, beaten: true },
  { name: 'UI-Venus-7B', v: 8.5, size: 7 },
  { name: 'Qwen3-VL-8B', v: 9.4, size: 8 },
  { name: 'MAI-UI-2B', v: 11.1, size: 2 },
  { name: 'Qwen3-VL-32B', v: 11.9, size: 32, beaten: true },
  { name: 'Qwen3-VL-235B-A22B', v: 12.8, size: 235, beaten: true },
  { name: 'UI-Venus-72B', v: 16.4, size: 72, beaten: true },
  { name: 'ClawGUI-2B', v: 17.1, size: 2, ours: true },
  { name: 'MAI-UI-8B', v: 19.7, size: 8 },
  { name: 'Doubao-1.5-UI-TARS', v: 26.3, size: -1 },
];

const OURS_V = 17.1;
const VMAX = 30;
const AX = 168;
const BARW = 322;
const ROW_TOP = 34;
const ROW_H = 19;
const RUN_MS = 1600;

const scale = (v: number) => (v / VMAX) * BARW;
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const asCol = (c: string) => c as typeof C.axis;

export const ScaleRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [bySize, setBySize] = useState(false);
  const [runNo, setRunNo] = useState(1);
  const startRef = useRef<number | null>(null);
  const runRef = useRef(1);

  // 换排序或重跑时，重置动画起点
  if (runRef.current !== runNo) {
    runRef.current = runNo;
    startRef.current = null;
  }

  const rows = bySize
    ? [...ROWS].sort((a, b) => (a.size === -1 ? 1 : b.size === -1 ? -1 : a.size - b.size))
    : [...ROWS].sort((a, b) => a.v - b.v);

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    if (startRef.current === null) startRef.current = t;
    const p = easeOut(Math.min(1, (t - startRef.current) / RUN_MS));

    text(
      ctx,
      bySize ? '按参数规模从小到大排列' : '按成绩从低到高排列',
      10,
      16,
      { size: 11.5, color: C.ink, weight: '700' }
    );
    text(ctx, 'MobileWorld GUI-Only 成功率（论文表 1）', MW - 10, 16, {
      size: 10.5,
      color: C.muted,
      align: 'right',
    });

    // 网格
    for (let g = 0; g <= VMAX; g += 10) {
      const gx = AX + scale(g);
      line(ctx, gx, ROW_TOP - 8, gx, ROW_TOP + ROWS.length * ROW_H - 2, C.axis, 1, g === 0 ? [] : [3, 3]);
      text(ctx, `${g}%`, gx, MH - 6, { size: 9.5, color: C.muted, align: 'center' });
    }

    // ClawGUI-2B 的成绩基准线：一眼看出谁在它左边
    const ox = AX + scale(OURS_V);
    line(ctx, ox, ROW_TOP - 12, ox, ROW_TOP + ROWS.length * ROW_H - 2, asCol(C.pass), 1.4, [4, 3]);

    rows.forEach((r, i) => {
      const y = ROW_TOP + i * ROW_H;
      const w = scale(r.v) * p;
      const col = r.ours ? C.pass : r.beaten ? C.emph : C.axis;

      // 模型名 + 规模
      text(ctx, r.name, AX - 42, y + 11, {
        size: r.ours ? 11 : 10.5,
        color: r.ours ? C.pass : C.ink,
        weight: r.ours ? '800' : '400',
        align: 'right',
      });
      text(ctx, r.size === -1 ? '未公开' : `${r.size}B`, AX - 8, y + 11, {
        size: 10,
        color: r.ours ? C.pass : C.muted,
        weight: r.ours || r.beaten ? '700' : '400',
        align: 'right',
        mono: true,
      });

      fillRound(ctx, AX, y + 2, BARW, 13, 3, 'rgba(221,214,200,0.35)');
      if (w > 1) fillRound(ctx, AX, y + 2, w, 13, 3, col);
      text(ctx, `${r.v.toFixed(1)}`, AX + w + 6, y + 12, {
        size: 10.5,
        color: r.ours ? C.pass : C.ink,
        weight: r.ours ? '800' : '400',
        mono: true,
      });
    });

    // 图例
    fillRound(ctx, 10, MH - 16, 9, 9, 2, C.pass);
    text(ctx, '本文 ClawGUI-2B', 23, MH - 8, { size: 9.5, color: C.muted });
    fillRound(ctx, 120, MH - 16, 9, 9, 2, C.emph);
    text(ctx, '被它越过的更大模型', 133, MH - 8, { size: 9.5, color: C.muted });
  });

  const beaten = ROWS.filter((r) => r.beaten);

  return (
    <div>
      <div className="chip-row">
        {['按成绩排序', '按规模排序'].map((s, i) => (
          <button
            key={s}
            className={`chip ${(bySize ? 1 : 0) === i ? 'selected' : ''}`}
            onClick={() => {
              setBySize(i === 1);
              setRunNo((n) => n + 1);
            }}
          >
            {s}
          </button>
        ))}
        <button className="tiny ghost" onClick={() => setRunNo((n) => n + 1)}>
          重播
        </button>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className={`feedback ${bySize ? 'good' : ''}`}>
        {bySize
          ? `按规模排完就很清楚：${beaten.map((r) => r.name).join('、')} 都比 ClawGUI-2B 大得多，成绩却都在它左边——规模和成绩不是正相关。`
          : '11 个端到端模型按成绩排开，ClawGUI-2B 以 2B 的体量排在 17.1%。切到「按规模排序」，看规模能不能解释这个排名。'}
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="l">ClawGUI-2B</div>
          <div className="v">17.1%</div>
          <div className="l">2B 参数</div>
        </div>
        <div className="metric">
          <div className="l">被它越过的更大模型</div>
          <div className="v">{beaten.length} 个</div>
          <div className="l">最大 235B</div>
        </div>
        <div className="metric">
          <div className="l">仍在它之上</div>
          <div className="v">2 个</div>
          <div className="l">MAI-UI-8B · Doubao-1.5-UI-TARS</div>
        </div>
      </div>

      <div className="src-note">
        数据来源：论文表 1，MobileWorld GUI-Only 赛道（117 个在线交互任务，最多 50
        步）。此处只列端到端模型；闭源前沿模型搭建的智能体框架（如 Gemini-3-Pro + UI-Ins-7B 55.6%）属于不同范式，不参与这场赛跑。
      </div>
    </div>
  );
};

export default ScaleRace;
