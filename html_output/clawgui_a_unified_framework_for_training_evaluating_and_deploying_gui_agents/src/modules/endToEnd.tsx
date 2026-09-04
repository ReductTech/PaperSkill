import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, FONT, text, fillRound, line, road, car } from './kit';

/* ============================================================================
   收尾：一条任务走完「训练 → 评测 → 部署」整条路

   小车从左往右开，依次经过三段；每进入一段，该段变绿并弹出它的证据数字。
   全程 2.4 秒左右跑完，跑完后画布底部给出边界提示：
   三类证据各管一段，不能互相替代。
   ============================================================================ */

interface Seg {
  zh: string;
  en: string;
  lines: [string, string];
  ev: string;
  evLabel: string;
}

const SEGS: Seg[] = [
  {
    zh: '训练',
    en: 'TRAIN',
    lines: ['64 个并行虚拟环境 + 真机', 'PRM 逐步奖励 + GiGPO'],
    ev: '17.1%',
    evLabel: 'MobileWorld GUI-Only',
  },
  {
    zh: '评测',
    en: 'EVALUATE',
    lines: ['Infer → Judge → Metric', '6 个基准 / 11+ 模型'],
    ev: '95.8%',
    evLabel: '46 / 48 个格子复现一致',
  },
  {
    zh: '部署',
    en: 'DEPLOY',
    lines: ['12+ 聊天平台', 'Android / HarmonyOS / iOS'],
    ev: '真机可用',
    evLabel: '12+ 平台 · 3 种系统',
  },
];

/* —— 版面常量 —— */
const PX = [10, 194, 378];
const PW = 172;
const PY = 38;
const PH = 128;
const RY = 176;
const RH = 16;
const CENTERS = [96, 280, 464];

/* —— 时间轴：全程 2.4 秒出头，绝不做慢动画 —— */
const CAR_X0 = 24;
const CAR_X1 = 536;
const TRAVEL = 2300;
const T = CENTERS.map((c) => Math.round((TRAVEL * (c - CAR_X0)) / (CAR_X1 - CAR_X0)));
const DONE_T = TRAVEL + 120;

const INIT_FB = {
  text: '点「开始端到端流程 ▸」，跟着一条任务把训练、评测、部署三段一次走完。',
  cls: '',
};

const SEG_FB = [
  {
    text: '训练段：64 个并行虚拟环境加真机，PRM 给出稠密的逐步奖励，再交给 GiGPO（Feng et al. 2025b，非本文提出）更新模型——这一段的证据是 MobileWorld GUI-Only 上的 17.1%。',
    cls: '',
  },
  {
    text: '评测段：Infer → Judge → Metric 三步拆开跑，同一套配置重算 6 个基准、11+ 个模型，46 / 48 个格子对得上，复现率 95.8%。',
    cls: '',
  },
  {
    text: '部署段：同一个智能体接到 12+ 个聊天平台，落到 Android、HarmonyOS、iOS 三类真实设备上。',
    cls: '',
  },
];

const DONE_FB = {
  text: '17.1% 只验证训练流水线，95.8% 只验证评测可复现，12+ 平台与三类设备只验证部署能力——三类证据各管一段，不能互相替代。',
  cls: 'good',
};

const NOTE1 = '17.1% 只验证训练流水线 · 95.8% 只验证评测可复现 · 12+ 平台与三类设备只验证部署能力';
const NOTE2 = '三类证据各管一段，不能互相替代';

/** 自动缩字号，保证任何字体回退下都不会撑破色块 */
function fitSize(ctx: CanvasRenderingContext2D, s: string, maxW: number, base: number): number {
  let sz = base;
  while (sz > 8) {
    ctx.font = `400 ${sz}px ${FONT}`;
    if (ctx.measureText(s).width <= maxW) break;
    sz -= 0.5;
  }
  return sz;
}

function easeOut(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

function drawSeg(
  ctx: CanvasRenderingContext2D,
  i: number,
  reached: boolean,
  isCur: boolean,
  pop: number
) {
  const px = PX[i];
  const s = SEGS[i];
  const col = reached ? C.pass : C.axis;

  fillRound(ctx, px, PY, PW, PH, 8, C.white, col, isCur ? 2.6 : reached ? 1.7 : 1.2);
  fillRound(
    ctx,
    px,
    PY,
    PW,
    26,
    8,
    reached ? 'rgba(31,111,67,0.12)' : 'rgba(221,214,200,0.38)'
  );

  text(ctx, s.zh, px + 12, PY + 18, {
    size: 13,
    weight: '800',
    color: reached ? C.pass : C.muted,
  });
  text(ctx, s.en, px + PW - 12, PY + 18, {
    size: 10,
    weight: '700',
    color: reached ? C.pass : C.muted,
    align: 'right',
  });

  s.lines.forEach((ln, k) => {
    text(ctx, ln, px + 12, PY + 46 + k * 18, {
      size: fitSize(ctx, ln, PW - 24, 10.5),
      color: reached ? C.ink : C.muted,
    });
  });

  /* —— 证据格 —— */
  const bx = px + 12;
  const by = PY + 74;
  const bw = PW - 24;
  const bh = 34;

  if (pop <= 0) {
    fillRound(ctx, bx, by, bw, bh, 6, 'rgba(221,214,200,0.30)', C.axis, 1);
    text(ctx, '证据待验', bx + bw / 2, by + bh / 2, {
      size: 11,
      color: C.muted,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    const e = easeOut(Math.min(1, pop));
    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(0.82 + 0.18 * e, 0.82 + 0.18 * e);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));
    fillRound(ctx, bx, by, bw, bh, 6, 'rgba(31,111,67,0.13)', C.pass, 1.4);
    text(ctx, s.ev, bx + bw / 2, by + bh / 2 + 0.5, {
      size: 16,
      weight: '800',
      color: C.pass,
      align: 'center',
      baseline: 'middle',
      mono: true,
    });
    ctx.restore();
  }

  text(ctx, s.evLabel, px + PW / 2, PY + 122, {
    size: fitSize(ctx, s.evLabel, PW - 16, 9.5),
    color: C.muted,
    align: 'center',
  });
}

export const EndToEnd: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0); // 0 未开始 · 1~3 已到第 n 段 · 4 完成
  const [fb, setFb] = useState(INIT_FB);
  const startRef = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    if (!running) startRef.current = null;
    else if (startRef.current === null) startRef.current = t;

    const el = startRef.current === null ? -1 : t - startRef.current;
    const cur = el < 0 ? -1 : T.reduce((acc, ms, i) => (el >= ms ? i : acc), -1);
    const finished = el >= DONE_T;

    /* —— 标题 —— */
    text(ctx, '一条任务走完整条路：训练 → 评测 → 部署', 10, 22, {
      size: 12,
      weight: '700',
      color: C.ink,
    });
    text(ctx, finished ? '全程跑完' : cur < 0 ? '还没出发' : `正在第 ${cur + 1} 段`, MW - 10, 22, {
      size: 11,
      weight: '700',
      color: finished ? C.pass : C.muted,
      align: 'right',
    });

    /* —— 三段大色块 —— */
    SEGS.forEach((_, i) => {
      const reached = i <= cur;
      const pop = reached ? Math.min(1, (el - T[i]) / 260) : 0;
      drawSeg(ctx, i, reached, !finished && i === cur, pop);
    });

    /* —— 色块与路面之间的短连接线 —— */
    CENTERS.forEach((cx, i) => {
      line(ctx, cx, PY + PH, cx, RY, i <= cur ? C.pass : C.axis, 1.2, [3, 3]);
    });

    /* —— 路面与小车 —— */
    road(ctx, 10, RY, 540, RH, 0);
    const p = el < 0 ? 0 : Math.min(1, el / TRAVEL);
    const cx = CAR_X0 + p * (CAR_X1 - CAR_X0);
    car(ctx, cx, RY + RH / 2, 0.5, finished ? C.pass : C.guide);

    /* —— 底部边界提示 —— */
    if (finished) {
      fillRound(ctx, 20, 200, 520, 52, 8, 'rgba(31,111,67,0.08)', C.pass, 1.4);
      text(ctx, NOTE1, MW / 2, 222, {
        size: fitSize(ctx, NOTE1, 496, 11.5),
        color: C.ink,
        align: 'center',
      });
      text(ctx, NOTE2, MW / 2, 241, {
        size: fitSize(ctx, NOTE2, 496, 12.5),
        weight: '800',
        color: C.pass,
        align: 'center',
      });
    } else {
      text(
        ctx,
        el < 0 ? '按下方「开始端到端流程 ▸」，小车会依次经过三段' : '小车正在往下一段开……',
        MW / 2,
        226,
        { size: 12, color: C.muted, align: 'center' }
      );
    }
  });

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const start = () => {
    clearTimers();
    startRef.current = null;
    setStage(0);
    setRunning(true);
    setFb({ text: '出发：同一条任务先进训练段。', cls: '' });
    T.forEach((ms, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setStage(i + 1);
          setFb(SEG_FB[i]);
        }, ms)
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setStage(4);
        setFb(DONE_FB);
      }, DONE_T)
    );
  };

  const reset = () => {
    clearTimers();
    startRef.current = null;
    setRunning(false);
    setStage(0);
    setFb(INIT_FB);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className="chip-row">
        <button className="tiny" disabled={running && stage < 4} onClick={start}>
          开始端到端流程 ▸
        </button>
        <button className="tiny ghost" disabled={!running} onClick={reset}>
          重置
        </button>
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <div className="metrics">
        <div className="metric">
          <div className="l">训练</div>
          <div className="v">17.1%</div>
          <div className="l">MobileWorld GUI-Only</div>
        </div>
        <div className="metric">
          <div className="l">评测</div>
          <div className="v">95.8%</div>
          <div className="l">46 / 48 个格子</div>
        </div>
        <div className="metric">
          <div className="l">部署</div>
          <div className="v">12+</div>
          <div className="l">聊天平台 · 3 种系统</div>
        </div>
      </div>

      <div className="step-desc">
        按一次就跑完全程（约 2.4 秒）；想再看一遍，先按「重置」再点一次开始。
      </div>

      <div className="src-note">三段数字分别来自论文表 1、表 3 与部署章节。</div>
    </div>
  );
};

export default EndToEnd;
