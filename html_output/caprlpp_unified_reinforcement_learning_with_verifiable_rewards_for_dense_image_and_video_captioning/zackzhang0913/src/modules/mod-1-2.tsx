import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser,
  drawQuestionCard, drawScoreboard, drawScoreCell,
  drawCurveAxis, drawCurve, drawBar, drawLabel, drawLegend,
} from '../canvas-scene';

const W = 1080;
const H = 280;

// 1.2 换一把尺子：这一次让看不见画面的学生来答题，答对几题就得几分。
export const Mod12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ flags: [false, false, false, false, false] as boolean[] });
  const [flags, setFlags] = useState<boolean[]>([false, false, false, false, false]);
  const [fb, setFb] = useState({ text: '现在换规则：讲解者写完，请一位看不见画面的学生来答题。点一点每题的对错，看分数怎么变。', cls: '' });

  const score = flags.filter(Boolean).length;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const render = (s: { flags: boolean[] }) => {
      gameField(ctx, W, H);
      // 题干卡
      for (let i = 0; i < 5; i++) {
        drawQuestionCard(ctx, 60 + i * 104, 60, 88, s.flags[i] ? 'right' : 'wrong');
      }
      // 黑板分数格
      drawScoreboard(ctx, 700, 50, 320, 90, 5);
      const gap = 8;
      const cw = (320 - gap * 6) / 5;
      for (let i = 0; i < 5; i++) {
        drawScoreCell(ctx, 700 + gap + i * (cw + gap), 58, cw, i < s.flags.filter(Boolean).length, C.green);
      }
      drawLabel(ctx, String(s.flags.filter(Boolean).length), 980, 200, C.green, 22);
      drawLegend(ctx, [{ label: '答对', color: C.green }, { label: '答错', color: C.red }], 60, 250);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const toggle = (i: number) => {
    const next = flags.slice();
    next[i] = !next[i];
    stateRef.current = { flags: next };
    setFlags(next);
    const n = next.filter(Boolean).length;
    setFb(
      n === 5
        ? { text: '5 题全对：这段讲解把画面信息完整传递给了看不见画面的学生。', cls: 'good' }
        : n >= 1
        ? { text: '部分信息传到了，但仍有细节缺失。', cls: '' }
        : { text: '一题都没答对，等于什么也没讲清楚，分数为 0。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          盲学生逐题判定 <span className="val">{score} / 5</span>
        </label>
        {[0, 1, 2, 3, 4].map((i) => (
          <button key={i} className={`chip ${flags[i] ? 'selected' : ''}`} onClick={() => toggle(i)}>
            第 {i + 1} 题{flags[i] ? '：对' : '：错'}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod12;
