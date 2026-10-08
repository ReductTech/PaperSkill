import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBird, drawFlag, drawBook, drawSceneLabel, bar } from './birdKit';

// m6-2 (gen-vs-retrieve) — 生成 vs 检索：GenerateU 逐字生成，LRPC 先找后查（Tab 3）。

const W = 520;
const H = 280;
const DURATION = 2.6;
const WORD = 'sparrow';

export const M6_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const genRef = useRef<HTMLCanvasElement>(null);
  const retRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ start: number; doneNotified: boolean }>({ start: -1, doneNotified: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '点击“开始对比”：左边逐字生成，右边先找后查。', cls: '' });

  useEffect(() => {
    const genCanvas = genRef.current;
    const retCanvas = retRef.current;
    if (!genCanvas || !retCanvas) return;
    let genCtx: CanvasRenderingContext2D;
    let retCtx: CanvasRenderingContext2D;
    try {
      genCtx = setupCanvas(genCanvas, W, H);
      retCtx = setupCanvas(retCanvas, W, H);
    } catch {
      return;
    }

    const renderGen = (p: number, t: number) => {
      clearScene(genCtx, W, H);
      drawSceneLabel(genCtx, 'GenerateU 生成', 24, 32, PALETTE.muted);
      drawBird(genCtx, 130, 110, t, { body: PALETTE.treeDark });
      // 逐字蹦出类别名（慢：全程才打完）
      const n = Math.floor(clamp(p, 0, 1) * WORD.length);
      genCtx.save();
      genCtx.font = 'bold 20px monospace';
      genCtx.fillStyle = PALETTE.orange;
      genCtx.fillText(WORD.slice(0, n) + (p < 1 && n < WORD.length ? '▌' : ''), 220, 116);
      genCtx.restore();
      // FPS 条
      if (p >= 1) {
        bar(genCtx, 60, 226, 300, 18, 0.48 / 26, PALETTE.red, '0.48 FPS');
      } else {
        drawSceneLabel(genCtx, '语言模型逐字生成中……', 60, 240, PALETTE.muted);
      }
    };

    const renderRet = (p: number, t: number) => {
      clearScene(retCtx, W, H);
      drawSceneLabel(retCtx, 'LRPC 检索', 24, 32, PALETTE.blue);
      drawBird(retCtx, 130, 110, t, { body: PALETTE.treeDark });
      // 0.3 前插旗；0.5 前翻页；随后立即亮名
      if (p > 0.15) drawFlag(retCtx, 130, 84, PALETTE.orange);
      if (p > 0.3) drawBook(retCtx, 250, 130, t, { thick: 1.4, flip: p < 0.6 });
      if (p > 0.6) {
        const f = easeOutCubic(clamp((p - 0.6) / 0.2, 0, 1));
        retCtx.save();
        retCtx.globalAlpha = f;
        retCtx.fillStyle = PALETTE.green;
        retCtx.font = 'bold 20px sans-serif';
        retCtx.fillText('sparrow', 282, 124);
        retCtx.restore();
        bar(retCtx, 60, 226, 300, 18, 25.3 / 26, PALETTE.green, '25.3 FPS');
      } else {
        drawSceneLabel(retCtx, '先插旗，再查词表……', 60, 240, PALETTE.muted);
      }
    };

    const tick = () => {
      const t = performance.now() / 1000;
      const st = stateRef.current;
      const p = st.start < 0 ? 0 : clamp((t - st.start) / DURATION, 0, 1);
      renderGen(p, t);
      renderRet(p, t);
      if (st.start >= 0 && p >= 1 && !st.doneNotified) {
        st.doneNotified = true;
        setFeedback({
          text: '同一张图：0.48 FPS 对 25.3 FPS——检索式命名快 53 倍，参数还少 6.3 倍。',
          cls: 'good',
        });
      }
      [genCanvas, retCanvas].forEach((c) => {
        if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const d1 = observeCanvas(genCanvas, start, stop);
    const d2 = observeCanvas(retCanvas, () => {}, () => {});
    return () => {
      stop();
      d1();
      d2();
    };
  }, []);

  const onPlay = () => {
    stateRef.current.start = performance.now() / 1000;
    stateRef.current.doneNotified = false;
    setFeedback({ text: '左边逐字生成，右边先找后查……', cls: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}-gen`}
          ref={genRef}
          width={W}
          height={H}
          style={{ borderColor: PALETTE.orange }}
        />
        <canvas
          id={`cv-${chapterId}-${moduleId}-ret`}
          ref={retRef}
          width={W}
          height={H}
          style={{ borderColor: PALETTE.blue }}
        />
      </div>
      <div className="ctrl">
        <button type="button" onClick={onPlay}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M6_2;
