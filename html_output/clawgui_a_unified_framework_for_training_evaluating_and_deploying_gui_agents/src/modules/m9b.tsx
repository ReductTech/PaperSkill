import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  useCanvasScene,
  C,
  MW,
  MH,
  text,
  fillRound,
  roundRect,
  line,
  arrow,
  phone,
  uiRows,
} from './kit';

/* ============================================================================
   4.2 一条指令，怎么从聊天窗口一路走到真机

   固定画一条部署链路（全部是论文事实）：
     聊天平台（12+）→ 智能体循环：感知 → 推理 → 动作 → 混合 CLI / GUI 控制
     → 真机：Android / HarmonyOS / iOS → 执行结果

   唯一的对比维度是「个性化记忆」开关，差别落在链路的「推理」节点上：
     关闭 —— 推理节点旁只有一个空记忆槽，缺的信息只能反问；
     开启 —— 结构化记忆卡按相关性检索 top-k，注入推理节点的上下文。

   点「发送指令」后高亮自上而下推进，全程 2.15 秒跑完，不做慢动画。
   ============================================================================ */

/* 链路节点几何 */
const SX = 16;
const SW = 268;
const STAGES: { y: number; h: number }[] = [
  { y: 10, h: 28 }, // 0 聊天平台
  { y: 51, h: 54 }, // 1 智能体循环（内含三个小节点）
  { y: 118, h: 28 }, // 2 混合 CLI / GUI 控制
  { y: 159, h: 28 }, // 3 真机
  { y: 200, h: 28 }, // 4 执行结果
];
const CXA = SX + SW / 2; // 链路中轴

/* 时间轴（ms，自「发送指令」起）：总时长 2150ms < 2.5s */
const T = [0, 320, 720, 1040, 1800, 2150];

/* 「感知 / 推理 / 动作」三个小节点 */
const PILL_W = 62;
const PILL_Y = 72;
const PILL_H = 26;
const PILL_X = [26, 119, 212];
const PILL_LABEL = ['感知', '推理', '动作'];

/* 记忆面板 */
const MEM_X = 296;
const MEM_Y = 44;
const MEM_W = 250;
const MEM_H = 66;

/* 真机 */
const PH_X = 460;
const PH_Y = 118;
const PH_W = 72;
const PH_H = 118;
const PH_ROWS = 5;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 状态 → 描边 / 底色 */
function tone(state: 0 | 1 | 2): { stroke: string; fill: string; lw: number } {
  if (state === 1) return { stroke: C.guide, fill: 'rgba(39,68,110,0.13)', lw: 2 };
  if (state === 2) return { stroke: C.pass, fill: 'rgba(31,111,67,0.07)', lw: 1.5 };
  return { stroke: C.axis, fill: C.white, lw: 1.2 };
}

/** 绿色完成对勾 */
function checkMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = C.pass;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = r / 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.05);
  ctx.lineTo(cx - r * 0.12, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.32);
  ctx.stroke();
  ctx.restore();
}

export const M9b: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mem, setMem] = useState(false);
  const [runNo, setRunNo] = useState(0);
  const startRef = useRef<number | null>(null);
  const [fb, setFb] = useState({
    text: '点「发送指令」，看高亮怎么从聊天平台一路推进到真机；再切换记忆开关，看差别落在链路的哪个节点上。',
    cls: '',
  });

  const canvasRef = useCanvasScene(MW, MH, (ctx, t) => {
    if (runNo > 0 && startRef.current === null) startRef.current = t;
    const tt = runNo > 0 && startRef.current !== null ? t - startRef.current : -1;

    /* 当前推进到第几段：-1 未开始，5 = 全部完成 */
    let cur = -1;
    if (tt >= 0) {
      cur = 5;
      for (let i = 0; i < 5; i++) {
        if (tt >= T[i] && tt < T[i + 1]) cur = i;
      }
    }
    const stateOf = (i: number): 0 | 1 | 2 => (cur === i ? 1 : cur > i ? 2 : 0);
    const allDone = cur === 5;

    /* ── 链路主干 ── */
    const LABELS = [
      '聊天平台（12+）',
      '',
      '混合 CLI / GUI 控制',
      '真机：Android / HarmonyOS / iOS',
      '执行结果',
    ];

    STAGES.forEach((s, i) => {
      const st = stateOf(i);
      const tn = tone(st);
      const doneTail = i === 4 && allDone;
      fillRound(
        ctx,
        SX,
        s.y,
        SW,
        s.h,
        7,
        doneTail ? 'rgba(31,111,67,0.14)' : tn.fill,
        doneTail ? C.pass : tn.stroke,
        doneTail ? 1.8 : tn.lw
      );
      // 段与段之间的推进箭头
      if (i < 4) {
        arrow(ctx, CXA, s.y + s.h + 1, CXA, STAGES[i + 1].y - 1, cur > i ? C.pass : C.axis, 2, 5);
      }
      if (i === 1) return; // 智能体循环的内部节点单独画
      text(ctx, LABELS[i], CXA, s.y + s.h / 2, {
        size: i === 3 ? 11.5 : 12,
        color: st === 1 ? C.guide : doneTail ? C.pass : C.ink,
        weight: '700',
        align: 'center',
        baseline: 'middle',
      });
    });

    /* ── 智能体循环：感知 → 推理 → 动作 ── */
    text(ctx, '智能体循环', SX + 10, 65, { size: 11, color: C.muted, weight: '700' });
    const inner =
      cur === 1 ? clamp(Math.floor(((tt - T[1]) / (T[2] - T[1])) * 3), 0, 2) : cur > 1 ? 2 : -1;
    PILL_X.forEach((px, k) => {
      const active = cur === 1 && inner === k;
      const passed = cur > 1 || (cur === 1 && inner > k);
      const isReason = k === 1;
      const stroke = isReason && mem ? C.aux : active ? C.guide : passed ? C.pass : C.axis;
      const fill = active
        ? 'rgba(39,68,110,0.14)'
        : isReason && mem
          ? 'rgba(124,58,237,0.10)'
          : C.white;
      fillRound(ctx, px, PILL_Y, PILL_W, PILL_H, 6, fill, stroke, active ? 2 : 1.3);
      text(ctx, PILL_LABEL[k], px + PILL_W / 2, PILL_Y + PILL_H / 2, {
        size: 11.5,
        color: active ? C.guide : C.ink,
        weight: '700',
        align: 'center',
        baseline: 'middle',
      });
      if (k < 2) {
        const ax = px + PILL_W + 4;
        arrow(ctx, ax, PILL_Y + PILL_H / 2, ax + 23, PILL_Y + PILL_H / 2, C.axis, 1.6, 5);
      }
    });

    /* ── 记忆面板（推理节点旁） ── */
    if (mem) {
      fillRound(ctx, MEM_X, MEM_Y, MEM_W, MEM_H, 8, 'rgba(124,58,237,0.09)', C.aux, 1.5);
      fillRound(ctx, MEM_X + 10, MEM_Y + 10, 11, 11, 3, C.aux);
      text(ctx, '个性化记忆（结构化）', MEM_X + 28, MEM_Y + 16, {
        size: 11.5,
        color: C.aux,
        weight: '800',
      });
      fillRound(ctx, MEM_X + 8, MEM_Y + 28, MEM_W - 16, 20, 5, 'rgba(124,58,237,0.13)');
      text(ctx, '联系人 · 常用 App · 使用习惯', MEM_X + 16, MEM_Y + 38, {
        size: 10.5,
        color: C.ink,
        baseline: 'middle',
      });
      text(ctx, '检索 top-k 注入上下文 ↓', MEM_X + 8, MEM_Y + 60, {
        size: 10.5,
        color: C.aux,
        weight: '700',
      });
      // 紫色注入箭头：记忆卡 → 推理节点
      line(ctx, MEM_X + 14, MEM_Y + MEM_H, MEM_X + 14, 114, C.aux, 1.8);
      line(ctx, MEM_X + 14, 114, 170, 114, C.aux, 1.8);
      arrow(ctx, 170, 114, 170, PILL_Y + PILL_H + 1, C.aux, 1.8, 6);
    } else {
      ctx.save();
      ctx.setLineDash([5, 4]);
      roundRect(ctx, MEM_X, MEM_Y, MEM_W, MEM_H, 8);
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      fillRound(ctx, MEM_X + 10, MEM_Y + 10, 11, 11, 3, C.axis);
      text(ctx, '个性化记忆 · 空', MEM_X + 28, MEM_Y + 16, {
        size: 11.5,
        color: C.muted,
        weight: '800',
      });
      fillRound(ctx, MEM_X + 8, MEM_Y + 28, MEM_W - 16, 20, 5, C.field, C.axis, 1);
      text(ctx, '（空记忆槽）', MEM_X + MEM_W / 2, MEM_Y + 38, {
        size: 10.5,
        color: C.muted,
        align: 'center',
        baseline: 'middle',
      });
      text(ctx, '不认识你，需要反问确认', MEM_X + 8, MEM_Y + 60, {
        size: 10.5,
        color: C.muted,
        weight: '700',
      });
    }

    /* ── 真机：接管箭头 + 手机屏幕 ── */
    const armed = cur >= 3;
    text(ctx, '远程模式 / 本地模式', 372, 162, {
      size: 10,
      color: C.muted,
      align: 'center',
    });
    arrow(ctx, 292, 175, 452, 175, armed ? C.pass : C.axis, 2, 7);
    text(ctx, tt < 0 ? '待命' : allDone ? '已完成' : armed ? '执行中…' : '下发中…', 372, 196, {
      size: 11,
      color: allDone ? C.pass : armed ? C.guide : C.muted,
      weight: '700',
      align: 'center',
    });

    const scr = phone(ctx, PH_X, PH_Y, PH_W, PH_H, C.white, C.ink);
    const hl =
      cur === 3 ? clamp(Math.floor(((tt - T[3]) / (T[4] - T[3])) * PH_ROWS), 0, PH_ROWS - 1) : -1;
    uiRows(ctx, scr.sx, scr.sy, scr.sw, PH_ROWS, hl, C.guide);
    if (allDone) checkMark(ctx, scr.sx + scr.sw / 2, scr.sy + scr.sh / 2, 16);
    text(ctx, '真机屏幕', PH_X + PH_W / 2, 250, {
      size: 10,
      color: C.muted,
      align: 'center',
    });
  });

  const memFb = (on: boolean) =>
    on
      ? {
          text: '结构化记忆按相关性检索 top-k 注入上下文，且跨会话持久保存——越用越懂你。',
          cls: 'good',
        }
      : {
          text: '没有记忆，智能体每次都像第一次认识你，指令里缺的信息只能反问。',
          cls: 'bad',
        };

  const send = () => {
    startRef.current = null;
    setRunNo((n) => n + 1);
    setFb(memFb(mem));
  };

  const reset = () => {
    startRef.current = null;
    setRunNo(0);
  };

  return (
    <div>
      <div className="chip-row">
        {['记忆关闭', '记忆开启'].map((s, i) => (
          <button
            key={s}
            className={`chip ${(mem ? 1 : 0) === i ? 'selected' : ''}`}
            onClick={() => {
              const on = i === 1;
              setMem(on);
              reset();
              setFb(memFb(on));
            }}
          >
            {s}
          </button>
        ))}
        <button className="tiny" onClick={send}>
          发送指令 ▸
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className="metrics">
        <div className="metric">
          <div className="l">聊天平台</div>
          <div className="v">12+</div>
        </div>
        <div className="metric">
          <div className="l">Android · HarmonyOS · iOS</div>
          <div className="v">3</div>
        </div>
        <div className="metric">
          <div className="l">跨会话个性化记忆</div>
          <div className="v">持久</div>
        </div>
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <div className="step-desc">
        先切换记忆开关，再点「发送指令」：高亮会沿链路自上而下推进到真机，差别只落在「推理」这一节点上。
      </div>

      <div className="src-note">
        ClawGUI-Agent 支持远程模式（经聊天平台指挥）与本地模式（直接接管本机）；记忆以结构化事实存入向量库，按相关性检索注入上下文并跨会话持久。
      </div>
    </div>
  );
};

export default M9b;
