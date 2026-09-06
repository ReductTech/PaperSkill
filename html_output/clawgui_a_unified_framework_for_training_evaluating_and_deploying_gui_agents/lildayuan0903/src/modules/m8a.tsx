import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, roundRect, line, arrow } from './kit';

/* ============================================================================
   3.1 配置不锁 vs 配置锁死 —— 这两个分数到底能不能放在一起比？

   同一个模型、同一个基准，权重一个比特都没改。左右两次评测唯一的差别，
   只在四项常常不写进论文的评测配置上。

   「配置漂移」：四项配置各不相同 → 结果区不给任何数字。因为此时任何数字
   都没有意义，你分不清差距来自模型还是来自配置。
   「配置锁定」：四项配置逐项钉死，两边走同一条 Infer → Judge → Metric
   流水线 → 结果才成为可比的量。

   ⚠ 本模块刻意不显示任何分数或百分比变化：论文并未公布逐项配置对分数的
   影响量，凭空造出这样的数字，正是本模块所批判的行为本身。
   ============================================================================ */

type Mode = 0 | 1; // 0 = 配置漂移，1 = 配置锁定

const MODES = ['配置漂移', '配置锁定（ClawGUI-Eval）'];

interface Cfg {
  label: string;
  /** 漂移状态下 A、B 两侧各自的取值 */
  a: string;
  b: string;
  /** 锁定状态下两侧共用的取值 */
  fixed: string;
}

const CFGS: Cfg[] = [
  { label: '提示词模板', a: '模板 A', b: '模板 B', fixed: '模板 A' },
  { label: '输入分辨率', a: '768 px', b: '1024 px', fixed: '1024 px' },
  { label: '坐标归一化', a: '绝对像素', b: '千分比', fixed: '千分比' },
  { label: '采样温度', a: '0.0', b: '0.7', fixed: '0.0' },
];

/* ── 画布几何：两种状态下完全一致，切换时画布不跳动 ── */
const PANEL_Y = 34;
const PANEL_H = 130;
const PANEL_W = 246;
const PA_X = 14;
const PB_X = 300;
const MID_X = 280; // 两块面板之间的中轴
const ROW_Y0 = 60;
const ROW_H = 26;
const CHIP_W = 100;

const RES_Y = 172;
const RES_H = 34;
const RES_W = 112;
const RES_MID = RES_Y + RES_H / 2;
const RA_X = PA_X + PANEL_W / 2 - RES_W / 2; // 81
const RB_X = PB_X + PANEL_W / 2 - RES_W / 2; // 367

const PIPE_Y = 214;
const PIPE_H = 30;
const PIPE_X = 112;
const PIPE_W = 336;
const BLOCK_W = 88;
const PIPE_MID = PIPE_Y + PIPE_H / 2;

/** 小挂锁图标：表示「这一项已被钉死」 */
function padlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y - 1.5, 2.6, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
  fillRound(ctx, x - 4, y - 1.5, 8, 7, 1.5, color);
}

/** 绿色对勾 */
function check(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.32;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y);
  ctx.lineTo(x - s * 0.15, y + s * 0.45);
  ctx.lineTo(x + s * 0.6, y - s * 0.5);
  ctx.stroke();
  ctx.restore();
}

export const M8a: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<Mode>(0);
  const locked = mode === 1;

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    const accent = locked ? C.pass : C.fail;
    const soft = locked ? 'rgba(31,111,67,0.12)' : 'rgba(179,55,47,0.10)';

    /* ── 顶部：强调「模型和基准一个字都没改」 ── */
    text(ctx, '固定不变：', 16, 21, { size: 12.5, color: C.muted, weight: '700' });
    text(ctx, '同一个模型 · 同一个基准 · 权重一比特未改', 79, 21, {
      size: 12.5,
      color: C.guide,
      weight: '700',
    });
    text(ctx, '唯一的差别：下面四项评测配置', MW - 16, 21, {
      size: 11.5,
      color: C.muted,
      align: 'right',
    });

    /* ── 两块并排的评测面板 ── */
    const drawPanel = (px: number, title: string, side: 'a' | 'b') => {
      fillRound(ctx, px, PANEL_Y, PANEL_W, PANEL_H, 7, C.white, C.axis, 1);
      text(ctx, title, px + 12, PANEL_Y + 17, { size: 12.5, color: C.guide, weight: '800' });
      text(ctx, locked ? '配置已锁定' : '配置自选', px + PANEL_W - 12, PANEL_Y + 17, {
        size: 11,
        color: locked ? C.pass : C.fail,
        weight: '700',
        align: 'right',
      });
      line(ctx, px + 10, PANEL_Y + 24, px + PANEL_W - 10, PANEL_Y + 24, C.axis, 1);

      CFGS.forEach((cfg, i) => {
        const y = ROW_Y0 + i * ROW_H;
        text(ctx, cfg.label, px + 12, y + 14, { size: 11.5, color: C.ink });

        const cx = px + PANEL_W - 12 - CHIP_W;
        fillRound(ctx, cx, y, CHIP_W, 20, 5, soft, accent, 1);

        if (locked) {
          padlock(ctx, cx + 12, y + 10, C.pass);
          text(ctx, cfg.fixed, cx + 24, y + 14, { size: 11.5, color: C.pass, weight: '700' });
        } else {
          text(ctx, side === 'a' ? cfg.a : cfg.b, cx + CHIP_W / 2, y + 14, {
            size: 11.5,
            color: C.fail,
            weight: '700',
            align: 'center',
          });
        }
      });
    };

    drawPanel(PA_X, '评测 A', 'a');
    drawPanel(PB_X, '评测 B', 'b');

    /* ── 中轴上的逐项「≠ / =」 ── */
    CFGS.forEach((_, i) => {
      const y = ROW_Y0 + i * ROW_H + 14;
      text(ctx, locked ? '=' : '≠', MID_X, y, {
        size: 15,
        color: accent,
        weight: '800',
        align: 'center',
      });
    });

    /* ── 结果区：漂移时给问号，锁定时给对勾。任何状态下都不出现分数 ── */
    const drawResult = (rx: number, label: string) => {
      fillRound(ctx, rx, RES_Y, RES_W, RES_H, 6, soft, accent, 1.4);
      text(ctx, label, rx + 14, RES_MID + 4, { size: 11.5, color: C.muted, weight: '700' });
      if (locked) {
        check(ctx, rx + 84, RES_MID, 15, C.pass);
      } else {
        text(ctx, '?', rx + 84, RES_MID, {
          size: 21,
          color: C.fail,
          weight: '800',
          align: 'center',
          baseline: 'middle',
        });
      }
    };
    drawResult(RA_X, '结果 A');
    drawResult(RB_X, '结果 B');

    /* ── 中间的判定徽标（带极轻的呼吸光晕，指引视线） ── */
    const pulse = 0.5 + 0.5 * Math.sin(t / 520);
    const badge = locked ? '可比较 ✓' : '无法直接比较';
    const bw = locked ? 78 : 94;
    const bx = MID_X - bw / 2;

    fillRound(
      ctx,
      bx - 6,
      RES_Y - 3,
      bw + 12,
      RES_H + 6,
      9,
      locked ? `rgba(31,111,67,${0.05 + 0.1 * pulse})` : `rgba(179,55,47,${0.05 + 0.1 * pulse})`
    );

    const segDash: number[] = locked ? [] : [5, 4];
    line(ctx, RA_X + RES_W, RES_MID, bx - 4, RES_MID, accent, locked ? 2 : 1.8, segDash);
    line(ctx, bx + bw + 4, RES_MID, RB_X, RES_MID, accent, locked ? 2 : 1.8, segDash);

    fillRound(ctx, bx, RES_MID - 13, bw, 26, 13, accent);
    text(ctx, badge, MID_X, RES_MID, {
      size: 11.5,
      color: C.white,
      weight: '800',
      align: 'center',
      baseline: 'middle',
    });

    /* ── 底部：三段式流水线（锁定）／未成立的流水线（漂移） ── */
    if (locked) {
      text(ctx, '三段解耦：', 16, PIPE_MID + 4, { size: 11.5, color: C.muted, weight: '700' });

      const stages = ['Infer', 'Judge', 'Metric'];
      stages.forEach((s, i) => {
        const sx = PIPE_X + i * (BLOCK_W + 36);
        fillRound(ctx, sx, PIPE_Y, BLOCK_W, PIPE_H, 7, C.pass);
        text(ctx, s, sx + BLOCK_W / 2, PIPE_MID, {
          size: 13,
          color: C.white,
          weight: '800',
          align: 'center',
          baseline: 'middle',
        });
        if (i < stages.length - 1) {
          arrow(ctx, sx + BLOCK_W + 4, PIPE_MID, sx + BLOCK_W + 32, PIPE_MID, C.pass, 2, 6);
        }
      });

      text(ctx, '任一段可独立重跑', MW - 16, PIPE_MID + 4, {
        size: 10.5,
        color: C.muted,
        align: 'right',
      });
    } else {
      text(ctx, '流水线：', 16, PIPE_MID + 4, { size: 11.5, color: C.muted, weight: '700' });
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.2;
      roundRect(ctx, PIPE_X, PIPE_Y, PIPE_W, PIPE_H, 7);
      ctx.stroke();
      ctx.restore();
      text(ctx, '四项配置各不相同 —— 两次评测走的根本不是同一条链路', PIPE_X + PIPE_W / 2, PIPE_MID, {
        size: 11.5,
        color: C.muted,
        align: 'center',
        baseline: 'middle',
      });
    }
  });

  const fb = locked
    ? {
        text: '逐模型钉死配置，再走同一条 Infer → Judge → Metric 流水线，两个数字才真正可比。',
        cls: 'good',
      }
    : {
        text: '四项配置各不相同，两个分数放在一起没有任何意义——你分不清差距来自模型还是来自配置。',
        cls: 'bad',
      };

  return (
    <div>
      <div className="chip-row">
        {MODES.map((m, i) => (
          <button
            key={m}
            className={`chip ${mode === i ? 'selected' : ''}`}
            onClick={() => setMode(i as Mode)}
          >
            {m}
          </button>
        ))}
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <div className="step-desc">
        在上面两种评测方式之间来回切换：注意结果区自始至终没有出现任何分数——问题从来不是「差多少」，而是「能不能比」。
      </div>

      <div className="tech-inset">
        论文的诘问：ScreenSpot-Pro 上 2% 的提升，可能是真实进步，可能是更讨巧的提示词，也可能只是换了个分辨率——读者没有任何办法分辨。
      </div>

      <div className="src-note">
        ClawGUI-Eval 逐模型固定评测配置，并将 Infer / Judge / Metric 三段解耦，任一段可独立重跑；全部预测结果公开。
      </div>

      <div className="src-note warn">⚠ 配置取值为示意，论文未逐项列出具体取值。</div>
    </div>
  );
};

export default M8a;
