import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch2 M2.1: P6 drag a reading window across the page; right inset shows stage + tensor size.
const W = 560;
const H = 240;

const STAGES = [
  { label: '输入', size: '224×224×3', ch: 'RGB 图像' },
  { label: 'conv1', size: '112×112×64', ch: '64 通道' },
  { label: 'conv2_x', size: '56×56×64', ch: '64 通道' },
  { label: 'conv3_x', size: '28×28×128', ch: '128 通道' },
  { label: 'conv4_x', size: '14×14×256', ch: '256 通道' },
  { label: 'conv5_x', size: '7×7×512', ch: '512 通道' },
];

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ windowX: 150 });
  const rafRef = useRef<number | null>(null);
  const [windowX, setWindowX] = useState(150);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { windowX: number }) => {
      clearScene(ctx, W, H);
      drawPage(ctx, 150, 140, 240, 84, 0);
      drawTextLines(ctx, 48, 126, 200, 3, 1, C.ink);
      const wx = clamp(s.windowX, 30, 270);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.strokeRect(wx - 30, 118, 60, 44);
      ctx.fillStyle = 'rgba(39,68,110,0.12)';
      ctx.fillRect(wx - 30, 118, 60, 44);
      drawSceneLabel(ctx, '拖动阅读窗口', 24, 30, C.blue);
      // right technical inset
      const idx = clamp(Math.floor(map(wx, 30, 270, 0, STAGES.length)), 0, STAGES.length - 1);
      const st = STAGES[idx];
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(360, 40, 180, 150);
      ctx.strokeRect(360, 40, 180, 150);
      drawSceneLabel(ctx, '当前阶段', 376, 52, C.muted);
      drawSceneLabel(ctx, st.label, 376, 72, C.blue);
      drawSceneLabel(ctx, `特征图 ${st.size}`, 376, 100, C.ink);
      drawSceneLabel(ctx, st.ch, 376, 128, C.muted);
      drawSceneLabel(ctx, '分辨率减半 · 通道加倍', 376, 158, C.orange);
    };
    const tick = () => {
      render(stateRef.current);
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
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    stateRef.current.windowX = x;
    setWindowX(x);
  };

  const idx = clamp(Math.floor(map(windowX, 30, 270, 0, STAGES.length)), 0, STAGES.length - 1);
  const st = STAGES[idx];
  const feedback =
    idx >= STAGES.length - 1
      ? '读完整个段落——7×7 的特征图已浓缩全图语义。'
      : `正在读取「${st.label}」阶段：特征图为 ${st.size}，分辨率减半、通道加倍。`;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDrag}
        onPointerMove={(e) => {
          if (e.buttons & 1) onDrag(e);
        }}
        style={{ cursor: 'grab', touchAction: 'none' }}
      />
      <div className={`feedback ${idx >= STAGES.length - 1 ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export default Ch2Mod1;
