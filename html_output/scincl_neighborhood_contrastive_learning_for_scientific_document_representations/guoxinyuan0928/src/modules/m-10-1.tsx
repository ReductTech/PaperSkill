import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 10.1：SCIDOCS 结果赛跑（实测值，含 SPECTER 领先的指标）。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', blue: '#27446e' };
type Metric = 'avg' | 'mesh' | 'mag' | 'rec';
// [SciNCL, SPECTER, Oracle(仅参考; rec/mag 有 oracle 值), SciNCL 是否胜]
const METRICS: Record<Metric, { name: string; vals: [number, number, number | null]; scinclWins: boolean; fb: string; cls: string }> = {
  avg: { name: '平均分', vals: [81.8, 80.0, 83.0], scinclWins: true, fb: '平均分：SciNCL 81.8 vs SPECTER 80.0（+1.8，9/12 指标领先；10 个随机种子平均）。', cls: 'good' },
  mesh: { name: 'MeSH F1', vals: [88.7, 86.4, 94.8], scinclWins: true, fb: 'MeSH 分类 F1：88.7 vs 86.4（+2.3）。', cls: 'good' },
  mag: { name: 'MAG F1', vals: [81.4, 82.0, 87.1], scinclWins: false, fb: 'MAG 分类 F1：81.4 vs 82.0——SPECTER 领先 0.6，这是 SciNCL 未拿下的指标之一。', cls: 'bad' },
  rec: { name: '推荐 P@1', vals: [19.3, 20.0, 19.4], scinclWins: false, fb: '推荐 P@1：19.3 vs 20.0——SPECTER 领先；nDCG 上两者持平（53.9）。', cls: 'bad' },
};
const DUR = 1800;

export const M101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ racing: false, t0: 0, metric: 'avg' as Metric });
  const [metric, setMetric] = useState<Metric>('avg');
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState({ text: '按下按钮查看实测成绩。', cls: '' });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const s = stateRef.current;
      const m = METRICS[s.metric];
      const t = s.racing ? Math.min(1, (performance.now() - s.t0) / DUR) : 1;
      const vMax = 100;
      const x0 = 150, maxW = 700, yTop = 40, rowH = 56;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.font = '15px sans-serif'; ctx.textAlign = 'right';
      const rows: Array<[string, number | null, string, boolean]> = [
        ['SciNCL', m.vals[0], m.scinclWins ? C.green : C.red, true],
        ['SPECTER', m.vals[1], C.red, false],
        ['Oracle（上限）', m.vals[2], C.muted, false],
      ];
      rows.forEach(([label, v, color, hl], i) => {
        if (v === null) return;
        const y = yTop + i * rowH;
        ctx.fillStyle = C.text; ctx.fillText(label, x0 - 12, y + 22);
        const grow = hl ? Math.min(1, Math.max(0, t * 1.4)) : Math.min(1, Math.max(0, (t - 0.2) * 1.4));
        const w = (v / vMax) * maxW * grow;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
        ctx.fillRect(x0, y, maxW, 30); ctx.strokeRect(x0, y, maxW, 30);
        if (hl) { ctx.fillStyle = color; ctx.fillRect(x0 + 1, y + 1, Math.max(1, w), 28); }
        else { ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.strokeRect(x0 + 1.5, y + 1.5, Math.max(1, w), 27); }
        ctx.fillStyle = C.text; ctx.textAlign = 'left';
        ctx.font = '18px sans-serif';
        ctx.fillText(grow >= 1 ? v.toFixed(1) : '', x0 + maxW + 12, y + 22);
        ctx.font = '15px sans-serif'; ctx.textAlign = 'right';
      });
      // 奖杯仅在 SciNCL 领先时
      if (m.scinclWins && t >= 1) {
        ctx.font = '30px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('🏆', x0 + maxW + 80, yTop + 28);
      }
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'left';
      ctx.fillText('SCIDOCS 测试集 · 含泄漏设置 · 10 个随机种子平均 · 越高越好 · Oracle 为该设置下的参考上限', 150, yTop + 3 * rowH + 18);
    };
    let raf = 0;
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) raf = requestAnimationFrame(tick); }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const start = () => {
    stateRef.current.racing = true;
    stateRef.current.t0 = performance.now();
    setRunning(true);
    const m = METRICS[stateRef.current.metric];
    setFb({ text: '比赛进行中——注意各条起点相同。', cls: '' });
    setTimeout(() => {
      setRunning(false);
      setFb({ text: m.fb, cls: m.cls });
    }, DUR + 100);
  };
  const switchMetric = (m: Metric) => {
    stateRef.current.metric = m;
    stateRef.current.racing = true;
    stateRef.current.t0 = performance.now() - DUR; // 立即到位
    setMetric(m);
    setRunning(false);
    setFb({ text: METRICS[m].fb, cls: METRICS[m].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={start}>{running ? '比赛中…' : '开始比赛'}</button>
        {(Object.keys(METRICS) as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'active' : ''}`} onClick={() => switchMetric(m)}>{METRICS[m].name}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M101;
