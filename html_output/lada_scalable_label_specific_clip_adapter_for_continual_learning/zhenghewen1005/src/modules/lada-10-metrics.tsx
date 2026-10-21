import { useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, line, roundRect, text } from './lada-kit';

const tasks = ['Aircraft', 'Caltech101', 'DTD', 'EuroSAT', 'Flowers', 'Food', 'MNIST', 'Pets', 'Cars', 'SUN397'];
const matrix = [
  [51.7, 75.2, 36.4, 37.4, 64.1, 83.4, 43.9, 87.8, 65.5, 61.1],
  [53.9, 95.2, 35.7, 37.3, 66.3, 84.2, 44.0, 88.0, 65.3, 61.2],
  [53.9, 95.3, 73.2, 35.5, 65.9, 84.0, 45.9, 88.0, 65.3, 60.9],
  [53.9, 95.3, 73.2, 95.8, 65.9, 84.0, 46.4, 88.0, 65.3, 61.1],
  [54.0, 95.7, 73.7, 95.8, 98.3, 84.0, 45.6, 88.0, 65.3, 61.2],
  [54.0, 95.7, 74.6, 95.7, 98.4, 89.4, 45.6, 88.0, 65.3, 61.1],
  [54.0, 95.7, 74.6, 95.7, 98.4, 89.4, 84.7, 88.0, 65.3, 61.1],
  [54.0, 95.7, 74.5, 95.7, 98.4, 89.4, 98.4, 94.4, 65.3, 61.0],
  [54.0, 96.1, 74.5, 95.7, 98.4, 89.4, 98.8, 94.4, 87.3, 60.9],
  [55.5, 96.2, 75.8, 95.8, 98.4, 89.6, 98.8, 94.5, 87.3, 77.2],
];

export function Lada10Metrics() {
  const [task, setTask] = useState('9');
  const [stage, setStage] = useState('0');
  const [metric, setMetric] = useState('Transfer');
  const k = Number(task), j = Number(stage), series = matrix.map(row => row[k]);
  const included = (index: number) => metric === 'Transfer' ? index < k : metric === 'Average' || index === 9;
  const chosen = series.filter((_, index) => included(index));
  const score = chosen.length ? chosen.reduce((sum, v) => sum + v, 0) / chosen.length : null;
  const state = j < k ? '尚未学习' : j === k ? '本轮学习' : '已经学习';
  const description = metric === 'Transfer' ? k === 0 ? '无学习前阶段' : `第 1—${k} 阶段，任务学习之前` : metric === 'Average' ? '全部 10 个训练阶段' : '第 10 阶段，全部任务学习结束';
  const aggregates = {
    Transfer: tasks.slice(1).map((_, i) => matrix.slice(0, i + 1).reduce((s, row) => s + row[i + 1], 0) / (i + 1)).reduce((s, v) => s + v, 0) / 9,
    Average: matrix.flat().reduce((s, v) => s + v, 0) / 100,
    Last: matrix[9].reduce((s, v) => s + v, 0) / 10,
  };
  return <div className="lada-metrics" onKeyDown={e => e.stopPropagation()}>
    <style>{`.lada-metrics .lada-metrics-legend{font-size:13px;color:#586354;line-height:1.8}.lada-metrics .lada-metrics-strip{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px;margin:9px 0 14px}.lada-metrics .lada-metrics-strip button{font:inherit;font-size:11px;line-height:1.55;min-width:0;padding:5px 1px;border:1px solid #d7dfd0;border-radius:5px;color:#27446e;background:#fff;cursor:pointer}.lada-metrics .lada-metrics-strip button[data-included=true]{background:#e5f1df;border-bottom:3px solid #228d5c}.lada-metrics .lada-metrics-strip button[aria-pressed=true]{outline:2px solid #f07e47;outline-offset:1px}.lada-metrics .lada-metrics-table{max-width:100%;overflow-x:auto;margin:12px 0}.lada-metrics table{border-collapse:collapse;font-size:12px;min-width:930px;width:100%;font-variant-numeric:tabular-nums}.lada-metrics th,.lada-metrics td{padding:8px;border-bottom:1px solid #d7dfd0;text-align:right;white-space:nowrap}.lada-metrics th:first-child{text-align:left}.lada-metrics td[data-selected=true]{outline:2px solid #f07e47;outline-offset:-2px}.lada-metrics td[data-included=true]{background:#e2efdb;color:#195f3e;font-weight:700}.lada-metrics details{margin-top:16px}.lada-metrics summary{cursor:pointer;color:#27446e}.lada-metrics p{line-height:1.8}@media(max-width:420px){.lada-metrics .lada-metrics-strip{grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}}`}</style>
    <Chips label="观察任务" value={task} onChange={setTask} options={tasks.map((label, i) => ({ value: String(i), label }))} />
    <Chips label="计算指标" value={metric} onChange={setMetric} options={['Transfer', 'Average', 'Last'].map(label => ({ value: label, label }))} />
    <Scene label={`${tasks[k]}在十个真实训练阶段的准确率；当前选中第${j + 1}阶段，${series[j]}%；${metric}选取${description}`} onPoint={(x, _y, w) => setStage(String(Math.max(0, Math.min(9, Math.round((x / w - .09) / .82 * 9)))))} draw={(ctx, w, h) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const x = (index: number) => w * (.09 + .82 * index / 9), y = (v: number) => h * (.88 - .73 * v / 100), base = y(0);
      [0, 25, 50, 75, 100].forEach(v => line(ctx, w * .06, y(v), w * .95, y(v), '#dfe6d9', 1));
      series.forEach((v, index) => {
        const color = index < k ? C.blue : C.green;
        ctx.save(); ctx.globalAlpha = included(index) ? .30 : .08; roundRect(ctx, x(index) - w * .028, y(v), w * .056, base - y(v), 3, color); ctx.restore();
        if (index) line(ctx, x(index - 1), y(series[index - 1]), x(index), y(v), color, 2);
        ctx.beginPath(); ctx.arc(x(index), y(v), included(index) ? 5 : 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        if (included(index)) line(ctx, x(index) - w * .026, base + 7, x(index) + w * .026, base + 7, C.green, 3);
        if (index === j) { ctx.beginPath(); ctx.arc(x(index), y(v), 9, 0, Math.PI * 2); ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.stroke(); }
      });
      text(ctx, '100%', w * .04, y(100) - 15, 11, C.muted, 'left');
      text(ctx, '0%', w * .04, base + 20, 11, C.muted, 'left');
    }} />
    <div className="lada-metrics-strip" role="group" aria-label="选择训练阶段，绿底表示参与当前指标计算">{series.map((v, index) => <button key={index} aria-label={`第${index + 1}阶段，学习${tasks[index]}后，${tasks[k]}准确率${v.toFixed(1)}%`} aria-pressed={j === index} data-included={included(index)} onClick={() => setStage(String(index))}>阶段 {index + 1}<br />{v.toFixed(1)}%</button>)}</div>
    <p className="lada-metrics-legend">蓝色为该任务学习前，绿色为本轮及后续阶段；橙圈标出当前阶段。下方绿底数值参与当前指标计算。</p>
    <Readout items={[{ label: `阶段 ${j + 1} · 学习 ${tasks[j]} 后`, value: `${tasks[k]} ${series[j].toFixed(1)}%` }, { label: '任务状态', value: state }, { label: `${tasks[k]} 的 ${metric}`, value: score === null ? '— 无学习前阶段' : `${score.toFixed(2)}%` }, { label: '纳入该任务计算', value: `${chosen.length} 个阶段` }]} />
    <Feedback>在学习 {tasks[j]} 后，{tasks[k]} 准确率为 {series[j].toFixed(1)}%；该任务此时{state}。{metric} 选取{description}{score === null ? '。' : `，该任务均值为 ${score.toFixed(2)}%。`}</Feedback>
    <details><summary>查看真实 10 × 10 阶段矩阵与指标计算</summary>
      <div className="lada-metrics-table" tabIndex={0} role="region" aria-label="Table 8 每阶段准确率矩阵，可横向滚动"><table><caption>Table 8 · LADA · Full-shot · Order I · 准确率 %</caption><thead><tr><th scope="col">学习后阶段</th>{tasks.map(t => <th key={t} scope="col">{t}</th>)}</tr></thead><tbody>{matrix.map((r, ri) => <tr key={ri}><th scope="row">{ri + 1} {tasks[ri]}</th>{r.map((v, ci) => <td key={ci} data-included={ci === k && included(ri)} data-selected={ci === k && ri === j}>{v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>
      <p>记 aₖ⁽ʲ⁾ 为学习第 j 个任务后，在第 k 个任务上的准确率。Transferₖ = Σⱼ₍ⱼ&lt;ₖ₎ aₖ⁽ʲ⁾ / (k−1)，k=2…10；Averageₖ = Σⱼ₌₁¹⁰ aₖ⁽ʲ⁾ / 10；Lastₖ = aₖ⁽¹⁰⁾。先对每个任务计算，再对任务求平均；首任务没有 Transfer。</p>
      <p>按这张保留一位小数的矩阵重算：Transfer {aggregates.Transfer.toFixed(2)}%，Average {aggregates.Average.toFixed(2)}%，Last {aggregates.Last.toFixed(2)}%。论文 Table 2 汇总分别为 61.9%、75.2%、86.9%，汇总与逐格重算受数值舍入影响。</p>
      <p>候选类别名称在任务开始前已给定。实验覆盖 10 个域与 1100 类；训练保留压缩的历史特征统计，可学习记忆随已见类别数量增加。</p>
    </details>
    <Source page={14} label="Table 8 · LADA Full-shot Order I；指标定义见 p. 12 Appendix A Eq. 12–14" />
  </div>;
}
