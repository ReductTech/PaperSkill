import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { clearScene, drawBars, drawLegend, drawSceneLabel, C } from './lighthouseKit';
import type { WidgetProps } from './registry';

// Module 10.1 — 把过程指标一起报出来（P8 结果竞赛）
// 注意：0.78 / 0.29 / 0.61 均为示意值，非论文实测。

const W = 1080;
const H = 340; // 本章比其他章高 40px（标准为 300）
const ANIM_MS = 1600;
const STAGGER_MS = 250;

// 两组对照：仅结果指标 / 结果 + 过程指标；未测量用灰色
const COL_A = C.beam; // 仅结果指标
const COL_B = C.hit; // 结果 + 过程指标
const COL_UNK = C.inkMuted; // 未测量

const BAR_X = 40;
const BAR_W = 700; // drawBars 总宽；标签 150 + 条 494 + 值 56
const BAR_LABEL_W = 150;
const BAR_TRACK_W = BAR_W - BAR_LABEL_W - 56;

export const Mod101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);
  const kickRef = useRef<() => void>(() => {});
  const [feedback, setFeedback] = useState({ text: '点击开始，看两种评测口径的差异。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      clearScene(ctx, W, H);

      // 顶部说明标签（≤6 汉字）
      drawSceneLabel(ctx, 880, 26, '示意值非实测');

      const now = performance.now();
      const elapsed = runningRef.current ? now - startRef.current : 0;
      const pA = easeOutCubic(clamp(elapsed / ANIM_MS, 0, 1));
      const pB = easeOutCubic(clamp((elapsed - STAGGER_MS) / (ANIM_MS - STAGGER_MS), 0, 1));

      // 指标 1：一次性完成率（两组均 0.78）
      ctx.fillStyle = C.ink;
      ctx.font = '15px "Microsoft YaHei", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('一次性完成率', BAR_X, 52);
      drawBars(ctx, BAR_X, 66, BAR_W, [
        { label: '仅结果指标', value: 0.78 * pA, color: COL_A },
        { label: '结果+过程指标', value: 0.78 * pB, color: COL_B },
      ]);
      drawSceneLabel(ctx, 880, 79, '一致');

      // 指标 2：pass^k 可靠性（k=5）
      ctx.fillStyle = C.ink;
      ctx.fillText('pass^k 可靠性（k=5）', BAR_X, 132);
      drawBars(ctx, BAR_X, 146, BAR_W, [
        { label: '仅结果指标', value: 0.29 * pA, color: COL_A },
        { label: '结果+过程指标', value: 0.61 * pB, color: COL_B },
      ]);

      // 指标 3：过程成本（token / 工具调用 / 重试）手动绘制
      ctx.fillStyle = C.ink;
      ctx.fillText('过程成本（token / 工具调用 / 重试）', BAR_X, 196);
      const bx = BAR_X + BAR_LABEL_W;
      const yA = 212; // 仅结果指标：未测量
      const yB = 238; // 结果 + 过程指标：已记录
      // A：仅结果指标 = 未测量
      ctx.fillStyle = C.line;
      ctx.fillRect(bx, yA - 7, BAR_TRACK_W, 14);
      ctx.fillStyle = COL_UNK;
      ctx.font = '14px "Microsoft YaHei", sans-serif';
      ctx.fillText('未测量', bx + BAR_TRACK_W + 12, yA);
      // B：结果 + 过程指标 = 已记录（生长）
      ctx.fillStyle = C.line;
      ctx.fillRect(bx, yB - 7, BAR_TRACK_W, 14);
      ctx.fillStyle = COL_B;
      ctx.fillRect(bx, yB - 7, BAR_TRACK_W * pB, 14);
      ctx.fillStyle = C.ink;
      ctx.fillText('已记录', bx + BAR_TRACK_W + 12, yB);

      // 图例（至多 3 项）
      drawLegend(ctx, 720, 150, [
        { color: COL_A, label: '仅结果指标' },
        { color: COL_B, label: '结果+过程指标' },
        { color: COL_UNK, label: '未测量' },
      ]);
    };

    const tick = () => {
      render();
      if (runningRef.current) {
        const elapsed = performance.now() - startRef.current;
        if (elapsed >= ANIM_MS) {
          runningRef.current = false;
          setFeedback({
            text:
              '两种口径在一次性完成率上一致，但可靠性与过程成本立刻分出高下——一次性评测看不见过程。（示意，非论文实测）',
            cls: '',
          });
        }
      }
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
    kickRef.current = start;
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    runningRef.current = true;
    startRef.current = performance.now();
    setFeedback({ text: '正在对比两种评测口径（示意，非论文实测）……', cls: '' });
    kickRef.current(); // 即使观察器暂停也能继续推进
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onStart}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod101;
