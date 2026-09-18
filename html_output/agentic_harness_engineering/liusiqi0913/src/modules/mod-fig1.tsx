import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-fig1 — 1080x360，第三章 3.1「最终结果：Figure 1 十轮演化曲线」
// 复现论文 Figure 1：三条基线用不同颜色与线型区分；点「开始推演」手动播放，
// 曲线从 iteration 1 播到 10；播放结束后四个方框标注淡入，可点击查看说明。
// 无自动播放；中间轮次数值为示意形状，仅有论文依据的三个锚点标数。

const W = 1080;
const H = 360;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// 中间轮次仅示意形状；有论文依据的数字：起点 69.7、iter8 峰值 76.97、最终 best 77.0
const AHE = [69.5, 74.2, 74.2, 73.0, 74.6, 75.9, 73.0, 77.0, 74.0, 75.4];
const BEST = [69.7, 74.2, 74.2, 74.2, 74.6, 75.9, 75.9, 77.0, 77.0, 77.0];

// 三条基线：不同颜色 + 不同线型区分
const BASELINES = [
  { name: 'TF-GRPO', v: 72.3, color: C.green, dash: [7, 5] },
  { name: 'Codex', v: 71.9, color: C.orange, dash: [12, 4, 3, 4] },
  { name: 'ACE', v: 68.9, color: C.purple, dash: [2, 4] },
];

interface Milestone {
  iter: number;
  line1: string;
  tag: string;
  tagColor: string;
  fb: string;
}

const MILESTONES: Milestone[] = [
  {
    iter: 2,
    line1: 'iter 2 · 契约优先工作流+可调 shell 超时',
    tag: '提示词+工具',
    tagColor: C.blue,
    fb: 'iter 2 首轮修复即跃升：契约优先工作流（contract-first workflow）+ 可调 shell 超时写入提示词与工具层，起点 69.7% 被迅速越过',
  },
  {
    iter: 5,
    line1: 'iter 5 · 发布状态守卫',
    tag: '提示词+工具',
    tagColor: C.blue,
    fb: 'iter 5 发布状态守卫（publish-state guard）拦截「成功后清理交付物」类破坏，best-so-far 第二次抬升',
  },
  {
    iter: 6,
    line1: 'iter 6 · 跨步风险监测',
    tag: '中间件',
    tagColor: C.purple,
    fb: 'iter 6 中间件上线跨步风险监测（cross-step risk monitoring），best-so-far 第三次抬升',
  },
  {
    iter: 8,
    line1: 'iter 8 · 成功后硬阻塞+回合前风险显著化',
    tag: '工具+中间件',
    tagColor: C.orange,
    fb: 'iter 8 成功后硬阻塞（hard block after success）+ 回合前风险显著化（pre-turn risk salience）：当轮 76.97% 为全程最高，best-so-far 定格 77.0%',
  },
];

const DEFAULT_FB = '十轮迭代、四个里程碑方框；点「开始推演」观看曲线从第 1 轮生长到第 10 轮';

// 几何
const L = 64;
const R = 160;
const T = 118;
const B = 40;
const PW = W - L - R; // 856
const PH = H - T - B; // 202
const Y_MIN = 68;
const Y_MAX = 80;

const xOf = (iter: number) => L + ((iter - 1) / 9) * PW;
const yOf = (v: number) => T + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * PH;

// 里程碑方框：两行，错行排布避免碰撞
const BOX_W = 252;
const BOX_H = 44;
const boxRow = (mi: number) => (mi === 0 || mi === 2 ? 0 : 1); // iter2/iter6 上行，iter5/iter8 下行
const boxY = (mi: number) => 6 + boxRow(mi) * 52;
const boxCx = (mi: number) =>
  clamp(xOf(MILESTONES[mi].iter), BOX_W / 2 + 6, W - BOX_W / 2 - 6);

const PLAY_MS = 450; // 每轮揭示时长

type Phase = 'idle' | 'playing' | 'done';

export const ModFig1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; playStart: number; doneStart: number; sel: number | null }>({
    phase: 'idle',
    playStart: 0,
    doneStart: 0,
    sel: null,
  });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState(DEFAULT_FB);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawAheLine = (color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      AHE.forEach((v, i) => {
        const x = xOf(i + 1);
        const y = yOf(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawStepLine = (color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(xOf(1), yOf(BEST[0]));
      for (let i = 1; i < BEST.length; i++) {
        ctx.lineTo(xOf(i + 1), yOf(BEST[i - 1]));
        ctx.lineTo(xOf(i + 1), yOf(BEST[i]));
      }
      ctx.stroke();
    };

    const render = (now: number) => {
      const s = stateRef.current;
      // 播放进度：0 → 10 轮
      let n = 0;
      if (s.phase === 'playing') {
        n = clamp((now - s.playStart) / PLAY_MS, 0, 10);
        if (n >= 10) {
          s.phase = 'done';
          s.doneStart = now;
          setPhase('done');
        }
      } else if (s.phase === 'done') {
        n = 10;
      }

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 网格与 y 轴刻度
      ctx.font = '11px "Segoe UI", sans-serif';
      [68, 72, 76, 80].forEach((v) => {
        const y = yOf(v);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(L + PW, y);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'right';
        ctx.fillText(String(v), L - 8, y + 4);
      });
      // x 轴
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L, yOf(Y_MIN));
      ctx.lineTo(L + PW, yOf(Y_MIN));
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      for (let i = 1; i <= 10; i++) ctx.fillText(String(i), xOf(i), yOf(Y_MIN) + 16);
      ctx.fillText('迭代轮次', L + PW / 2, yOf(Y_MIN) + 32);

      // 三条基线：各自颜色 + 线型，右侧同色标签（即图例）
      BASELINES.forEach((b, bi) => {
        const y = yOf(b.v);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.setLineDash(b.dash);
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(L + PW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        // 右侧：线型小样 + 名称数值
        const ly = bi === 1 ? y + 16 : y - 6; // Codex 标签下移避免与 TF-GRPO 重叠
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.setLineDash(b.dash);
        ctx.beginPath();
        ctx.moveTo(L + PW + 10, ly - 4);
        ctx.lineTo(L + PW + 34, ly - 4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = b.color;
        ctx.font = 'bold 11.5px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${b.name} ${b.v.toFixed(1)}`, L + PW + 40, ly);
      });

      if (s.phase === 'idle') {
        // 待推演提示
        ctx.fillStyle = C.muted;
        ctx.font = '13.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('点下方「开始推演」：蓝虚线（每轮 pass@1）与绿阶梯（best-so-far）将从第 1 轮生长到第 10 轮', L + PW / 2, T + PH / 2);
      } else {
        // 主曲线区（按播放进度从左向右揭示）
        ctx.save();
        ctx.beginPath();
        ctx.rect(L - 6, 0, (n / 10) * PW + 12, H);
        ctx.clip();
        drawStepLine(C.green, 2.5);
        drawAheLine(C.blue, 2);
        // 圆点：随进度逐轮出现
        ctx.fillStyle = C.blue;
        AHE.forEach((v, i) => {
          if (i + 1 > n) return;
          ctx.beginPath();
          ctx.arc(xOf(i + 1), yOf(v), 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // 当前轮次提示
        const latest = Math.min(10, Math.max(1, Math.floor(n)));
        if (s.phase === 'playing' && latest <= 10) {
          ctx.fillStyle = C.muted;
          ctx.font = '11px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`iter ${latest}`, xOf(latest), yOf(AHE[latest - 1]) - 10);
        }
        // 有论文依据的三个锚点
        if (n >= 1) {
          ctx.fillStyle = C.text;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('起点 69.7', xOf(1) + 8, yOf(AHE[0]) + 18);
        }
        if (n >= 8) {
          ctx.fillStyle = C.text;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('76.97', xOf(8), yOf(77.0) - 10);
        }
        if (s.phase === 'done') {
          ctx.fillStyle = C.green;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('best 77.0', (xOf(9) + xOf(10)) / 2, yOf(77.0) - 10);
        }
      }

      // 播放结束后：四个方框标注淡入
      if (s.phase === 'done') {
        const doneElapsed = now - s.doneStart;
        MILESTONES.forEach((m, mi) => {
          const cx = boxCx(mi);
          const by = boxY(mi);
          const isSel = s.sel === mi;
          const dim = s.sel !== null && !isSel;
          const pa = easeOutCubic(clamp((doneElapsed - 200 - mi * 160) / 400, 0, 1));
          ctx.save();
          ctx.globalAlpha = pa * (dim ? 0.35 : 1);
          // 连接线：方框底边 → best-so-far 阶梯上的对应点
          ctx.strokeStyle = isSel ? m.tagColor : rgba(C.steel, 0.6);
          ctx.lineWidth = isSel ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(cx, by + BOX_H);
          ctx.lineTo(xOf(m.iter), yOf(BEST[m.iter - 1]) - 8);
          ctx.stroke();
          // 里程碑圆环
          ctx.strokeStyle = isSel ? m.tagColor : C.steel;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(xOf(m.iter), yOf(AHE[m.iter - 1]), 6, 0, Math.PI * 2);
          ctx.stroke();
          // 方框
          ctx.beginPath();
          ctx.roundRect(cx - BOX_W / 2, by, BOX_W, BOX_H, 8);
          ctx.fillStyle = isSel ? rgba(m.tagColor, 0.12) : C.panel;
          ctx.fill();
          ctx.lineWidth = isSel ? 2.5 : 1.5;
          ctx.strokeStyle = isSel ? m.tagColor : C.border;
          ctx.stroke();
          ctx.textAlign = 'center';
          ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillStyle = C.text;
          ctx.fillText(m.line1, cx, by + 18);
          ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillStyle = m.tagColor;
          ctx.fillText(`[${m.tag}]`, cx, by + 35);
          ctx.restore();
        });
      }

      // 注释
      ctx.textAlign = 'left';
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(
        '',
        L,
        H - 6
      );
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const play = () => {
    stateRef.current.phase = 'playing';
    stateRef.current.playStart = performance.now();
    stateRef.current.sel = null;
    setPhase('playing');
    setFeedback('推演中：蓝虚线为每轮 pass@1，绿阶梯为 best-so-far……');
  };

  const reset = () => {
    stateRef.current.phase = 'idle';
    stateRef.current.sel = null;
    setPhase('idle');
    setFeedback(DEFAULT_FB);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.phase !== 'done') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let mi = 0; mi < MILESTONES.length; mi++) {
      const cx = boxCx(mi);
      const by = boxY(mi);
      if (x >= cx - BOX_W / 2 && x <= cx + BOX_W / 2 && y >= by && y <= by + BOX_H) {
        const ns = stateRef.current.sel === mi ? null : mi;
        stateRef.current.sel = ns;
        setFeedback(ns === null ? DEFAULT_FB : MILESTONES[ns].fb);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: phase === 'done' ? 'pointer' : 'default' }}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <div className="step-ctrl">
          <button type="button" className="tiny" onClick={play} disabled={phase === 'playing'}>
            {phase === 'idle' ? '开始推演' : phase === 'playing' ? '推演中…' : '重新播放'}
          </button>
          <button type="button" className="tiny ghost" onClick={reset} disabled={phase === 'idle'}>
            重新推演
          </button>
        </div>
      </div>
      <div className="feedback">{feedback}</div>
      <div className="mod-adv-row">
        <div className="mod-adv-card">
          <div className="mod-adv-title">RQ1 · 现有定位（第 4 章）</div>
          <div className="mod-adv-desc">为什么是智能体 harness 工程，而不是人工设计的 harness 或其他自动化方法？</div>
        </div>
        <div className="mod-adv-card">
          <div className="mod-adv-title">RQ2 · 迁移（第 5 章）</div>
          <div className="mod-adv-desc">AHE 是否过拟合其优化目标？换任务面、换底座模型，增益还在吗？</div>
        </div>
        <div className="mod-adv-card">
          <div className="mod-adv-title">RQ3 · 组件价值（第 6 章）</div>
          <div className="mod-adv-desc">AHE 内部是什么驱动了增益，循环的自我归因有多可靠？</div>
        </div>
      </div>
    </div>
  );
};

export default ModFig1;
