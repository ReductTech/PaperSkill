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

// 7.2 一轮训练的四步：同一个画面讲三遍 → 各自算分 → 比组内高低 → 往高的方向调。
const CAND = [
  { text: '左侧第三人', score: 0.5 },
  { text: '红衣服的人', score: 0.82 },
  { text: '有人在动', score: 0.3 },
];

export const Mod72: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0, picked: null as number | null });
  const [stage, setStage] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [fb, setFb] = useState({ text: '逐步走完一轮：讲三遍、各自算分、比高低、调方向。', cls: '' });

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
    const render = (s: { stage: number; picked: number | null }) => {
      gameField(ctx, W, H);
      const steps = ['讲三遍', '各自算分', '比高低', '调方向'];
      for (let i = 0; i < 4; i++) {
        const done = s.stage > i;
        const cur = s.stage === i;
        ctx.save();
        ctx.fillStyle = done ? C.green : '#ffffff';
        ctx.strokeStyle = cur ? C.blue : done ? C.green : C.axis;
        ctx.lineWidth = cur ? 3 : 2;
        ctx.beginPath();
        ctx.rect(50 + i * 150, 40, 130, 46);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, steps[i], 62 + i * 150, 63, done || cur ? '#ffffff' : C.muted, 16);
      }
      for (let i = 0; i < CAND.length; i++) {
        const show = s.stage >= 2;
        const sel = s.picked === i;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = sel ? C.green : C.axis;
        ctx.lineWidth = sel ? 3 : 2;
        ctx.beginPath();
        ctx.rect(50, 120 + i * 46, 300, 38);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (show) drawBar(ctx, 380, 130 + i * 46, 200, 16, CAND[i].score, sel ? C.green : C.red);
        drawLabel(ctx, CAND[i].text.slice(0, 6), 60, 139 + i * 46, C.ink, 16);
        if (!show) drawLabel(ctx, '还没算分', 380, 139 + i * 46, C.muted, 16);
      }
      const shift = s.picked === null ? 0 : CAND[s.picked].score - 0.54;
      ctx.save();
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(820, 150, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = shift >= 0 ? C.green : C.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(820, 150);
      ctx.lineTo(820 + 52 * Math.sin(shift * 3), 150 - 52 * Math.cos(shift * 3));
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, shift.toFixed(2), 700, 60, shift >= 0 ? C.green : C.red, 22);
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

  const next = () => {
    const s = stateRef.current;
    if (s.stage >= 4) return;
    s.stage += 1;
    setStage(s.stage);
    const texts = [
      '同一个画面，讲解者一次讲三遍，得到三段不同的讲解稿。',
      '每段稿子都按前面的流程算一次分：盲学生答对多少，就多少分。',
      '看这三段里谁比组内平均更高——比的是相对高低，不是绝对分数。',
      '把讲解者的方向朝「讲得更好的那段」挪一小步。',
      '一轮结束。下一轮会重新讲三遍，继续微调。',
    ];
    setFb({ text: texts[Math.min(4, s.stage)], cls: s.stage >= 3 ? 'good' : '' });
  };
  const reset = () => {
    stateRef.current = { stage: 0, picked: null };
    setStage(0);
    setPicked(null);
    setFb({ text: '逐步走完一轮：讲三遍、各自算分、比高低、调方向。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          训练步骤 <span className="val">{stage} / 4</span>
        </label>
        <button className="chip" onClick={reset}>
          重来
        </button>
        <button className="chip selected" onClick={next} disabled={stage >= 4}>
          下一步
        </button>
        {CAND.map((c, i) => (
          <button
            key={i}
            className={`chip ${picked === i ? 'selected' : ''}`}
            disabled={stage < 3}
            onClick={() => {
              stateRef.current.picked = i;
              setPicked(i);
              setFb({ text: '采纳这一段讲解稿后，讲解者的方向朝它偏移。', cls: 'good' });
            }}
          >
            采纳：{c.text}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod72;
