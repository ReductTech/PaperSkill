import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird, drawCard, drawBook, drawSceneLabel, insetBox } from './birdKit';

// m5-1 (prompt-modes) — 三种提示方式：文本 / 视觉 / 无提示，场景与 inset 同步切换。

const W = 1080;
const H = 280;

const MODES: Record<string, { enc: string; feat: string; scene: string }> = {
  text: { enc: 'RepRTA', feat: '用文字说出类别，最通用', scene: '适合：类别名说得出口' },
  visual: { enc: 'SAVPE', feat: '给示例找同类，对付难以描述的目标', scene: '适合：说不清但指得出' },
  free: { enc: 'LRPC', feat: '不给线索，全场景识别再逐一命名', scene: '适合：全都要、懒得说' },
};
const FEEDBACK: Record<string, string> = {
  text: '文字能说明白的，就用文本提示。',
  visual: '说不清楚的，给它看个样子。',
  free: '什么线索都不给，就让模型自己全认出来。',
};

export const M5_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'text' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState('text');
  const [feedback, setFeedback] = useState({ text: FEEDBACK.text, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 观鸟者与目标鸟
      drawBirder(ctx, 120, 210);
      drawBird(ctx, 480, 100, t, { body: PALETTE.orange });
      drawBird(ctx, 560, 140, t + 1.2, { body: PALETTE.treeDark });

      // 当前道具（蓝色高亮）
      const glow = PALETTE.blue;
      if (s.mode === 'text') {
        drawCard(ctx, 210, 140, { lines: 3, w: 44, h: 34, glow });
        drawSceneLabel(ctx, '描述卡片', 180, 200, PALETTE.blue);
      } else if (s.mode === 'visual') {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = glow;
        ctx.lineWidth = 3;
        ctx.fillRect(186, 128, 56, 44);
        ctx.strokeRect(186, 128, 56, 44);
        drawBird(ctx, 210, 156, t, { body: PALETTE.orange });
        ctx.restore();
        drawSceneLabel(ctx, '示例照片', 180, 200, PALETTE.blue);
      } else {
        drawBook(ctx, 214, 172, t, { thick: 2, glow });
        drawSceneLabel(ctx, '整本图鉴', 180, 208, PALETTE.blue);
      }

      // 右侧 inset
      const info = MODES[s.mode];
      insetBox(ctx, 660, 44, 380, 192);
      drawSceneLabel(ctx, '编码器', 688, 80, PALETTE.muted);
      ctx.save();
      ctx.fillStyle = PALETTE.blue;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(info.enc, 688, 116);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '15px sans-serif';
      ctx.fillText(info.feat, 688, 156);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '13px sans-serif';
      ctx.fillText(info.scene, 688, 192);
      ctx.restore();
    };

    const tick = () => {
      render(performance.now() / 1000);
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

  const onChip = (key: string) => {
    stateRef.current.mode = key;
    setMode(key);
    setFeedback({ text: FEEDBACK[key], cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={mode === 'text' ? 'chip selected' : 'chip'} onClick={() => onChip('text')}>
          文本提示
        </button>
        <button type="button" className={mode === 'visual' ? 'chip selected' : 'chip'} onClick={() => onChip('visual')}>
          视觉提示
        </button>
        <button type="button" className={mode === 'free' ? 'chip selected' : 'chip'} onClick={() => onChip('free')}>
          无提示
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M5_1;
