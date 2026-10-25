import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLegend,
  useCanvas,
  clamp,
  lerp,
} from '../lib/trailKit';

// 第 10 章模块：单轴竞速 + 已验证数值表 + 边界说明。
// 两个条从 0 出发，长度按论文报告值；切换基准时轴标签、两条、表格与反馈同时替换。

const W = 1080;
const H = 280;
const RACE_MS = 2000;

type Bench = 'wild' | 'science' | 'blip2';

interface RaceState {
  bench: Bench;
  race: 0 | 1 | 2; // 0 = 未开始，1 = 生长中，2 = 到终点
  t0: number;
}

interface Rival { name: string; value: number }
const RES: Record<Bench, { ours: number; rivals: Rival[]; label: string; unit: string }> = {
  wild: {
    ours: 67.3,
    rivals: [
      { name: 'BLIP-2', value: 38.1 },
      { name: 'OpenFlamingo', value: 19.1 },
    ],
    label: 'LLaVA vs BLIP-2 / OpenFlamingo（In-the-Wild 相对分）',
    unit: '相对分',
  },
  science: { ours: 92.53, rivals: [{ name: 'MM-CoT', value: 91.68 }], label: 'LLaVA+裁判 vs MM-CoT（ScienceQA 准确率 %）', unit: '准确率 %（+GPT-4 裁判）' },
  blip2: { ours: 81.7, rivals: [{ name: 'BLIP-2', value: 32.9 }], label: '复杂推理子项 vs BLIP-2（相对分）', unit: '相对分' },
};
const AXIS_MAX: Record<Bench, number> = { wild: 100, science: 100, blip2: 100 };

const BENCHES: Array<{ id: Bench; name: string }> = [
  { id: 'wild', name: 'In-the-Wild' },
  { id: 'science', name: 'ScienceQA' },
  { id: 'blip2', name: 'BLIP-2 对照' },
];

const FB_IDLE = '选一个基准，按下开始。';

function resultFeedback(bench: Bench): { text: string; cls: string } {
  const res = RES[bench];
  return {
    text: `${res.label}：本方法 ${res.ours}，${res.rivals.map((r) => `${r.name} ${r.value}`).join('、')}；均为论文报告值，协议不同不可直接等同。`,
    cls: 'good',
  };
}

function progressOf(s: RaceState, time: number): number {
  if (s.race === 0) return 0;
  if (s.race === 2) return 1;
  return clamp((time - s.t0) / RACE_MS, 0, 1);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const draw = (ctx: CanvasRenderingContext2D, time: number, s: RaceState): void => {
  clearScene(ctx, W, H);
  const res = RES[s.bench];
  const p = easeOutCubic(progressOf(s, time));

  const x0 = 70;
  const x1 = 970;
  const axisY = 196;

  drawLabel(ctx, '同一起点', 70, 40, { color: COLORS.muted, size: 13 });

  // 单轴与刻度
  ctx.save();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, axisY);
  ctx.lineTo(x1, axisY);
  ctx.stroke();
  for (let i = 0; i <= 4; i += 1) {
    const tx = lerp(x0, x1, i / 4);
    ctx.beginPath();
    ctx.moveTo(tx, axisY);
    ctx.lineTo(tx, axisY + 6);
    ctx.stroke();
  }
  ctx.restore();

  // 两条从 0 出发，长度 = value / axisMax
  const full = x1 - x0;
  const axisMax = AXIS_MAX[s.bench];
  // Before the learner starts, show the comparison dimmed at its final length so the
  // canvas is never empty; the race then grows it from zero.
  const idle = s.race === 0;
  const grow = idle ? 1 : p;
  const wOurs = full * clamp(res.ours / axisMax, 0, 1) * grow;
  const rivalWidths = res.rivals.map((r) => full * clamp(r.value / axisMax, 0, 1) * grow);

  ctx.save();
  if (idle) ctx.globalAlpha = 0.45;
  ctx.fillStyle = COLORS.good;
  ctx.fillRect(x0, 92, wOurs, 26);
  res.rivals.forEach((r, i) => {
    ctx.fillStyle = i === 0 ? COLORS.muted : 'rgba(104,119,143,0.55)';
    ctx.fillRect(x0, 134 + i * 22, rivalWidths[i], 20);
  });
  ctx.restore();

  // 只有本方法确实更高时才画领先标记
  const allLower = res.rivals.every((r) => res.ours > r.value);
  if (allLower && !idle && p > 0.99) {
    const ex = x0 + wOurs;
    ctx.save();
    ctx.strokeStyle = COLORS.fader;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, 92);
    ctx.lineTo(ex, 70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex, 70);
    ctx.lineTo(ex + 14, 76);
    ctx.lineTo(ex, 82);
    ctx.closePath();
    ctx.fillStyle = COLORS.fader;
    ctx.fill();
    ctx.restore();
  }

  drawLegend(ctx, 40, 258, [
    { color: COLORS.good, text: '本方法' },
    { color: COLORS.muted, text: res.rivals.map((r) => r.name).join('/') },
    { color: COLORS.fader, text: '领先' },
  ]);
};

export const Ch10Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<RaceState>({ bench: 'wild', race: 0, t0: 0 });
  const [bench, setBench] = useState<Bench>('wild');
  const [race, setRace] = useState<0 | 1 | 2>(0);
  const [fb, setFb] = useState<{ text: string; cls: string }>({ text: FB_IDLE, cls: '' });
  const timer = useRef<number | null>(null);
  const { ref } = useCanvas<RaceState>(draw, W, H, stateRef);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const clearTimer = (): void => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const pick = (next: Bench): void => {
    clearTimer();
    stateRef.current.bench = next;
    stateRef.current.race = 0;
    stateRef.current.t0 = 0;
    setBench(next);
    setRace(0);
    setFb({ text: FB_IDLE, cls: '' });
  };

  const start = (): void => {
    clearTimer();
    const current = stateRef.current.bench;
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      stateRef.current.race = 2;
      stateRef.current.t0 = 0;
      setRace(2);
    } else {
      stateRef.current.race = 1;
      stateRef.current.t0 = performance.now();
      setRace(1);
      timer.current = window.setTimeout(() => {
        stateRef.current.race = 2;
        timer.current = null;
        setRace(2);
      }, RACE_MS);
    }
    setFb(resultFeedback(current));
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {BENCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${bench === item.id ? 'selected' : ''}`}
            aria-pressed={bench === item.id}
            onClick={() => pick(item.id)}
          >
            {item.name}
          </button>
        ))}
        <button type="button" className="tiny" onClick={start}>
          开始比较
        </button>
        <label>
          本方法 <span className="val">{RES[bench].ours}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <div className="note">
        <b>当前对比</b>：{RES[bench].label}
      </div>
      <table className="paper">
        <thead>
          <tr>
            <th>基准</th>
            <th>本方法</th>
            <th>对照</th>
            <th>口径</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>In-the-Wild</td>
            <td>{bench === 'wild' ? <b>67.3</b> : '67.3'}</td>
            <td>BLIP-2 38.1 / OpenFlamingo 19.1</td>
            <td>相对分</td>
          </tr>
          <tr>
            <td>ScienceQA</td>
            <td>{bench === 'science' ? <b>92.53</b> : '92.53'}</td>
            <td>MM-CoT 91.68</td>
            <td>准确率 %（+GPT-4 裁判）</td>
          </tr>
          <tr>
            <td>复杂推理子项</td>
            <td>{bench === 'blip2' ? <b>81.7</b> : '81.7'}</td>
            <td>BLIP-2 32.9</td>
            <td>相对分</td>
          </tr>
        </tbody>
      </table>

      <div className="note">
        表中的数值都是论文报告值：LLaVA-Bench 给的是<b>相对分</b>，ScienceQA 给的是<b>准确率 %</b>，
        两者协议不同，不能当成同一个绝对正确率来比。
      </div>
      <div className="note">
        <b>边界</b>：分类/细粒度弱、会幻觉、继承偏见、基准是相对分。
      </div>
    </div>
  );
};

export default Ch10Mod1;
