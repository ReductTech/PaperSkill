import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBird, drawBook, drawSceneLabel, insetBox, bar } from './birdKit';

// m1-1 (closed-stress) — 亲手体验：类别墙有多硬。
// 滑块控制新物种数量，按钮切换闭集/开放；左侧观鸟场景 + 右侧认出率 inset。

const W = 1080;
const H = 280;
const BIRD_Y = [70, 110, 150, 190, 96];

export const M1_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ novel: 20, mode: 'closed' as 'closed' | 'open' });
  const rafRef = useRef<number | null>(null);
  const [novel, setNovel] = useState(20);
  const [mode, setMode] = useState<'closed' | 'open'>('closed');
  const [feedback, setFeedback] = useState({
    text: '旧图鉴只收录 80 种：新物种越多，叫不出名字的越多。',
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

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 未收录比例与认出率
      const unknownFrac = s.mode === 'open' ? 0 : s.novel / (80 + s.novel);
      const unknownCount = Math.ceil(unknownFrac * 5);
      const recognized = s.mode === 'open' ? 1 : 1 - unknownFrac;

      // 左侧场景：图鉴 + 5 只循环飞过的鸟
      drawBook(ctx, 72, 236, t, { thick: 1.6, flip: s.mode === 'closed' });
      drawSceneLabel(ctx, s.mode === 'open' ? '可替换卡片' : '旧图鉴 80 种', 30, 264, s.mode === 'open' ? PALETTE.green : PALETTE.muted);
      for (let i = 0; i < 5; i++) {
        const px = 660 - ((t * 52 + i * 132) % 640);
        const py = BIRD_Y[i];
        const isUnknown = s.mode === 'closed' && i < unknownCount;
        drawBird(ctx, px, py, t + i, {
          state: isUnknown ? 'unknown' : 'known',
          body: isUnknown ? PALETTE.purple : PALETTE.treeDark,
        });
      }

      // 右侧 inset：认出率横条
      insetBox(ctx, 660, 40, 380, 190);
      drawSceneLabel(ctx, '认出率', 688, 76, PALETTE.ink);
      const pct = Math.round(recognized * 100);
      const color = recognized < 0.7 ? PALETTE.red : recognized <= 0.9 ? PALETTE.blue : PALETTE.green;
      bar(ctx, 688, 96, 240, 22, recognized, color, pct + '%');
      // 图例
      drawSceneLabel(ctx, '新物种 ' + s.novel + ' 种', 688, 156, PALETTE.muted);
      drawSceneLabel(ctx, s.mode === 'open' ? '来者都能认' : '未收录 ' + Math.round(unknownFrac * 100) + '%', 688, 184, color);
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

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.novel = v;
    setNovel(v);
    if (stateRef.current.mode === 'open') {
      setFeedback({ text: '同一双眼睛，换上可替换的“提示卡片”，来者都能认。', cls: 'good' });
    } else if (v > 60) {
      setFeedback({ text: '图鉴明显不够用了——这不是眼神问题，是图鉴太薄。', cls: 'bad' });
    } else {
      setFeedback({ text: '旧图鉴只收录 80 种：新物种越多，叫不出名字的越多。', cls: '' });
    }
  };

  const onToggle = () => {
    const next = stateRef.current.mode === 'closed' ? 'open' : 'closed';
    stateRef.current.mode = next;
    setMode(next);
    setFeedback(
      next === 'open'
        ? { text: '同一双眼睛，换上可替换的“提示卡片”，来者都能认。', cls: 'good' }
        : { text: '旧图鉴只收录 80 种：新物种越多，叫不出名字的越多。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          新物种数量 <span className="val">{novel}</span>
        </label>
        <input type="range" min={0} max={100} value={novel} onChange={onSlider} />
        <button type="button" onClick={onToggle}>
          {mode === 'closed' ? '换上会学习的图鉴' : '换回旧图鉴'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M1_1;
