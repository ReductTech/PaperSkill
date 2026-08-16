import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import * as PosterKit from './poster-kit';

const W = 800;
const H = 300;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const TEXT = '#21324a';

const PLOT = { x: 55, y: 35, w: 430, h: 205 };

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
  drawSceneLabel: (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string
  ) => void;
};

type SceneState = {
  coverage: number;
  quality: number;
  textAware: boolean;
  dragging: boolean;
};

export const Ch3DataWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState>({
    coverage: 0.18,
    quality: 0.2,
    textAware: false,
    dragging: false,
  });
  const rafRef = useRef<number | null>(null);
  const [coverage, setCoverage] = useState(0.18);
  const [quality, setQuality] = useState(0.2);
  const [textAware, setTextAware] = useState(false);
  const [dragging, setDragging] = useState(false);

  sceneRef.current = { coverage, quality, textAware, dragging };

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
      const state = sceneRef.current;
      kit.clearDesk(ctx, W, H);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
      ctx.strokeRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
      ctx.beginPath();
      ctx.moveTo(PLOT.x + PLOT.w / 2, PLOT.y);
      ctx.lineTo(PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h);
      ctx.moveTo(PLOT.x, PLOT.y + PLOT.h / 2);
      ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h / 2);
      ctx.stroke();

      ctx.fillStyle = TEXT;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('常见类别', PLOT.x + 12, PLOT.y + PLOT.h - 10);
      ctx.fillText('长尾覆盖', PLOT.x + PLOT.w - 68, PLOT.y + PLOT.h - 10);
      ctx.save();
      ctx.translate(PLOT.x + 15, PLOT.y + 85);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('类内质量提高', 0, 0);
      ctx.restore();

      if (state.coverage < 0.5 && state.quality < 0.5) {
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
          ctx.beginPath();
          ctx.moveTo(PLOT.x + 25 + i * 24, PLOT.y + 145);
          ctx.lineTo(PLOT.x + 42 + i * 24, PLOT.y + 162);
          ctx.stroke();
        }
      }

      const cardX = PLOT.x + 35 + state.coverage * (PLOT.w - 90);
      const cardY = PLOT.y + PLOT.h - 62 - state.quality * (PLOT.h - 90);
      kit.drawPoster(ctx, cardX, cardY, 62, 46, ORANGE, 0.4 + state.quality * 0.55);
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = state.dragging ? 4 : 3;
      ctx.strokeRect(cardX - 4, cardY - 4, 70, 54);

      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.fillRect(510, 35, 255, 205);
      ctx.strokeRect(510, 35, 255, 205);
      ctx.fillStyle = TEXT;
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText('同一张图，两种训练描述', 528, 58);

      // Left: a poster with clearly visible text. The orange outline means
      // "text that is actually present in the image", not a generic icon.
      kit.drawPoster(ctx, 528, 76, 72, 86, ORANGE, 0.82);
      ctx.fillStyle = '#fff7ed';
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.fillRect(534, 119, 60, 25);
      ctx.strokeRect(534, 119, 60, 25);
      ctx.fillStyle = TEXT;
      ctx.font = '700 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('春日音乐会', 564, 135);
      ctx.fillStyle = ORANGE;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('框内＝图中可见文字', 564, 178);

      // Arrow: whether the visible words are copied into the training caption.
      ctx.strokeStyle = state.textAware ? GREEN : RED;
      ctx.fillStyle = state.textAware ? GREEN : RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(603, 120);
      ctx.lineTo(625, 120);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(625, 120);
      ctx.lineTo(617, 115);
      ctx.lineTo(617, 125);
      ctx.closePath();
      ctx.fill();

      // Right: the caption that is actually stored as training text.
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = state.textAware ? GREEN : RED;
      ctx.lineWidth = 2;
      ctx.fillRect(628, 76, 119, 86);
      ctx.strokeRect(628, 76, 119, 86);
      ctx.textAlign = 'left';
      ctx.fillStyle = TEXT;
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.fillText('训练描述', 638, 95);
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('一张音乐节海报', 638, 116);
      if (state.textAware) {
        ctx.fillStyle = GREEN;
        ctx.fillText('文字为「春日音乐会」', 638, 137);
      } else {
        ctx.fillStyle = RED;
        ctx.fillText('遗漏了海报文字', 638, 137);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = state.textAware ? GREEN : RED;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(state.textAware ? '文字信息被写入描述' : '只描述画面，文字被漏掉', 637, 207);
      kit.drawSceneLabel(ctx, '教学示意', 60, 34, BLUE);
      ctx.fillStyle = MUTED;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('坐标是教学示意，不是采样概率', 522, 232);
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

  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    setCoverage(clamp((x - PLOT.x - 20) / (PLOT.w - 40), 0, 1));
    setQuality(clamp(1 - (y - PLOT.y - 20) / (PLOT.h - 40), 0, 1));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    if (x < PLOT.x || x > PLOT.x + PLOT.w || y < PLOT.y || y > PLOT.y + PLOT.h) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromPointer(event);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging) updateFromPointer(event);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        aria-label="可拖动的类间覆盖与类内质量教学平面"
      />
      <div className="ctrl">
        <label>
          类间覆盖 <span className="val">{Math.round(coverage * 100)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(coverage * 100)}
          onChange={(event) => setCoverage(Number(event.target.value) / 100)}
          aria-label="类间覆盖教学坐标"
        />
        <label>
          类内质量 <span className="val">{Math.round(quality * 100)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(quality * 100)}
          onChange={(event) => setQuality(Number(event.target.value) / 100)}
          aria-label="类内质量教学坐标"
        />
        <span className="ctrl-label">训练描述方式</span>
        <button
          type="button"
          className={'tiny ' + (!textAware ? '' : 'ghost')}
          aria-pressed={!textAware}
          onClick={() => setTextAware(false)}
        >
          只描述画面
        </button>
        <button
          type="button"
          className={'tiny ' + (textAware ? '' : 'ghost')}
          aria-pressed={textAware}
          onClick={() => setTextAware(true)}
        >
          同时写入图中文字
        </button>
      </div>
      <div className="hotspot-info">
        <b>图示含义</b>：橙色框表示图中真实可见的文字，右侧白卡表示最终写入训练数据的描述；箭头表示是否把这些文字补进描述。
        <br />
        <b>当前结果</b>：{textAware
          ? '描述不仅说明画面内容，还写入了“春日音乐会”，模型因此能接触图中文字与语义的对应关系。'
          : '描述只说明这是一张音乐节海报，“春日音乐会”没有进入训练描述。'}
      </div>
    </div>
  );
};

export default Ch3DataWidget;
