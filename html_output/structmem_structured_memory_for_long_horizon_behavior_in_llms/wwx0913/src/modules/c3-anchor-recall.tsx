import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawPhoto,
  drawAxisBox,
  drawStamp,
  roundRect,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 3.1（P3 同步对照）：两侧共用同一条时间基准、同一个开始按钮。
// 无锚定只亮起种子那一张；有锚定按 E_τ(x*) 一次亮起同一时间戳的全部条目。

const W = 1080;
const H = 280;

type Phase = 'idle' | 'running' | 'done';

const EVENT = { tau: '2022-08-14 15:40', size: 5 };
const SEED = 2;
const CARD_X = [70, 150, 230, 310, 390];
const CARD_Y = 120;
const CARD_W = 80;
const CARD_H = 54;
const TRIGGER = 0.6;

export const C3AnchorRecall: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; t: number; startAt: number }>({
    phase: 'idle',
    t: 0,
    startAt: 0,
  });
  const uiRef = useRef<{ phase: Phase; retrieved: boolean }>({ phase: 'idle', retrieved: false });
  const [ui, setUi] = useState<{ phase: Phase; retrieved: boolean }>({
    phase: 'idle',
    retrieved: false,
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
    const DUR = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 4000 : 1600;
    let raf: number | null = null;

    const render = (now: number) => {
      const s = stateRef.current;
      if (s.phase === 'running') {
        s.t = clamp((now - s.startAt) / DUR, 0, 1);
        if (s.t >= 1) {
          s.t = 1;
          s.phase = 'done';
        }
      }
      const retrieved = s.t >= TRIGGER;
      if (uiRef.current.phase !== s.phase || uiRef.current.retrieved !== retrieved) {
        const next = { phase: s.phase, retrieved };
        uiRef.current = next;
        setUi(next);
      }

      clearScene(ctx, W, H, true);

      // 左右两个等尺寸面板
      drawAxisBox(ctx, 40, 40, 500, 200);
      drawAxisBox(ctx, 540, 40, 500, 200);

      // 两侧共用的基线与横轴刻度
      ctx.save();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 220);
      ctx.lineTo(1020, 220);
      ctx.stroke();
      CARD_X.forEach((x) => {
        [x + CARD_W / 2, x + 500 + CARD_W / 2].forEach((tx) => {
          ctx.beginPath();
          ctx.moveTo(tx, 214);
          ctx.lineTo(tx, 226);
          ctx.stroke();
        });
      });
      ctx.restore();

      // 两侧条目卡：坐标逐个相同，右侧整体偏移 +500
      CARD_X.forEach((x, i) => {
        const lActive = retrieved;
        const rActive = retrieved && i === SEED;
        drawPhoto(ctx, x, CARD_Y, CARD_W, CARD_H, 0, lActive ? COL.blue : COL.axis, lActive ? COL.blue : COL.white);
        drawPhoto(
          ctx,
          x + 500,
          CARD_Y,
          CARD_W,
          CARD_H,
          0,
          rActive ? COL.blue : COL.axis,
          rActive ? COL.blue : COL.white
        );
      });

      // 共享指针：两侧同 x
      const px = 40 + 460 * s.t;
      ctx.save();
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      [px, px + 500].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, 220);
        ctx.stroke();
      });
      ctx.restore();

      if (retrieved) {
        // 左侧：同一时间戳的整组条目 + 事件重建成功
        ctx.save();
        ctx.strokeStyle = COL.blue;
        ctx.lineWidth = 3;
        roundRect(ctx, 62, 112, 416, 70, 8);
        ctx.stroke();
        ctx.restore();
        drawStamp(ctx, 496, 147, 18, COL.green, false);

        // 右侧：只剩种子自己，事件无法重建
        ctx.save();
        ctx.strokeStyle = COL.red;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(CARD_X[SEED] + 510, 130);
        ctx.lineTo(CARD_X[SEED] + 570, 164);
        ctx.moveTo(CARD_X[SEED] + 570, 130);
        ctx.lineTo(CARD_X[SEED] + 510, 164);
        ctx.stroke();
        ctx.restore();
      }

      // 2 个短标签 + 1 个图例
      label(ctx, '有锚定', 60, 34, COL.ink, 'left', 20);
      label(ctx, '无锚定', 560, 34, COL.ink, 'left', 20);
      legend(
        ctx,
        [
          { c: COL.orange, t: '同一时刻' },
          { c: COL.blue, t: '取回' },
          { c: COL.axis, t: '未取回' },
        ],
        44,
        190
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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

  const onStart = () => {
    stateRef.current.phase = 'running';
    stateRef.current.t = 0;
    stateRef.current.startAt = performance.now();
    uiRef.current = { phase: 'running', retrieved: false };
    setUi(uiRef.current);
  };

  const onReset = () => {
    stateRef.current.phase = 'idle';
    stateRef.current.t = 0;
    uiRef.current = { phase: 'idle', retrieved: false };
    setUi(uiRef.current);
  };

  const anchoredCount = ui.retrieved ? EVENT.size : 1;
  const flatCount = 1;

  const feedback =
    ui.phase === 'idle'
      ? { text: '点击开始：两侧共用同一条时间基准，起始状态完全一致。', cls: '' }
      : ui.phase === 'running'
      ? { text: '指针推进：两侧条目排布完全相同，只有时间戳是否保留不同。', cls: '' }
      : { text: '有锚定复原出完整事件，无锚定只剩种子自己——差别来自 τ。', cls: 'good' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button
          className="tiny"
          type="button"
          disabled={ui.phase === 'running'}
          aria-disabled={ui.phase === 'running'}
          onClick={onStart}
        >
          开始
        </button>
        <button className="tiny ghost" type="button" onClick={onReset}>
          重置
        </button>
      </div>
      <div className="compare-row">
        <div className="compare-col">
          <div className="compare-label">有锚定：同一时间戳 {EVENT.size} 条一起取回</div>
        </div>
        <div className="compare-col">
          <div className="compare-label">无锚定：只取回种子自己</div>
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">有锚定 · 取回条目</div>
          <div className="v">{anchoredCount}</div>
        </div>
        <div className="metric">
          <div className="l">无锚定 · 取回条目</div>
          <div className="v">{flatCount}</div>
        </div>
        <div className="metric">
          <div className="l">示例事件时间戳 τ</div>
          <div className="v">{EVENT.tau}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C3AnchorRecall;
