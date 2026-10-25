import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawSpeechOut,
  drawWaveform,
  drawArm,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.2 module 2.1 — 步进分解 (P2, 4 steps):
// ①接收总指令 → ②高层推理（文字子任务气泡）→ ③低层推理（条件于子任务出动作块，
// 波形+机械臂）→ ④执行完回到②. Left: home + instruction card; middle: blue
// subtask bubbles lighting up (older ones fade but persist); right: waveform + arm.
const W = 1080;
const H = 280;

const STEP_TITLES = ['①接收总指令', '②高层推理', '③低层推理', '④执行完回到②'];
const STEP_DESCS = [
  '①接收总指令："把餐具放进水池"进入模型。',
  '②高层推理：模型输出文字子任务"pick up the plate"——类比链式思考。',
  '③低层推理：条件于子任务，流匹配专家输出动作块。',
  '④执行完毕回到②：下一件餐具，继续先喊单、再动手。',
];
const STEP_FBS = [
  { text: '先读单：总指令只说"要什么结果"，怎么拆是模型自己的事。', cls: '' },
  { text: '子任务是英文短句，和链式思考一样——先想一步，再动手。', cls: '' },
  { text: '动作块是连续控制：低层只管"怎么做"，不管"做什么"。', cls: '' },
  { text: '循环回到②：每一件餐具都重复一遍"喊单→动手"。', cls: '' },
];
const DONE_FB = {
  text: '两级共用同一套权重：拆任务不是外挂的规划器，而是<b>模型自己会写待办清单</b>。',
  cls: 'good',
};
const DONE_DESC = '完成：②→③→④ 循环往复，直到总指令完成。';

export const Ch2Hierarchy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const doneRef = useRef(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const bubble = (x: number, y: number, text: string, alpha: number, bob: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      drawSpeechOut(ctx, x, y + bob, text, { color: C.blue, w: 150 });
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = ms / 1000;
      const st = clamp(stepRef.current, 0, 3);
      const dn = doneRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- LEFT: home scene + 总指令卡 ----
      drawHome(ctx, 34, 128, 128, 78, { familiar: true, tidy01: 0.5 });
      const cardHot = st === 0 && !dn;
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = cardHot ? 3 : 2;
      if (cardHot) ctx.shadowColor = C.blue;
      if (cardHot) ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(28, 32, 172, 44, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, '把餐具放进水池', 114, 54, { color: C.blue, align: 'center' });
      // small arrow from card down to the home
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(114, 80);
      ctx.lineTo(114, 108);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(114, 116);
      ctx.lineTo(108, 104);
      ctx.lineTo(120, 104);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ---- MIDDLE: coach + subtask bubbles ----
      const coachHot = st === 1 && !dn;
      ctx.save();
      ctx.globalAlpha = coachHot ? 1 : 0.45;
      drawCrew(ctx, 250, 252, 1.3, { mode: 'coach', t: ms / 400, color: C.blue });
      ctx.restore();
      // bubble alphas: active=1, recent=0.5, older=0.32, future=hidden
      const b1a = st === 0 && !dn ? 0 : st === 1 ? 1 : st === 2 ? 0.5 : 0.32;
      const b2a = st === 3 || dn ? 1 : 0;
      const bob = Math.sin(t * Math.PI * 2 * 0.8) * 2;
      if (b1a > 0) bubble(450, 74, 'pick up the plate', b1a, st === 1 ? bob : 0);
      if (b2a > 0) bubble(450, 164, 'put plate in sink', b2a, bob);

      // cycle arrow (step ④ / done): back from execution to ②
      if (st === 3 || dn) {
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 1.5));
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([9, 7]);
        ctx.lineDashOffset = -(ms / 28) % 16;
        ctx.beginPath();
        ctx.moveTo(1050, 148);
        ctx.quadraticCurveTo(1050, 22, 500, 22);
        ctx.quadraticCurveTo(438, 22, 432, 50);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(432, 60);
        ctx.lineTo(425, 46);
        ctx.lineTo(439, 46);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ---- RIGHT: action waveform + arm + worker ----
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(648, 58, 404, 84, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, '动作块', 656, 48, { color: C.purple });
      const wfActive = st >= 2 || dn;
      const pts: number[] = [];
      for (let i = 0; i < 48; i++) {
        pts.push(
          wfActive
            ? Math.sin(i * 0.5 + t * 6) * 0.45 + Math.sin(i * 1.7 + t * 9) * 0.25
            : Math.sin(i * 0.35 + t * 1.2) * 0.06
        );
      }
      drawWaveform(ctx, 660, 70, 380, 60, pts, C.purple, { dashed: !wfActive });
      const armA = wfActive ? 0.25 + 0.32 * Math.sin(t * Math.PI * 2 * 0.8) : 0.25;
      const grip = wfActive ? 0.55 + 0.45 * Math.sin(t * Math.PI * 2 * 0.8 + 1) : 0.8;
      drawArm(ctx, 880, 210, { scale: 1.7, angle: armA, grip, color: C.purple });
      ctx.save();
      ctx.globalAlpha = wfActive ? 1 : 0.4;
      drawCrew(ctx, 748, 252, 1.3, { mode: 'work', t: ms / 280, color: C.green });
      ctx.restore();

      drawLegend(ctx, [['高层=文字子任务', C.blue], ['低层=动作块', C.purple]], 28, 268);
      if (dn) drawVerdict(ctx, 1038, 252, true, { pulse: t * 1.2 });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onNext = () => {
    if (stepRef.current < 3) {
      stepRef.current = Math.min(3, stepRef.current + 1);
      setStep(stepRef.current);
      doneRef.current = false;
      setDone(false);
    } else {
      doneRef.current = true;
      setDone(true);
    }
  };
  const onPrev = () => {
    doneRef.current = false;
    setDone(false);
    if (stepRef.current > 0) {
      stepRef.current = Math.max(0, stepRef.current - 1);
      setStep(stepRef.current);
    }
  };

  const safeStep = clamp(step, 0, 3);
  const fb = done ? DONE_FB : STEP_FBS[safeStep];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="step-ctrl">
          <button className="tiny ghost" onClick={onPrev} disabled={step === 0 && !done}>
            上一步
          </button>
          <span className="step-label">
            步骤 <b>{done ? 4 : safeStep + 1}</b>/4 · {STEP_TITLES[safeStep]}
          </span>
          <button className="tiny" onClick={onNext}>
            {safeStep >= 3 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
      <div className="step-desc">{done ? DONE_DESC : STEP_DESCS[safeStep]}</div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default Ch2Hierarchy;
