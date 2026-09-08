import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import * as PosterKit from './poster-kit';

const W = 800;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const TEXT = '#21324a';

const RESOLUTIONS = ['256×256', '512×512', '1024×1024'] as const;
type Stage = 0 | 1 | 2;
type Ratio = '1:1' | '3:4' | '16:9';

const RATIO_LABELS: Record<Ratio, string> = {
  '1:1': '正方形 1:1',
  '3:4': '竖版 3:4',
  '16:9': '横版 16:9',
};

const kit = PosterKit as unknown as {
  clearDesk: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  drawPoster: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    detail?: number
  ) => void;
  drawProofFrame: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ) => void;
  drawSceneLabel: (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string
  ) => void;
};

export const Ch4CurriculumWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ stage: Stage; ratio: Ratio }>({ stage: 0, ratio: '1:1' });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState<Stage>(0);
  const [ratio, setRatio] = useState<Ratio>('1:1');

  stateRef.current = { stage, ratio };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const draw = () => {
      const state = stateRef.current;
      kit.clearDesk(ctx, W, H);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.fillRect(24, 24, 500, 218);
      ctx.strokeRect(24, 24, 500, 218);
      ctx.fillRect(548, 24, 228, 218);
      ctx.strokeRect(548, 24, 228, 218);

      const dims =
        state.ratio === '1:1'
          ? { w: 172, h: 172 }
          : state.ratio === '3:4'
          ? { w: 139, h: 186 }
          : { w: 228, h: 128 };
      const posterX = 274 - dims.w / 2;
      const posterY = 133 - dims.h / 2;
      kit.drawPoster(ctx, posterX, posterY, dims.w, dims.h, BLUE, 0.35 + state.stage * 0.3);
      kit.drawProofFrame(ctx, posterX - 5, posterY - 5, dims.w + 10, dims.h + 10, state.stage === 2 ? GREEN : BLUE);

      const gridCount = state.stage === 0 ? 4 : state.stage === 1 ? 7 : 10;
      ctx.strokeStyle = 'rgba(39,68,110,0.24)';
      ctx.lineWidth = 1;
      for (let i = 1; i < gridCount; i += 1) {
        const gx = posterX + (dims.w * i) / gridCount;
        ctx.beginPath();
        ctx.moveTo(gx, posterY);
        ctx.lineTo(gx, posterY + dims.h);
        ctx.stroke();
      }

      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(585, 96);
      ctx.lineTo(739, 96);
      ctx.stroke();
      RESOLUTIONS.forEach((label, index) => {
        const x = 595 + index * 68;
        ctx.fillStyle = index === state.stage ? (state.stage === 2 ? GREEN : BLUE) : '#ffffff';
        ctx.strokeStyle = index === state.stage ? (state.stage === 2 ? GREEN : BLUE) : BORDER;
        ctx.lineWidth = index === state.stage ? 4 : 2;
        ctx.beginPath();
        ctx.arc(x, 96, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = index === state.stage ? '#ffffff' : MUTED;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(index + 1), x, 100);
        ctx.fillStyle = TEXT;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(label.split('×')[0], x, 126);
      });

      ctx.textAlign = 'left';
      ctx.fillStyle = ORANGE;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(RATIO_LABELS[state.ratio], 586, 172);
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('每个阶段都保留多种长宽比', 586, 199);
      ctx.fillText('网格仅表示逐步增加细节', 586, 219);
      kit.drawSceneLabel(ctx, RESOLUTIONS[state.stage], 42, 25, state.stage === 2 ? GREEN : BLUE);
      ctx.restore();
      canvas.classList.add('is-ready');
    };

    const tick = () => {
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const ratioOrder: Ratio[] = ['1:1', '3:4', '16:9'];

  return (
    <div
      onKeyDown={(event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setStage((value) => Math.max(0, value - 1) as Stage);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setStage((value) => Math.min(2, value + 1) as Stage);
        }
        if (event.key === 'Home') setStage(0);
        if (event.key === 'End') setStage(2);
      }}
    >
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="256、512、1024 三段预训练分辨率与多长宽比海报取景框"
      />
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          disabled={stage === 0}
          onClick={() => setStage((value) => Math.max(0, value - 1) as Stage)}
        >
          上一阶段
        </button>
        <span className="step-label">
          阶段 <b>{stage + 1}/3</b> · {RESOLUTIONS[stage]}
        </span>
        <button
          type="button"
          className="tiny"
          disabled={stage === 2}
          onClick={() => setStage((value) => Math.min(2, value + 1) as Stage)}
        >
          下一阶段
        </button>
      </div>
      <div className="chip-row" role="radiogroup" aria-label="长宽比">
        {ratioOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={'chip ' + (ratio === item ? 'selected' : '')}
            aria-pressed={ratio === item}
            onClick={() => setRatio(item)}
          >
            {RATIO_LABELS[item]}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        <b>当前阶段</b>：{RESOLUTIONS[stage]}；三个阶段都保留多种长宽比。
      </div>
    </div>
  );
};

export default Ch4CurriculumWidget;
