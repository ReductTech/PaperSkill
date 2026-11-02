import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawDriver,
  drawLegend,
  drawLicense,
  drawSceneLabel,
  drawVehicle,
  EMPH,
  GUIDE,
  LINE,
  MUTED,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

type Mode = 'solo' | 'general';

const FEEDBACK: Record<Mode, string> = {
  solo: '旧做法：每换一种本体、一个环境，就要重新采集数据、重新训练一套模型——22 种本体就是 22 套模型。',
  general: '通用策略：把 21 家机构、60 个数据集、100 万+ 轨迹放在一起训练，再用同一套策略适配新本体。',
};

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'solo' });
  const [mode, setMode] = useState<Mode>('solo');
  const [feedback, setFeedback] = useState(FEEDBACK.solo);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawSolo = (alpha: number) => {
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 4; i++) {
        const cy = 96 + i * 42;
        drawVehicle(ctx, 92, cy + 8, i === 0 ? 'sedan' : i === 1 ? 'truck' : i === 2 ? 'van' : 'bus', 0.5, PAINT);
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(118, cy - 6);
        ctx.lineTo(160, cy - 6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(162, cy - 24, 120, 34);
        ctx.strokeStyle = MUTED;
        ctx.strokeRect(162.5, cy - 23.5, 119, 33);
        ctx.fillStyle = MUTED;
        for (let k = 0; k < 3; k++) {
          ctx.fillRect(178 + k * 16, cy - 6 - (8 + k * 5), 9, 8 + k * 5);
        }
        ctx.fillStyle = LINE;
        ctx.fillRect(244, cy - 16, 30, 3);
        ctx.fillRect(244, cy - 8, 22, 3);
      }
      // 省略号：表示 22 套里的更多套
      ctx.fillStyle = MUTED;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(210 + i * 14, 250, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawGeneral = (alpha: number) => {
      ctx.globalAlpha = alpha;
      // 一叠数据卡
      for (let i = 4; i >= 1; i--) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(632 - i * 5, 56 + i * 5, 124, 66);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(632 - i * 5, 56 + i * 5, 124, 66);
      }
      drawLicense(ctx, 632, 56, 124, 66, GUIDE);
      drawDriver(ctx, 606, 176, 1.1, GUIDE);

      // 一条策略接到多种本体
      for (let i = 0; i < 11; i++) {
        const x = 620 + i * 40;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(694, 146);
        ctx.lineTo(x, 228);
        ctx.stroke();
      }
      for (let i = 0; i < 11; i++) {
        drawVehicle(ctx, 620 + i * 40, 236, i % 3 === 0 ? 'sedan' : i % 3 === 1 ? 'van' : 'truck', 0.34, PAINT);
      }
      ctx.globalAlpha = 1;
    };

    const render = (now: number) => {
      clearScene(ctx, W, H);
      const m = stateRef.current.mode;
      drawSolo(m === 'solo' ? 1 : 0.26);
      drawGeneral(m === 'general' ? 1 : 0.26);

      const pulse = clamp(0.5 + 0.5 * Math.sin(now / 420), 0, 1);
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 2;
      ctx.globalAlpha = lerp(0.55, 0.9, pulse);
      if (m === 'solo') {
        ctx.strokeRect(30, 46, 474, 216);
      } else {
        ctx.strokeRect(556, 46, 480, 216);
      }
      ctx.globalAlpha = 1;

      drawSceneLabel(ctx, '一机一模型', 40, 32, m === 'solo' ? PAINT : MUTED);
      drawSceneLabel(ctx, '一条通用策略', 590, 32, m === 'general' ? GUIDE : MUTED);

      drawLegend(
        ctx,
        [
          { color: PAINT, text: '车型' },
          { color: MUTED, text: '单独模型' },
          { color: GUIDE, text: '共享策略' },
        ],
        370,
        268
      );
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(FEEDBACK[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (mode === 'solo' ? ' selected' : '')} onClick={() => choose('solo')}>
          一机一模型
        </button>
        <button className={'chip' + (mode === 'general' ? ' selected' : '')} onClick={() => choose('general')}>
          一条通用策略
        </button>
      </div>
      <div className={'feedback ' + (mode === 'general' ? 'good' : 'bad')}>{feedback}</div>
    </div>
  );
};

export default M11;
