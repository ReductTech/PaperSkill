import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, line, arrow, pointerPos } from './kit';

/* ============================================================================
   1.2 三段裂缝的地图 —— 整场汇报的导航图

   研究 →[裂缝1]→ 训练 →[裂缝2]→ 评测 →[裂缝3]→ 用户
   点任意一道红色裂缝：断口被绿色拱桥补上，对应的 ClawGUI 模块点亮。
   每道裂缝只保留一句问题，详情留给后面的章节展开。
   ============================================================================ */

const strokeLine = line as unknown as (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color?: string,
  lw?: number,
  dash?: number[]
) => void;
const drawArrow = arrow as unknown as (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color?: string,
  lw?: number,
  head?: number
) => void;

interface Box {
  l: number;
  t: number;
  w: number;
  h: number;
}

interface Gap {
  no: string;
  stage: string;
  module: string;
  problem: string;
  fix: string;
  /** 点开后的结论：每道裂缝各说各的，不复用同一句 */
  lead: string;
  /** 该模块在论文 Figure 1 上的位置（百分比）：上方模块卡 + 下方对应部分 */
  boxes: Box[];
}

/* Figure 1 原图 1100 × 474，下列百分比由原图像素实测换算：
   上方模块卡 y 8–197，下方对应部分 y 204–470。 */
const TOP = { t: 1.7, h: 39.9 };
const BOT = { t: 43.0, h: 56.1 };

const GAPS: Gap[] = [
  {
    no: '裂缝 1',
    stage: '训练',
    module: 'ClawGUI-RL',
    problem: '在线 RL 的训练基建全部闭源，且只在模拟器里验证过。',
    fix: '开源的训练基建：虚拟环境与真机同一套接口，奖励从稀疏变稠密。',
    lead:
      '原图框出来的就是 ClawGUI-RL：上面是 Rollout 管理器、多环境并行、奖励管理器（PRM）、RL 训练器四件套，下面 Build 这一列是它管着的虚拟设备与真实设备——第 2 章我们把这个闭环逐环点亮。',
    boxes: [
      { l: 3.1, w: 33.0, ...TOP },
      { l: 3.1, w: 33.3, ...BOT },
    ],
  },
  {
    no: '裂缝 2',
    stage: '评测',
    module: 'ClawGUI-Eval',
    problem: '评测配置在论文之间悄悄漂移，跨论文的分数根本不可比。',
    fix: '逐模型钉死配置，统一 Infer → Judge → Metric 流水线，数字重新可比。',
    lead:
      '中间框出来的是 ClawGUI-Eval：上面是 Infer → Judge → Metric 三段流水线，挂着 ScreenSpot-Pro、UI-Vision、MMBench-GUI 等 6 个基准，下面 Evaluate 这一列就是统一跑分的那一段——第 3 章看它怎么把分数变回可比。',
    boxes: [
      { l: 37.4, w: 26.5, ...TOP },
      { l: 36.7, w: 26.9, ...BOT },
    ],
  },
  {
    no: '裂缝 3',
    stage: '部署',
    module: 'ClawGUI-Agent',
    problem: '训好的智能体几乎从不落到真实设备上，对真人有没有用无从验证。',
    fix: '接上真机与聊天平台，让训练出来的智能体真正被人用起来。',
    lead:
      '右边框出来的是 ClawGUI-Agent：上面是 Chat Apps → Agent Loop → Result，配上个性化记忆与混合控制，下面 Deployment 这一列是消息进来后感知 → 推理 → 动作、一路落到真机的完整流程——第 4 章我们发一条指令走一遍。',
    boxes: [
      { l: 64.7, w: 30.5, ...TOP },
      { l: 60.5, w: 34.7, ...BOT },
    ],
  },
];

const BOXES = ['研究', '训练', '评测', '用户'];
const BOX_W = 90;
const GAP_W = 56;
const PITCH = BOX_W + GAP_W;
const X0 = 16;
const BOX_Y = 56;
const BOX_H = 48;
const CY = BOX_Y + BOX_H / 2;

const gapX = (i: number) => X0 + BOX_W + i * PITCH;
const gapCx = (i: number) => gapX(i) + GAP_W / 2;

export const M2a: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState(-1);

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    text(ctx, '从研究到用户：这条管道断了三处', 16, 28, {
      size: 14,
      weight: '700',
      color: C.ink,
    });

    // 阶段方块
    BOXES.forEach((b, i) => {
      const bx = X0 + i * PITCH;
      const isFixed = sel >= 0 && (i === sel || i === sel + 1);
      fillRound(
        ctx,
        bx,
        BOX_Y,
        BOX_W,
        BOX_H,
        8,
        C.white,
        isFixed ? C.guide : C.axis,
        isFixed ? 1.8 : 1
      );
      text(ctx, b, bx + BOX_W / 2, CY, {
        size: 15,
        weight: '700',
        color: C.ink,
        align: 'center',
        baseline: 'middle',
      });
    });

    // 三道裂缝
    GAPS.forEach((g, i) => {
      const gx = gapX(i);
      const cx = gapCx(i);
      const on = sel === i;

      text(ctx, on ? '已补上' : g.no, cx, BOX_Y - 8, {
        size: 11.5,
        weight: '700',
        color: on ? C.pass : C.fail,
        align: 'center',
      });

      // 断掉的两截管道
      strokeLine(ctx, gx, CY, gx + 16, CY, on ? C.pass : C.fail, 3.5);
      strokeLine(ctx, gx + GAP_W - 16, CY, gx + GAP_W, CY, on ? C.pass : C.fail, 3.5);

      if (on) {
        // 绿色拱桥把断口接上
        ctx.save();
        ctx.strokeStyle = C.pass;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(gx + 14, CY);
        ctx.quadraticCurveTo(cx, CY - 22, gx + GAP_W - 14, CY);
        ctx.stroke();
        ctx.restore();
        const pulse = 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(t / 320));
        ctx.save();
        ctx.globalAlpha = pulse;
        fillRound(ctx, gx - 2, BOX_Y - 2, GAP_W + 4, BOX_H + 4, 8, 'rgba(31,111,67,0.10)', C.pass, 2);
        ctx.restore();
      } else {
        // 断口锯齿
        ctx.save();
        ctx.strokeStyle = C.fail;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx + 16, CY - 9);
        ctx.lineTo(gx + 21, CY - 3);
        ctx.lineTo(gx + 16, CY + 3);
        ctx.lineTo(gx + 21, CY + 9);
        ctx.moveTo(gx + GAP_W - 16, CY - 9);
        ctx.lineTo(gx + GAP_W - 21, CY - 3);
        ctx.lineTo(gx + GAP_W - 16, CY + 3);
        ctx.lineTo(gx + GAP_W - 21, CY + 9);
        ctx.stroke();
        ctx.restore();
      }

      // 连到下方的模块名
      strokeLine(ctx, cx, BOX_Y + BOX_H + 2, cx, 130, on ? C.pass : C.axis, on ? 2 : 1, on ? [] : [4, 4]);
      fillRound(
        ctx,
        cx - 52,
        132,
        104,
        26,
        13,
        on ? 'rgba(31,111,67,0.12)' : C.white,
        on ? C.pass : C.axis,
        on ? 1.8 : 1
      );
      text(ctx, g.module, cx, 145, {
        size: 12.5,
        weight: '700',
        mono: true,
        color: on ? C.pass : C.muted,
        align: 'center',
        baseline: 'middle',
      });
    });

    // 底部固定说明条：高度恒定，切换时画面不跳动
    fillRound(ctx, 16, 176, MW - 32, 66, 8, C.white, C.axis, 1);
    if (sel < 0) {
      text(ctx, '点击任意一道红色裂缝，看论文用哪个模块去补。', MW / 2, 209, {
        size: 13,
        color: C.muted,
        align: 'center',
        baseline: 'middle',
      });
    } else {
      const g = GAPS[sel];
      text(ctx, `${g.no} · ${g.stage}`, 30, 196, { size: 12, weight: '700', color: C.fail });
      text(ctx, g.problem, 30, 215, { size: 12.5, color: C.ink });
      drawArrow(ctx, 30, 228, 46, 228, C.pass, 2, 6);
      text(ctx, `${g.module}：${g.fix}`, 52, 232, { size: 12, color: C.pass, weight: '600' });
    }
  });

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e, MW, MH);
    for (let i = 0; i < GAPS.length; i++) {
      const gx = gapX(i);
      const cx = gapCx(i);
      const hitGap =
        p.x >= gx - 4 && p.x <= gx + GAP_W + 4 && p.y >= BOX_Y - 16 && p.y <= BOX_Y + BOX_H + 6;
      const hitPill = p.x >= cx - 52 && p.x <= cx + 52 && p.y >= 132 && p.y <= 158;
      if (hitGap || hitPill) {
        setSel(i);
        return;
      }
    }
  };

  const cur = sel >= 0 ? GAPS[sel] : null;

  return (
    <div>
      {/* 论文 Figure 1 原图：选中某道裂缝时，在原图上框出对应模块并压暗其余部分 */}
      <figure className="paper-figure" style={{ margin: '4px 0 14px' }}>
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: 6,
            lineHeight: 0,
          }}
        >
          <img
            src="/images/fig1-overview.png"
            alt="论文 Figure 1：ClawGUI 框架总览"
            loading="lazy"
            style={{
              maxWidth: '100%',
              display: 'block',
              border: '1px solid var(--line)',
              borderRadius: 6,
              background: '#fff',
            }}
          />
          {cur ? (
            <>
              {/* 遮罩：整张图压暗，只在两个高亮框处开洞 */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                aria-hidden="true"
              >
                <defs>
                  <mask id="m2a-spot" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                    <rect x="0" y="0" width="100" height="100" fill="#fff" />
                    {cur.boxes.map((b, i) => (
                      <rect key={i} x={b.l} y={b.t} width={b.w} height={b.h} rx="1" fill="#000" />
                    ))}
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  fill="rgba(250, 247, 239, 0.70)"
                  mask="url(#m2a-spot)"
                />
              </svg>
              {/* 两个绿色高亮框：上方模块卡 + 下方对应部分 */}
              {cur.boxes.map((b, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${b.l}%`,
                    top: `${b.t}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                    border: `3px solid ${C.pass}`,
                    borderRadius: 8,
                    transition: 'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </>
          ) : null}
        </div>
        <figcaption>
          论文 Figure 1：ClawGUI 框架总览
          {cur ? `　·　当前高亮：${cur.module}（对应${cur.stage}这一段）` : '　·　点下方任意一道裂缝，在原图上框出对应模块'}
        </figcaption>
      </figure>

      <div className="chip-row">
        {GAPS.map((g, i) => (
          <button
            key={g.no}
            className={`chip ${sel === i ? 'selected' : ''}`}
            onClick={() => setSel(i)}
          >
            {g.no} · {g.stage}
          </button>
        ))}
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={MW}
        height={MH}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />

      <div className={`feedback ${cur ? 'good' : ''}`}>
        {cur
          ? cur.lead
          : '这条从「研究」通向「用户」的管道断了三处。点击画布上任意一道红色裂缝，或用上方按钮——原图上会同步框出对应的模块。'}
      </div>

      <div className="step-desc">
        三道裂缝对应三个模块，也对应本教程的第 2、3、4 章——这张图就是整篇论文的结构。
      </div>
    </div>
  );
};

export default M2a;
