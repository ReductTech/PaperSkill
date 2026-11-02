import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawRoad,
  drawVehicle,
  drawSceneLabel,
  drawLegend,
  INK,
  MUTED,
  OK,
  EMPH,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 模块 5.1（P8）：小数据集结果赛。论文只给出总体结论——RT-1-X 相对各机构
// 原 SOTA 方法成功率高 50%；没有逐数据集百分比。因此画面只做定性对比：
// RT-1-X 冲过终点线，原方法仍在路上。

const W = 1080;
const H = 280;
const RACE_MS = 1500;

interface DatasetCase {
  name: string;
  note: string;
}

const DATASETS: DatasetCase[] = [
  { name: 'Kitchen', note: 'Kitchen 数据量小，论文点名这里的提升最明显。' },
  { name: 'Cable Routing', note: 'Cable Routing 样本有限，跨本体经验补上了本体的不足。' },
  { name: 'Door Opening', note: 'Door Opening 是论文点名提升最明显的小数据集之一。' },
  { name: 'UR5', note: 'UR5 自身数据不多，混合数据带来了明显增益。' },
  { name: 'Robot Play', note: 'Robot Play 样本少，正迁移在这里最容易看出来。' },
];

const FINISH_X = 950;

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const startRef = useRef(0);
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '从下方选一个小数据集，开始对比。两者使用同一套 RT-X 动作接口。',
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

    const render = (now: number) => {
      clearScene(ctx, W, H);

      drawRoad(ctx, 40, 88, 960, 46);
      drawRoad(ctx, 40, 160, 960, 46);

      drawSceneLabel(ctx, '原方法', 40, 80, INK);
      drawSceneLabel(ctx, 'RT-1-X', 40, 154, INK);

      const p = startedRef.current ? clamp((now - startRef.current) / RACE_MS, 0, 1) : 0;
      const pRt = startedRef.current ? clamp((now - startRef.current - 120) / RACE_MS, 0, 1) : 0;
      const e = easeOutCubic(p);
      const eRt = easeOutCubic(pRt);

      // 终点：黑白格。
      for (let r = 0; r < 17; r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : INK;
          ctx.fillRect(FINISH_X + c * 8, 88 + r * 7, 8, 7);
        }
      }

      const xOrig = lerp(84, 800, e);
      const xRt = lerp(84, 974, eRt);
      drawVehicle(ctx, xOrig, 130, 'sedan', 0.55, MUTED);
      drawVehicle(ctx, xRt, 202, 'van', 0.55, OK);

      // 终点小旗。
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(FINISH_X + 16, 84);
      ctx.lineTo(FINISH_X + 16, 58);
      ctx.stroke();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.moveTo(FINISH_X + 16, 58);
      ctx.lineTo(FINISH_X + 42, 65);
      ctx.lineTo(FINISH_X + 16, 72);
      ctx.closePath();
      ctx.fill();

      drawLegend(
        ctx,
        [
          { color: MUTED, text: '原方法' },
          { color: OK, text: 'RT-1-X' },
          { color: EMPH, text: '终点' },
        ],
        40,
        262
      );
    };

    const tick = () => {
      render(performance.now());
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

  const pick = (i: number) => {
    setSel(i);
    startedRef.current = true;
    startRef.current = performance.now();
    setFeedback({
      text:
        DATASETS[i].name +
        '：' +
        DATASETS[i].note +
        ' 论文的总体结论是 RT-1-X 相对各机构原 SOTA 方法成功率高 50%；画面为定性示意，不代表逐数据集数值。',
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {DATASETS.map((d, i) => (
          <button
            key={d.name}
            className={'chip' + (sel === i ? ' selected' : '')}
            onClick={() => pick(i)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M51;
