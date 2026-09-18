import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawAimLine,
  drawSceneLabel,
  SUCCESS,
  TEXT_MUTED,
  BORDER,
} from './billiardsKit';

// §10 module 10.1「成绩竞赛」(1080×280) — 同一指标、同一协议下比名次。
// 四条泳道从同一基线出发，先后到达；末端写裸数字（成功率 %，越高越好）。
// 选手名字只出现在 DOM 里，不进 Canvas。

type Metric = 'robotwin' | 'libero' | 'rmbench';

interface Racer {
  name: string;
  value: number;
}

const RACERS: Record<Metric, Racer[]> = {
  robotwin: [
    { name: 'WLA-0', value: 92.94 },
    { name: 'Fast-WAM', value: 91.88 },
    { name: 'Motus', value: 88.66 },
    { name: 'π0.5', value: 82.74 },
  ],
  libero: [
    { name: 'WLA-0', value: 98.6 },
    { name: 'π0.5', value: 98.0 },
    { name: 'Fast-WAM', value: 97.0 },
    { name: 'Motus', value: 96.6 },
  ],
  rmbench: [
    { name: 'WLA-0', value: 56.5 },
    { name: 'Mem-0', value: 28.5 },
    { name: 'Fast-WAM', value: 13.3 },
    { name: 'π0.5', value: 5.5 },
  ],
};

const METRICS: { id: Metric; chip: string; protocol: string }[] = [
  { id: 'robotwin', chip: 'RoboTwin 2.0', protocol: 'RoboTwin 2.0 · Clean 口径' },
  { id: 'libero', chip: 'LIBERO', protocol: 'LIBERO · 四套件平均' },
  { id: 'rmbench', chip: 'RMBench', protocol: 'RMBench · M(n) 四任务平均' },
];

const CONCLUSION: Record<Metric, string> = {
  robotwin:
    'Clean 口径：WLA-0 92.94%，比 Fast-WAM 的 91.88% 高 1.06 个百分点，且只用 2B 激活参数、没有具身预训练（越高越好）。注意 LingBot-VA 的 92.90% 用的是 seen instructions 设置，不能并列比较。',
  libero: '四套件平均：WLA-0 98.6%，π0.5 98.0%、Fast-WAM 97.0%、Motus 96.6%（越高越好）。',
  rmbench: 'M(n) 四任务平均：WLA-0 56.5%，接近 Mem-0（28.5%）的两倍；Fast-WAM 13.3%（越高越好）。',
};

const REAL_WORLD =
  '真实世界四个长时程任务的成功次数均值（满分 10）：标准 7.5、OOD 物体 5.25、OOD 场景 4.75。';

const GUIDE_TEXT = '选一个指标，按开始对比。';
const RUN_TEXT = '四条泳道从同一基线先后到达……';

const W = 1080;
const H = 280;
const LANE_X = 150;
const LANE_MAX = 820;
const LANES = [92, 128, 164, 200];
const BAR_H = 16;
const NUMBER_X = 1000;
const RUN_SECONDS = 1.6;
const HOLD_SECONDS = 1.6;

const fmt = (v: number) =>
  Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? v.toFixed(1) : v.toFixed(2);

interface Scene {
  metric: Metric;
  /** 起跑进度 0→1 */
  t: number;
  runId: number;
  running: boolean;
  hold: number;
}

/** 名次越靠前越先到：第 1 名 0.55，最后一名 1.0。 */
const arrivalOf = (racers: Racer[], index: number) => {
  const rank = racers.filter((other) => other.value > racers[index].value).length;
  return 0.55 + 0.15 * rank;
};

export const Wla101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Scene>({
    metric: 'robotwin',
    t: 0,
    runId: 0,
    running: false,
    hold: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('robotwin');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: GUIDE_TEXT, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const renderScene = (c: CanvasRenderingContext2D, s: Scene) => {
      clearScene(c, W, H);
      drawTable(c, W, H);

      const racers = RACERS[s.metric];
      const arrivals = racers.map((_, i) => arrivalOf(racers, i));

      racers.forEach((racer, i) => {
        const laneY = LANES[i];
        const isPaper = i === 0;

        // 泳道底线
        drawAimLine(c, LANE_X, laneY, LANE_X + LANE_MAX, laneY, { color: BORDER, width: 1 });

        const grow = easeOutCubic(clamp(s.t / arrivals[i], 0, 1));
        const len = LANE_MAX * (racer.value / 100) * grow;

        if (len > 2) {
          c.save();
          c.fillStyle = isPaper ? SUCCESS : TEXT_MUTED;
          c.fillRect(LANE_X, laneY - BAR_H / 2, len, BAR_H);
          c.restore();
        }

        // 论文方法到终点后加一个深绿圆环
        if (isPaper && s.t >= arrivals[i]) {
          c.save();
          c.strokeStyle = SUCCESS;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(LANE_X + len + 14, laneY, 11, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }

        // 末端裸数字（成功率 %）
        drawSceneLabel(c, fmt(racer.value), NUMBER_X, laneY, {
          size: 14,
          color: s.runId > 0 && s.t >= arrivals[i] ? (isPaper ? SUCCESS : TEXT_MUTED) : TEXT_MUTED,
          align: 'left',
        });
      });

      // 最多两个短标签
      drawSceneLabel(c, '成功率', 48, 84, { size: 12, color: TEXT_MUTED });
      drawSceneLabel(c, '越高越好', 48, 246, { size: 12, color: TEXT_MUTED });
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const s = stateRef.current;

      if (s.running) {
        s.t = Math.min(1, s.t + dt / RUN_SECONDS);
        if (s.t >= 1) {
          s.running = false;
          s.hold = 0;
          setRunning(false);
          setFeedback({ text: `${CONCLUSION[s.metric]} ${REAL_WORLD}`, cls: 'good' });
        }
      } else if (s.hold < HOLD_SECONDS) {
        s.hold += dt;
      }

      renderScene(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        last = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    const s = stateRef.current;
    s.runId += 1;
    s.t = 0;
    s.hold = 0;
    s.running = true;
    setRunning(true);
    setFeedback({ text: RUN_TEXT, cls: '' });
  };

  const onPickMetric = (next: Metric) => {
    const s = stateRef.current;
    s.metric = next;
    s.t = 0;
    s.running = false;
    s.hold = 0;
    setMetric(next);
    setRunning(false);
    setFeedback({ text: GUIDE_TEXT, cls: '' });
  };

  const racers = RACERS[metric];
  const protocol = METRICS.filter((item) => item.id === metric)[0].protocol;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {METRICS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${metric === item.id ? 'selected' : ''}`}
            aria-pressed={metric === item.id}
            onClick={() => onPickMetric(item.id)}
          >
            {item.chip}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button className="tiny" type="button" onClick={onStart} disabled={running}>
          开始对比
        </button>
        <span className="step-desc">{protocol}</span>
      </div>
      <div className="metrics">
        {racers.map((racer, i) => (
          <div className="metric" key={racer.name}>
            <div className="l">
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  marginRight: 6,
                  borderRadius: 2,
                  background: i === 0 ? SUCCESS : TEXT_MUTED,
                }}
              />
              {racer.name}
            </div>
            <div className="v">{fmt(racer.value)}</div>
          </div>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla101;
