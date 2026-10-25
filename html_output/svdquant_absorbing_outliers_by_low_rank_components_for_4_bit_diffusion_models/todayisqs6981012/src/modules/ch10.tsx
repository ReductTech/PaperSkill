import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, text, rrect } from './kit';

const W = 1080;
const H = 280;

// 效率指标（arXiv:2411.05007，vs NF4 W4A16 基线 = 1×，方向均为越高越好）
const METRICS = [
  { id: 'size', name: '模型体积压缩', value: 3.6, unit: '×', note: 'FLUX.1-12B：22.2 → 6.1 GiB（含 0.3 GiB 低秩分支）' },
  { id: 'mem', name: '显存下降', value: 3.5, unit: '×', note: 'FLUX.1-12B' },
  { id: 'int4', name: 'INT4 加速', value: 3.0, unit: '×', note: 'RTX 4090，vs NF4 W4A16' },
  { id: 'nvfp4', name: 'NVFP4 加速', value: 3.1, unit: '×', note: 'RTX 5090' },
];

export const Ch10Race: React.FC<WidgetProps> = () => {
  const [metricIdx, setMetricIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const m = METRICS[metricIdx];

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    const bx = 220;
    const maxW = 520;
    // 基线（NF4 W4A16 = 1×）
    rrect(ctx, bx, 110, maxW / 4, 34, C.axis, C.axis, 1, 6);
    text(ctx, '基线 NF4 W4A16 = 1×', bx + maxW / 8, 92, C.muted, 14, 'center');
    // SVDQuant（进度增长）
    const w = (maxW / 4) * m.value * progress;
    rrect(ctx, bx, 110, w, 34, C.green, C.green, 1, 6);
    if (progress > 0.08) {
      text(ctx, m.value.toFixed(1) + m.unit, bx + w + 12, 127, C.green, 16);
    }
    text(ctx, 'SVDQuant', bx - 40, 127, C.green, 15, 'right');
    text(ctx, `${m.name}  ↑ 越高越好`, W / 2, 40, C.blue, 16, 'center');
    text(ctx, m.note, W / 2, 200, C.muted, 13, 'center');
  });

  const start = () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    let p = 0;
    timer.current = window.setInterval(() => {
      p += 0.03;
      const np = Math.min(1, p);
      setProgress(np);
      if (np >= 1) {
        if (timer.current) clearInterval(timer.current);
        setRunning(false);
      }
    }, 30);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {METRICS.map((mm, i) => (
          <button key={mm.id} className={`chip ${i === metricIdx ? 'selected' : ''}`} onClick={() => { setMetricIdx(i); setProgress(0); }}>
            {mm.name}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button className="tiny" onClick={start} disabled={running}>
          {progress >= 1 ? '重新对比' : '开始对比'}
        </button>
        <span style={{ color: 'var(--slate)', fontSize: 'var(--ui-type-body-small-size)' }}>
          对照基线：NF4 W4A16（weight-only 4-bit）· 方向 ↑ 越高越好
        </span>
      </div>
      <div className={`feedback ${progress >= 1 ? 'good' : ''}`}>
        {progress >= 1
          ? `${m.name} ${m.value}${m.unit} 来自论文已验证结果。但要看清分母：8.7×/10.1× 的大加速包含「消除 CPU 卸载」，与 kernel 本身加速是两回事。`
          : '点击「开始对比」，看当前指标从基线 1× 跑出。'}
      </div>
      <details className="deep-reading">
        <summary>深入阅读：论文报告的关键效率数字（Fig.8 / 正文）</summary>
        <div className="table-scroll">
          <table className="paper">
            <thead>
              <tr>
                <th>指标（↑ 越高越好）</th>
                <th>SVDQuant</th>
                <th>基线 NF4 W4A16</th>
                <th>条件</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>模型体积</td>
                <td>6.1 GiB（3.6×）</td>
                <td>22.2 GiB</td>
                <td>FLUX.1-12B</td>
              </tr>
              <tr>
                <td>显存</td>
                <td>3.5×</td>
                <td>1×</td>
                <td>FLUX.1-12B</td>
              </tr>
              <tr>
                <td>INT4 加速</td>
                <td>3.0×</td>
                <td>1×</td>
                <td>RTX 4090</td>
              </tr>
              <tr>
                <td>NVFP4 加速</td>
                <td>3.1×</td>
                <td>1×</td>
                <td>RTX 5090</td>
              </tr>
              <tr>
                <td>笔记本加速</td>
                <td>10.1×</td>
                <td>1×</td>
                <td>笔记本 4090，含消除 CPU 卸载</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

export default Ch10Race;
