import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, line, arrow } from './kit';

/* ============================================================================
   5.1 两组核心证据：训练流水线到底有没有用

   视图 1 —— 奖励消融（论文表 2）：仅回合级二值奖励 14.5% → 回合 + 步级稠密奖励 17.1%
   视图 2 —— 同规模对比（论文表 1）：MAI-UI-2B 11.1% → ClawGUI-2B 17.1%（+6.0 绝对点）

   两个视图共用同一套坐标与条形布局，切换时画面不跳动。
   证明的是「这套训练流水线有效」，不是「小模型天生比大模型强」。
   ============================================================================ */

interface Pair {
  chip: string;
  title: string;
  base: { name: string; sub: string; v: number };
  ours: { name: string; sub: string; v: number };
  gap: string;
  source: string;
  fb: string;
}

const VIEWS: Pair[] = [
  {
    chip: '奖励消融（表 2）',
    title: '同一条流水线，只替换奖励设计 · MobileWorld GUI-Only 成功率',
    base: { name: '仅回合奖励', sub: '二值 · 回合级', v: 14.5 },
    ours: { name: '完整 ClawGUI-RL', sub: '稠密 · 回合 + 步级', v: 17.1 },
    gap: '+2.6 绝对点',
    source: '论文表 2：其余训练配置完全相同，只替换优势估计与奖励粒度。',
    fb: '把回合级二值奖励换成回合 + 步级的稠密奖励，成功率 14.5% → 17.1%：细粒度的信用分配确实值这个钱。',
  },
  {
    chip: '同规模对比（表 1）',
    title: '同规模模型对照 · MobileWorld GUI-Only 成功率',
    base: { name: 'MAI-UI-2B', sub: '同规模基线', v: 11.1 },
    ours: { name: 'ClawGUI-2B', sub: '经 ClawGUI-RL 训练', v: 17.1 },
    gap: '+6.0 绝对点',
    source: '论文表 1：MobileWorld GUI-Only 赛道，117 个在线交互任务，最多 50 步。',
    fb: '同样是 2B，经过这套训练流水线之后高出 6.0 个绝对点——差距来自训练基建，不是模型规模。',
  },
];

const VMAX = 20;
const BX = 186;
const BW = 316;
const scale = (v: number) => (v / VMAX) * BW;
/** kit 的 line() / arrow() 默认参数把颜色收窄成了字面量类型，这里统一转一次 */
const asCol = (c: string) => c as typeof C.axis;

export const M10a: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [view, setView] = useState(0);
  const d = VIEWS[view];

  const canvasRef = useCanvasScene(MW, MH, (ctx) => {
    text(ctx, d.title, 10, 20, { size: 11.5, color: C.muted, weight: '600' });

    // 网格与刻度
    for (let g = 0; g <= VMAX; g += 5) {
      const gx = BX + scale(g);
      line(ctx, gx, 34, gx, 206, C.axis, 1, g === 0 ? [] : [3, 3]);
      text(ctx, `${g}%`, gx, 220, { size: 9.5, color: C.muted, align: 'center' });
    }

    const bars = [
      { y: 56, d: d.base, color: 'rgba(179,55,47,0.55)', tone: C.ink },
      { y: 130, d: d.ours, color: C.pass, tone: C.pass },
    ];

    bars.forEach((b) => {
      text(ctx, b.d.name, BX - 12, b.y + 12, {
        size: 13,
        color: b.tone,
        weight: '700',
        align: 'right',
      });
      text(ctx, b.d.sub, BX - 12, b.y + 28, { size: 10.5, color: C.muted, align: 'right' });
      fillRound(ctx, BX, b.y, BW, 28, 4, 'rgba(221,214,200,0.45)');
      fillRound(ctx, BX, b.y, scale(b.d.v), 28, 4, b.color);
      text(ctx, `${b.d.v.toFixed(1)}%`, BX + scale(b.d.v) + 9, b.y + 18, {
        size: 13.5,
        color: b.tone,
        weight: '700',
        mono: true,
      });
    });

    // 差值标注
    const x1 = BX + scale(d.base.v);
    const x2 = BX + scale(d.ours.v);
    line(ctx, x1, 84, x1, 190, asCol(C.muted), 1, [3, 3]);
    line(ctx, x2, 158, x2, 190, asCol(C.pass), 1, [3, 3]);
    arrow(ctx, x1, 184, x2, 184, asCol(C.pass), 1.6, 5);
    arrow(ctx, x2, 184, x1, 184, asCol(C.pass), 1.6, 5);
    text(ctx, d.gap, x1 - 12, 188, {
      size: 12.5,
      color: C.pass,
      weight: '700',
      align: 'right',
    });
  });

  return (
    <div>
      <div className="chip-row">
        {VIEWS.map((v, i) => (
          <button
            key={v.chip}
            className={`chip ${view === i ? 'selected' : ''}`}
            onClick={() => setView(i)}
          >
            {v.chip}
          </button>
        ))}
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className="metrics">
        <div className="metric">
          <div className="l">{d.base.name}</div>
          <div className="v">{d.base.v.toFixed(1)}%</div>
        </div>
        <div className="metric">
          <div className="l">{d.ours.name}</div>
          <div className="v">{d.ours.v.toFixed(1)}%</div>
        </div>
        <div className="metric">
          <div className="l">差距</div>
          <div className="v">{d.gap.replace(' 绝对点', '')}</div>
          <div className="l">绝对百分点</div>
        </div>
      </div>

      <div className="feedback good">{d.fb}</div>

      <div className="src-note">{d.source}</div>

      <div className="src-note">
        这两组对比都在<b>同规模、同源权重</b>下进行，因此差距可归因于训练流水线本身；论文中
        Doubao-1.5-UI-TARS（26.3%）等更强模型与闭源前沿模型搭建的智能体框架（55.6%）属于不同范式，不参与这场对照。
      </div>
    </div>
  );
};

export default M10a;
