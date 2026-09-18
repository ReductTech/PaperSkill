import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const DURATION = 2.6;
const STAGGER = 0.12;
const START_X = 120;
const GOAL_X = 980;
const SPAN = GOAL_X - START_X;
const SCORE_FULL = 0.7;
const TRACK_Y = [62, 100, 138, 176];

type View = 'heldout' | 'alphaearth' | 'label1';
type Phase = 'idle' | 'running' | 'done';
type Fb = { text: string; cls: '' | 'good' | 'bad' };

interface Runner {
  key: string;
  name: string;
  aperture: number;
  heldout: number;
  alphaearth: number;
}

const RUNNERS: Runner[] = [
  { key: 'v2', name: 'TESSERA v2-2B-L', aperture: 4, heldout: 0.647, alphaearth: 0.593 },
  { key: 'olmo', name: 'OlmoEarth-L', aperture: 9, heldout: 0.614, alphaearth: 0.512 },
  { key: 'v1', name: 'TESSERA v1', aperture: 7, heldout: 0.614, alphaearth: 0.541 },
  { key: 'ae', name: 'ALPHAEARTH', aperture: 9, heldout: 0.59, alphaearth: 0.56 },
];

const VIEW_LABEL: Record<View, string> = {
  heldout: '留出套件',
  alphaearth: 'ALPHAEARTH',
  label1: '1% 标签',
};

const VIEWS: { id: View; label: string }[] = [
  { id: 'heldout', label: '留出套件' },
  { id: 'alphaearth', label: 'ALPHAEARTH 套件' },
  { id: 'label1', label: '1% 标签' },
];

const FB_IDLE: Fb = { text: '按下开始对比：四条赛道共享 0 基线，复合得分越高跑得越远。', cls: '' };
const FB_RUNNING: Fb = { text: '44M 的学生正在追上并超过更大编码器的对照。', cls: '' };
const FB_DONE: Record<View, Fb> = {
  heldout: {
    text: '留出复合得分 0.647 对 0.614 / 0.614 / 0.590；去掉 CITYREP、改用线性探针、换两种聚合规则后仍第一，验证通过。',
    cls: 'good',
  },
  alphaearth: {
    text: '共享 15 任务套件 0.593 对 0.560 / 0.541 / 0.512，平均排名 2.0 优于 4.1 与 5.1；分布内套件不授予验证奖杯。',
    cls: 'good',
  },
  label1: {
    text: '1%/30%/100% 标签预算下 v2 在多数留出数据集领先，且 1% 时差距最大；此视图只示方向，不给出未公开的逐数据集增量。',
    cls: 'good',
  },
};
const FB_SWITCH: Fb = { text: '已换用另一套件，排名按当前套件重算，请勿沿用上一视图的结论。', cls: '' };

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 16, W, 16);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 16);
  ctx.lineTo(W, H - 16);
  ctx.stroke();
}

function label(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left'
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function drawScope(ctx: CanvasRenderingContext2D, x: number, y: number, aperture: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 30, y - aperture / 2, 24, aperture);
  ctx.beginPath();
  ctx.arc(x - 6, y, aperture * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 11);
  ctx.lineTo(x + 7, y - 11);
  ctx.lineTo(x + 4, y - 3);
  ctx.lineTo(x - 4, y - 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 1.5, y - 3, 3, 5);
  ctx.fillRect(x - 5, y + 2, 10, 2.5);
}

function drawArrowUp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#228d5c';
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 7, y);
  ctx.lineTo(x + 2.5, y);
  ctx.lineTo(x + 2.5, y + 9);
  ctx.lineTo(x - 2.5, y + 9);
  ctx.lineTo(x - 2.5, y);
  ctx.lineTo(x - 7, y);
  ctx.closePath();
  ctx.fill();
}

interface RaceState {
  phase: Phase;
  view: View;
  progress: number;
  stamp: number;
  verified: boolean;
  ys: number[];
}

function scoreOf(r: Runner, view: View): number | null {
  if (view === 'heldout') return r.heldout;
  if (view === 'alphaearth') return r.alphaearth;
  return null;
}

function orderFor(view: View): number[] {
  if (view === 'label1') return [0, 1, 2, 3];
  return RUNNERS.map((_, i) => i).sort((a, b) => (scoreOf(RUNNERS[b], view) ?? 0) - (scoreOf(RUNNERS[a], view) ?? 0));
}

function markerFrac(r: Runner, view: View): number {
  if (view === 'label1') return r.key === 'v2' ? 0.55 : 0.18;
  return clamp((scoreOf(r, view) ?? 0) / SCORE_FULL, 0, 1);
}

function render(ctx: CanvasRenderingContext2D, st: RaceState) {
  clearScene(ctx);
  const order = orderFor(st.view);
  const rankOf = RUNNERS.map((_, i) => order.indexOf(i));

  RUNNERS.forEach((_, i) => {
    st.ys[i] = lerp(st.ys[i], TRACK_Y[rankOf[i]], 0.16);
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(START_X, st.ys[i]);
    ctx.lineTo(GOAL_X, st.ys[i]);
    ctx.stroke();
  });

  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(START_X, 44);
  ctx.lineTo(START_X, 194);
  ctx.stroke();

  ctx.fillStyle = '#68778f';
  ctx.beginPath();
  ctx.moveTo(GOAL_X, 104);
  ctx.lineTo(GOAL_X + 6, 118);
  ctx.lineTo(GOAL_X, 132);
  ctx.lineTo(GOAL_X - 6, 118);
  ctx.closePath();
  ctx.fill();

  RUNNERS.forEach((r, i) => {
    const y = st.ys[i];
    const pLane = clamp((st.progress * DURATION - (3 - rankOf[i]) * STAGGER) / (DURATION - 3 * STAGGER), 0, 1);
    const grow = st.phase === 'idle' ? 0 : easeOutCubic(pLane);
    const x = START_X + SPAN * markerFrac(r, st.view) * grow;
    const color = r.key === 'v2' ? '#228d5c' : '#68778f';
    drawScope(ctx, x, y, r.aperture, color);
    if (st.progress > 0 && st.view !== 'label1') {
      label(ctx, (scoreOf(r, st.view) ?? 0).toFixed(3), x + 12, y, color, 16);
    }
    if (r.key === 'v2' && st.verified && st.view === 'heldout') drawTrophy(ctx, x + 20, y - 24);
    if (r.key === 'v2' && st.view === 'label1') drawArrowUp(ctx, x, y - 24);
  });

  ctx.strokeStyle = st.verified ? '#228d5c' : '#68778f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(958, 238, 20, 0, Math.PI * 2);
  ctx.stroke();
  if (st.view === 'heldout' && st.stamp > 0 && !st.verified) {
    ctx.beginPath();
    ctx.arc(958, 238, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * st.stamp);
    ctx.stroke();
  }
  if (st.verified) {
    ctx.strokeStyle = '#228d5c';
    ctx.beginPath();
    ctx.moveTo(948, 238);
    ctx.lineTo(955, 246);
    ctx.lineTo(969, 229);
    ctx.stroke();
  }
  label(ctx, '验证', 986, 240, st.verified ? '#228d5c' : '#68778f', 18);

  label(ctx, VIEW_LABEL[st.view], 40, 32, '#21324a', 20);
  let lx = 40;
  (
    [
      ['#f07e47', '起跑基线'],
      ['#228d5c', '论文方法'],
      ['#68778f', '对照'],
    ] as [string, string][]
  ).forEach(([color, text]) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, 248, 12, 12);
    label(ctx, text, lx + 18, 255, '#21324a', 16);
    lx += 20 + ctx.measureText(text).width + 24;
  });
}

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState>({
    phase: 'idle',
    view: 'heldout',
    progress: 0,
    stamp: 0,
    verified: false,
    ys: [...TRACK_Y],
  });
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [view, setView] = useState<View>('heldout');
  const [feedback, setFeedback] = useState<Fb>(FB_IDLE);

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
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const st = stateRef.current;
      if (st.phase === 'running') {
        st.progress = clamp(st.progress + dt / DURATION, 0, 1);
        if (st.progress >= 1) {
          st.phase = 'done';
          setPhase('done');
          setFeedback(FB_DONE[st.view]);
        }
      }
      if (st.phase === 'done' && st.view === 'heldout' && !st.verified) {
        st.stamp = clamp(st.stamp + dt / 0.8, 0, 1);
        if (st.stamp >= 1) st.verified = true;
      }
      render(ctx, st);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const launch = () => {
    const st = stateRef.current;
    st.phase = 'running';
    st.progress = 0;
    st.stamp = 0;
    st.verified = false;
    setPhase('running');
    setFeedback(FB_RUNNING);
  };

  const pick = (v: View) => {
    const st = stateRef.current;
    if (st.phase === 'running') return;
    st.view = v;
    st.stamp = v === 'heldout' && st.phase === 'done' ? 1 : 0;
    st.verified = v === 'heldout' && st.phase === 'done';
    setView(v);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (st.phase === 'done') {
      setFeedback(FB_SWITCH);
      timerRef.current = window.setTimeout(() => setFeedback(FB_DONE[v]), 1200);
    }
  };

  const chipNav = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = e.key === 'ArrowLeft' ? (i + VIEWS.length - 1) % VIEWS.length : (i + 1) % VIEWS.length;
    chipRefs.current[next]?.focus();
  };

  const ranked = orderFor(view).map((i) => RUNNERS[i]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={launch} disabled={phase === 'running'} aria-disabled={phase === 'running'}>
          {phase === 'idle' ? '开始对比' : phase === 'running' ? '对比中…' : '重新对比'}
        </button>
      </div>
      <div className="chip-row">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            className={`chip ${view === v.id ? 'selected' : ''}`}
            disabled={phase === 'running'}
            onClick={() => pick(v.id)}
            onKeyDown={(e) => chipNav(e, i)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <table className="paper">
        <thead>
          <tr>
            <th>排名</th>
            <th>选手</th>
            <th>{VIEW_LABEL[view]}得分</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => (
            <tr key={r.key}>
              <td>{i + 1}</td>
              <td>{r.name}</td>
              <td>{view === 'label1' ? (r.key === 'v2' ? '方向性领先' : '—') : (scoreOf(r, view) ?? 0).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
