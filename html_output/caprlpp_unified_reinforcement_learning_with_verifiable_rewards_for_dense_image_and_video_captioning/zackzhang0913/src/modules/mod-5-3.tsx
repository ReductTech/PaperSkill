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

// 5.3 题库从哪来：图像/视频 → 强模型批量出题 → 两道都验 → 剩下的才是训练用题库。
const STAGES = [
  { id: 'collect', label: '收素材', info: '图像取自网络与开源数据集（自然场景、图表、文档）；视频取 LLaVA-Video-178K 里的短片，多数在 30 秒以内。' },
  { id: 'gen', label: '批量出题', info: '用多个强视觉模型一起出选择题，避免只信一个模型带来的偏差。视频专门出两类题：时间定位题与通用视觉理解题。' },
  { id: 'filter', label: '两道都验', info: '带图答对、去掉图答错，才留下。这一步专门挡掉「靠常识或题干暗示就能答对」的题。' },
  { id: 'done', label: '得到题库', info: '约 10 万条图像问答对 + 约 2 万条视频问答对，训练期间固定不变。' },
];

export const Mod53: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const [stage, setStage] = useState(0);
  const [fb, setFb] = useState({ text: '按「下一步」看题库是怎么攒出来的。', cls: '' });

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
    const render = (s: { stage: number }) => {
      gameField(ctx, W, H);
      // 四个阶段的固定槽位
      for (let i = 0; i < STAGES.length; i++) {
        const done = s.stage > i;
        const cur = s.stage === i;
        ctx.save();
        ctx.fillStyle = done ? C.green : '#ffffff';
        ctx.strokeStyle = cur ? C.blue : done ? C.green : C.axis;
        ctx.lineWidth = cur ? 3 : 2;
        ctx.beginPath();
        ctx.rect(60 + i * 250, 50, 210, 56);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, STAGES[i].label, 76 + i * 250, 78, done || cur ? '#ffffff' : C.muted, 16);
        if (i < STAGES.length - 1) {
          ctx.save();
          ctx.strokeStyle = done ? C.green : C.axis;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(270 + i * 250, 78);
          ctx.lineTo(310 + i * 250, 78);
          ctx.stroke();
          ctx.restore();
        }
      }
      // 素材卡与题卡随阶段出现
      if (s.stage >= 1) {
        drawPictureCard(ctx, 90, 150, 90, 'clean');
        drawQuestionCard(ctx, 210, 150, 80, 'idle');
      }
      if (s.stage >= 3) {
        for (let i = 0; i < 4; i++) drawQuestionCard(ctx, 380 + i * 90, 150, 76, i < 2 ? 'right' : 'wrong');
      }
      if (s.stage >= 4) {
        drawScoreboard(ctx, 780, 140, 240, 70, 5);
        for (let i = 0; i < 5; i++) {
          const gap = 8;
          const cw = (240 - gap * 6) / 5;
          drawScoreCell(ctx, 780 + gap + i * (cw + gap), 148, cw, true, C.green);
        }
      }
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
    const info = STAGES[Math.min(3, s.stage - 1)];
    setFb({ text: info.info, cls: s.stage >= 4 ? 'good' : '' });
  };
  const reset = () => {
    stateRef.current.stage = 0;
    setStage(0);
    setFb({ text: '按「下一步」看题库是怎么攒出来的。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          步骤 <span className="val">{stage} / 4</span>
        </label>
        <button className="chip" onClick={reset}>
          重来
        </button>
        <button className="chip selected" onClick={next} disabled={stage >= 4}>
          下一步
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod53;
