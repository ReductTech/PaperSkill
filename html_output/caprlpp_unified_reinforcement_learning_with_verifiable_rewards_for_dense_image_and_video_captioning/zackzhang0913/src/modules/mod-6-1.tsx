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

// 6.1 逐题打分流程：抽题、打乱选项、盲学生作答、计分。
const STEP_TEXT = [
  '先从题库里抽一道题——这些题都在第 6 章筛过，不看图答不出来。',
  '选项每次都要打乱：否则学生可能摸到「答案总在 A」的规律，分数就不反映讲解质量了。',
  '学生看不到画面，只能读讲解稿作答。答对，说明讲解里确实写到了这个细节。',
  '一次作答太偶然，多轮重复后取平均，才是这段讲解的最终得分。',
];

export const Mod61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, q: 3, order: [0, 1, 2, 3], ok: true, n: 0 });
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '用「下一步」走完一次完整打分：抽题、打乱、作答、计分。', cls: '' });

  const roll = () => {
    const q = 1 + Math.floor(Math.random() * 5);
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const ok = Math.random() > 0.4;
    return { q, order, ok };
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const render = (s: { step: number; q: number; order: number[]; ok: boolean; n: number }) => {
      gameField(ctx, W, H);
      drawPictureCard(ctx, 60, 40, 90, 'clean');
      drawDescriber(ctx, 200, 220, 60, C.blue);
      drawGuesser(ctx, 320, 220, 60, C.blue);
      const st = s.step >= 3 ? (s.ok ? 'right' : 'wrong') : 'idle';
      drawQuestionCard(ctx, 400, 40, 92, st as 'idle' | 'right' | 'wrong');
      for (let i = 0; i < 4; i++) {
        const on = s.step >= 2;
        ctx.save();
        ctx.fillStyle = on && s.order[i] === 0 ? C.green : C.axis;
        ctx.fillRect(520 + i * 30, 60, 24, 24);
        ctx.restore();
      }
      drawScoreboard(ctx, 700, 40, 300, 70, 5);
      for (let i = 0; i < 5; i++) {
        const gap = 8;
        const cw = (300 - gap * 6) / 5;
        drawScoreCell(ctx, 700 + gap + i * (cw + gap), 48, cw, i < s.n, C.green);
      }
      drawLabel(ctx, String(s.q), 400, 150, C.blue, 22);
      drawLabel(ctx, String(s.n), 700, 150, C.green, 22);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(() => render(stateRef.current)); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const next = () => {
    const s = stateRef.current;
    if (s.step >= 4) return;
    if (s.step === 0) {
      const r = roll();
      s.q = r.q; s.order = r.order; s.ok = r.ok;
    }
    if (s.step === 3 && s.ok) s.n = Math.min(5, s.n + 1);
    s.step += 1;
    setStep(s.step);
    const i = Math.min(3, s.step - 1);
    if (s.step >= 1 && s.step <= 4) {
      const txt = s.step === 3 ? (s.ok ? '这一题答对了，说明描述里确实写到了这个细节。' : '这一题没答对，描述缺了它需要的信息。') : STEP_TEXT[i];
      setFb({ text: txt, cls: s.step === 3 ? (s.ok ? 'good' : 'bad') : '' });
    }
  };
  const reset = () => {
    stateRef.current = { step: 0, q: 3, order: [0, 1, 2, 3], ok: true, n: 0 };
    setStep(0);
    setFb({ text: '用「下一步」走完一次完整打分。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>步骤 <span className="val">{step} / 4</span></label>
        <button className="chip" onClick={reset}>重来</button>
        <button className="chip selected" onClick={next} disabled={step >= 4}>下一步</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod61;
