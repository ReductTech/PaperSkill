import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, roundRect, pointerPos } from './kit';

/* ============================================================================
   3.2 95.8% 复现率 —— 46 / 48 个格子对上了（论文表 3）

   48 个方格 = 全部有官方基线可比的格子。46 个绿、2 个红。
   两个红格恰好都是官方评测配置未公开的模型（Qwen3-VL-2B、UI-TARS 1.5-7B，
   均在 ScreenSpot-Pro），反过来印证上一模块：评测漂移是基建问题。

   ⚠ 12 × 4 的排布只是数量示意，不是「基准 × 模型」的真实矩阵。
   ============================================================================ */

const COLS = 12;
const ROWS = 4;
const TOTAL = COLS * ROWS; // 48
const CW = 30;
const CH = 26;
const GAP = 6;
const GX = 18;
const GY = 58;

const LEG_X = 460;
const BOX_Y = 194;
const BOX_H = 32;

interface Miss {
  short: string;
  title: string;
  body: string;
}

/** 两个红格在示意阵列中的位置（位置本身无含义，仅为数量可视化） */
const MISS: Record<number, Miss> = {
  9: {
    short: 'Qwen3-VL-2B · ScreenSpot-Pro',
    title: 'Qwen3-VL-2B · ScreenSpot-Pro 未能复现',
    body: '论文给出的原因：该模型的官方评测配置未公开。提示词模板与输入分辨率都拿不到，复现值落在判定阈值之外。',
  },
  30: {
    short: 'UI-TARS 1.5-7B · ScreenSpot-Pro',
    title: 'UI-TARS 1.5-7B · ScreenSpot-Pro 未能复现',
    body: '论文给出的原因：官方评测配置同样未公开。48 个格子里只有这两个没对上，而它们恰好都是配置不透明的那两个。',
  },
};
const MISS_IDX = [9, 30];

function cellXY(i: number): { x: number; y: number } {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return { x: GX + col * (CW + GAP), y: GY + row * (CH + GAP) };
}

export const M10b: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState(-1);
  const [fb, setFb] = useState({
    text: '48 个有官方基线的格子里对上了 46 个，总体复现率 95.8%。点开两个红色格子，看论文给出的失败原因。',
    cls: '',
  });

  const selMiss = sel >= 0 ? MISS[sel] : undefined;

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    /* ── 标题 ── */
    text(ctx, '48 = 全部有官方基线可比的格子', 18, 25, {
      size: 13.5,
      color: C.ink,
      weight: '800',
    });
    text(ctx, '6 个基准 · 11+ 模型 · 逐格与官方报告值比对', 18, 44, {
      size: 11.5,
      color: C.muted,
    });
    text(ctx, '95.8%', MW - 16, 30, {
      size: 17,
      color: C.pass,
      weight: '800',
      align: 'right',
      mono: true,
    });
    text(ctx, '46 / 48 复现成功', MW - 16, 46, {
      size: 11,
      color: C.muted,
      align: 'right',
    });

    /* ── 48 个方格 ── */
    const pulse = 0.5 + 0.5 * Math.sin(t / 620);
    for (let i = 0; i < TOTAL; i++) {
      const { x, y } = cellXY(i);
      const bad = MISS_IDX.indexOf(i) >= 0;

      // 红格的呼吸光环：未选中时提示「这里可以点」
      if (bad && i !== sel) {
        ctx.save();
        ctx.strokeStyle = `rgba(179,55,47,${0.14 + 0.24 * pulse})`;
        ctx.lineWidth = 3;
        roundRect(ctx, x - 3, y - 3, CW + 6, CH + 6, 8);
        ctx.stroke();
        ctx.restore();
      }

      fillRound(ctx, x, y, CW, CH, 5, bad ? C.fail : C.pass);

      // 格内小标记：绿格淡对勾，红格实心叉
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const mx = x + CW / 2;
      const my = y + CH / 2;
      if (bad) {
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mx - 4.5, my - 4.5);
        ctx.lineTo(mx + 4.5, my + 4.5);
        ctx.moveTo(mx + 4.5, my - 4.5);
        ctx.lineTo(mx - 4.5, my + 4.5);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.62)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - 5, my);
        ctx.lineTo(mx - 1.5, my + 3.8);
        ctx.lineTo(mx + 5.5, my - 4);
        ctx.stroke();
      }
      ctx.restore();

      // 选中描边（蓝 = 当前状态）
      if (i === sel) {
        ctx.save();
        ctx.strokeStyle = C.guide;
        ctx.lineWidth = 2.4;
        roundRect(ctx, x - 3.5, y - 3.5, CW + 7, CH + 7, 8);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* ── 阵列右侧图例 ── */
    fillRound(ctx, LEG_X, 70, 12, 12, 3, C.pass);
    text(ctx, '复现成功', LEG_X + 18, 80, { size: 11, color: C.ink, weight: '700' });
    text(ctx, '46 格', LEG_X + 18, 95, { size: 10.5, color: C.muted, mono: true });

    fillRound(ctx, LEG_X, 118, 12, 12, 3, C.fail);
    text(ctx, '未能复现', LEG_X + 18, 128, { size: 11, color: C.ink, weight: '700' });
    text(ctx, '2 格', LEG_X + 18, 143, { size: 10.5, color: C.muted, mono: true });

    text(ctx, '点击格子', LEG_X, 172, { size: 10.5, color: C.muted });

    /* ── 选中说明条 ── */
    fillRound(ctx, 18, BOX_Y, MW - 36, BOX_H, 6, C.white, C.axis, 1);
    const ty = BOX_Y + BOX_H / 2 + 4;
    if (sel < 0) {
      text(ctx, '点击任意一个格子，看这一格的复现结果。', 32, ty, { size: 12, color: C.muted });
    } else if (selMiss) {
      fillRound(ctx, 32, ty - 12, 9, 9, 2, C.fail);
      text(ctx, `${selMiss.short} —— 未能复现`, 48, ty, {
        size: 12,
        color: C.fail,
        weight: '700',
      });
    } else {
      fillRound(ctx, 32, ty - 12, 9, 9, 2, C.pass);
      text(ctx, '这一格复现成功 —— 复现值不低于官方值，或绝对差 ≤ 2%。', 48, ty, {
        size: 12,
        color: C.pass,
        weight: '700',
      });
    }

    text(ctx, '红色两格是论文中唯一没能对上的两格，点开可看论文给出的原因。', 18, 245, {
      size: 11,
      color: C.muted,
    });
  });

  const pick = (i: number) => {
    setSel(i);
    if (MISS[i]) {
      setFb({
        text: '复现失败的恰恰是配置未公开的模型——反过来印证了上一个模块：评测漂移是基建问题，不是本质限制。',
        cls: 'good',
      });
    } else {
      setFb({
        text: '这一格复现成功。46 个绿格全部走同一套钉死配置的三段式流水线复测通过。',
        cls: '',
      });
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, MW, MH);
    const col = Math.floor((p.x - GX) / (CW + GAP));
    const row = Math.floor((p.y - GY) / (CH + GAP));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    const i = row * COLS + col;
    const { x, y } = cellXY(i);
    if (p.x < x || p.x > x + CW || p.y < y || p.y > y + CH) return;
    pick(i);
  };

  return (
    <div>
      <div className="chip-row">
        {MISS_IDX.map((i) => (
          <button key={i} className="tiny ghost" onClick={() => pick(i)}>
            红格 · {MISS[i].short.split(' · ')[0]}
          </button>
        ))}
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={MW}
        height={MH}
        onClick={onCanvasClick}
      />

      <div className="tech-inset" style={{ minHeight: 64 }}>
        {sel < 0 ? (
          <span>点击阵列中任意格子。红色两格是论文中仅有的两个未复现格，点开可看论文给出的失败原因。</span>
        ) : selMiss ? (
          <span>
            <b>{selMiss.title}</b>
            <br />
            {selMiss.body}
          </span>
        ) : (
          <span>
            <b>这一格复现成功</b>
            <br />
            复现值不低于官方报告值，或与官方值的绝对差 ≤ 2%，按论文的判定标准记为复现成功。
          </span>
        )}
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="l">基准数 Benchmarks</div>
          <div className="v">6</div>
        </div>
        <div className="metric">
          <div className="l">模型数 Models</div>
          <div className="v">11+</div>
        </div>
        <div className="metric">
          <div className="l">46 / 48 复现成功</div>
          <div className="v">95.8%</div>
        </div>
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <div className="src-note">
        数据来源：论文表 3。判定标准为「复现值不低于官方值，或绝对差 ≤ 2%」。
      </div>

      <div className="src-note warn">
        ⚠ 12 × 4 的格子排布仅为数量示意，48 格并非按「基准 × 模型」的真实矩阵排列，两个红格的位置也不代表具体行列。
      </div>
    </div>
  );
};

export default M10b;
