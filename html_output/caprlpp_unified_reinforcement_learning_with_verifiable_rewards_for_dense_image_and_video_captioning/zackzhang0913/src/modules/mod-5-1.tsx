import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawScoreboard, drawScoreCell, drawHourglass, drawTimeBadge, drawBiasCoin,
  drawCurveAxis, drawCurve, drawBar, drawBars, drawLabel, drawLegend,
} from '../canvas-scene';

const W = 1080;
const H = 280;

// 5.1 题库里每道题都要验：带图答对、去掉图答错，才留下来。
// 画布内只放三个数字（保留 / 划掉 / 总数）与两个短标签，含义由图例说明。
type Item = { id: number; withImage: boolean; noImage: boolean };
const BASE: Item[] = [
  { id: 1, withImage: true, noImage: false },
  { id: 2, withImage: true, noImage: false },
  { id: 3, withImage: true, noImage: true },
  { id: 4, withImage: true, noImage: true },
  { id: 5, withImage: true, noImage: false },
];

export const Mod51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'with-image' as string });
  const [mode, setMode] = useState('with-image');
  const [fb, setFb] = useState({ text: '同一批题，换一种方式判一遍：先只看「带图能不能答对」。', cls: '' });

  const kept = BASE.filter((i) => i.withImage && !i.noImage).length;

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
    const render = (s: { mode: string }) => {
      gameField(ctx, W, H);
      for (let i = 0; i < BASE.length; i++) {
        const it = BASE[i];
        const keep = it.withImage && !it.noImage;
        const st =
          s.mode === 'with-image'
            ? it.withImage
              ? 'right'
              : 'wrong'
            : s.mode === 'no-image'
            ? it.noImage
              ? 'wrong'
              : 'right'
            : keep
            ? 'right'
            : 'wrong';
        drawQuestionCard(ctx, 70 + i * 112, 46, 96, st as 'right' | 'wrong' | 'idle');
        // 两个判定标记：带图（绿点）/ 去掉图（红点）
        ctx.save();
        ctx.fillStyle = it.withImage ? C.green : C.axis;
        ctx.beginPath();
        ctx.arc(86 + i * 112, 168, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = it.noImage ? C.red : C.axis;
        ctx.beginPath();
        ctx.arc(110 + i * 112, 168, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // 右侧：三个裸数字 + 两个短标签
      drawBar(ctx, 700, 52, 300, 22, kept / 5, C.green);
      drawLabel(ctx, kept + '', 700, 104, C.green, 22);
      drawLabel(ctx, 5 - kept + '', 800, 104, C.red, 22);
      drawLabel(ctx, '保留', 700, 140, C.muted, 16);
      drawLabel(ctx, '划掉', 800, 140, C.muted, 16);
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

  const pick = (m: string) => {
    stateRef.current.mode = m;
    setMode(m);
    setFb(
      m === 'bidirectional'
        ? kept <= 2
          ? { text: '只留下「必须看图才答得出」的题：这样学生答对，才算讲解者讲清楚了。', cls: 'good' }
          : { text: '还有偏多的题不看图也能答对，得继续筛。', cls: 'bad' }
        : m === 'with-image'
        ? { text: '带图能答对，只说明这题可答，不能说明它必须靠画面。', cls: '' }
        : { text: '凡是「不看图也能答对」的题，学生都是靠常识猜——留着它们，分数就假了。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          判定方式 <span className="val">{mode === 'with-image' ? '带图作答' : mode === 'no-image' ? '去掉图作答' : '两道都验'}</span>
        </label>
        <div className="chip-row">
          <button className={`chip ${mode === 'with-image' ? 'selected' : ''}`} onClick={() => pick('with-image')}>
            带图作答
          </button>
          <button className={`chip ${mode === 'no-image' ? 'selected' : ''}`} onClick={() => pick('no-image')}>
            去掉图作答
          </button>
          <button
            className={`chip ${mode === 'bidirectional' ? 'selected' : ''}`}
            onClick={() => pick('bidirectional')}
          >
            两道都验
          </button>
        </div>
      </div>
      <div className="ctrl">
        <label>
          每题两个标记 <span className="val">左=带图作答，右=去掉图作答</span>
        </label>
        <label>
          绿点=这题答对了，红点=答错了 <span className="val">卡片绿框=留下，红框=划掉</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod51;
