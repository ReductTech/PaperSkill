import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 8.1: the complete Infoprop Dyna training loop as an animated closed circuit:
// 真实机器人 -> 真实轨迹 -> dynamics model -> Infoprop (imagine + truncate) ->
// 可信 imagined data -> 策略优化 -> 新策略回机器人 -> 更多真实数据 -> 循环。
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'These results highlight the practical potential of Infoprop Dyna to bridge the gap between data efficiency and high final performance on real robotic systems.',
    zh: '论文结论：这套闭环展示了 Infoprop Dyna <b>兼顾数据效率与最终性能</b>的实践潜力。',
    locator: '§V · p.2',
    highlights: ['bridge the gap between data efficiency and high final performance'],
  },
  {
    en: 'a model-based rollout mechanism that separates aleatoric from epistemic model uncertainty and reduces the influence of the latter on the data distribution',
    zh: 'Infoprop <b>降低认知不确定性对数据分布的影响</b>——不可信的数据被截断，不进入训练。',
    locator: '先前工作 [8] Abstract',
    highlights: ['reduces the influence of the latter on the data distribution'],
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

interface NodeDef {
  x: number;
  y: number;
  lines: string[];
}

const BOX_W = 200;
const BOX_H = 52;

const NODES: NodeDef[] = [
  { x: 160, y: 74, lines: ['真实机器人', '先跑一小段'] },
  { x: 410, y: 74, lines: ['真实轨迹'] },
  { x: 660, y: 74, lines: ['dynamics model'] },
  { x: 910, y: 74, lines: ['Infoprop', '想象 + 截断'] },
  { x: 660, y: 202, lines: ['可信 imagined data'] },
  { x: 410, y: 202, lines: ['策略优化'] },
  { x: 160, y: 202, lines: ['新策略回机器人'] },
];

// path taken when entering each stage (index = target stage 1..7)
const ENTER_PATHS: [number, number][][] = [
  [],
  [],
  [
    [260, 74],
    [310, 74],
  ],
  [
    [510, 74],
    [560, 74],
  ],
  [
    [760, 74],
    [810, 74],
  ],
  [
    [910, 100],
    [910, 138],
    [660, 138],
    [660, 176],
  ],
  [
    [560, 202],
    [510, 202],
  ],
  [
    [310, 202],
    [260, 202],
  ],
];

// wrap path: node 7 -> node 1 (closing the loop)
const WRAP_PATH: [number, number][] = [
  [160, 228],
  [160, 254],
  [30, 254],
  [30, 74],
  [58, 74],
];

const STAGE_TEXT = [
  '点击「开始训练循环」：沿着闭环走一圈，看少量真实经验如何变成大量想象经验。',
  '① 真实机器人：新策略先跑一小段真实经验——真实数据很贵，所以要省着用。',
  '② 真实轨迹：把这一小段经验完整记录下来，作为模型的学习材料。',
  '③ dynamics model：用真实数据学一个会预测的模型（不是物理仿真器）。',
  '④ Infoprop：模型在「想象」中连续预测，同时跟踪信息损失——不可信时立刻截断。',
  '⑤ 可信 imagined data：截断之前的数据被确认为可信，汇聚成大批想象经验。',
  '⑥ 策略优化：真实经验 + 可信想象经验一起训练策略。',
  '⑦ 新策略回机器人：部署新策略 → 采集更多真实数据 → 回到 ①，闭环转起来。',
];

export const Ch8DynaLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ stage: number; animT0: number; lap: number }>({
    stage: 0,
    animT0: -1,
    lap: 0,
  });
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState({ text: STAGE_TEXT[0], cls: '' });

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

    const drawPolyline = (pts: [number, number][], color: string, width: number, arrow: boolean) => {
      if (pts.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      if (arrow) {
        const [ex, ey] = pts[pts.length - 1];
        const [px, py] = pts[pts.length - 2];
        const ang = Math.atan2(ey - py, ex - px);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 10 * Math.cos(ang - 0.42), ey - 10 * Math.sin(ang - 0.42));
        ctx.lineTo(ex - 10 * Math.cos(ang + 0.42), ey - 10 * Math.sin(ang + 0.42));
        ctx.closePath();
        ctx.fill();
      }
    };

    const render = (time: number) => {
      const s = stateRef.current;
      const active = s.stage - 1; // 0-based active node, -1 = none
      const entering = s.stage >= 1 && time - s.animT0 < 0.85 ? clamp((time - s.animT0) / 0.85, 0, 1) : 1;
      const animating = s.stage >= 1 && entering < 1;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- static connectors ----
      for (let i = 2; i < ENTER_PATHS.length; i++) drawPolyline(ENTER_PATHS[i], C.border, 1.6, true);
      drawPolyline(WRAP_PATH, C.border, 1.6, true);

      // ---- highlighted segment for the last transition ----
      if (s.stage >= 2) {
        drawPolyline(ENTER_PATHS[s.stage], C.blue, 2.6, true);
      } else if (s.stage === 1 && s.lap > 0) {
        drawPolyline(WRAP_PATH, C.green, 2.6, true);
      }

      // ---- moving pulse on the active segment ----
      if (animating) {
        const path = s.stage === 1 && s.lap > 0 ? WRAP_PATH : ENTER_PATHS[s.stage] ?? [];
        if (path.length >= 2) {
          const total = path.reduce(
            (acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1])),
            0
          );
          let d = easeOutCubic(entering) * total;
          for (let i = 1; i < path.length; i++) {
            const seg = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
            if (d <= seg) {
              const t = seg === 0 ? 0 : d / seg;
              const x = path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t;
              const y = path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t;
              ctx.fillStyle = C.blue;
              ctx.beginPath();
              ctx.arc(x, y, 5, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            d -= seg;
          }
        }
      }

      // ---- nodes ----
      NODES.forEach((n, i) => {
        const isActive = i === active;
        const bx = n.x - BOX_W / 2;
        const by = n.y - BOX_H / 2;
        ctx.fillStyle = '#ffffff';
        if (isActive) {
          const pulse = 0.65 + 0.35 * Math.sin(time * 5);
          ctx.strokeStyle = `rgba(39,68,110,${pulse.toFixed(2)})`;
          ctx.lineWidth = 3.2;
        } else {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
        }
        rr(ctx, bx, by, BOX_W, BOX_H, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isActive ? C.blue : C.muted;
        ctx.font = (isActive ? 'bold ' : '') + '13px "Segoe UI", sans-serif';
        const lh = 16;
        const startY = n.y - ((n.lines.length - 1) * lh) / 2 + 4.5;
        n.lines.forEach((line, li) => {
          const tw = ctx.measureText(line).width;
          ctx.fillText(line, n.x - tw / 2, startY + li * lh);
        });
      });
    };

    const tick = (now: number) => {
      render(now / 1000);
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

  const go = () => {
    const s = stateRef.current;
    let next: number;
    if (s.stage === 0) next = 1;
    else if (s.stage >= 7) {
      next = 1;
      s.lap += 1;
    } else next = s.stage + 1;
    s.stage = next;
    s.animT0 = performance.now() / 1000;
    setStage(next);
    const text =
      next === 1 && s.lap > 0
        ? '⓪ 闭环转回来了：新策略让真实数据更多，模型更准、想象更可信——循环重新开始（Infoprop 的作用：不是让模型永远正确，而是避免模型不可靠后继续生成数据）。'
        : STAGE_TEXT[next];
    setFeedback({ text, cls: next >= 5 ? 'good' : next === 1 && s.lap > 0 ? '' : '' });
  };

  const reset = () => {
    stateRef.current = { stage: 0, animT0: -1, lap: 0 };
    setStage(0);
    setFeedback({ text: STAGE_TEXT[0], cls: '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="step-ctrl">
          <button onClick={go}>{stage === 0 ? '开始训练循环' : stage >= 7 ? '再转一圈' : '下一步'}</button>
          <span className="feedback" style={{ marginTop: 0, minHeight: 0 }}>
            {stage === 0 ? '未开始' : `第 ${stage} / 7 站`}
          </span>
          <button onClick={reset} disabled={stage === 0}>
            重置
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch8DynaLoop;
