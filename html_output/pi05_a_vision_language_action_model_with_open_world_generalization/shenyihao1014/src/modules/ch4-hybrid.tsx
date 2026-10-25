import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawWaveform,
  drawVerdict,
  drawCrossMark,
  drawValueChip,
  drawSceneLabel,
  drawLegend,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.4 module 4.1 — 两段式混合训练 (P2, 6 steps + done).
// TOP track: FAST scroll of purple discrete token cells (fills during the
// pre-train steps; becomes the blue autoregressive subtask stream at
// inference). BOTTOM track: flow-matching hand — purple waveform + 10 denoise
// step dots that light up in the post-train steps. Current step highlighted.
const W = 1080;
const H = 280;
const TOP = { x: 130, y: 26, w: 900, h: 84 };
const BOT = { x: 130, y: 178, w: 900, h: 84 };

const STEP_TITLES = ['①预训练', '②FAST 卷轴', '③后训练开始', '④联合损失', '⑤推理子任务', '⑥10 步去噪'];
const STEP_DESCS = [
  '①预训练阶段：全部任务（含动作）都是离散 token，标准下一词预测（α=0，280k 步，简单可扩展）。',
  '②FAST 卷轴：动作块压成少量高信息 token。',
  '③后训练开始：加随机初始化的动作专家（流匹配）。',
  '④联合损失：文本交叉熵 + α=10.0·流匹配（两种动作表示互不注意）。',
  '⑤推理：自回归出子任务。',
  '⑥10 步去噪条件于子任务出动作块。',
];
const STEP_FBS = [
  { text: '学得快：离散 token + 下一词预测，280k 步简单可扩展。', cls: '' },
  { text: 'FAST 把动作块压成少量高信息 token——卷轴越短，学得越快。', cls: '' },
  { text: '80k 步后训练：新专家从随机初始化学起，专管连续动作。', cls: '' },
  { text: '一套损失两头吃：文本交叉熵 + α=10.0·流匹配；两种动作表示互不注意。', cls: '' },
  { text: '推理第一跳：像写句子一样，自回归地写出子任务。', cls: '' },
  { text: '推理第二跳：条件于子任务，10 步去噪输出动作块。', cls: '' },
];
const DONE_FB = {
  text: '训练吃离散的快、推理吃连续的稳——这就是 <b>π0.5 的两段式混合训练</b>。',
  cls: 'good',
};
const DONE_DESC = '完成：预训练吃 FAST 离散 token，后训练加流匹配专家，推理两跳收工。';

export const Ch4Hybrid: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const noisePts = (ph: number) => {
      const a: number[] = [];
      for (let i = 0; i < 60; i++) a.push(Math.sin(i * 1.9 + ph * 7) * 0.42 + Math.sin(i * 3.7 + ph * 11) * 0.3);
      return a;
    };
    const smoothPts = (ph: number) => {
      const a: number[] = [];
      for (let i = 0; i < 60; i++) a.push(Math.sin(i * 0.32 + ph * 2) * 0.5);
      return a;
    };

    const render = (ms: number) => {
      const t = ms / 1000;
      const st = clamp(stepRef.current, 0, 5);
      const dn = doneRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- track panels + labels ----
      const topActive = dn || st === 0 || st === 1 || st === 4;
      const botActive = dn || st === 2 || st === 3 || st === 5;
      const panel = (p: { x: number; y: number; w: number; h: number }, active: boolean) => {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.strokeStyle = active ? C.orange : C.border;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      panel(TOP, topActive);
      panel(BOT, botActive);
      drawSceneLabel(ctx, 'FAST 离散', 16, 64, { color: C.purple });
      drawSceneLabel(ctx, '流匹配', 16, 216, { color: C.green });
      drawLegend(ctx, [['离散 token', C.purple], ['去噪→动作块', C.green]], 16, 144);

      // ---- TOP track ----
      const innerL = TOP.x + 36;
      if (st === 0 && !dn) {
        // pre-training: all discrete tokens, next-token prediction fills the scroll
        const prog = (ms % 1400) / 1400;
        const litN = Math.max(0, Math.min(24, Math.floor(prog * 24) + 1));
        for (let i = 0; i < 24; i++) {
          const on = i < litN;
          const x = innerL + i * 32.5;
          ctx.fillStyle = on ? C.purple : 'rgba(124,58,237,0.12)';
          ctx.strokeStyle = on ? C.purple : 'rgba(124,58,237,0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, TOP.y + 22, 27, TOP.h - 44, 4);
          ctx.fill();
          ctx.stroke();
        }
        drawValueChip(ctx, 190, 14, 'α=0', C.blue);
        drawValueChip(ctx, 262, 14, '280k', C.blue);
      } else if (st === 1 && !dn) {
        // FAST scroll: many cells compress into a few high-info tokens
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 10; i++) {
          const x = innerL + i * 34;
          ctx.fillStyle = C.purple;
          ctx.beginPath();
          ctx.roundRect(x, TOP.y + 22, 27, TOP.h - 44, 4);
          ctx.fill();
        }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(innerL + 356, TOP.y + TOP.h / 2);
        ctx.lineTo(innerL + 396, TOP.y + TOP.h / 2);
        ctx.stroke();
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(innerL + 410, TOP.y + TOP.h / 2);
        ctx.lineTo(innerL + 394, TOP.y + TOP.h / 2 - 8);
        ctx.lineTo(innerL + 394, TOP.y + TOP.h / 2 + 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI * 2 * 0.9);
        for (let i = 0; i < 4; i++) {
          const x = innerL + 430 + i * 104;
          ctx.save();
          ctx.globalAlpha = i === 3 ? pulse : 1;
          ctx.fillStyle = C.purple;
          ctx.strokeStyle = C.deep;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, TOP.y + 16, 84, TOP.h - 32, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = C.white;
          ctx.beginPath();
          ctx.arc(x + 42, TOP.y + TOP.h / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (st === 2 || st === 3) {
        // post-train: the frozen FAST scroll dims out
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 24; i++) {
          const x = innerL + i * 32.5;
          ctx.fillStyle = C.purple;
          ctx.beginPath();
          ctx.roundRect(x, TOP.y + 22, 27, TOP.h - 44, 4);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // st 4/5 + done: autoregressive subtask stream (blue cells fill in order)
        const animated = st === 4 || dn;
        const prog = (ms % 1800) / 1800;
        const litN = animated ? Math.max(0, Math.min(8, Math.floor(prog * 8) + 1)) : 8;
        const baseAlpha = st === 5 ? 0.4 : 1;
        for (let i = 0; i < 8; i++) {
          const on = i < litN;
          const x = innerL + 10 + i * 104;
          ctx.save();
          ctx.globalAlpha = baseAlpha;
          ctx.fillStyle = on ? C.blue : 'rgba(39,68,110,0.1)';
          ctx.strokeStyle = on ? C.blue : 'rgba(39,68,110,0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, TOP.y + 16, 88, TOP.h - 32, 8);
          ctx.fill();
          ctx.stroke();
          if (on) {
            ctx.fillStyle = C.white;
            ctx.beginPath();
            ctx.arc(x + 44, TOP.y + TOP.h / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          // chain arrow to the next cell (autoregression)
          if (animated && on && i < 7) {
            ctx.strokeStyle = C.blue;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 90, TOP.y + TOP.h / 2);
            ctx.lineTo(x + 101, TOP.y + TOP.h / 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // ---- BOTTOM track ----
      if (st <= 1 && !dn) {
        // not yet in post-training: dashed placeholder
        ctx.save();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.roundRect(BOT.x + 24, BOT.y + 16, BOT.w - 48, BOT.h - 32, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        // waveform (flow-matching expert output)
        let pts: number[] = noisePts(t);
        let wfAlpha = 1;
        let dashed = false;
        if (st === 4) {
          wfAlpha = 0.35;
          dashed = true;
        } else if (st === 5 || dn) {
          const prog = clamp((ms % 2000) / 2000, 0, 1);
          const sm = smoothPts(t);
          const nz = noisePts(t);
          pts = nz.map((v, i) => v + (sm[i] - v) * (dn ? 1 : prog));
        }
        ctx.save();
        ctx.globalAlpha = wfAlpha;
        drawWaveform(ctx, 250, 196, 710, 34, pts, C.purple, { dashed });
        ctx.restore();
        // action expert crew (added at post-train, randomly initialized)
        ctx.save();
        ctx.globalAlpha = st === 4 ? 0.4 : 1;
        drawCrew(ctx, 196, 254, 1.45, { mode: 'work', t: ms / 300, color: C.purple });
        ctx.restore();
        if (st === 2 && !dn) {
          ctx.save();
          ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 1.2));
          ctx.fillStyle = C.purple;
          ctx.font = 'bold 18px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', 230, 200);
          ctx.restore();
          drawValueChip(ctx, 330, 166, '80k', C.green);
        }
        // 10 denoise step dots
        const dotProg = clamp((ms % 2000) / 2000, 0, 1);
        const litDots =
          st === 5 && !dn
            ? Math.max(0, Math.min(10, Math.ceil(dotProg * 10)))
            : dn
            ? 10
            : 0;
        for (let i = 0; i < 10; i++) {
          const x = 250 + i * 80;
          const y = 246;
          const on = i < litDots;
          const r = on && dn ? 7 + Math.sin(t * Math.PI * 2 + i * 0.6) * 1.2 : 7;
          ctx.save();
          ctx.fillStyle = on ? C.green : C.white;
          ctx.strokeStyle = on ? C.green : C.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        if (st === 5 && !dn) drawValueChip(ctx, 990, 226, '10 步', C.green);
      }

      // ---- middle zone: joint loss (step ④) ----
      if (st === 3 && !dn) {
        drawValueChip(ctx, 320, 144, 'H', C.blue);
        drawValueChip(ctx, 420, 144, 'α=10.0', C.green);
        // the two action representations do not attend to each other
        ctx.save();
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(760, 116);
        ctx.lineTo(760, 130);
        ctx.moveTo(760, 158);
        ctx.lineTo(760, 172);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(754, 126);
        ctx.lineTo(760, 114);
        ctx.lineTo(766, 126);
        ctx.closePath();
        ctx.fillStyle = C.muted;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(754, 162);
        ctx.lineTo(760, 174);
        ctx.lineTo(766, 162);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        drawCrossMark(ctx, 760, 144, 11);
      }

      if (dn) drawVerdict(ctx, 1046, 66, true, { pulse: t * 1.2 });

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
    if (stepRef.current < 5) {
      stepRef.current = Math.min(5, stepRef.current + 1);
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

  const safeStep = clamp(step, 0, 5);
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
            步骤 <b>{done ? 6 : safeStep + 1}</b>/6 · {STEP_TITLES[safeStep]}
          </span>
          <button className="tiny" onClick={onNext}>
            {safeStep >= 5 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
      <div className="step-desc">{done ? DONE_DESC : STEP_DESCS[safeStep]}</div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default Ch4Hybrid;
