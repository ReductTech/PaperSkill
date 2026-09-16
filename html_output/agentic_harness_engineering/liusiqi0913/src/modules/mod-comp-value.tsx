import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-comp-value — 第六章 6.1「价值在哪里累积：单组件消融」（1080x320）
// Table 3 可视化：chips 切 All/Easy/Medium/Hard；六行横条（种子 + 四个单组件置换 + 完整 AHE），
// 种子参考虚线；下方三卡分析（失败面分工 / 非加性 / Medium 偏重折中）。数据已核实。

const W = 1080;
const H = 320;

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

type Tier = 'all' | 'easy' | 'medium' | 'hard';

const TIERS: { k: Tier; label: string }[] = [
  { k: 'all', label: 'All (89)' },
  { k: 'easy', label: 'Easy (4)' },
  { k: 'medium', label: 'Medium (55)' },
  { k: 'hard', label: 'Hard (30)' },
];
const TIER_IDX: Record<Tier, number> = { all: 0, easy: 1, medium: 2, hard: 3 };

// 顺序：种子 → 四个单组件置换 → 完整 AHE；数值对应 All/Easy/Medium/Hard
const ROWS: { label: string; v: number[]; color: string; bold?: boolean }[] = [
  { label: 'NexAU0（种子）', v: [69.7, 87.5, 78.2, 51.7], color: C.steel },
  { label: '+memory（长期记忆）', v: [75.3, 50.0, 83.6, 63.3], color: C.green },
  { label: '+tool（工具集）', v: [73.0, 75.0, 87.3, 46.7], color: C.blue },
  { label: '+middleware（中间件）', v: [71.9, 100.0, 81.8, 50.0], color: C.purple },
  { label: '+prompt（系统提示词）', v: [67.4, 75.0, 78.2, 46.7], color: C.red },
  { label: 'AHE（完整）', v: [77.0, 100.0, 88.2, 53.3], color: C.orange, bold: true },
];

const FEEDBACK: Record<Tier, string> = {
  all: '总体上三正一负：+memory +5.6 / +tool +3.3 / +middleware +2.2 / +prompt −2.3pp——三正项之和 +11.1 超过整体 +7.3',
  easy: 'Easy 仅 4 个任务，波动极大：+middleware 与 AHE 并列 100.0，+memory 反而掉到 50.0（多余复查）',
  medium: 'Medium 上 +tool 87.3 几乎追平完整 AHE 的 88.2——单项组件在这一档最见效',
  hard: 'Hard 上只换 memory（63.3%）反超完整 AHE（53.3%）——组件间干扰在长任务上吃掉了一部分收益',
};

const X0 = 250;
const TRACK = 760;
const ROW_Y = 56;
const ROW_STEP = 36;
const BAR_H = 20;

export const ModCompValue: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ tier: Tier; animStart: number }>({ tier: 'all', animStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [tier, setTier] = useState<Tier>('all');
  const [feedback, setFeedback] = useState(FEEDBACK.all);

  useEffect(() => {
    stateRef.current.animStart = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      const elapsed = now - s.animStart;
      const ti = TIER_IDX[s.tier];
      const seedV = ROWS[0].v[ti];

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 标题
      ctx.fillStyle = C.muted;
      ctx.font = '11.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('每行 = 把完整 AHE 的某一个组件单独换进种子 NexAU0，其余组件保持种子默认（Table 3）', 40, 30);

      // 种子参考虚线
      const seedX = X0 + (seedV / 100) * TRACK;
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(seedX, ROW_Y - 14);
      ctx.lineTo(seedX, ROW_Y + ROW_STEP * 5 + BAR_H + 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.steel;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`种子 ${seedV.toFixed(1)}`, seedX, ROW_Y - 20);

      ROWS.forEach((row, i) => {
        const y = ROW_Y + i * ROW_STEP;
        const v = row.v[ti];
        const p = easeOutCubic(clamp((elapsed - i * 100) / 700, 0, 1));
        const w = ((v * p) / 100) * TRACK;

        // 行标签
        ctx.fillStyle = row.bold ? C.orange : C.text;
        ctx.font = `${row.bold ? 'bold ' : ''}13px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(row.label, X0 - 12, y + BAR_H / 2 + 5);
        ctx.textAlign = 'left';

        // 轨道
        ctx.fillStyle = '#e9edf3';
        ctx.fillRect(X0, y, TRACK, BAR_H);

        // 条
        if (w > 0) {
          ctx.fillStyle = row.color;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(X0, y, w, BAR_H);
          ctx.globalAlpha = 1;
        }

        // 数值 + 相对种子差值
        if (p > 0) {
          ctx.fillStyle = C.text;
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          ctx.fillText((v * p).toFixed(1), X0 + w + 8, y + BAR_H / 2 + 5);
        }
        if (p >= 1 && i > 0) {
          const d = v - seedV;
          ctx.fillStyle = d >= 0 ? C.green : C.red;
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.fillText(`${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`, X0 + w + 56, y + BAR_H / 2 + 5);
        }
      });

      // 注释
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('绿色差值＝相对种子的提升；红色＝回退（+prompt 是唯一总体回退的单项置换）', 40, H - 12);
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

  const pickTier = (nt: Tier) => {
    stateRef.current.tier = nt;
    stateRef.current.animStart = performance.now();
    setTier(nt);
    setFeedback(FEEDBACK[nt]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {TIERS.map((t) => (
          <button
            key={t.k}
            className={`chip ${tier === t.k ? 'selected' : ''}`}
            onClick={() => pickTier(t.k)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback}</div>
      <div className="mod-adv-row">
        <div className="mod-adv-card">
          <div className="mod-adv-title">各占不同失败面</div>
          <div className="mod-adv-desc">
            memory＝12 条边界案例经验；tools＝1364 行 shell、自动浮现契约提示；middleware＝finish-hook
            强制闭环检查；prompt＝79 行通用纪律，可执行性依赖其他三者——单独换入反而 −2.3pp。
          </div>
        </div>
        <div className="mod-adv-card">
          <div className="mod-adv-title">组件非加性</div>
          <div className="mod-adv-desc">
            三个正项之和 +11.1pp 超过整体 +7.3pp——它们都推向同类闭环式验证，叠加后产生冗余复查，互相吃掉一部分收益。
          </div>
        </div>
        <div className="mod-adv-card">
          <div className="mod-adv-title">Medium 偏重的折中</div>
          <div className="mod-adv-desc">
            聚合指标被 55 个 Medium 任务主导；Hard 上只换 memory（63.3%）反超完整
            AHE——论文把「交互感知的演化」列为未来工作。
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModCompValue;
