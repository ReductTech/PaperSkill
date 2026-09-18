import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 2.1: the learner picks an action (left / straight / right); dashed previews
// show where each action would lead. Choosing well requires predicting the outcome.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'The objective is to learn a racing policy that drives the Mini Wheelbot around a fixed track, shown in Figure 1, as fast as possible.',
    zh: '学习目标：一个<b>尽快绕赛道行驶</b>的竞速策略——「学会」的含义就是学会选动作。',
    locator: '§III Task · p.2',
    highlights: ['learn a racing policy', 'as fast as possible'],
  },
  {
    en: 'The racing agent directly commands the motor torques.',
    zh: '竞速智能体<b>直接输出电机力矩</b>——这就是它每一步要做的「动作选择」。',
    locator: '§III Task · p.2',
    highlights: ['directly commands the motor torques'],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function kart(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  rr(ctx, -11, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.fillRect(-8, -9, 5, 3);
  ctx.fillRect(3, -9, 5, 3);
  ctx.fillRect(-8, 6, 5, 3);
  ctx.fillRect(3, 6, 5, 3);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(2, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 16, y - 16);
  ctx.lineTo(x, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface Pose {
  x: number;
  y: number;
  h: number;
}

const START: Pose = { x: 110, y: 200, h: -0.42 };
const GOAL = { x: 900, y: 84 };
const STEP_LEN = 112;
const TURNS = [-0.32, 0, 0.32];
const ACTIONS = ['左转', '直行', '右转'];
const MAX_STEPS = 8;

function move(p: Pose, turn: number): Pose {
  const h = p.h + turn;
  return { x: p.x + Math.cos(h) * STEP_LEN, y: p.y + Math.sin(h) * STEP_LEN, h };
}

export const Ch2LearnWhat: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ pose: Pose; steps: number; done: boolean; trail: Pose[] }>({
    pose: START,
    steps: 0,
    done: false,
    trail: [START],
  });
  const [steps, setSteps] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '点击一个动作：虚线预览模型对「这一步会去哪」的预测——选能靠近终点旗的。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // wide driving area + gentle lane
      ctx.strokeStyle = C.track;
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(60, 210);
      ctx.quadraticCurveTo(560, 190, 960, 70);
      ctx.stroke();
      ctx.lineCap = 'butt';

      // trail of taken steps
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      s.trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // goal flag
      flag(ctx, GOAL.x, GOAL.y + 20, C.green);

      // previews for the three actions (the prediction the learner must use)
      if (!s.done) {
        for (let i = 0; i < 3; i++) {
          const nxt = move(s.pose, TURNS[i]);
          const color = i === 0 ? C.purple : i === 1 ? C.blue : C.orange;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(s.pose.x, s.pose.y);
          ctx.lineTo(nxt.x, nxt.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(nxt.x, nxt.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      kart(ctx, s.pose.x, s.pose.y, s.pose.h, s.done ? C.green : C.ink);

      // step counter board
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 40, 30, 150, 44, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = s.done ? C.green : C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('步数 ' + s.steps + ' / ' + MAX_STEPS, 58, 58);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const act = (i: number) => {
    const s = stateRef.current;
    if (s.done || s.steps >= MAX_STEPS) return;
    const nxt = move(s.pose, TURNS[i]);
    s.pose = nxt;
    s.steps += 1;
    s.trail = [...s.trail, nxt];
    setSteps(s.steps);
    const dist = Math.hypot(nxt.x - GOAL.x, nxt.y - GOAL.y);
    if (dist < 80) {
      s.done = true;
      setFeedback({
        text: '到达终点旗！你刚刚做的正是「预测 → 选动作」的循环：先看每个动作通向哪里，再选最优的。',
        cls: 'good',
      });
    } else if (s.steps >= MAX_STEPS) {
      setFeedback({
        text: '步数用完了。只凭直觉乱选很难到达目标——要选好动作，先得预测每个动作的后果。',
        cls: 'bad',
      });
    } else {
      setFeedback({ text: '位置已更新：再选一个动作——每一步的好坏，取决于它把你带到哪里。', cls: '' });
    }
  };

  const reset = () => {
    stateRef.current = { pose: START, steps: 0, done: false, trail: [START] };
    setSteps(0);
    setFeedback({ text: '重新开始：这次先看虚线预览，再选动作。', cls: '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="chip-row">
          {ACTIONS.map((a, i) => (
            <button
              key={a}
              className="chip"
              onClick={() => act(i)}
              style={{ borderLeft: `4px solid ${i === 0 ? C.purple : i === 1 ? C.blue : C.orange}` }}
            >
              {a}
            </button>
          ))}
          <button className="chip" onClick={reset}>
            重置
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch2LearnWhat;
