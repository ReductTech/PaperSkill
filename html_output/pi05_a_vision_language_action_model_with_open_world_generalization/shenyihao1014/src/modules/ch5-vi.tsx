import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawSpeechOut,
  drawSceneLabel,
  drawValueChip,
  drawCheckMark,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch5 module 5.1 — VI 语言示范 (P2 step-through). The expert only speaks:
// each step fires one verbal command; the robot executes it (the home gets
// one notch tidier) and the command is copied into the model's ℓ̂ label
// history on the right. 1080x280.
const W = 1080;
const H = 280;
const N = 4;
const CMDS = ['捡起蓝衬衫', '放进洗衣篮', '擦桌面', '整理床铺'];
const TIDY = [0.12, 0.34, 0.58, 0.8, 0.95];

interface Fb {
  text: string;
  cls: string;
}

const FEEDBACK: Fb[] = [
  {
    text: '按「下一步」——听专家怎么只用一张嘴，把整间卧室的活派完。',
    cls: '',
  },
  {
    text: '第 1 句口令：专家不碰操纵杆，机器人自己捡起蓝衬衫——这句口令随即抄录为一条 ℓ̂ 标签。',
    cls: '',
  },
  {
    text: '第 2 句：口令与执行配对，模型学到「捡起之后，该放进洗衣篮」——教的是顺序，不是手法。',
    cls: '',
  },
  {
    text: '第 3 句：换到擦桌面也不乱——低层动作它早就会了，VI 补的是「下一句该说什么」。',
    cls: '',
  },
  {
    text: 'VI 本质是<b>教模型说正确的下一句</b>——不是教动手（低层已会），是教拆单。后面 Fig 13 消融：删掉 VI 显著掉分。',
    cls: 'good',
  },
];

export const Ch5Vi: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Fb>(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const s = stateRef.current.step;
      const tidy = TIDY[Math.max(0, Math.min(TIDY.length - 1, s))];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // ---- left: the live demonstration ----
      drawSceneLabel(ctx, 'VI 示范现场', 24, 22, { color: C.blue });

      // overall instruction card (ℓ)
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(24, 36, 232, 46, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('总指令 ℓ', 38, 50);
      ctx.fillStyle = C.text;
      ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('收拾这间卧室', 38, 70);
      ctx.restore();

      // expert: mouth only (megaphone coach)
      drawCrew(ctx, 150, 234, 1.5, { mode: 'coach', t: ms / 400, color: C.blue });

      // current command bubble
      const ci = Math.max(0, s - 1);
      if (s >= 1) {
        drawSpeechOut(ctx, 296, 96, CMDS[ci], { color: C.blue });
        // dashed copy arrow: bubble -> newest ℓ̂ chip
        const chipY = 60 + Math.max(0, s - 1) * 42 + 15;
        ctx.save();
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(348, 96);
        ctx.lineTo(588, chipY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(596, chipY);
        ctx.lineTo(584, chipY - 6);
        ctx.lineTo(584, chipY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // the room being tidied, one notch per command
      drawHome(ctx, 360, 108, 250, 138, { familiar: false, tidy01: tidy });
      // robot doing the low-level work (it already knows how)
      drawCrew(ctx, 648, 236, 1.3, { mode: 'work', t: ms / 300, color: C.green });

      // ---- right: what the model learns (ℓ̂ label history) ----
      drawSceneLabel(ctx, '模型学到的 ℓ̂', 616, 22, { color: C.blue });
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(600, 36, 456, 204, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < s; i++) {
        const text = CMDS[Math.max(0, Math.min(CMDS.length - 1, i))];
        const y = 60 + i * 42;
        const bw = text.length * 13 + 26;
        ctx.save();
        ctx.globalAlpha = i === s - 1 ? 1 : 0.72;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.roundRect(630, y, bw, 30, 8);
        ctx.fill();
        if (i === s - 1) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(630, y, bw, 30, 8);
          ctx.stroke();
        }
        ctx.fillStyle = C.white;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 643, y + 16);
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${i + 1}`, 620, y + 16);
        ctx.restore();
      }
      if (s >= N) {
        drawCheckMark(ctx, 1032, 52, 11);
      }

      // bare-number progress chip
      drawValueChip(ctx, 1044, 22, `${s}/${N}`, C.blue);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const s = Math.max(0, Math.min(N, next));
    stateRef.current.step = s;
    setStep(s);
    setFeedback(FEEDBACK[Math.max(0, Math.min(FEEDBACK.length - 1, s))]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-label">
          口令 <b>{step}/{N}</b>
        </span>
        <button type="button" className="tiny ghost" onClick={() => go(step - 1)} disabled={step <= 0}>
          上一步
        </button>
        <button type="button" className="tiny" onClick={() => go(step + 1)} disabled={step >= N}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch5Vi;
