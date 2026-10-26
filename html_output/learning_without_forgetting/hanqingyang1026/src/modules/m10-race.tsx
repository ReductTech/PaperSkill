import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  axis: '#d7deea',
  grid: '#e7ebf1',
  ink: '#21324a',
};

type Pair = 'in_voc' | 'in_cub' | 'p_cub';
type MethodKey = 'lwf' | 'ft' | 'fe' | 'joint';
type Phase = 'idle' | 'running' | 'done';

const DATA: Record<Pair, Record<MethodKey, [number, number]>> = {
  in_voc: {
    lwf: [56.2, 76.1],
    ft: [55.3, 75.8],
    fe: [57.0, 75.6],
    joint: [56.9, 75.9],
  },
  in_cub: {
    lwf: [54.7, 57.7],
    ft: [50.9, 57.0],
    fe: [57.0, 52.5],
    joint: [55.3, 56.6],
  },
  p_cub: {
    lwf: [47.9, 34.8],
    ft: [43.3, 35.8],
    fe: [51.7, 22.5],
    joint: [50.2, 36.3],
  },
};

const PAIR_LABEL: Record<Pair, string> = {
  in_voc: 'ImageNet→VOC',
  in_cub: 'ImageNet→CUB',
  p_cub: 'Places365→CUB',
};

const METHODS: { key: MethodKey; label: string; color: string }[] = [
  { key: 'lwf', label: 'LwF', color: C.green },
  { key: 'ft', label: '微调', color: C.red },
  { key: 'fe', label: '特征提取', color: C.blue },
  { key: 'joint', label: '联合训练', color: C.purple },
];

const DURATION = 2000;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e0a83e';
  ctx.strokeStyle = '#9a6b1f';
  ctx.lineWidth = 1.4;

  // 杯身
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(25, 0);
  ctx.lineTo(23, 11);
  ctx.quadraticCurveTo(14, 20, 5, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 双耳
  ctx.beginPath();
  ctx.arc(3, 6, 5.5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(25, 6, 5.5, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  // 杯柄与底座
  ctx.fillRect(12, 19, 4, 6);
  ctx.strokeRect(12, 19, 4, 6);
  ctx.fillRect(7, 25, 14, 3);
  ctx.strokeRect(7, 25, 14, 3);
  ctx.restore();
}

function isStrictBest(pair: Pair, row: 0 | 1): boolean {
  const lwf = DATA[pair].lwf[row];
  return METHODS.every((m) => m.key === 'lwf' || lwf > DATA[pair][m.key][row]);
}

export const M10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pair, setPair] = useState<Pair>('in_voc');
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '选一对任务，再点开始。指标都是越高越好。',
    cls: '',
  });

  const pairRef = useRef<Pair>('in_voc');
  const phaseRef = useRef<Phase>('idle');
  const progressRef = useRef(0);
  const startRef = useRef(0);

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
    const tick = (now: number) => {
      if (phaseRef.current === 'running') {
        const p = clamp((now - startRef.current) / DURATION, 0, 1);
        progressRef.current = p;
        if (p >= 1) {
          phaseRef.current = 'done';
          setPhase('done');
          const current = pairRef.current;
          if (current === 'in_voc') {
            setFeedback({
              text: '新任务 76.1 第一，旧任务 56.2 只输给特征提取 57.0 和联合训练 56.9 —— 联合训练还用了旧数据。',
              cls: 'good',
            });
          } else if (current === 'in_cub') {
            setFeedback({
              text: '新任务 57.7 第一，旧任务 54.7 落后于特征提取 57.0 与联合训练 55.3。',
              cls: 'good',
            });
          } else {
            setFeedback({
              text: '这一对是反例：新任务 34.8 输给微调 35.8，旧任务 47.9 输给特征提取 51.7 —— 鸟和场景差得太远。',
              cls: '',
            });
          }
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = C.table;
      ctx.fillRect(0, 258, W, 22);
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 258);
      ctx.lineTo(W, 258);
      ctx.stroke();

      const x0 = 124;
      const x1 = 980;
      const scale = x1 - x0;

      // 两行的底板
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      roundRect(ctx, 32, 44, 1000, 88, 10);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, 32, 140, 1000, 88, 10);
      ctx.fill();
      ctx.stroke();

      // 刻度线（0–80，每 20 一格）
      for (let v = 0; v <= 80; v += 20) {
        const x = x0 + (v / 80) * scale;
        ctx.strokeStyle = v === 0 ? C.axis : C.grid;
        ctx.lineWidth = v === 0 ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 222);
        ctx.stroke();
      }

      ctx.fillStyle = C.ink;
      ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('旧任务', 44, 88);
      ctx.fillText('新任务', 44, 184);

      const current = pairRef.current;
      const eased = easeOutCubic(clamp(progressRef.current, 0, 1));
      const rows: { row: 0 | 1; top: number }[] = [
        { row: 0, top: 52 },
        { row: 1, top: 148 },
      ];

      rows.forEach(({ row, top }) => {
        METHODS.forEach((m, index) => {
          const laneY = top + 6 + index * 17;
          const target = DATA[current][m.key][row];
          const value = target * eased;
          const width = (value / 80) * scale;

          ctx.fillStyle = 'rgba(39, 68, 110, 0.06)';
          roundRect(ctx, x0, laneY, scale, 10, 5);
          ctx.fill();

          if (width > 1) {
            ctx.fillStyle = m.color;
            roundRect(ctx, x0, laneY, width, 10, 5);
            ctx.fill();
          }

          if (m.key === 'lwf' && phaseRef.current === 'done') {
            ctx.fillStyle = C.green;
            ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(target.toFixed(1), x0 + width + 10, laneY + 5);
          }
        });

        if (phaseRef.current === 'done' && isStrictBest(current, row)) {
          drawTrophy(ctx, 1002, top + 20);
        }
      });

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

  const pickPair = (nextPair: Pair) => {
    pairRef.current = nextPair;
    setPair(nextPair);
    progressRef.current = 0;
    phaseRef.current = 'idle';
    setPhase('idle');
    setFeedback({ text: `已选 ${PAIR_LABEL[nextPair]}；点开始对比。`, cls: '' });
  };

  const startRace = () => {
    if (phaseRef.current === 'running') return;
    progressRef.current = 0;
    startRef.current = performance.now();
    phaseRef.current = 'running';
    setPhase('running');
    setFeedback({ text: '四条条形从 0 起跑 —— 旧任务一行，新任务一行。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="选择任务对">
        {(Object.keys(PAIR_LABEL) as Pair[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${pair === key ? 'selected' : ''}`}
            aria-pressed={pair === key}
            onClick={() => pickPair(key)}
          >
            {PAIR_LABEL[key]}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button
          type="button"
          className="chip"
          onClick={startRace}
          disabled={phase === 'running'}
        >
          {phase === 'done' ? '重跑' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div
        className="metrics"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
      >
        {METHODS.map((m) => {
          const value = DATA[pair][m.key];
          return (
            <div
              className="metric"
              key={m.key}
              style={m.key === 'lwf' ? { borderColor: C.green } : undefined}
            >
              <div className="l">
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    marginRight: 6,
                    borderRadius: '50%',
                    background: m.color,
                  }}
                />
                {m.label}
              </div>
              <div className="v">
                {value[0].toFixed(1)} / {value[1].toFixed(1)}
              </div>
              <div className="l">旧任务 / 新任务</div>
            </div>
          );
        })}
      </div>
      <div className="step-desc">AlexNet；VOC 看 mAP，其余看准确率，都是越高越好。</div>
    </div>
  );
};

export default M10Race;
