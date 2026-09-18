import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  第 10 章交互模块：主结果竞速（P8）+ 消融对比（P4）
//  数据来源：论文表 2（主结果）、表 6（消融，六论文子集重跑）
// ============================================================================

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

/* ---------------- Ch10.1：主结果竞速（P8） ---------------- */
type Metric = 'f1' | 'prec' | 'esvr' | 'time';

const METRICS: Record<Metric, { label: string; dir: 'up' | 'down'; unit: string }> = {
  f1: { label: 'F1（越高越好）', dir: 'up', unit: '' },
  prec: { label: '精确率 P_verified（越高越好）', dir: 'up', unit: '' },
  esvr: { label: 'ESVR 编辑安全违规率（越低越好）', dir: 'down', unit: '' },
  time: { label: '耗时 W（越低越好）', dir: 'down', unit: 'h' },
};

const RACERS = [
  { name: 'Forward', color: '#c9d3dd', values: { f1: null, prec: null, esvr: 0.24, time: 0.31 } },
  { name: 'Critic', color: MUTED, values: { f1: 0.446, prec: 0.577, esvr: null, time: 0.51 } },
  { name: 'Judge', color: BLUE, values: { f1: 0.519, prec: 0.663, esvr: 0.11, time: 2.06 } },
  { name: 'Naive', color: ORANGE, values: { f1: 0.459, prec: 0.511, esvr: null, time: 8.37 } },
  { name: 'PaperJury', color: GREEN, values: { f1: 0.656, prec: 0.847, esvr: 0.025, time: 2.47 } },
];

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'f1' as Metric, racing: false, startT: 0, animT: 0 });
  const [metric, setMetric] = useState<Metric>('f1');
  const [racing, setRacing] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '按下"开始对比"，五个系统从同一基线竞速到各自指标值。PaperJury 用最少的编辑换取最高的质量。',
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

    const render = (s: { metric: Metric; racing: boolean; startT: number; animT: number }, now: number) => {
      const m = METRICS[s.metric];
      let t = s.animT;
      if (s.racing) t = Math.min(1, (now - s.startT) / 2600);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = TEXT;
      ctx.font = '22px sans-serif';
      ctx.fillText(m.label, 40, 40);

      // 值域
      let maxV = 1;
      const vals = RACERS.map((r) => (r.values[s.metric] as number | null) ?? 0);
      maxV = Math.max(...vals, 0.001) * 1.12;

      RACERS.forEach((r, i) => {
        const v = r.values[s.metric] as number | null;
        const y = 70 + i * 42;
        const grow = v === null ? 0 : t * (0.75 + i * 0.05);
        const shown = v === null ? 0 : v * grow;
        const frac = v === null ? 0 : clamp(shown / maxV, 0, 1);
        ctx.fillStyle = r.color;
        ctx.fillRect(220, y, frac * 680, 26);
        ctx.fillStyle = TEXT;
        ctx.font = '18px sans-serif';
        ctx.fillText(r.name, 40, y + 19);
        if (v !== null && t > 0.15) {
          ctx.fillStyle = r.color;
          ctx.font = '20px sans-serif';
          ctx.fillText(shown.toFixed(3) + m.unit, 220 + frac * 680 + 10, y + 19);
        }
      });

      // 完成标记
      if (t >= 1) {
        const best = RACERS.reduce((a, b) => {
          const av = a.values[s.metric] as number | null;
          const bv = b.values[s.metric] as number | null;
          if (av === null) return b;
          if (bv === null) return a;
          return m.dir === 'up' ? (av > bv ? a : b) : av < bv ? a : b;
        }, RACERS[0]);
        ctx.font = '26px sans-serif';
        ctx.fillText('🏆', 40, 264);
        ctx.fillStyle = TEXT;
        ctx.font = '18px sans-serif';
        ctx.fillText(`${best.name} 在 ${m.label} 上${m.dir === 'up' ? '领先' : '最优'}`, 80, 268);
      }
    };

    const tick = (now: number) => {
      render(stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startRace = () => {
    stateRef.current = { ...stateRef.current, racing: true, startT: performance.now(), animT: 0 };
    setRacing(true);
    setFeedback({
      text:
        metric === 'f1'
          ? 'PaperJury F1=0.656 领先（Judge Loop 0.519），且配对 F1 在全部 12 篇论文上对每个基线获胜。'
          : metric === 'prec'
          ? '审计精确率 0.847（98 个审计问题）为全场最高，同时维持高召回。'
          : metric === 'esvr'
          ? 'ESVR=0.025，约为 Judge Loop（0.110）的 1/4.4——守卫链阻断 17% 补丁换来的安全。'
          : '耗时上 PaperJury（2.47h）与 Judge Loop（2.06h）接近，远低于 Naive（8.37h）。',
      cls: 'good',
    });
  };
  const resetRace = () => {
    stateRef.current = { ...stateRef.current, racing: false, animT: 0 };
    setRacing(false);
    setFeedback({ text: '按下"开始对比"，五个系统从同一基线竞速到各自指标值。', cls: '' });
  };
  const switchMetric = (m: Metric) => {
    stateRef.current = { metric: m, racing: false, startT: 0, animT: 0 };
    setMetric(m);
    setRacing(false);
    setFeedback({ text: `已切换至「${METRICS[m].label}」。按下"开始对比"重新竞速。`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${metric === 'f1' ? 'selected' : ''}`} onClick={() => switchMetric('f1')}>
          F1
        </button>
        <button type="button" className={`chip ${metric === 'prec' ? 'selected' : ''}`} onClick={() => switchMetric('prec')}>
          精确率
        </button>
        <button type="button" className={`chip ${metric === 'esvr' ? 'selected' : ''}`} onClick={() => switchMetric('esvr')}>
          ESVR
        </button>
        <button type="button" className={`chip ${metric === 'time' ? 'selected' : ''}`} onClick={() => switchMetric('time')}>
          耗时
        </button>
        <button type="button" onClick={startRace} disabled={racing}>
          开始对比
        </button>
        <button type="button" onClick={resetRace}>
          重置
        </button>
      </div>
      <table className="evidence-table">
        <thead>
          <tr>
            <th>方法</th>
            <th>F1 ↑</th>
            <th>P_verified ↑</th>
            <th>Acc_v ↑</th>
            <th>Acc_r ↑</th>
            <th>ESVR ↓</th>
            <th>轮数 K</th>
            <th>耗时 W</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Forward-only</td><td>n/a</td><td>n/a</td><td>n/a</td><td>n/a</td><td>0.240</td><td>1</td><td>0.31h</td></tr>
          <tr><td>Critic only</td><td>0.446</td><td>0.577</td><td>n/a</td><td>n/a</td><td>n/a</td><td>1</td><td>0.51h</td></tr>
          <tr><td>Judge loop</td><td>0.519</td><td>0.663</td><td>0.681</td><td>n/a</td><td>0.110</td><td>3.33 (2/12触顶)</td><td>2.06h</td></tr>
          <tr><td>Naive gen</td><td>0.459</td><td>0.511</td><td>n/a</td><td>n/a</td><td>n/a</td><td>1</td><td>8.37h</td></tr>
          <tr className="row-best"><td>PaperJury</td><td>0.656</td><td>0.847</td><td>0.887</td><td>0.913</td><td>0.025</td><td>3.08 (0/12触顶)</td><td>2.47h</td></tr>
        </tbody>
      </table>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- Ch10.2：消融实验（P4 芯片） ---------------- */
type AbMetric = 'f1' | 'accv' | 'esvr' | 'time';

const AB_METRICS: Record<AbMetric, { label: string; dir: 'up' | 'down'; unit: string }> = {
  f1: { label: 'F1（越高越好）', dir: 'up', unit: '' },
  accv: { label: '裁决一致性 Acc_v（越高越好）', dir: 'up', unit: '' },
  esvr: { label: 'ESVR（越低越好）', dir: 'down', unit: '' },
  time: { label: '耗时 W（越低越好）', dir: 'down', unit: 'h' },
};

const ABLATIONS = [
  { name: 'Full', full: true, values: { f1: 0.649, accv: 0.881, esvr: 0.029, time: 2.43 } },
  { name: 'w/o 有界审稿', full: false, values: { f1: 0.572, accv: 0.868, esvr: 0.042, time: 4.81 } },
  { name: 'w/o 路由', full: false, values: { f1: 0.636, accv: 0.806, esvr: 0.047, time: 3.49 } },
  { name: 'w/o 审判', full: false, values: { f1: 0.642, accv: 0.728, esvr: 0.052, time: 2.18 } },
  { name: 'w/o 主线', full: false, values: { f1: 0.632, accv: 0.857, esvr: 0.112, time: 2.37 } },
  { name: 'w/o 守卫链', full: false, values: { f1: 0.627, accv: 0.859, esvr: 0.181, time: 1.94 } },
];

export const Ch10Ablation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'esvr' as AbMetric });
  const [metric, setMetric] = useState<AbMetric>('esvr');
  const [feedback, setFeedback] = useState({
    text: '消融（表 6，六论文子集）：移除守卫链使 ESVR 飙升 +0.152，是安全退化最大的组件。',
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

    const render = (s: { metric: AbMetric }) => {
      const m = AB_METRICS[s.metric];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = TEXT;
      ctx.font = '22px sans-serif';
      ctx.fillText('各组件边际贡献（' + m.label + '）', 40, 40);

      const fullV = ABLATIONS[0].values[s.metric];
      const values = ABLATIONS.map((a) => a.values[s.metric]);
      const maxV = Math.max(...values, 0.001) * 1.12;

      ABLATIONS.forEach((a, i) => {
        const v = a.values[s.metric];
        const y = 70 + i * 34;
        const frac = clamp(v / maxV, 0, 1);
        // 相对 Full 的退化（向上/向下取决于指标方向）
        const delta = m.dir === 'up' ? fullV - v : v - fullV;
        const bad = !a.full && delta > 0.005;
        ctx.fillStyle = a.full ? GREEN : bad ? RED : BLUE;
        ctx.fillRect(280, y, frac * 620, 22);
        ctx.fillStyle = TEXT;
        ctx.font = '16px sans-serif';
        ctx.fillText(a.name, 40, y + 17);
        ctx.fillStyle = MUTED;
        ctx.font = '16px sans-serif';
        ctx.fillText(v.toFixed(3) + m.unit, 920, y + 17);
        if (!a.full) {
          ctx.fillStyle = bad ? RED : MUTED;
          ctx.font = '14px sans-serif';
          ctx.fillText((m.dir === 'up' ? -delta : delta).toFixed(3), 960, y + 17);
        }
      });

      ctx.fillStyle = MUTED;
      ctx.font = '15px sans-serif';
      ctx.fillText('绿色=完整系统；红色=该指标下显著退化；括号为相对完整系统的 Δ', 40, 268);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const switchMetric = (m: AbMetric) => {
    stateRef.current = { metric: m };
    setMetric(m);
    const notes: Record<AbMetric, string> = {
      f1: '移除有界审稿使 F1 下降最多（-0.077）且耗时翻倍——有界审稿是问题发现质量的关键。',
      accv: '移除正当程序审判使裁决一致性下降最多（-0.153）——审判是裁决质量的支柱。',
      esvr: '移除守卫链使 ESVR 升至 0.181（+0.152）、移除主线升至 0.112（+0.083）——两者是编辑安全的核心。',
      time: '移除路由使成本从 2.43h 升至 3.49h——确定性路由节省了语义裁决资源。',
    };
    setFeedback({ text: notes[m], cls: m === 'esvr' || m === 'accv' ? 'bad' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${metric === 'esvr' ? 'selected' : ''}`} onClick={() => switchMetric('esvr')}>
          ESVR 安全
        </button>
        <button type="button" className={`chip ${metric === 'accv' ? 'selected' : ''}`} onClick={() => switchMetric('accv')}>
          裁决一致性
        </button>
        <button type="button" className={`chip ${metric === 'f1' ? 'selected' : ''}`} onClick={() => switchMetric('f1')}>
          F1
        </button>
        <button type="button" className={`chip ${metric === 'time' ? 'selected' : ''}`} onClick={() => switchMetric('time')}>
          耗时
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
