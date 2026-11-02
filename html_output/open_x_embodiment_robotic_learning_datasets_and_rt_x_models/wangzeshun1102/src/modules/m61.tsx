import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawDriver,
  drawGauge,
  drawSceneLabel,
  drawLegend,
  INK,
  AUX,
  OK,
  BAD,
  LINE,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 模块 6.1（P3）：同步前后对比。左：未见物体/背景/环境，RT-2 与 RT-2-X 大致持平；
// 右：涌现技能，RT-2-X 约为只用评估本体数据训练模型的 3 倍。一个滑块、同一时间基准。

const W = 1080;
const H = 280;

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(0);
  const curRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '拖动滑块推进评估：左右两侧共用同一个时间基准。',
    cls: '',
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

    let raf: number | null = null;

    const render = () => {
      curRef.current += (targetRef.current - curRef.current) * 0.18;
      const p = clamp(curRef.current, 0, 1);

      clearScene(ctx, W, H);

      // 中缝。
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(540, 18);
      ctx.lineTo(540, 248);
      ctx.stroke();
      ctx.setLineDash([]);

      drawSceneLabel(ctx, '未见场景', 40, 34, INK);
      drawSceneLabel(ctx, '涌现技能', 590, 34, INK);

      // 左：两者几乎并排。
      drawDriver(ctx, 64, 116, 0.95, AUX);
      drawGauge(ctx, 96, 92, 424, 24, 0.56 * p, AUX);
      drawDriver(ctx, 64, 182, 0.95, OK);
      drawGauge(ctx, 96, 158, 424, 24, 0.57 * p, OK);

      // 右：基线短，RT-2-X 约为其 3 倍。两侧量程相同，便于直接比较。
      drawDriver(ctx, 588, 116, 0.95, BAD);
      drawGauge(ctx, 620, 92, 424, 24, 0.18 * p, BAD);
      drawDriver(ctx, 588, 182, 0.95, OK);
      drawGauge(ctx, 620, 158, 424, 24, 0.54 * p, OK);

      drawLegend(
        ctx,
        [
          { color: AUX, text: 'RT-2' },
          { color: BAD, text: '本体基线' },
          { color: OK, text: 'RT-2-X' },
        ],
        40,
        262
      );
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    targetRef.current = v;
    setProgress(v);
    if (v >= 0.99) {
      setFeedback({
        text:
          '左侧：RT-2 与 RT-2-X 在未见物体/背景/环境上大致持平；右侧：RT-2-X 的涌现技能约为只用评估本体数据训练模型的 3 倍。',
        cls: 'good',
      });
    } else if (v <= 0.02) {
      setFeedback({ text: '拖动滑块推进评估：左右两侧共用同一个时间基准。', cls: '' });
    } else {
      setFeedback({ text: '两侧同步增长：左边两条几乎并排，右边的差距越拉越大。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          评估进度 <span className="val">{Math.round(progress * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progress * 100)}
          onChange={onChange}
        />
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M61;
