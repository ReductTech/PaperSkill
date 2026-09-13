import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chapter 10 module 10.1 — 验证过的数据赛跑 (P8 race + task chips).
// Three horizontal progress bars start from a shared baseline 0 and run to the real R-Bench
// scores (1.8 s eased, 0.1 s phase stagger per method). Task chips switch to the MCQ / VQA /
// CAP views, where every method shows three small low/mid/high segments of exact Table 1
// values. Bare number labels sit at the bar ends; the winning Robust-U1 bar carries a small
// trophy once the race is done. An evidence table (DOM) repeats the selected task's values.

const W = 1080;
const H = 280;

type Task = 'overall' | 'mcq' | 'vqa' | 'cap';
type TaskKey = Exclude<Task, 'overall'>;

interface MethodDef {
  name: string;
  color: string;
}

const METHODS: MethodDef[] = [
  { name: 'BAGEL', color: '#27446e' },
  { name: 'Robust-R1', color: '#76906a' },
  { name: 'Robust-U1', color: '#228d5c' },
];

const OVERALL = [0.577, 0.5017, 0.7398];

/** Table 1 exact values, per method order (BAGEL / Robust-R1 / Robust-U1), low → mid → high. */
const TASK_VALUES: Record<TaskKey, number[][]> = {
  mcq: [
    [0.7176, 0.6584, 0.5793],
    [0.6529, 0.6391, 0.6097],
    [0.7353, 0.7329, 0.6768],
  ],
  vqa: [
    [0.6497, 0.6127, 0.615],
    [0.4914, 0.4909, 0.498],
    [0.7067, 0.7164, 0.6934],
  ],
  cap: [
    [0.4685, 0.4633, 0.4288],
    [0.4068, 0.3781, 0.3484],
    [0.8272, 0.8059, 0.764],
  ],
};

const SEVERITY_LABELS = ['低强度', '中强度', '高强度'];
const TASK_LABELS: Array<{ id: Task; label: string }> = [
  { id: 'overall', label: '总体' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'vqa', label: 'VQA' },
  { id: 'cap', label: 'CAP' },
];

const IDLE_FEEDBACK = '按下开始对比，用真实数据看差距';

const LANE_Y = [72, 134, 196];
const BAR_H = 30;
const BASE_X = 60;
const OVERALL_W = 860;
const SLOT_W = 300;
const SEG_MAX = 200;
const SEG_MIN = 0.3;
const SEG_RANGE = 0.55;
const RACE_MS = 1800;
const STAGGER_MS = 100;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<[string, string]>,
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  let cx = x;
  items.slice(0, 3).forEach((item) => {
    ctx.fillStyle = item[0];
    ctx.fillRect(cx, y - 6, 12, 12);
    ctx.fillStyle = '#68778f';
    ctx.fillText(item[1], cx + 18, y);
    cx += 18 + ctx.measureText(item[1]).width + 22;
  });
  ctx.restore();
}

/** Small trophy mark — only drawn at the end of the verified-winning Robust-U1 bar. */
function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x - 9, y - 7, 4, Math.PI * 0.55, Math.PI * 1.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 9, y - 7, 4, -Math.PI * 0.55, Math.PI * 0.45);
  ctx.stroke();
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 12);
  ctx.lineTo(x + 9, y - 12);
  ctx.lineTo(x + 6, y - 2);
  ctx.quadraticCurveTo(x, y + 3, x - 6, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 2, y + 3, 4, 6);
  ctx.fillRect(x - 8, y + 9, 16, 4);
  ctx.restore();
}

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<Task>('overall');
  const runningRef = useRef(false);
  const doneRef = useRef(false);
  const startRef = useRef(0);
  const progressRef = useRef<number[]>([0, 0, 0]);
  const [task, setTask] = useState<Task>('overall');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({ text: IDLE_FEEDBACK, cls: '' });

  useEffect(() => {
    if (!done) return;
    if (task === 'overall') {
      setFeedback({
        text: 'Robust-U1 总分 0.7398，比 BAGEL（0.5770）高约 0.16，比 Robust-R1（0.5017）高约 0.24',
        cls: 'good',
      });
    } else if (task === 'mcq') {
      setFeedback({
        text: 'MCQ 任务：Robust-U1 0.7353/0.7329/0.6768，三个强度全部最高',
        cls: 'good',
      });
    } else if (task === 'vqa') {
      setFeedback({ text: 'VQA 任务：Robust-U1 三个强度全面领先', cls: 'good' });
    } else {
      setFeedback({
        text: 'CAP 任务：Robust-U1 优势最大（0.8272/0.8059/0.7640）',
        cls: 'good',
      });
    }
  }, [done, task]);

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
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawLegend(
        ctx,
        METHODS.map((m): [string, string] => [m.color, m.name]),
        BASE_X,
        24
      );

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(BASE_X, 62);
      ctx.lineTo(BASE_X, 234);
      ctx.stroke();

      const current = taskRef.current;
      METHODS.forEach((m, i) => {
        const laneY = LANE_Y[i];
        const p = progressRef.current[i];

        if (current === 'overall') {
          const value = OVERALL[i];
          const len = value * OVERALL_W * p;

          roundRectPath(ctx, BASE_X, laneY, OVERALL_W, BAR_H, 8);
          ctx.fillStyle = '#eef2e9';
          ctx.fill();

          if (len > 0.5) {
            roundRectPath(ctx, BASE_X, laneY, len, BAR_H, 8);
            ctx.fillStyle = m.color;
            ctx.fill();
          }

          if (p > 0.02) {
            const label = (value * p).toFixed(4);
            ctx.font = '14px "Segoe UI", sans-serif';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#21324a';
            ctx.fillText(label, BASE_X + len + 10, laneY + BAR_H / 2 + 5);
            if (i === 2 && doneRef.current) {
              drawTrophy(
                ctx,
                BASE_X + len + 10 + ctx.measureText(label).width + 16,
                laneY + BAR_H / 2
              );
            }
          }
        } else {
          const values = TASK_VALUES[current][i];
          values.forEach((value, j) => {
            const slotX = BASE_X + j * SLOT_W;
            const norm = clamp((value - SEG_MIN) / SEG_RANGE, 0, 1);
            const len = norm * SEG_MAX * p;

            roundRectPath(ctx, slotX, laneY, SEG_MAX, BAR_H, 8);
            ctx.fillStyle = '#eef2e9';
            ctx.fill();

            if (len > 0.5) {
              roundRectPath(ctx, slotX, laneY, len, BAR_H, 8);
              ctx.fillStyle = m.color;
              ctx.globalAlpha = 1 - j * 0.22;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            if (p > 0.02) {
              const label = (value * p).toFixed(4);
              const labelX = slotX + len + 8;
              ctx.font = '13px "Segoe UI", sans-serif';
              ctx.textBaseline = 'alphabetic';
              ctx.fillStyle = '#21324a';
              ctx.fillText(label, labelX, laneY + BAR_H / 2 + 5);
              if (i === 2 && j === 2 && doneRef.current) {
                drawTrophy(ctx, labelX + ctx.measureText(label).width + 16, laneY + BAR_H / 2);
              }
            }
          });
        }
      });
    };

    const tick = (now: number) => {
      if (runningRef.current) {
        let allDone = true;
        for (let i = 0; i < METHODS.length; i++) {
          const p = easeInOutQuad(
            clamp((now - startRef.current - i * STAGGER_MS) / RACE_MS, 0, 1)
          );
          progressRef.current[i] = p;
          if (p < 1) allDone = false;
        }
        if (allDone) {
          runningRef.current = false;
          if (!doneRef.current) {
            doneRef.current = true;
            setRunning(false);
            setDone(true);
          }
        }
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startRace = () => {
    startRef.current = performance.now();
    progressRef.current = [0, 0, 0];
    runningRef.current = true;
    doneRef.current = false;
    setRunning(true);
    setDone(false);
    setFeedback({ text: '赛跑中…', cls: '' });
  };

  const pickTask = (next: Task) => {
    taskRef.current = next;
    setTask(next);
    progressRef.current = [0, 0, 0];
    runningRef.current = false;
    doneRef.current = false;
    setRunning(false);
    setDone(false);
    setFeedback({ text: IDLE_FEEDBACK, cls: '' });
  };

  const rows = task === 'overall' ? OVERALL.map((v) => [v]) : TASK_VALUES[task];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={startRace}>
          {running || done ? '重新对比' : '开始对比'}
        </button>
        {TASK_LABELS.map((tk) => (
          <button
            key={tk.id}
            type="button"
            className={`chip${task === tk.id ? ' selected' : ''}`}
            aria-pressed={task === tk.id}
            onClick={() => pickTask(tk.id)}
          >
            {tk.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <table className="paper">
        <thead>
          <tr>
            <th>方法</th>
            {task === 'overall' ? (
              <th>总体</th>
            ) : (
              SEVERITY_LABELS.map((s) => <th key={s}>{s}</th>)
            )}
          </tr>
        </thead>
        <tbody>
          {METHODS.map((m, i) => (
            <tr key={m.name}>
              <td>{m.name}</td>
              {rows[i].map((v, j) => (
                <td
                  key={j}
                  style={{ color: m.color, fontFamily: 'var(--ui-font-mono)' }}
                >
                  {v.toFixed(4)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 8, color: 'var(--slate-2)', fontSize: '0.86em' }}>
        注：以上为 Table 1 的精确值，优势随损坏强度增大而扩大；边界提醒——严重损坏仍难、依赖成对数据、推理开销大（55 s）。
      </p>
    </div>
  );
};

export default Ch10Mod1;
