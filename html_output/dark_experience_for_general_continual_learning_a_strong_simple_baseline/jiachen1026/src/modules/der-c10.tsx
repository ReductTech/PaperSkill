import React, { useEffect, useState } from 'react';
import { C, useCanvas, drawPhoto, roundRect, Feedback, Source } from './der-kit';

const names = ['ER', 'MER', 'A-GEM-R', 'GSS', 'DER', 'DER++'];
const results: Record<number, { mean: number[]; spread: number[] }> = {
  200: { mean: [49.27, 48.58, 28.34, 43.92, 55.22, 54.16], spread: [2.25, 1.07, 2.24, 2.43, 1.67, 3.02] },
  500: { mean: [65.04, 62.21, 28.13, 54.45, 69.11, 69.62], spread: [1.53, 1.36, 2.62, 3.14, 1.66, 1.59] },
  1000: { mean: [75.18, 70.91, 29.21, 63.84, 75.97, 76.03], spread: [1.50, .76, 2.62, 2.09, 2.08, 1.61] },
};
export function DerC10() {
  const [budget, setBudget] = useState(500);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); setRunning(false); return; }
    let frame = 0, start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / 900); setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick); else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, budget]);
  const selected = results[budget];
  const ref = useCanvas(ctx => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
    for (let x = 180; x <= 1030; x += 170) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 265); ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.stroke(); }
    selected.mean.forEach((v, i) => {
      const y = 15 + i * 42, color = i >= 4 ? C.green : C.blue;
      drawPhoto(ctx, 72, y, 50, 32, [.25, .45, .65], color);
      roundRect(ctx, 180, y + 4, 850, 24, 4, C.axis);
      if (progress > 0) roundRect(ctx, 180, y + 4, Math.max(1, 850 * v / 100 * progress), 24, 4, color);
      if (i === 5 && progress > 0) { ctx.beginPath(); ctx.moveTo(180, y + 16); ctx.lineTo(180 + 850 * v / 100 * progress, y + 16); ctx.strokeStyle = C.bg; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]); }
    });
  }, [budget, progress]);
  const delta = selected.mean[5] - selected.mean[0];
  return <div className="der-widget">
    <canvas ref={ref} className="der-canvas" aria-label={`MNIST-360 缓存 ${budget}，六种方法的最终准确率结果揭示图`} />
    <div className="der-controls">
      <label>缓存容量 K <select aria-label="MNIST-360 缓存容量" value={budget} onChange={e => { setRunning(false); setProgress(0); setBudget(Number(e.target.value)); }}><option value={200}>200</option><option value={500}>500</option><option value={1000}>1000</option></select></label>
      <button type="button" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>显示论文结果</button>
      <button type="button" onClick={() => { setRunning(false); setProgress(0); }}>重置展示</button>
    </div>
    <Feedback tone={budget === 200 ? 'purple' : 'green'}>{progress === 0 ? '先选择容量，再显示论文结果。下表始终保留精确数值；动画只揭示结果，不执行训练。' : budget === 200 ? 'K=200 时 DER 为 55.22%，DER++ 为 54.16%。添加标签回放并不保证每个预算的均值都更高。' : `K=${budget} 时，DER++ 比 ER 的最终准确率均值高 ${delta.toFixed(2)} 个百分点；表格离散量提醒我们不能把均值差直接当作显著性结论。`}</Feedback>
    <div className="der-prose">
      <p>结果图从上到下依次为 ER、MER、A-GEM-R、GSS、DER、DER++，横轴是最终测试准确率 0–100%，六条竖刻线依次为 0、20、40、60、80、100%。绿色表示论文方法，DER++ 用白色虚线区分。各预算比较的是同一个 MNIST-360 协议，单位为 %，越高越好。</p>
      <div className="der-table-wrap"><table><caption>正文 Table 3：MNIST-360 完整六方法对照</caption><thead><tr><th>方法</th><th>K=200</th><th>K=500</th><th>K=1000</th></tr></thead><tbody>{names.map((name, i) => <tr key={name}><th scope="row">{name}</th>{[200, 500, 1000].map(k => <td key={k}>{results[k].mean[i].toFixed(2)} ± {results[k].spread[i].toFixed(2)}</td>)}</tr>)}</tbody></table></div>
      <p>同表的离线 JOINT 参照为 82.98 ± 3.24，无回放 SGD 为 19.09 ± 0.69。这里保留原表“均值 ± 报告的离散量”格式；不擅自把它解释为置信区间，不从这张表反推出配对显著性检验。论文标准基准明确跨 10 个不同初始化运行；任务顺序固定，不涵盖所有流排列的波动。</p>
      <p>ER 与 DER 的差别支持“旧的完整输出关系有额外价值”，但它不是独立隔离每个机制的完全因果实验。DER++ 与 DER 的比较说明加入旧标签通常有帮助，也展示了有限预算下的例外。这个合成流测试了没有显式边界时的适应与保留，没有验证未知类别无限增长、无监督标签或真实业务延迟。</p>
      <Source>正文第 7 页，§4.3，Table 3。</Source>
    </div>
  </div>;
}
