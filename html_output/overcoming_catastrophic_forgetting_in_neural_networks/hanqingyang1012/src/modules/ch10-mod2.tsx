import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 10.2 指标对比（数值为方向性示意）：Atari 总分视图（普通SGD < 1，红柱 0.9；
// EWC 明显更高，绿柱 4.5；虚线灰参考线「独立网络上限」在最高处 10）↔
// 排列MNIST 视图（复用 10.1 的三条柱 + 虚线单任务参考线）。切换 0.8 s 过渡。

const W = 1080;
const H = 280;
const AX = 250;
const AXE = 1000;
const AY = 232;

const RED = '#c43f52';
const ORANGE = '#f07e47';
const GREEN = '#228d5c';
const DARK = '#21324a';
const MUTED = '#68778f';
const TRACK = '#d7deea';
const REF = '#8a97a8';

const ROW_Y = [88, 140, 192];
const ROW_H = 30;

type View = 'atari' | 'mnist';

interface Slot {
  key: string;
  label: string;
  value: number;
  color: string;
  lane: number;
  alpha: number;
  arrow: boolean;
  trophy: boolean;
}

const scaleOf = (view: View): number => (view === 'atari' ? 10 : 1);

const slotsFor = (view: View): Slot[] => {
  if (view === 'atari') {
    return [
      { key: 'sgd', label: '普通SGD', value: 0.9, color: RED, lane: 0, alpha: 1, arrow: false, trophy: false },
      { key: 'drop', label: 'SGD+dropout', value: 0.45, color: ORANGE, lane: 1, alpha: 0, arrow: true, trophy: false },
      { key: 'ewc', label: 'EWC', value: 4.5, color: GREEN, lane: 1, alpha: 1, arrow: false, trophy: false },
    ];
  }
  return [
    { key: 'sgd', label: '普通SGD', value: 0.1, color: RED, lane: 0, alpha: 1, arrow: false, trophy: false },
    { key: 'drop', label: 'SGD+dropout', value: 0.45, color: ORANGE, lane: 1, alpha: 1, arrow: true, trophy: false },
    { key: 'ewc', label: 'EWC', value: 0.98, color: GREEN, lane: 2, alpha: 1, arrow: false, trophy: true },
  ];
};

interface LegendItem {
  label: string;
  color: string;
}

const legendFor = (view: View): LegendItem[] =>
  view === 'atari'
    ? [
        { label: '普通SGD', color: RED },
        { label: 'EWC', color: GREEN },
      ]
    : [
        { label: '普通SGD', color: RED },
        { label: 'SGD+dropout', color: ORANGE },
        { label: 'EWC', color: GREEN },
      ];

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const easeInOut = (k: number): number =>
  k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

export const Ch10Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ view: 'atari' as View, prevView: 'atari' as View, switchAt: -1 });
  const [view, setView] = useState<View>('atari');
  const [feedback, setFeedback] = useState({
    text: 'EWC 让单个网络学会多个游戏（任务标签由论文的任务识别模块推断），但达不到十个独立网络的上限——这就是对角近似的代价。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const lenOf = (slot: Slot, view: View): number =>
      (slot.value * (AXE - AX)) / scaleOf(view);

    const render = (s: typeof stateRef.current, now: number): void => {
      const e = s.switchAt < 0 ? 1 : clamp((now - s.switchAt) / 800, 0, 1);
      const ease = easeInOut(e);
      const oldSlots = slotsFor(s.prevView);
      const newSlots = slotsFor(s.view);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 轴标签（交叉淡入淡出）
      const oldLabel = s.prevView === 'atari' ? 'Atari总分' : '旧任务平均保持率';
      const newLabel = s.view === 'atari' ? 'Atari总分' : '旧任务平均保持率';
      ctx.font = '600 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1 - ease;
      ctx.fillStyle = MUTED;
      ctx.fillText(oldLabel, 24, 30);
      ctx.globalAlpha = ease;
      ctx.fillStyle = DARK;
      ctx.fillText(newLabel, 24, 30);
      ctx.globalAlpha = 1;

      // 共享轴 + 刻度（裸数字，交叉淡入）
      ctx.strokeStyle = TRACK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(AX, AY);
      ctx.lineTo(AXE, AY);
      ctx.stroke();
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const oldTicks = s.prevView === 'atari' ? ['0', '5', '10'] : ['0', '0.5', '1.0'];
      const newTicks = s.view === 'atari' ? ['0', '5', '10'] : ['0', '0.5', '1.0'];
      const tickX = [AX, (AX + AXE) / 2, AXE];
      tickX.forEach((x, i) => {
        ctx.globalAlpha = 1 - ease;
        ctx.fillStyle = MUTED;
        ctx.fillText(oldTicks[i], x, AY + 8);
        ctx.globalAlpha = ease;
        ctx.fillStyle = DARK;
        ctx.fillText(newTicks[i], x, AY + 8);
      });
      ctx.globalAlpha = 1;

      // 轨道（三个车道；无柱的车道淡出）
      [0, 1, 2].forEach((lane) => {
        const oldOn = oldSlots.some((sl) => sl.lane === lane && sl.alpha > 0);
        const newOn = newSlots.some((sl) => sl.lane === lane && sl.alpha > 0);
        const a = lerp(oldOn ? 1 : 0, newOn ? 1 : 0, ease);
        if (a > 0.02) {
          ctx.globalAlpha = a;
          ctx.fillStyle = TRACK;
          roundRectPath(ctx, AX, ROW_Y[lane], AXE - AX, ROW_H, 8);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // 柱（长度、车道、透明度、数值均插值）
      oldSlots.forEach((oldS, i) => {
        const newS = newSlots[i];
        const len = lerp(lenOf(oldS, s.prevView), lenOf(newS, s.view), ease);
        const laneY = lerp(ROW_Y[oldS.lane], ROW_Y[newS.lane], ease);
        const alpha = lerp(oldS.alpha, newS.alpha, ease);
        const val = lerp(oldS.value, newS.value, ease);
        const arrowA = lerp(oldS.arrow ? 1 : 0, newS.arrow ? 1 : 0, ease);
        const trophyA = lerp(oldS.trophy ? 1 : 0, newS.trophy ? 1 : 0, ease);
        if (alpha < 0.02) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = newS.color;
        roundRectPath(ctx, AX, laneY, len, ROW_H, 8);
        ctx.fill();
        // 裸数字（条端，白底）
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(AX + len + 4, laneY + ROW_H / 2 - 11, 48, 22);
        ctx.font = '600 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = newS.color;
        ctx.fillText(val.toFixed(2), AX + len + 10, laneY + ROW_H / 2 + 1);
        if (arrowA > 0.02) {
          ctx.globalAlpha = alpha * arrowA;
          ctx.fillStyle = ORANGE;
          ctx.beginPath();
          const ax = AX + len + 58;
          const ay = laneY + ROW_H + 16;
          ctx.moveTo(ax - 6, ay - 10);
          ctx.lineTo(ax + 6, ay - 10);
          ctx.lineTo(ax, ay);
          ctx.closePath();
          ctx.fill();
        }
        if (trophyA > 0.02) {
          ctx.globalAlpha = alpha * trophyA;
          ctx.font = '22px "Segoe UI", "Segoe UI Emoji", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏆', AX + len + 66, laneY + ROW_H / 2 + 1);
        }
        ctx.globalAlpha = 1;
      });

      // 虚线灰参考线：两视图都在最高处（x = AXE）
      ctx.strokeStyle = REF;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(AXE, 60);
      ctx.lineTo(AXE, 214);
      ctx.stroke();
      ctx.setLineDash([]);
      const oldRef = s.prevView === 'atari' ? '独立网络上限' : '单任务';
      const newRef = s.view === 'atari' ? '独立网络上限' : '单任务';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1 - ease;
      ctx.fillStyle = MUTED;
      ctx.fillText(oldRef, AXE - 8, 52);
      ctx.globalAlpha = ease;
      ctx.fillStyle = REF;
      ctx.fillText(newRef, AXE - 8, 52);
      ctx.globalAlpha = 1;

      // 图例（≤3 项，交叉淡入）
      const oldLegend = legendFor(s.prevView);
      const newLegend = legendFor(s.view);
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      [0, 1, 2].forEach((i) => {
        const lx = 828;
        const ly = 22 + i * 22;
        const o = oldLegend[i];
        const n = newLegend[i];
        if (o) {
          ctx.globalAlpha = 1 - ease;
          ctx.fillStyle = o.color;
          roundRectPath(ctx, lx, ly - 6, 14, 9, 2);
          ctx.fill();
          ctx.fillStyle = MUTED;
          ctx.fillText(o.label, lx + 20, ly - 1);
        }
        if (n) {
          ctx.globalAlpha = ease;
          ctx.fillStyle = n.color;
          roundRectPath(ctx, lx, ly - 6, 14, 9, 2);
          ctx.fill();
          ctx.fillStyle = DARK;
          ctx.fillText(n.label, lx + 20, ly - 1);
        }
      });
      ctx.globalAlpha = 1;
    };

    const tick = (): void => {
      render(stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (v: View): void => {
    if (v === stateRef.current.view) return;
    stateRef.current.prevView = stateRef.current.view;
    stateRef.current.view = v;
    stateRef.current.switchAt = performance.now();
    setView(v);
    setFeedback(
      v === 'atari'
        ? {
            text: 'EWC 让单个网络学会多个游戏（任务标签由论文的任务识别模块推断），但达不到十个独立网络的上限——这就是对角近似的代价。',
            cls: 'good',
          }
        : { text: '排列 MNIST 上 EWC 接近单任务水平；其余方法随任务数退化。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button
            className={`chip ${view === 'atari' ? 'selected' : ''}`}
            onClick={() => choose('atari')}
          >
            Atari 总分
          </button>
          <button
            className={`chip ${view === 'mnist' ? 'selected' : ''}`}
            onClick={() => choose('mnist')}
          >
            排列MNIST
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod2;
