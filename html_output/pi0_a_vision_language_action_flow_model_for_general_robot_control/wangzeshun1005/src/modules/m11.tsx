import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawKeyboard, drawSceneLabel, drawScore, GUIDE, MUTED, OK } from './musicKit';
import type { WidgetProps } from './registry';

// m11 — 一任务一策略 vs 通用策略（P4 chips）。
// 单任务策略：整排琴键里只亮一个，其余发灰；通用策略：同一套权重点亮一片琴键。

const W = 1080;
const H = 280;

const KEY_X = 60;
const KEY_Y = 178;
const KEY_W = 960;
const KEY_H = 54;
const WHITE = 16;
const KW = KEY_W / WHITE;

const SINGLE_KEY = 7;
const GENERAL_KEYS: number[] = [1, 3, 5, 7, 9, 11, 13, 15];

type Mode = 'single' | 'general';

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('single');
  const [mode, setMode] = useState<Mode>('single');
  const [fb, setFb] = useState<{ text: string; cls: string }>({
    text: '先看「单任务策略」：整排琴键里只有一个键是亮的。再切到「通用策略」看看区别。',
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
    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const single = modeRef.current === 'single';
      const pulse = 0.5 + 0.5 * Math.sin(elapsed / 420);

      clearScene(ctx, W, H);
      drawScore(ctx, 60, 78, 960, 26, 12, single ? 1 : 9, single ? MUTED : OK);

      ctx.save();
      ctx.globalAlpha = 0.16 + 0.2 * pulse;
      ctx.fillStyle = single ? GUIDE : OK;
      if (single) {
        ctx.fillRect(KEY_X + SINGLE_KEY * KW, KEY_Y - 10, KW - 2, KEY_H + 10);
      } else {
        for (const i of GENERAL_KEYS) ctx.fillRect(KEY_X + i * KW, KEY_Y - 8, KW - 2, KEY_H + 8);
      }
      ctx.restore();

      drawKeyboard(
        ctx,
        KEY_X,
        KEY_Y,
        KEY_W,
        KEY_H,
        WHITE,
        single ? [SINGLE_KEY] : GENERAL_KEYS,
        single ? GUIDE : OK
      );

      if (single) {
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.fillStyle = '#c7cfdb';
        for (let i = 0; i < WHITE; i++) {
          if (i !== SINGLE_KEY) ctx.fillRect(KEY_X + i * KW, KEY_Y, KW - 2, KEY_H);
        }
        ctx.restore();
      }

      drawSceneLabel(ctx, single ? '单任务策略' : '通用策略', 60, 46, single ? MUTED : OK);
      drawSceneLabel(ctx, single ? '只亮一个键' : '点亮一片键', 60, 152, single ? MUTED : OK);
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: Mode): void => {
    modeRef.current = m;
    setMode(m);
    setFb(
      m === 'single'
        ? { text: '单任务策略只覆盖一个键：换一首曲子，就要从头再训一个模型。', cls: 'bad' }
        : { text: '同一套权重覆盖多种任务，这正是 π0 的目标。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (mode === 'single' ? ' selected' : '')} onClick={() => pick('single')}>
          单任务策略
        </button>
        <button className={'chip' + (mode === 'general' ? ' selected' : '')} onClick={() => pick('general')}>
          通用策略
        </button>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default M11;
