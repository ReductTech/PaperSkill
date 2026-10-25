import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  drawCuePads,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
} from '../lib/consoleKit';

// §6 module 6.1 — step through 0 / 4 / 32 shots and watch the prompt grow.
// One dominant operation: 上一步 / 下一步 / 重置; 下一步 disables at the last step.
const W = 1080;
const H = 280;
const SHOTS = [0, 4, 32];

interface Ch6State {
  step: number;
  decoding: string;
}

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, w, h);
}

export const Ch6Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch6State>({ step: 0, decoding: 'beam' });
  const [step, setStep] = useState(0);
  const [decoding, setDecoding] = useState('beam');
  const [feedback, setFeedback] = useState({
    text: '零样本：提示里没有示例，只给任务格式的说明。',
    cls: '',
  });

  const go = (next: number, nextDecoding: string) => {
    const s = clamp(next, 0, 2);
    stateRef.current.step = s;
    stateRef.current.decoding = nextDecoding;
    setStep(s);
    setDecoding(nextDecoding);
    if (s === 0) {
      setFeedback({
        text: '零样本：论文的做法是放两个「去掉图片」的文本示例，否则输出会被单个示例带偏。',
        cls: '',
      });
    } else if (s === 1) {
      setFeedback({
        text: '4 个示例：提示里已经能看到任务的输入输出格式，模型开始按格式续写。',
        cls: '',
      });
    } else {
      setFeedback({
        text: '32 个示例：在多个基准上已经能超过微调方法，但推理成本随示例数线性上升。',
        cls: 'good',
      });
    }
  };

  const { ref } = useCanvas<Ch6State>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const shots = SHOTS[s.step];
      const promptTokens = shots * 24 + 24;
      const shown = Math.min(shots, 8);

      // promptBar: <BOS> · example groups · query · Answer:
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(40, 34, 1000, 38);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.strokeRect(40, 34, 1000, 38);
      block(ctx, 50, 41, 40, 24, COLORS.muted);
      let x = 100;
      for (let i = 0; i < shown; i += 1) {
        block(ctx, x, 41, 38, 24, COLORS.fader);
        x += 44;
      }
      if (shots > 8) {
        drawLabel(ctx, `+${shots - 8}`, x + 6, 59, { color: COLORS.fader, size: 13 });
        x += 46;
      }
      block(ctx, x + 12, 41, 76, 24, COLORS.route);
      x += 100;
      block(ctx, x + 12, 41, 70, 24, COLORS.good);

      // prompt length meter: longer prompt = higher cost
      drawLevelMeter(ctx, 40, 94, 460, 18, promptTokens / 800, {
        direction: 'down',
        axisMax: 800,
      });

      // padGrid: 8×4 cue pads, lit = shots
      drawCuePads(ctx, 48, 132, 8, 4, Math.min(shots, 32), { total: 32 });

      // answerZone
      if (s.decoding === 'beam') {
        drawSignalPath(ctx, [
          [590, 132],
          [700, 154],
          [856, 178],
        ], { dashed: true });
        drawSignalPath(ctx, [
          [590, 178],
          [700, 178],
          [856, 178],
        ], { active: true });
        drawSignalPath(ctx, [
          [590, 224],
          [700, 202],
          [856, 178],
        ], { dashed: true });
        ctx.beginPath();
        ctx.arc(868, 178, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.good;
        ctx.fill();
      } else {
        const lens = [190, 140, 100, 64];
        for (let k = 0; k < lens.length; k += 1) {
          const yy = 130 + k * 30;
          drawSignalPath(ctx, [
            [590, yy],
            [590 + lens[k], yy],
          ], { active: k === 0 });
          ctx.beginPath();
          ctx.arc(592 + lens[k], yy, 4, 0, Math.PI * 2);
          ctx.fillStyle = k === 0 ? COLORS.good : COLORS.axis;
          ctx.fill();
        }
      }

      drawLabel(ctx, `示例 ${shots}`, 44, 24, { color: COLORS.route, size: 13 });
      drawLabel(ctx, `提示 ${promptTokens}`, 44, 88, { color: COLORS.route, size: 13 });
      drawLegend(ctx, 44, 264, [
        { color: COLORS.fader, text: '示例组' },
        { color: COLORS.route, text: '查询' },
        { color: COLORS.good, text: '答案' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button type="button" className="chip" disabled={step === 0} onClick={() => go(step - 1, decoding)}>
            上一步
          </button>
          <button type="button" className="chip" disabled={step === 2} onClick={() => go(step + 1, decoding)}>
            下一步
          </button>
          <button type="button" className="chip" onClick={() => go(0, decoding)}>
            重置
          </button>
          {step === 2 ? <span className="val">已到最大示例数</span> : null}
        </div>
        <div className="chip-row">
          <button
            type="button"
            className={decoding === 'beam' ? 'chip selected' : 'chip'}
            onClick={() => go(step, 'beam')}
          >
            开放式：束搜索
          </button>
          <button
            type="button"
            className={decoding === 'score' ? 'chip selected' : 'chip'}
            onClick={() => go(step, 'score')}
          >
            封闭式：按似然打分
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
