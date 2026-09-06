import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, line, road, car } from './kit';

/* ============================================================================
   2.2 同一条轨迹，两种奖励设置

   一个切换按钮，同一条 12 步轨迹立刻换一种奖励设置（瞬时切换，不做动画）：
     只有结果奖励 —— 12 步全灰，整个回合只有终点 1 个监督信号；
     结果奖励 + PRM —— 每步都有方向：推进（＋）/ 死路（−）。

   只表示「正向 / 死路」的方向，不显示任何逐步分数——论文未公布具体数值。
   ============================================================================ */

const TOTAL = 12;
/** 本回合任务最终完成：R_outcome = 1 */
const OUTCOME = 1;
/** PRM 对每一步的方向判断（示意）：第 3、7 步走进死路 */
const DEAD_ENDS = [2, 6];

/** 允许任意颜色的直线（kit 的 line 默认参数把颜色收窄成了 C.axis 字面量） */
function ln(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lw = 1,
  dash: number[] = []
) {
  line(ctx, x1, y1, x2, y2, color as typeof C.axis, lw, dash);
}

const RX = 40;
const RW = MW - 80;
const ROAD_Y = 58;
const ZERO = 168;

export const M6a: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [dense, setDense] = useState(false);

  const canvasRef = useCanvasScene(MW, MH, (ctx) => {
    const accent = dense ? C.pass : C.fail;

    // 标题条
    fillRound(
      ctx,
      RX,
      16,
      RW,
      26,
      6,
      dense ? 'rgba(31,111,67,0.10)' : 'rgba(179,55,47,0.10)'
    );
    text(ctx, dense ? '结果奖励 + PRM 逐步奖励' : '只有结果奖励', RX + 12, 33.5, {
      size: 13,
      color: accent,
      weight: '800',
    });
    text(
      ctx,
      dense ? '每一步都有方向' : '中间 12 步没有任何信号',
      RX + RW - 12,
      33.5,
      { size: 11, color: C.muted, align: 'right' }
    );

    // 同一条 12 步轨迹：路面 + 停在终点的车
    road(ctx, RX, ROAD_Y, RW, 18, 0);
    const slotW = RW / TOTAL;
    car(ctx, RX + (TOTAL - 0.5) * slotW, ROAD_Y + 9, 0.45, C.guide);
    text(ctx, '同一条 12 步轨迹，两种设置下都成功完成任务', RX, ROAD_Y + 34, {
      size: 11,
      color: C.muted,
    });

    // 每步信号
    ln(ctx, RX, ZERO, RX + RW, ZERO, C.axis, 1, []);
    text(ctx, dense ? '每步信号 R_step' : '每步信号（始终为空）', RX, ZERO - 46, {
      size: 11,
      color: C.muted,
      weight: '700',
    });
    if (dense) {
      text(ctx, '红色 = 死路（第 3、7 步）', RX + RW, ZERO - 46, {
        size: 10.5,
        color: C.fail,
        weight: '700',
        align: 'right',
      });
    }

    for (let i = 0; i < TOTAL; i++) {
      const bx = RX + i * slotW + slotW / 2;
      if (!dense) {
        // 走过了，但没有任何信号
        fillRound(ctx, bx - 6, ZERO - 2, 12, 4, 2, C.axis);
        continue;
      }
      const bad = DEAD_ENDS.includes(i);
      const col = bad ? C.fail : C.pass;
      const h = 26;
      if (bad) {
        fillRound(ctx, bx - 6, ZERO, 12, h, 2, col);
        text(ctx, '−', bx, ZERO + h + 12, {
          size: 13,
          color: col,
          weight: '800',
          align: 'center',
        });
      } else {
        fillRound(ctx, bx - 6, ZERO - h, 12, h, 2, col);
        text(ctx, '＋', bx, ZERO - h - 5, {
          size: 11,
          color: col,
          weight: '800',
          align: 'center',
        });
      }
    }

    // 回合末的结果奖励 + 信号总数
    fillRound(ctx, RX, 224, 110, 24, 5, C.pass);
    text(ctx, `R_outcome = ${OUTCOME}`, RX + 55, 236.5, {
      size: 11.5,
      color: C.white,
      weight: '800',
      align: 'center',
      baseline: 'middle',
      mono: true,
    });
    const cnt = dense ? TOTAL + 1 : 1;
    text(ctx, '本回合监督信号总数', RX + 126, 232, { size: 11, color: C.muted });
    text(ctx, `${cnt} 个`, RX + 126, 247, {
      size: 13,
      color: cnt > 1 ? C.pass : C.fail,
      weight: '800',
      mono: true,
    });
  });

  return (
    <div>
      <div className="chip-row">
        {['只有结果奖励', '结果奖励 + PRM'].map((s, i) => (
          <button
            key={s}
            className={`chip ${(dense ? 1 : 0) === i ? 'selected' : ''}`}
            onClick={() => setDense(i === 1)}
          >
            {s}
          </button>
        ))}
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className={`feedback ${dense ? 'good' : 'bad'}`}>
        {dense
          ? 'PRM 在每个动作后立刻判断这一步有没有推进任务：第 3、7 步的死路被明确标成负向。优化器终于能区分有效动作和死胡同。'
          : '整整 12 步操作，只在回合结束时换来一个 0 / 1。中间哪一步走对、哪一步走进死胡同，优化器完全看不见。'}
      </div>

      <div className="step-desc">
        切换上方两种奖励设置，看同一条轨迹的监督信号从 1 个变成 13 个。
      </div>

      <div className="tech-inset">
        <div>
          论文式 (1)：<b>R = R_outcome + R_step</b>
        </div>
        <div>PRM 的输入是「上一张截图 + 当前截图 + 完整动作历史」，输出这一步有没有实质推进任务。</div>
      </div>

      <div className="src-note warn">
        ⚠ 哪几步是死路（这里设为第 3、7 步）为机制示意，<b>论文未公布逐步奖励的具体数值</b>；此处只表示方向（推进
        / 死路），不代表任何真实分数。式 (1) 来自论文。
      </div>
    </div>
  );
};

export default M6a;
