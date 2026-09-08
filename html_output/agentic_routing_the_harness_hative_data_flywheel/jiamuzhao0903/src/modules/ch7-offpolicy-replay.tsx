import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawLegend,
  drawMeter,
  drawPatchCable,
  drawScoreTrack,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 560;
const H = 260;
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const MUTED = '#d7deea';

type ReplayState = {
  running: boolean;
  progress: number;
  completed: boolean;
};

const INITIAL: ReplayState = { running: false, progress: 0, completed: false };

export const Ch7OffpolicyReplay: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ReplayState>(INITIAL);
  const [state, setState] = useState<ReplayState>(INITIAL);

  const commit = (next: ReplayState) => {
    stateRef.current = next;
    setState(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = 'min(100%, 560px)';
    canvas.style.height = 'auto';
    let raf: number | null = null;
    let last = performance.now();

    const render = (s: ReplayState) => {
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 36, 544, 184);
      drawStudioLabel(ctx, '同一条 Arena 失败记录', 16, 20, 'left');
      drawLegend(ctx, [
        { label: '旧动作', color: RED },
        { label: '环境结果', color: GREEN },
      ], 365, 20);

      const left = { x: 140, y: 57, w: 184, h: 148 };
      const right = { x: 338, y: 57, w: 206, h: 148 };
      drawPatchCable(ctx, { x: 120, y: 130 }, { x: 150, y: 130 }, RED);
      ctx.save();
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(120, 158);
      ctx.bezierCurveTo(130, 158, 130, 214, 142, 214);
      ctx.lineTo(326, 214);
      ctx.bezierCurveTo(338, 214, 338, 158, 348, 158);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      [{ x: 120, y: 158 }, { x: 348, y: 158 }].forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      ctx.fillStyle = '#fffdf7';
      ctx.fillRect(16, 50, 104, 158);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(16, 50, 104, 158);
      drawScoreTrack(ctx, 26, 66, 84, 1, BLUE);
      ['hₜ 状态', 'uₜ 动作', '验证 / 恢复', '成本 / 延迟', '来源 ωₜ'].forEach((label, index) => {
        ctx.fillStyle = index === 1 ? RED : BLUE;
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText(label, 27, 107 + index * 20);
      });

      [left, right].forEach((box) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = MUTED;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      });
      drawStudioLabel(ctx, '行为克隆：复制动作', 150, 78, 'left');
      drawStudioLabel(ctx, '结果学习：评价动作', 348, 78, 'left');

      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(154, 122);
      ctx.lineTo(310, 122);
      ctx.moveTo(350, 150);
      ctx.lineTo(528, 150);
      ctx.stroke();
      ctx.strokeStyle = BLUE;
      ctx.beginPath();
      ctx.moveTo(154, 122);
      ctx.lineTo(154 + 156 * s.progress, 122);
      ctx.moveTo(350, 150);
      ctx.lineTo(350 + 178 * s.progress, 150);
      ctx.stroke();

      const playX = 154 + 374 * s.progress;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(playX, 96);
      ctx.lineTo(playX, 178);
      ctx.stroke();
      ctx.fillStyle = ORANGE;
      ctx.fillRect(playX - 7, 91, 14, 8);

      drawMeter(ctx, 271, 136, s.completed ? 0.2 : 0.55, s.completed ? RED : BLUE, 60);
      drawTargetBand(ctx, 446, 174, 78);
      if (s.completed) {
        ctx.fillStyle = RED;
        ctx.font = '700 21px "Segoe UI", sans-serif';
        ctx.fillText('×', 300, 188);
        ctx.fillStyle = GREEN;
        ctx.fillText('✓', 511, 188);
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('复制旧模型', 207, 198);
      ctx.fillText('按结果重估', 360, 198);
      ctx.fillText(s.running ? `回放 ${(s.progress * 100).toFixed(0)}%` : s.completed ? '回放完成' : '等待同时回放', 18, 244);
    };

    const tick = (now: number) => {
      const current = stateRef.current;
      if (current.running) {
        const progress = clamp(current.progress + (now - last) / 2800, 0, 1);
        const next: ReplayState = progress >= 1
          ? { running: false, progress: 1, completed: true }
          : { running: true, progress, completed: false };
        stateRef.current = next;
        setState(next);
      }
      last = now;
      render(stateRef.current);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      last = performance.now();
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const feedback = state.running
    ? { cls: '', text: '结果学习正在把动作与环境评分分离，并校正日志策略带来的选择偏差。' }
    : state.completed
      ? { cls: 'good', text: '坏路由成为负例：目标是移动前沿，而不是同意上一代路由器。' }
      : { cls: 'bad', text: '行为克隆把旧模型选择当答案，失败会被原样复制。' };

  const startReplay = () => commit({ running: true, progress: 0, completed: false });
  const reset = () => commit(INITIAL);

  return (
    <div onKeyDown={(event) => { if (event.key === 'Escape') reset(); }}>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="同一条失败记录在行为克隆与离策略结果学习两条路径中同步回放"
      />
      <div className="step-ctrl">
        <button className="tiny" type="button" onClick={startReplay} disabled={state.running}>
          {state.completed ? '再次回放' : '同时回放'}
        </button>
        <button className="tiny ghost" type="button" onClick={reset}>重置</button>
        <span className="step-label"><b>{Math.round(state.progress * 100)}%</b> · 同一起点</span>
      </div>
      <div className="compare-row">
        <div className="three-col-panel noisy">
          <div className="three-col-label">旧限制：模仿动作</div>
          <p>“上一代选了谁”被当成答案，失败选择会进入下一轮。</p>
        </div>
        <div className="three-col-panel clean">
          <div className="three-col-label">论文方案：学习结果</div>
          <p>状态、动作、验证、恢复、成本、延迟与来源分开记录，再做离策略估计。</p>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <div className="hotspot-info">
        <b>成立条件：</b>需要替代动作覆盖、已记录路由概率、结果变化、长轨迹信用分配与稳健验证。缺少这些条件时，逆倾向或双重稳健修正也不能自动保证可靠；只有同等奖励下降低实付成本，或固定预算下提高奖励的新一代才应晋级，否则回滚。
      </div>
      <div className="hotspot-info">
        <b>适用性判断：</b>拥有完整执行轨迹、探索来源和可信环境结算时，失败路线可成为负例；若只剩最终回答，或验证信号被系统性污染，则不能做可靠归因。
      </div>
    </div>
  );
};
