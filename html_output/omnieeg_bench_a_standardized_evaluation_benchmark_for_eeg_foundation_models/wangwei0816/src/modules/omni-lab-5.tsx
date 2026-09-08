import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, usePanelWidth } from './omni-interaction-kit';

type Mode = 'linear' | 'finetune';
type Point = { x: number; y: number; label: 0 | 1; originX: number; originY: number };
type Snapshot = { step: number; loss: number; points: Point[]; w: [number, number]; b: number };

const INK = '#17263b';
const MUTED = '#687b8f';
const BLUE = '#245d87';
const PURPLE = '#6756a3';
const ORANGE = '#c47719';
const GREEN = '#27815f';

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function normal(random: () => number) {
  const u = Math.max(1e-6, random());
  const v = Math.max(1e-6, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-clamp(value, -20, 20)));
}

function makePoints(seed: number) {
  const random = seededRandom(seed * 7919 + 17);
  const gaps = [0.64, 0.40, 0.24];
  const noises = [0.34, 0.46, 0.56];
  const level = seed % 3;
  const points: Point[] = [];
  for (const label of [0, 1] as const) {
    for (let index = 0; index < 14; index += 1) {
      const x = clamp((label ? 1 : -1) * gaps[level] + normal(random) * noises[level], -1.3, 1.3);
      const y = clamp((label ? 0.10 : -0.10) + normal(random) * noises[level] * 0.78, -1.3, 1.3);
      points.push({ x, y, label, originX: x, originY: y });
    }
  }
  return { points, level };
}

function simulate(seed: number, mode: Mode) {
  const generated = makePoints(seed);
  const random = seededRandom(seed * 3571 + (mode === 'linear' ? 23 : 97));
  let points = generated.points.map((point) => ({ ...point }));
  let w: [number, number] = [(random() - 0.5) * 0.35, (random() - 0.5) * 0.35];
  let b = (random() - 0.5) * 0.12;
  const snapshots: Snapshot[] = [];
  const recent: number[] = [];
  const maximum = mode === 'linear' ? 220 : 280;

  for (let step = 0; step <= maximum; step += 1) {
    let loss = 0;
    let gradW0 = 0;
    let gradW1 = 0;
    let gradB = 0;
    const errors: number[] = [];

    points.forEach((point) => {
      const probability = sigmoid(w[0] * point.x + w[1] * point.y + b);
      const error = probability - point.label;
      errors.push(error);
      loss += -(point.label * Math.log(probability + 1e-7) + (1 - point.label) * Math.log(1 - probability + 1e-7));
      gradW0 += error * point.x;
      gradW1 += error * point.y;
      gradB += error;
    });

    const count = points.length;
    loss = loss / count + 0.015 * (w[0] ** 2 + w[1] ** 2);
    gradW0 = gradW0 / count + 0.03 * w[0];
    gradW1 = gradW1 / count + 0.03 * w[1];
    gradB /= count;

    if (step % 4 === 0) snapshots.push({ step, loss, points: points.map((point) => ({ ...point })), w: [...w], b });
    recent.push(loss);
    if (recent.length > 17) recent.shift();
    if (step >= 64 && recent.length === 17 && recent[0] - recent[16] < 0.0012) break;
    if (step === maximum) break;

    const oldW: [number, number] = [...w];
    w = [w[0] - 0.42 * gradW0, w[1] - 0.42 * gradW1];
    b -= 0.42 * gradB;

    if (mode === 'finetune') {
      points = points.map((point, index) => ({
        ...point,
        x: clamp(point.x - 0.055 * errors[index] * oldW[0] - 0.003 * (point.x - point.originX), -1.35, 1.35),
        y: clamp(point.y - 0.055 * errors[index] * oldW[1] - 0.003 * (point.y - point.originY), -1.35, 1.35),
      }));
    }
  }

  const last = snapshots[snapshots.length - 1];
  return {
    snapshots,
    totalSteps: last.step,
    level: generated.level,
  };
}

function boundary(snapshot: Snapshot, plot: { x: number; y: number; w: number; h: number }) {
  const [wx, wy] = snapshot.w;
  const norm = Math.max(0.001, Math.hypot(wx, wy));
  const centerX = -snapshot.b * wx / (norm * norm);
  const centerY = -snapshot.b * wy / (norm * norm);
  const dx = -wy / norm * 3;
  const dy = wx / norm * 3;
  const map = (x: number, y: number) => ({
    x: plot.x + (x + 1.4) / 2.8 * plot.w,
    y: plot.y + (1.4 - y) / 2.8 * plot.h,
  });
  return [map(centerX - dx, centerY - dy), map(centerX + dx, centerY + dy)] as const;
}

export const OmniLab5: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const [mode, setMode] = useState<Mode>('linear');
  const [seed, setSeed] = useState(1);
  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(false);
  const simulation = useMemo(() => simulate(seed, mode), [seed, mode]);
  const lastFrame = simulation.snapshots.length - 1;
  const snapshot = simulation.snapshots[Math.min(frame, lastFrame)];
  const done = frame >= lastFrame;
  const difficulty = ['分离较清楚', '中度重叠', '高度重叠'][simulation.level];

  useEffect(() => {
    if (!running) return;
    if (frame >= lastFrame) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setFrame((current) => Math.min(lastFrame, current + 1)), 42);
    return () => window.clearTimeout(timer);
  }, [frame, lastFrame, running]);

  const selectMode = (next: Mode) => {
    setRunning(false);
    setFrame(0);
    setMode(next);
  };

  const resample = () => {
    setRunning(false);
    setFrame(0);
    setSeed((current) => current + 1);
  };

  const train = () => {
    if (running) return;
    if (done) setFrame(0);
    setRunning(true);
  };

  const width = mobile ? 360 : 920;
  const height = mobile ? 710 : 390;
  const scatterPanel = mobile ? { x: 16, y: 18, w: 328, h: 350 } : { x: 24, y: 20, w: 540, h: 350 };
  const plot = mobile ? { x: 42, y: 78, w: 276, h: 238 } : { x: 58, y: 78, w: 472, h: 242 };
  const parameterPanel = mobile ? { x: 16, y: 386, w: 328, h: 128 } : { x: 584, y: 20, w: 312, h: 148 };
  const lossPanel = mobile ? { x: 16, y: 532, w: 328, h: 160 } : { x: 584, y: 188, w: 312, h: 182 };
  const lossPlot = mobile
    ? { x: lossPanel.x + 28, y: lossPanel.y + 48, w: lossPanel.w - 52, h: 73 }
    : { x: lossPanel.x + 30, y: lossPanel.y + 50, w: lossPanel.w - 54, h: 82 };
  const lineEnds = boundary(snapshot, plot);
  const initial = simulation.snapshots[0];
  const maxLoss = initial.loss;
  const minLoss = simulation.snapshots[lastFrame].loss;
  const visibleSnapshots = simulation.snapshots.slice(0, frame + 1);
  const lossPath = visibleSnapshots.map((item, index) => {
    const x = lossPlot.x + item.step / Math.max(1, simulation.totalSteps) * lossPlot.w;
    const ratio = (item.loss - minLoss) / Math.max(0.001, maxLoss - minLoss);
    const y = lossPlot.y + lossPlot.h - ratio * lossPlot.h;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const pointToScreen = (point: Point) => ({
    x: plot.x + (point.x + 1.4) / 2.8 * plot.w,
    y: plot.y + (1.4 - point.y) / 2.8 * plot.h,
  });

  return (
    <div className="oi-unit" ref={ref}>
      <div className="ob-state-control" role="group" aria-label="选择参数更新边界">
        <button type="button" className={mode === 'linear' ? 'active' : ''} aria-pressed={mode === 'linear'} onClick={() => selectMode('linear')}>线性探测 · 冻结骨干</button>
        <button type="button" className={mode === 'finetune' ? 'active' : ''} aria-pressed={mode === 'finetune'} onClick={() => selectMode('finetune')}>全量微调 · 更新骨干</button>
      </div>
      <div className="ob-state-control ol5-actions" role="group" aria-label="生成表示并训练">
        <button type="button" onClick={resample}>↻ 换一组表示样本</button>
        <button type="button" className="active" disabled={running} onClick={train}>{running ? '正在迭代…' : done ? '▶ 重新训练至停止' : '▶ 训练至停止'}</button>
      </div>
      <div className="oi-caption">
        <span>样本组 #{seed} · {difficulty}</span>
        <strong>{done ? `损失进入平台 · k = ${snapshot.step}` : `当前优化步 k = ${snapshot.step}`}</strong>
      </div>
      <svg className="oi-stage is-static" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="随机生成表示点并比较线性探测与全量微调训练至损失稳定时的参数更新过程">
        <defs>
          <clipPath id="ol5-scatter-clip"><rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx="3" /></clipPath>
        </defs>
        <rect x=".5" y=".5" width={width - 1} height={height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />
        <g>
          <rect x={scatterPanel.x} y={scatterPanel.y} width={scatterPanel.w} height={scatterPanel.h} rx="5" fill="#fff" stroke="#cbd7e1" />
          <text x={scatterPanel.x + 16} y={scatterPanel.y + 26} className="oi-label">表示空间 z 与任务头 g</text>
          <circle cx={scatterPanel.x + scatterPanel.w - (mobile ? 120 : 142)} cy={scatterPanel.y + 23} r="5" fill={BLUE} />
          <text x={scatterPanel.x + scatterPanel.w - (mobile ? 111 : 132)} y={scatterPanel.y + 26} className="oi-mini">类别 A</text>
          <circle cx={scatterPanel.x + scatterPanel.w - (mobile ? 62 : 72)} cy={scatterPanel.y + 23} r="5" fill={PURPLE} />
          <text x={scatterPanel.x + scatterPanel.w - (mobile ? 53 : 62)} y={scatterPanel.y + 26} className="oi-mini">类别 B</text>
          <rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} rx="3" fill="#fbfcfe" stroke="#d7e0e8" />
          {[0.25, 0.5, 0.75].map((ratio) => <React.Fragment key={ratio}>
            <line x1={plot.x + plot.w * ratio} y1={plot.y} x2={plot.x + plot.w * ratio} y2={plot.y + plot.h} stroke="#edf1f4" />
            <line x1={plot.x} y1={plot.y + plot.h * ratio} x2={plot.x + plot.w} y2={plot.y + plot.h * ratio} stroke="#edf1f4" />
          </React.Fragment>)}
          <g clipPath="url(#ol5-scatter-clip)">
            {mode === 'finetune' && frame > 0 && snapshot.points.map((point, index) => {
              const start = pointToScreen(initial.points[index]);
              const end = pointToScreen(point);
              return <line key={`trail-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={point.label ? PURPLE : BLUE} strokeWidth="1" strokeDasharray="3 3" opacity=".28" />;
            })}
            <line x1={lineEnds[0].x} y1={lineEnds[0].y} x2={lineEnds[1].x} y2={lineEnds[1].y} stroke={ORANGE} strokeWidth="3" />
            {snapshot.points.map((point, index) => {
              const screen = pointToScreen(point);
              return <circle key={index} cx={screen.x} cy={screen.y} r={mobile ? 4.3 : 5.3} fill={point.label ? PURPLE : BLUE} stroke="#fff" strokeWidth="1.5" />;
            })}
          </g>
          <text x={plot.x} y={plot.y + plot.h + 22} className="oi-note">{mode === 'linear' ? '点位固定：只旋转和移动分类边界' : '虚线轨迹：任务梯度推动表示与边界共同变化'}</text>
          <text x={plot.x + plot.w} y={plot.y + plot.h + (mobile ? 38 : 22)} textAnchor="end" className="oi-mini">二维表示仅作原理示意</text>
        </g>

        <g>
          <rect x={parameterPanel.x} y={parameterPanel.y} width={parameterPanel.w} height={parameterPanel.h} rx="5" fill="#fff" stroke="#cbd7e1" />
          <text x={parameterPanel.x + 16} y={parameterPanel.y + 25} className="oi-label">反向传播更新到哪里</text>
          {[
            ['骨干 fθ', mode === 'linear' ? '冻结' : '更新', mode === 'linear' ? MUTED : PURPLE],
            ['表示 z', mode === 'linear' ? '固定' : '移动', mode === 'linear' ? BLUE : PURPLE],
            ['任务头 g', '更新', ORANGE],
          ].map(([name, state, color], index) => {
            const y = parameterPanel.y + 54 + index * (mobile ? 22 : 27);
            return <g key={name}>
              <text x={parameterPanel.x + 18} y={y} className="oi-note">{name}</text>
              <line x1={parameterPanel.x + (mobile ? 116 : 104)} y1={y - 4} x2={parameterPanel.x + parameterPanel.w - 68} y2={y - 4} stroke="#e0e7ed" strokeWidth="5" strokeLinecap="round" />
              {state !== '冻结' && <line x1={parameterPanel.x + (mobile ? 116 : 104)} y1={y - 4} x2={parameterPanel.x + parameterPanel.w - 68} y2={y - 4} stroke={color} strokeWidth="5" strokeLinecap="round" opacity={frame === 0 ? '.35' : '.9'} />}
              <text x={parameterPanel.x + parameterPanel.w - 18} y={y} textAnchor="end" fill={color} fontSize="10" fontWeight="900">{state}</text>
            </g>;
          })}
        </g>

        <g>
          <rect x={lossPanel.x} y={lossPanel.y} width={lossPanel.w} height={lossPanel.h} rx="5" fill="#fff" stroke="#cbd7e1" />
          <text x={lossPanel.x + 16} y={lossPanel.y + 25} className="oi-label">优化损失何时停止下降</text>
          <text x={lossPanel.x + lossPanel.w - 16} y={lossPanel.y + 25} textAnchor="end" fill={done ? GREEN : MUTED} fontSize="9" fontWeight="850">{done ? '平台区 · 停止' : `k = ${snapshot.step}`}</text>
          <line x1={lossPlot.x} y1={lossPlot.y + lossPlot.h} x2={lossPlot.x + lossPlot.w} y2={lossPlot.y + lossPlot.h} stroke="#aebbc7" />
          <line x1={lossPlot.x} y1={lossPlot.y} x2={lossPlot.x} y2={lossPlot.y + lossPlot.h} stroke="#aebbc7" />
          <path d={lossPath} fill="none" stroke={mode === 'linear' ? BLUE : PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lossPlot.x + snapshot.step / Math.max(1, simulation.totalSteps) * lossPlot.w} cy={lossPlot.y + lossPlot.h - ((snapshot.loss - minLoss) / Math.max(0.001, maxLoss - minLoss)) * lossPlot.h} r="4" fill={ORANGE} />
          <text x={lossPlot.x - 5} y={lossPlot.y + 4} textAnchor="end" className="oi-mini">loss</text>
          <text x={lossPlot.x + lossPlot.w} y={lossPlot.y + lossPlot.h + 17} textAnchor="end" className="oi-mini">优化步 k</text>
          <text x={lossPanel.x + 16} y={lossPanel.y + lossPanel.h - 13} className="oi-mini">步数为机制模拟；论文未报告统一 epoch 或早停阈值</text>
        </g>
      </svg>
      <div className={`oi-feedback ${done ? 'good' : ''}`} aria-live="polite">
        <b>{frame === 0
          ? (mode === 'linear' ? '预训练表示已经固定，等待训练任务头 g。' : '任务梯度将同时进入任务头 g 与预训练骨干 fθ。')
          : running
            ? (mode === 'linear' ? `第 ${snapshot.step} 步：点位不动，g 正在寻找损失更低的分类边界。` : `第 ${snapshot.step} 步：g 与表示 z 同时沿任务梯度更新。`)
            : mode === 'linear'
              ? `损失在 k=${snapshot.step} 进入平台；点位始终未动，因此结果衡量冻结表示的可读性。`
              : `损失在 k=${snapshot.step} 进入平台；表示和任务头共同变化，因此结果包含任务适配能力。`}</b>
      </div>
    </div>
  );
};
