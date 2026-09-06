import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 286;

const STEPS = [
  { name: '一张平纸', check: '先检查纸张当前状态：没有折痕，唯一可执行的是第一步中线对折。' },
  { name: '沿中线对折', check: '纸张已变成三角形，下一步只能基于当前三角形操作两个前角。' },
  { name: '折起两个前角', check: '机头雏形出现，下一步应继续压实机头，而不是展开机翼。' },
  { name: '再次对折机头', check: '机身已经收窄，现在才具备展开机翼的前提。' },
  { name: '展开机翼', check: '全部步骤完成：动作顺序正确，纸飞机可以起飞。' },
];

const OPTIONS = [
  ['先展开机翼', '沿中线对折', '直接折机头'],
  ['再次纵向对折', '直接展开机翼', '把两个前角折向中线'],
  ['把机头再向前对折', '把机尾向后折', '把机翼向下折'],
  ['把机翼向上折', '展开两侧机翼', '再折一次机头'],
];
const CORRECT = [1, 2, 0, 1];

function drawShape(ctx: CanvasRenderingContext2D, step: number, t: number, wrong: boolean, done: boolean): void {
  const cx = W / 2;
  const cy = H / 2 + 14;
  ctx.save();
  if (wrong) ctx.translate(Math.sin(t * 42) * 6, 0);
  if (step === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 70, cy - 70, 140, 140);
    ctx.strokeRect(cx - 70, cy - 70, 140, 140);
    ctx.strokeStyle = C.orange;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx, cy + 70); ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '平纸', cx, cy + 90, 11, C.blue);
  } else if (step === 1) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 80, cy + 62); ctx.lineTo(cx, cy - 78); ctx.lineTo(cx + 80, cy + 62); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath(); ctx.moveTo(cx, cy - 78); ctx.lineTo(cx, cy + 62); ctx.stroke();
    label(ctx, '三角形', cx, cy + 84, 11, C.blue);
  } else if (step === 2) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 80, cy + 62); ctx.lineTo(cx - 36, cy - 22); ctx.lineTo(cx, cy - 78); ctx.lineTo(cx + 36, cy - 22); ctx.lineTo(cx + 80, cy + 62); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath(); ctx.moveTo(cx, cy - 78); ctx.lineTo(cx, cy + 62); ctx.stroke();
    label(ctx, '机头雏形', cx, cy + 84, 11, C.orange);
  } else if (step === 3) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 46, cy + 62); ctx.lineTo(cx, cy - 84); ctx.lineTo(cx + 46, cy + 62); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath(); ctx.moveTo(cx, cy - 84); ctx.lineTo(cx, cy + 62); ctx.stroke();
    label(ctx, '机头压实', cx, cy + 84, 11, C.orange);
  } else {
    // finished paper plane: side view with two wings and motion trails
    const glide = done ? Math.sin(t * 2.6) * 8 : 0;
    ctx.save();
    ctx.translate(0, glide);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 82, cy + 26);
    ctx.lineTo(cx, cy - 64);
    ctx.lineTo(cx + 82, cy + 26);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    // wings
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 6);
    ctx.lineTo(cx + 34, cy + 6);
    ctx.lineTo(cx + 54, cy + 34);
    ctx.lineTo(cx - 44, cy + 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // nose highlight
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 6);
    ctx.lineTo(cx, cy - 64);
    ctx.lineTo(cx + 30, cy + 6);
    ctx.stroke();
    if (done) {
      ctx.strokeStyle = 'rgba(34,141,92,0.45)';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx - 92 - i * 12, cy + 12 - i * 6);
        ctx.lineTo(cx - 62 - i * 8, cy + 12 - i * 6);
        ctx.stroke();
      }
    }
    ctx.restore();
    label(ctx, '纸飞机完成', cx, cy + 92, 11, C.green);
  }
  ctx.restore();
  if (wrong) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    label(ctx, '这一步在当前状态下不可执行', W / 2, 42, 12, C.red);
  }
}

export const OrigamiPlanner: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const wrongTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [feedback, setFeedback] = useState({ text: '当前是一张平纸。请选择第一个可执行动作。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { step: number }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      drawShape(ctx, s.step, performance.now() / 1000, wrongFlash, s.step >= 4);
      label(ctx, `步骤 ${Math.min(s.step + 1, 5)} / 5 · ${STEPS[s.step].name}`, W / 2, 20, 12, s.step >= 4 ? C.green : C.blue);
      label(ctx, '规划器：每步先读当前状态，再选下一步', W / 2, H - 14, 11, C.muted);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => { render(stateRef.current); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [wrongFlash]);

  useEffect(() => () => { if (wrongTimer.current) window.clearTimeout(wrongTimer.current); }, []);

  const choose = (i: number) => {
    if (step >= STEPS.length - 1) return;
    if (i === CORRECT[step]) {
      const next = step + 1;
      stateRef.current.step = next;
      setStep(next);
      setWrongFlash(false);
      setFeedback({ text: `正确：${STEPS[next].check}`, cls: next >= 4 ? 'good' : '' });
    } else {
      setWrongFlash(true);
      if (wrongTimer.current) window.clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setWrongFlash(false), 1200);
      setFeedback({ text: `错误：${OPTIONS[step][i]} 与当前纸张状态不匹配。${STEPS[step].check}`, cls: 'bad' });
    }
  };

  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
    setWrongFlash(false);
    setFeedback({ text: '已展开纸张重新开始。每一步都要先看状态，再选动作。', cls: '' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      {step < 4 ? (
        <>
          <div className="chip-row origami-options">
            {OPTIONS[step].map((opt, i) => (
              <button key={opt} className="chip" onClick={() => choose(i)}>{opt}</button>
            ))}
          </div>
          <div className="origami-steps" aria-label="步骤进度">
            {STEPS.slice(0, 4).map((_, i) => (
              <span key={i} className={i < step ? 'done' : i === step ? 'active' : ''}>{i + 1}</span>
            ))}
          </div>
        </>
      ) : (
        <div className="ctrl">
          <span className="val">纸飞机完成，可以起飞 ✈️</span>
          <button className="chip" onClick={reset}>重新折一次</button>
        </div>
      )}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default OrigamiPlanner;
