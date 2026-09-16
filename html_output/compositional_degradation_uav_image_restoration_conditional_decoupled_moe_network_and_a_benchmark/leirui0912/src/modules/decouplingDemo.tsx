import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { DEGRADATIONS } from './uavScene';

// 解耦演示：同一个组件在第 3 章挂两处（类比卡与模块 3.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 静态对照。两个 .chip 切换「隐式表示 / 显式
//        解耦」，每次只看一张图，画大一点看得清。先前那个自写的 toggle-btn
//        在框架样式里并不存在（components.css 里被样式覆盖的是 .chip 那套），
//        渲染出来就是个没样式的默认按钮，所以这里换成 .chip。
//   模块 3.1                    -> 动画。8 个因子点从输入出发：左路汇成一团
//        （一个纠缠的整体条件 + 因子间干扰），右路逐个落到多热掩码 m̂ 的位上，
//        再经 FDPM → CDMM 得到按因子各自校正的结果。挂载即播一次；
//        「下一步」把动画推到下一段的终点并停在那里（播完之后按钮变成
//        「分步重看」，按一下回到第一步重新分步走），「重新播放」从头完整播一遍。
//
// 两处共用的东西：uavScene 的 8 种因子（名称与配色）、.chip 按钮、.feedback 反馈行。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const RED = '#c43f52';
const GREEN = '#228d5c';
const PURPLE = '#8b5cf6';

const N = DEGRADATIONS.length;

const W_ANA = 520;
const H_ANA = 220;
const W_MOD = 560;
const H_MOD = 340;

// 动画分四段：出现 → 分岔 → 掩码 → 结果。四段的终点即「下一步」的停靠点，
// 每个停靠点上都只看得见这一段的东西（下一段的元素还没开始画）。
const P_TRAVEL = [0.25, 0.55] as const;
const P_MASK = [0.58, 0.8] as const;
const P_RESULT = [0.8, 1] as const;

// 每段的终点。「下一步」就是停到下一个终点上，最后一步之后回到第一步重走。
const STOPS = [P_TRAVEL[0], P_TRAVEL[1], P_MASK[1], 1];

// 反馈文案与四个停靠点一一对应：停在哪里就说这一段画了什么（最后一段带 good）。
const STOP_MSGS: { text: string; cls: string }[] = [
  { text: '输入：同一张图上叠了多种退化因子', cls: '' },
  { text: '两条路：全压进一个条件，还是每个因子各留一份', cls: '' },
  { text: '左侧因子被搅成一团、互相干扰；右侧 FDPM 给出多热掩码 m̂', cls: '' },
  { text: '左侧修好一个可能弄坏另一个；右侧 CDMM 按掩码让对应专家各自校正', cls: 'good' }
];

const STEP = 0.01; // 每 16ms 推进一格，约 1.6s 播完
const TICK_MS = 16;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 把 t 从 [a,b] 映射到 [0,1]，缓出。t <= a 时为 0，t >= b 时为 1。 */
const seg = (t: number, a: number, b: number) => {
  const k = clamp01((t - a) / (b - a));
  return 1 - Math.pow(1 - k, 3);
};

const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  fillAlpha: number,
  label: string,
  labelColor = INK,
  font = 10
) {
  ctx.fillStyle = rgba(stroke, fillAlpha);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = labelColor;
  ctx.font = `${font}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 4);
}

/** 向下箭头（竖线 + 箭头），用于右路的流程。 */
function arrowDown(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1 - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, y1 - 6);
  ctx.lineTo(x, y1);
  ctx.lineTo(x + 4, y1 - 6);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// 类比卡：一张一张看
// ---------------------------------------------------------------------------

function paintAnalogy(ctx: CanvasRenderingContext2D, view: 'implicit' | 'explicit') {
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (view === 'implicit') {
    ctx.fillStyle = RED;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText('隐式表示（旧方法）', W_ANA / 2, 24);

    // 8 个因子沿圆周分布，每个都连向中心 —— 全都在往同一个地方挤
    const cx = W_ANA / 2;
    const cy = 102;
    const R = 62;
    const at = (i: number) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    };

    ctx.strokeStyle = 'rgba(196,63,82,0.3)';
    ctx.lineWidth = 1;
    DEGRADATIONS.forEach((_, i) => {
      const p = at(i);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });

    // 中心的糊团
    ctx.fillStyle = 'rgba(196,63,82,0.16)';
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(196,63,82,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    DEGRADATIONS.forEach((d, i) => {
      const p = at(i);
      dot(ctx, p.x, p.y, 7, d.color);
    });

    ctx.fillStyle = INK;
    ctx.font = `11px ${FONT}`;
    ctx.fillText('一个纠缠的', cx, cy - 6);
    ctx.fillText('整体条件', cx, cy + 10);
    ctx.fillStyle = RED;
    ctx.font = `10px ${FONT}`;
    ctx.fillText('因子之间互相干扰', cx, H_ANA - 34);

    ctx.fillStyle = SLATE;
    ctx.font = `11px ${FONT}`;
    ctx.fillText('多个退化被压成一个模糊条件，修好一个可能弄坏另一个', cx, H_ANA - 12);
    return;
  }

  ctx.fillStyle = GREEN;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('显式解耦（本文方法）', W_ANA / 2, 24);

  ctx.fillStyle = SLATE;
  ctx.font = `10px ${FONT}`;
  ctx.fillText('FDPM 为每个因子单独给出一份条件', W_ANA / 2, 46);

  // 8 个盒子：一个因子一份条件，互相不干扰
  const bw = 48;
  const gap = 12;
  const x0 = (W_ANA - (N * bw + (N - 1) * gap)) / 2;
  const by = 64;
  const bh = 40;
  DEGRADATIONS.forEach((d, i) => {
    const x = x0 + i * (bw + gap);
    ctx.fillStyle = rgba(d.color, 0.14);
    ctx.fillRect(x, by, bw, bh);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, by + 0.5, bw - 1, bh - 1);

    // 近白色块（如「雪」）在白底上几乎看不见，描一圈内边保证可辨
    ctx.strokeStyle = 'rgba(33,50,74,0.18)';
    ctx.strokeRect(x + 3.5, by + 3.5, bw - 7, bh - 7);

    ctx.fillStyle = INK;
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(d.name, x + bw / 2, by + bh / 2 + 4);

    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(x + bw / 2, by + bh);
    ctx.lineTo(x + bw / 2, by + bh + 20);
    ctx.stroke();
    dot(ctx, x + bw / 2, by + bh + 26, 6, d.color);
  });

  ctx.fillStyle = INK;
  ctx.font = `11px ${FONT}`;
  ctx.fillText(`→ 多热掩码 m̂（${N} 位）→ CDMM 按因子各自修复`, W_ANA / 2, H_ANA - 34);

  ctx.fillStyle = GREEN;
  ctx.font = `11px ${FONT}`;
  ctx.fillText('每个因子各自校正，互不干扰', W_ANA / 2, H_ANA - 12);
}

// ---------------------------------------------------------------------------
// 模块 3.1：动画
// ---------------------------------------------------------------------------

function paintAnimation(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // 出现段收在 0.25 之前，第一个停靠点看到的就是「输入已就位」的干净状态
  const stagger = (i: number) => seg(t, i * 0.012, i * 0.012 + 0.1);
  const appear = seg(t, 0, 0.16);
  ctx.globalAlpha = appear;
  ctx.fillStyle = SLATE;
  ctx.font = `11px ${FONT}`;
  ctx.fillText(`输入（两条路相同）：${N} 种原子退化因子`, W_MOD / 2, 30);
  ctx.globalAlpha = 1;

  // 两列各有一份同样的输入行：同一张图，左列压成一个条件、右列逐因子保留。
  // 不给两条路画同一行再分岔，是因为右侧的因子会被拉到左侧，线会横穿中间。
  const IN_Y = 62;
  const xL = (i: number) => 30 + (i * 220) / (N - 1);
  const xR = (i: number) => 312 + (i * 216) / (N - 1);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  DEGRADATIONS.forEach((d, i) => {
    ctx.globalAlpha = stagger(i);
    ctx.fillText(d.name, xL(i), IN_Y + 18);
    ctx.fillText(d.name, xR(i), IN_Y + 18);
    ctx.globalAlpha = 1;
  });

  // 两条路的标题
  ctx.globalAlpha = seg(t, 0.05, 0.25);
  ctx.fillStyle = RED;
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText('隐式表示（旧方法）', 140, 112);
  ctx.fillStyle = GREEN;
  ctx.fillText('显式解耦（本文方法）', 420, 112);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(280, 126);
  ctx.lineTo(280, 306);
  ctx.stroke();
  ctx.setLineDash([]);

  const travel = seg(t, P_TRAVEL[0], P_TRAVEL[1]);

  // ---------------- 左：汇成一团 ----------------
  const LC = { x: 140, y: 196 };
  const R_BLOB = 44;
  const blobR = 10 + (R_BLOB - 10) * travel;
  const edge = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return { x: LC.x + R_BLOB * Math.cos(a), y: LC.y + R_BLOB * Math.sin(a) };
  };

  if (travel > 0.02) {
    ctx.fillStyle = `rgba(196,63,82,${0.2 * travel})`;
    ctx.beginPath();
    ctx.arc(LC.x, LC.y, blobR, 0, Math.PI * 2);
    ctx.fill();
    if (travel > 0.9) {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(196,63,82,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 8 个因子：从输入行滑到糊团边缘，然后卡在那儿
  DEGRADATIONS.forEach((d, i) => {
    const to = edge(i);
    const x = xL(i) + (to.x - xL(i)) * travel;
    const y = IN_Y + (to.y - IN_Y) * travel;
    dot(ctx, x, y, 7 - travel, d.color, stagger(i));
  });

  const blobLabel = seg(t, 0.55, 0.66);
  if (blobLabel > 0) {
    ctx.globalAlpha = blobLabel;
    ctx.fillStyle = INK;
    ctx.font = `11px ${FONT}`;
    ctx.fillText('一个纠缠的', LC.x, LC.y - 6);
    ctx.fillText('整体条件', LC.x, LC.y + 10);
    ctx.globalAlpha = 1;
  }

  const interfere = seg(t, 0.62, 0.74);
  if (interfere > 0) {
    ctx.globalAlpha = interfere;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 1.2;
    [
      [0, 3],
      [1, 5],
      [2, 6],
      [4, 7]
    ].forEach(([a, b]) => {
      const p1 = edge(a);
      const p2 = edge(b);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo((p1.x + p2.x) / 2 + 16, (p1.y + p2.y) / 2 - 16, p2.x, p2.y);
      ctx.stroke();
    });
    ctx.fillStyle = RED;
    ctx.font = `10px ${FONT}`;
    ctx.fillText('因子间干扰', LC.x, 258);
    ctx.globalAlpha = 1;
  }

  const leftDone = seg(t, P_RESULT[0], P_RESULT[1]);
  if (leftDone > 0) {
    ctx.globalAlpha = leftDone;
    box(ctx, 44, 278, 192, 28, RED, 0.1, '统一修复：因子互相抵消', RED);
    ctx.globalAlpha = 1;
  }

  // ---------------- 右：逐个保留 ----------------
  // 因子点先落到 FDPM 上沿，随后被感知模块吸收（淡出），改由掩码的位接手
  const absorbed = seg(t, P_MASK[0], P_MASK[0] + 0.07);
  DEGRADATIONS.forEach((d, i) => {
    const y = IN_Y + (124 - IN_Y) * travel;
    dot(ctx, xR(i), y, 7 - travel, d.color, stagger(i) * (1 - absorbed));
  });

  const fdpmIn = seg(t, 0.42, 0.58);
  ctx.globalAlpha = fdpmIn;
  box(ctx, 300, 132, 240, 32, GREEN, 0.1 + 0.1 * absorbed, 'FDPM：逐因子感知退化', INK, 10);
  ctx.globalAlpha = 1;

  const flow = seg(t, P_MASK[0], P_MASK[0] + 0.06);
  arrowDown(ctx, 420, 164, 178, GREEN, flow);

  // 多热掩码：第 i 位在对应因子到位后点亮
  const BIT = 22;
  const BX0 = 304;
  const bitOn = (i: number) => t > P_MASK[0] + 0.02 + i * 0.022;
  // 整排位一起等 flow：前面两步不该先冒出一排空位来
  if (flow > 0) {
    DEGRADATIONS.forEach((_, i) => {
      const x = BX0 + i * (BIT + 8);
      const on = bitOn(i);
      ctx.fillStyle = on ? GREEN : '#eef2f6';
      ctx.fillRect(x, 178, BIT, BIT);
      ctx.strokeStyle = on ? GREEN : LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, 178.5, BIT - 1, BIT - 1);
      ctx.fillStyle = on ? '#ffffff' : SLATE;
      ctx.font = `bold 12px ${FONT}`;
      ctx.fillText(on ? '1' : '0', x + BIT / 2, 193);
    });

    ctx.globalAlpha = flow;
    ctx.fillStyle = SLATE;
    ctx.font = `9px ${FONT}`;
    ctx.fillText('多热掩码 m̂：每个因子一位，互不串味', 420, 214);
    ctx.globalAlpha = 1;
  }

  arrowDown(ctx, 420, 220, 234, PURPLE, leftDone);

  const rightDone = seg(t, P_RESULT[0] + 0.02, P_RESULT[1]);
  ctx.globalAlpha = rightDone;
  box(ctx, 300, 236, 240, 32, PURPLE, 0.1, 'CDMM：按掩码路由对应专家', INK, 10);
  ctx.globalAlpha = 1;

  if (rightDone > 0) {
    ctx.globalAlpha = rightDone;
    box(ctx, 300, 278, 240, 28, GREEN, 0.16, '每个因子独立校正，互不干扰', GREEN);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------

export const DecouplingDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  // 类比卡槽：静态对照 + 两个 .chip 切换；模块槽：动画
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [view, setView] = useState<'implicit' | 'explicit'>('implicit');
  const [progress, setProgress] = useState(0);
  // 动画的目标位置：挂载时是终态（自动播一遍），按「下一步」改成下一段的终点。
  // 到了目标就停，不常驻跑 CPU。
  const [target, setTarget] = useState(analogy ? 0 : 1);
  const done = progress >= target;

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(target, p + STEP));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [done, target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        ctx = setupCanvas(canvas, W, H);
      } catch {
        // 退化路径：拿不到 2D 上下文时按 1x 画，至少不留空白
        const fallback = canvas.getContext('2d');
        if (!fallback) return;
        canvas.width = W;
        canvas.height = H;
        ctx = fallback;
      }
      ctxRef.current = ctx;
      // 跟随栏宽并限高：窄列不被裁切，宽列不被放大糊掉
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxWidth = W + 'px';
      canvas.style.margin = '0 auto';
      canvas.style.display = 'block';
    }

    if (analogy) paintAnalogy(ctx, view);
    else paintAnimation(ctx, progress);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [analogy, view, progress, W, H]);

  const replay = () => {
    setProgress(0);
    setTarget(1);
  };

  // 推到下一段的终点并停在那里；已经在最后一段则回到第一步重走
  const nextStep = () => {
    const next = STOPS.find((s) => s > progress + 0.001);
    if (next === undefined) {
      setProgress(0);
      setTarget(STOPS[0]);
    } else {
      setTarget(next);
    }
  };

  const atEnd = progress >= 1 - 0.001;

  // 停在第 k 段终点上就显示第 k 段的文案，所以边界取「停靠点 + 一点点」
  const stopIdx = STOPS.findIndex((s) => progress < s + 0.001);
  const feedback = analogy
    ? view === 'implicit'
      ? { text: '隐式表示把多种退化压成一个纠缠的整体条件', cls: 'bad' }
      : { text: '显式解耦为每个因子单独给出一份条件', cls: 'good' }
    : STOP_MSGS[stopIdx < 0 ? STOP_MSGS.length - 1 : stopIdx];

  return (
    <div className="widget-container">
      <h3 className="widget-title">解耦演示器</h3>
      <p className="widget-description">
        {analogy
          ? '切换两种表示：全压进一个条件，还是每个因子各留一份'
          : '看 8 个因子如何在两条路上分岔：左边汇成一团，右边逐个落到掩码的位上'}
      </p>

      <div className="widget-content">
        <canvas
          ref={canvasRef}
          id={`cv-${chapterId}-${moduleId}-decoupling`}
          width={W}
          height={H}
        />

        {analogy ? (
          <div className="chip-row">
            <button
              type="button"
              className={`chip${view === 'implicit' ? ' selected' : ''}`}
              aria-pressed={view === 'implicit'}
              onClick={() => setView('implicit')}
            >
              隐式表示
            </button>
            <button
              type="button"
              className={`chip${view === 'explicit' ? ' selected' : ''}`}
              aria-pressed={view === 'explicit'}
              onClick={() => setView('explicit')}
            >
              显式解耦
            </button>
          </div>
        ) : (
          <div className="chip-row">
            <button
              type="button"
              className="chip"
              onClick={nextStep}
              title={atEnd ? '回到第一步，再一步步往下看' : '播放到下一段并停在那里'}
            >
              {atEnd ? '分步重看' : '下一步'}
            </button>
            <button type="button" className="chip" onClick={replay} title="从头完整播一遍">
              重新播放
            </button>
          </div>
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default DecouplingDemo;
