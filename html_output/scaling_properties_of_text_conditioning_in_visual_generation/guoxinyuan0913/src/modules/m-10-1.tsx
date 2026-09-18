import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clearScene, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

// §10 模块 10.1：五项指标竞赛（P8 + 证据表；技术视图）——Table 2 数值，均为越高越好
const W = 1080, H = 280;
type Metric = 'GenEval' | 'GenEval2 GM' | 'DPG' | 'WISE' | 'CoReBench';
const SYSTEMS = ['Qwen-Image 原版', 'Qwen-Image 官方PE', '匹配 NL 重训', 'Ours（结构化）'];
const DATA: Record<Metric, number[]> = {
  'GenEval': [0.87, 0.91, 0.91, 0.94],
  'GenEval2 GM': [33.8, 52.8, 56.2, 72.5],
  'DPG': [88.32, 87.2, 87.8, 90.71],
  'WISE': [0.62, 0.83, 0.84, 0.89],
  'CoReBench': [58.9, 74.7, 76.1, 85.2],
};

export const M1011: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>('GenEval2 GM');
  const [prog, setProg] = useState(0); // 0..1
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (ts: number) => {
      const k = Math.min(1, (ts - t0) / 1600);
      setProg(k);
      if (k < 1) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, metric]);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clearScene(ctx, W, H);
    const vals = DATA[metric];
    const max = Math.max(...vals) * 1.1;
    SYSTEMS.forEach((name, i) => {
      const y = 40 + i * 56;
      const wFull = (vals[i] / max) * 620;
      const w = wFull * prog;
      ctx.fillStyle = i === 3 ? C.orange : i === 2 ? C.blue : C.muted;
      ctx.fillRect(240, y, w, 34);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(240, y, wFull, 34);
      ctx.fillStyle = C.text; ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.fillText(name, 30, y + 22);
      ctx.fillStyle = i === 3 ? C.orange : C.muted;
      ctx.font = 'bold 15px monospace';
      ctx.fillText(String(vals[i]), 250 + wFull, y + 22);
    });
    drawSceneLabel(ctx, `${metric}（越高越好）· Table 2`, 30, 24, true);
    if (prog >= 1) {
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
      ctx.strokeRect(238, 40 + 3 * 56, 624, 38);
    }
  }, [metric, prog]);

  const fb = running
    ? { text: '竞赛进行中……', cls: 'fb-blue' }
    : metric === 'DPG'
      ? { text: `DPG 差距最小（90.71 vs 87.80）：整体描述类基准对结构差异相对不敏感（Table 4 注）`, cls: 'fb-blue' }
      : { text: `${metric}：Ours ${DATA[metric][3]} vs 匹配 NL ${DATA[metric][2]}——同样的骨干、数据与预算，换接口重训无法复现增益（Table 2）`, cls: 'fb-green' };

  return (
    <div className="widget">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W }} />
      <div className="ctrl-row">
        <button className="chip chip-on" onClick={() => { setProg(0); setRunning(true); }}>开始比较</button>
        {(Object.keys(DATA) as Metric[]).map((m) => (
          <button key={m} className={metric === m ? 'chip chip-on' : 'chip'} onClick={() => { setMetric(m); setProg(1); setRunning(false); }}>
            {m}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
