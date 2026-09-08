import React, { useEffect, useRef, useState } from 'react';
import { easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 240;

type ContextRow = { label: string; value: string; color: string };

const taskRows: ContextRow[] = [
  { label: '目标', value: '发布交互式论文页面', color: C.blue },
  { label: '约束', value: '准确 · 可交互 · 不失真', color: C.purple },
  { label: '状态', value: '第 1 章已实现，待核验', color: C.orange },
  { label: '下一步', value: '检查对照动画与文案', color: C.green },
];

function row(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, item: ContextRow, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  fillRR(ctx, x, y, w, 24, 5, '#f8fafc');
  ctx.fillStyle = item.color;
  ctx.fillRect(x, y, 4, 24);
  drawLabel(ctx, item.label, x + 10, y + 16, item.color, 10);
  drawLabel(ctx, item.value, x + 48, y + 16, C.text, 10);
  ctx.restore();
}

function windowFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  title: string,
  used: number,
  color: string
) {
  fillRR(ctx, x, 14, 258, 186, 9, '#ffffff');
  strokeRR(ctx, x, 14, 258, 186, 9, C.axis, 1.2);
  fillRR(ctx, x, 14, 258, 30, 9, '#edf2f7');
  drawLabel(ctx, title, x + 12, 34, C.text, 11);
  drawLabel(ctx, `${used}/30k`, x + 204, 34, color, 10);
  fillRR(ctx, x + 12, 49, 234, 5, 3, C.axis);
  fillRR(ctx, x + 12, 49, 234 * (used / 30), 5, 3, color);
}

function rawLog(ctx: CanvasRenderingContext2D, x: number, y: number, i: number, alpha: number) {
  const labels = ['tool schema', 'stdout…', 'old observation', 'retry trace', 'raw HTML', 'debug log'];
  ctx.save();
  ctx.globalAlpha = alpha;
  fillRR(ctx, x, y, 222, 22, 4, i % 2 ? '#f3e8ea' : '#e9eef3');
  ctx.fillStyle = i % 2 ? C.red : C.muted;
  ctx.fillRect(x, y, 4, 22);
  drawLabel(ctx, labels[i % labels.length], x + 10, y + 15, i % 2 ? C.red : C.muted, 9);
  drawLabel(ctx, '····················', x + 92, y + 15, '#9aa8b8', 9);
  ctx.restore();
}

export const ModCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0, playing: false, start: 0 });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const s = stateRef.current;
      if (s.playing) {
        s.t = Math.min(1, (now - s.start) / 2200);
        if (s.t >= 1) {
          s.playing = false;
          setBusy(false);
          setDone(true);
        }
      }
      const e = easeOutCubic(s.t);
      clearScene(ctx, W, H);

      // Context is shown as a bounded prompt budget. Both sides begin with the
      // same task state; only their information-admission policy differs.
      windowFrame(ctx, 8, '被动累积的上下文', Math.round(12 + e * 17), e > 0.62 ? C.red : C.orange);
      windowFrame(ctx, 294, '筛选后的活动上下文', Math.round(12 - e), C.green);

      ctx.save();
      ctx.beginPath();
      ctx.rect(18, 58, 238, 132);
      ctx.clip();
      taskRows.forEach((item, i) => row(ctx, 20, 60 + i * 28 - e * 34, 234, item, 1 - e * 0.86));
      const count = Math.ceil(e * 6);
      for (let i = 0; i < count; i++) {
        const appear = Math.max(0, Math.min(1, e * 7 - i));
        rawLog(ctx, 26, 168 - i * 23, i, appear);
      }
      ctx.restore();

      taskRows.forEach((item, i) => row(ctx, 306, 60 + i * 28, 234, item, 1));
      fillRR(ctx, 306, 174, 234, 16, 4, '#e8f5ee');
      drawLabel(ctx, `筛选器：${Math.round(e * 18)} 条原始日志留在窗口外`, 316, 186, C.green, 9);

      drawLabel(ctx, '日志增长 → 决策状态被挤走', 12, 226, C.red, 11);
      drawLabel(ctx, '预算稳定 → 决策状态持续可见', 298, 226, C.green, 11);
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          className="chip"
          disabled={busy}
          onClick={() => {
            stateRef.current = { t: 0, playing: true, start: performance.now() };
            setBusy(true);
            setDone(false);
          }}
        >
          {done ? '再看一次' : '同时出发'}
        </button>
      </div>
      <div className={`feedback ${done ? 'good' : ''}`}>
        {done
          ? '右侧不是“更少历史”，而是一个有准入规则的活动上下文：目标、约束、当前状态和下一步被持续保留；原始日志仍可存档，但不默认占用窗口。'
          : '两边从同一任务状态开始：左侧让交互历史被动累积，右侧只让当前决策需要的信息进入有限窗口。'}
      </div>
    </div>
  );
};
