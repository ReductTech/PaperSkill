import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, text, fillRound, line, arrow } from './kit';

/* ============================================================================
   4.1 三种设备控制范式，同一条任务链路的定性对比

   纯 CLI —— 指令 → 程序接口 → 应用；碰上没有程序接口的长尾应用，链路断在接口处。
   纯 GUI —— 指令 → 屏幕感知 → 逐屏点击 → 应用；哪儿都走得通，代价是链路明显更长。
   混合   —— 先判断「有程序接口？」：有 → 走 CLI 短链路；没有 → 退回 GUI 长链路。

   本模块只做定性的链路示意：不出现任何步数、覆盖率或百分比
   （论文给的是范式论断，并没有这组量化对比）。
   ============================================================================ */

type Mode = 0 | 1 | 2;
type Pt = [number, number];

const MODES = ['纯 CLI', '纯 GUI', '混合（论文方案）'];
const VERDICT = [
  '链路断在「没有程序接口」的地方',
  '哪儿都走得通，但链路明显更长',
  '有接口走 CLI，没有就退回 GUI',
];

const FB: { text: string; cls: string }[] = [
  { text: 'CLI 精确又高效，但只对提供了程序接口的应用有效——长尾应用直接够不着。', cls: 'bad' },
  { text: 'GUI 什么都够得着，代价是每件事都要一屏一屏点过去，链路明显更长。', cls: '' },
  {
    text: '有接口就走 CLI 的精确高效，没有就退回 GUI 的全覆盖——两种范式单独都不够，混合控制才两头都占。',
    cls: 'good',
  },
];

/* ------------------------------------------------------------------ */
/* 通用图元                                                             */
/* ------------------------------------------------------------------ */

/** 折线 + 末端箭头 */
function polyArrow(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, lw = 2) {
  for (let i = 0; i < pts.length - 2; i++) {
    line(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, lw);
  }
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  arrow(ctx, a[0], a[1], b[0], b[1], color, lw, 7);
}

/** 链路上的一个节点框 */
function node(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  stroke: string,
  fill: string,
  sub?: string,
  subColor?: string
) {
  fillRound(ctx, x, y, w, h, 7, fill, stroke, 1.6);
  const cx = x + w / 2;
  if (sub) {
    text(ctx, label, cx, y + h / 2 - 8, {
      size: 12,
      color: C.ink,
      weight: '700',
      align: 'center',
      baseline: 'middle',
    });
    text(ctx, sub, cx, y + h / 2 + 9, {
      size: 10,
      color: subColor ?? C.muted,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    text(ctx, label, cx, y + h / 2, {
      size: 12,
      color: C.ink,
      weight: '700',
      align: 'center',
      baseline: 'middle',
    });
  }
}

/** 「一屏一屏点过去」：一排小方块，当前那一块被点亮 */
function screenRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: number,
  bw: number,
  gap: number,
  t: number,
  on: string,
  off: string
) {
  const k = Math.floor(t / 210) % n;
  for (let i = 0; i < n; i++) {
    fillRound(ctx, x + i * (bw + gap), y, bw, bw * 1.2, 2, i === k ? on : off);
  }
}

/* ------------------------------------------------------------------ */
/* 三种策略各自的链路图                                                  */
/* ------------------------------------------------------------------ */

/** 纯 CLI：指令 → 程序接口 → 应用；长尾应用在接口处被挡住 */
function drawCli(ctx: CanvasRenderingContext2D, t: number) {
  node(ctx, 16, 109, 70, 40, '指令', C.guide, C.white);
  polyArrow(ctx, [[86, 129], [112, 129]], C.guide);
  node(ctx, 112, 109, 88, 40, '程序接口', C.ink, C.white);

  /* 上支：应用提供了程序接口 —— 走得通（绿） */
  polyArrow(ctx, [[200, 129], [226, 129], [226, 76], [256, 76]], C.pass);
  text(ctx, '有程序接口', 232, 114, { size: 10, color: C.pass, weight: '700' });
  node(
    ctx,
    256,
    56,
    290,
    40,
    '提供了程序接口的应用',
    C.pass,
    'rgba(31,111,67,0.09)',
    'CLI 直达 · 精确高效',
    C.pass
  );

  /* 下支：长尾应用没有程序接口 —— 断在接口处（红） */
  polyArrow(ctx, [[200, 129], [226, 129], [226, 186], [246, 186]], C.fail);
  text(ctx, '没有程序接口', 232, 152, { size: 10, color: C.fail, weight: '700' });

  // 红色阻断标记（轻微呼吸，把视线拉到断点上）
  ctx.save();
  ctx.globalAlpha = 0.78 + 0.22 * Math.sin(t / 320);
  fillRound(ctx, 254, 166, 9, 40, 3, C.fail);
  ctx.restore();
  line(ctx, 268, 186, 286, 186, C.axis, 1.5, [4, 4]);
  text(ctx, '够不着', 259, 218, {
    size: 11.5,
    color: C.fail,
    weight: '800',
    align: 'center',
  });

  node(ctx, 286, 166, 260, 40, '没有程序接口的长尾应用', C.fail, C.white, '链路到此为止', C.fail);

  text(ctx, '另：CLI 的执行过程对用户不透明。', 16, 244, { size: 10, color: C.muted });
}

/** 纯 GUI：指令 → 屏幕感知 → 逐屏点击 → 应用；全线走得通，但链路更长 */
function drawGui(ctx: CanvasRenderingContext2D, t: number) {
  node(ctx, 16, 108, 66, 42, '指令', C.pass, C.white);
  polyArrow(ctx, [[82, 129], [104, 129]], C.pass);
  node(ctx, 104, 108, 80, 42, '屏幕感知', C.pass, C.white);
  polyArrow(ctx, [[184, 129], [206, 129]], C.pass);

  // 「逐屏点击」——链路在这里被拉长成一连串小步
  fillRound(ctx, 206, 96, 222, 66, 7, 'rgba(31,111,67,0.07)', C.pass, 1.6);
  text(ctx, '逐屏点击', 317, 113, {
    size: 12,
    color: C.ink,
    weight: '700',
    align: 'center',
  });
  screenRow(ctx, 230, 124, 9, 14, 6, t, C.pass, 'rgba(31,111,67,0.22)');
  text(ctx, '一屏一屏点过去', 317, 155, {
    size: 10,
    color: C.muted,
    align: 'center',
  });

  polyArrow(ctx, [[428, 129], [450, 129]], C.pass);
  node(ctx, 450, 108, 96, 42, '应用', C.pass, 'rgba(31,111,67,0.09)', '都够得着', C.pass);

  fillRound(ctx, 254, 186, 126, 26, 13, 'rgba(31,111,67,0.12)');
  text(ctx, '可执行但链路长', 317, 199.5, {
    size: 12,
    color: C.pass,
    weight: '800',
    align: 'center',
    baseline: 'middle',
  });
}

/** 混合：先判断有没有程序接口，再决定走哪条链路 */
function drawHybrid(ctx: CanvasRenderingContext2D, t: number) {
  node(ctx, 14, 109, 62, 40, '指令', C.guide, C.white);
  polyArrow(ctx, [[76, 129], [96, 129]], C.guide);
  node(ctx, 96, 104, 104, 50, '有程序接口？', C.ink, C.white);

  /* 是 → CLI 短链路（绿） */
  text(ctx, 'CLI 短链路 · 精确高效', 393, 44, {
    size: 10.5,
    color: C.pass,
    weight: '700',
    align: 'center',
  });
  polyArrow(ctx, [[200, 129], [218, 129], [218, 72], [240, 72]], C.pass);
  text(ctx, '是', 224, 96, { size: 11.5, color: C.pass, weight: '800' });
  node(ctx, 240, 52, 92, 40, '程序接口', C.pass, C.white);
  polyArrow(ctx, [[332, 72], [352, 72]], C.pass);
  node(ctx, 352, 52, 194, 40, '应用', C.pass, 'rgba(31,111,67,0.09)');

  /* 否 → 退回 GUI 长链路（蓝） */
  polyArrow(ctx, [[200, 129], [218, 129], [218, 190], [240, 190]], C.guide);
  text(ctx, '否', 224, 170, { size: 11.5, color: C.guide, weight: '800' });
  node(ctx, 240, 170, 74, 40, '屏幕感知', C.guide, C.white);
  polyArrow(ctx, [[314, 190], [330, 190]], C.guide);
  text(ctx, '逐屏点击', 384, 176, {
    size: 9.5,
    color: C.muted,
    align: 'center',
  });
  screenRow(ctx, 333, 182, 6, 13, 5, t, C.guide, 'rgba(39,68,110,0.22)');
  polyArrow(ctx, [[437, 190], [452, 190]], C.guide);
  node(ctx, 452, 170, 94, 40, '应用', C.guide, 'rgba(39,68,110,0.09)');
  text(ctx, 'GUI 长链路 · 全覆盖', 393, 230, {
    size: 10.5,
    color: C.guide,
    weight: '700',
    align: 'center',
  });
}

/* ------------------------------------------------------------------ */

export const M9a: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<Mode>(0);

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    text(ctx, `策略：${MODES[mode]}`, 16, 20, {
      size: 12.5,
      color: mode === 2 ? C.pass : C.ink,
      weight: '800',
    });
    text(ctx, VERDICT[mode], MW - 14, 20, { size: 11, color: C.muted, align: 'right' });

    if (mode === 0) drawCli(ctx, t);
    else if (mode === 1) drawGui(ctx, t);
    else drawHybrid(ctx, t);
  });

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

      <div className={`feedback ${FB[mode].cls}`}>{FB[mode].text}</div>

      <div className="step-desc">切换上方三种策略，看同一条任务链路在哪里断、在哪里变长。</div>

      <div className="src-note">
        论文论断：CLI 精确但覆盖窄且对用户不透明，GUI 全覆盖但交互链路长，因此 ClawGUI-Agent 采用混合
        CLI-GUI 控制。
      </div>
    </div>
  );
};

export default M9a;
