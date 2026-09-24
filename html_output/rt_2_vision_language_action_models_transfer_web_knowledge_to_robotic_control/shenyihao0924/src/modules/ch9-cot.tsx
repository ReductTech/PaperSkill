import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawOrderCard,
  drawTokenString,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 9.2 「先说计划，再动手」 — P2 step through 指令 -> Plan -> Action.
// Three examples with the paper's Fig.7 strings; the current step column gets
// a pulsing green frame; future columns stay ghosted. The "+几百步微调" badge
// (CoT variant is fine-tuned for a few hundred extra steps) is a DOM label.
const W = 1080;
const H = 280;

type Ex = 'hungry' | 'hammer' | 'odd';

const EXAMPLES: Record<Ex, { chip: string; instr: string; plan: string; action: (string | number)[] }> = {
  hungry: {
    chip: '我饿了',
    instr: '我饿了',
    plan: 'pick rxbar chocolate',
    action: [1, 128, 124, 136, 121, 158, 111, 255],
  },
  hammer: {
    chip: '钉钉子',
    instr: '钉钉子',
    plan: 'Rocks.',
    action: [1, 128, 91, 241, 5, 101, 127],
  },
  odd: {
    chip: '挑不同的',
    instr: '挑不同的',
    plan: 'pick rxbar chocolate',
    action: [1, 128, 91, 241, 5, 101, 127],
  },
};

const EX_ORDER: Ex[] = ['hungry', 'hammer', 'odd'];
const STEP_MAX = 3;

// column frames: [x, y, w, h]
const COLS = [
  { x: 40, y: 72, w: 290, h: 168 },
  { x: 385, y: 72, w: 305, h: 168 },
  { x: 720, y: 72, w: 320, h: 168 },
];
const ARROWS = [
  { x: 358, y: 156 },
  { x: 703, y: 156 },
];

function feedbackFor(ex: Ex, step: number): { text: string; cls: string } {
  const e = EXAMPLES[ex];
  if (step === 1) {
    return { text: `第 1 步·指令：『${e.instr}』——这类指令从没出现在机器人数据里。`, cls: '' };
  }
  if (step === 2) {
    return {
      text: `第 2 步·Plan：先用语言说计划——『${e.plan}』，把看图问答的本事接到机械臂操作上。`,
      cls: '',
    };
  }
  return {
    text: '第 3 步·Action：再吐出动作串。先说话再出手：语言作为中间计划，把两步推理桥接起来——锤子没有？石头也行。',
    cls: 'good',
  };
}

export const Ch9Cot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ example: 'hungry' as Ex, step: 1 });
  const [example, setExample] = useState<Ex>('hungry');
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState(feedbackFor('hungry', 1));

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

    const drawArrow = (x: number, y: number, active: boolean) => {
      ctx.save();
      ctx.strokeStyle = active ? C.green : C.border;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.moveTo(x + 3, y - 7);
      ctx.lineTo(x + 11, y);
      ctx.lineTo(x + 3, y + 7);
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const { example: ex, step: s } = stateRef.current;
      const e = EXAMPLES[ex];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // columns 1..3 vs current step
      COLS.forEach((col, i) => {
        const n = i + 1;
        const isFuture = n > s;
        const isCurrent = n === s;
        ctx.save();
        if (isFuture) ctx.globalAlpha = 0.28;
        // frame
        if (isCurrent) {
          const pulse = 0.55 + 0.45 * Math.abs(Math.sin(ms / 450));
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(col.x, col.y, col.w, col.h, 10);
          ctx.stroke();
          ctx.restore();
        }
        // step number bubble
        const bx = col.x + 22;
        const by = col.y - 16;
        ctx.fillStyle = n <= s ? C.green : C.white;
        ctx.strokeStyle = n <= s ? C.green : C.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = n <= s ? C.white : C.muted;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), bx, by + 1);
        ctx.restore();
      });

      // column 1 content: the instruction order card
      ctx.save();
      if (1 > s) ctx.globalAlpha = 0.28;
      drawOrderCard(ctx, COLS[0].x + COLS[0].w / 2, 156, e.instr);
      ctx.restore();

      // column 2 content: the Plan speech bubble
      ctx.save();
      if (2 > s) ctx.globalAlpha = 0.28;
      const pb = { x: COLS[1].x + 32, y: 122, w: COLS[1].w - 64, h: 66 };
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pb.x, pb.y, pb.w, pb.h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pb.x + 18, pb.y + pb.h);
      ctx.lineTo(pb.x + 8, pb.y + pb.h + 16);
      ctx.lineTo(pb.x + 34, pb.y + pb.h);
      ctx.closePath();
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(pb.x + 18, pb.y + pb.h);
      ctx.lineTo(pb.x + 8, pb.y + pb.h + 16);
      ctx.lineTo(pb.x + 34, pb.y + pb.h);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.font = 'bold 14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.plan, pb.x + pb.w / 2, pb.y + pb.h / 2);
      ctx.restore();

      // column 3 content: the action token string
      ctx.save();
      if (3 > s) ctx.globalAlpha = 0.28;
      const gap = 34;
      const startX = COLS[2].x + COLS[2].w / 2 - ((e.action.length - 1) * gap) / 2;
      drawTokenString(ctx, startX, 156, e.action, gap);
      ctx.restore();

      ARROWS.forEach((a, i) => drawArrow(a.x, a.y, i + 1 < s));

      drawSceneLabel(ctx, '指令→计划→动作', 24, 30, { color: C.text });
      drawLegend(ctx, [['Plan 语言', C.green], ['动作口令', C.purple]], 800, 30);
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

  const goPrev = () => {
    const next = Math.max(1, stateRef.current.step - 1);
    stateRef.current = { ...stateRef.current, step: next };
    setStep(next);
    setFeedback(feedbackFor(stateRef.current.example, next));
  };
  const goNext = () => {
    const next = Math.min(STEP_MAX, stateRef.current.step + 1);
    stateRef.current = { ...stateRef.current, step: next };
    setStep(next);
    setFeedback(feedbackFor(stateRef.current.example, next));
  };
  const reset = () => {
    stateRef.current = { example: 'hungry', step: 1 };
    setExample('hungry');
    setStep(1);
    setFeedback(feedbackFor('hungry', 1));
  };
  const pickExample = (ex: Ex) => {
    stateRef.current = { example: ex, step: 1 };
    setExample(ex);
    setStep(1);
    setFeedback(feedbackFor(ex, 1));
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            padding: '2px 12px',
            background: '#fff',
            border: `1px solid ${C.orange}`,
            borderRadius: 999,
            color: C.orange,
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          +几百步微调
        </span>
      </div>
      <div className="ctrl">
        <span className="step-label">例句</span>
        {EX_ORDER.map((k) => (
          <button
            key={k}
            className={'chip' + (example === k ? ' selected' : '')}
            onClick={() => pickExample(k)}
          >
            {EXAMPLES[k].chip}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="tiny ghost" onClick={goPrev} disabled={step === 1}>
          上一步
        </button>
        <span className="step-label">
          步 <b>{step}</b>/{STEP_MAX}
        </span>
        <button className="tiny" onClick={goNext} disabled={step === STEP_MAX}>
          下一步
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Cot;
