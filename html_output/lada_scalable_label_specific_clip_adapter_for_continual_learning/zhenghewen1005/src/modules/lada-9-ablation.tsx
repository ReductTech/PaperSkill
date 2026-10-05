import { useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, line, roundRect, text } from './lada-kit';

const ablation = {
  '16': [[59.4, 70.9, 82.1], [59.9, 71.6, 82.6], [61.2, 72.3, 83.0], [61.5, 72.7, 83.1]],
  full: [[59.6, 73.2, 85.6], [60.3, 74.4, 86.3], [61.1, 74.9, 86.8], [61.9, 75.2, 86.9]],
};
const configNames = ['BF', 'BF + DPT', 'BF + LADA', 'BF + LADA + DPT'];
const metrics = ['Transfer', 'Average', 'Last'];

export function Lada9Ablation() {
  const [shot, setShot] = useState<'16' | 'full'>('16');
  const [lada, setLada] = useState(false);
  const [dpt, setDpt] = useState(false);
  const index = Number(lada) * 2 + Number(dpt), rows = ablation[shot], scores = rows[index], baseline = rows[0];
  return <div className="lada-ablation" onKeyDown={e => e.stopPropagation()}>
    <style>{`.lada-ablation .lada-ablation-switches{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.lada-ablation button[role=switch]{border:1px solid #b8c6b0;border-radius:9px;padding:9px 15px;background:#fff;color:#27446e;cursor:pointer;font:inherit}.lada-ablation button[aria-checked=true]{background:#e2efdc;border-color:#228d5c;color:#195f3e}.lada-ablation .lada-ablation-legend{font-size:13px;line-height:1.7;color:#586354}.lada-ablation details{margin-top:16px}.lada-ablation summary{cursor:pointer;color:#27446e}.lada-ablation .lada-ablation-table{max-width:100%;overflow-x:auto;margin:12px 0}.lada-ablation table{border-collapse:collapse;font-size:13px;min-width:440px;width:100%;font-variant-numeric:tabular-nums}.lada-ablation th,.lada-ablation td{padding:8px 10px;border-bottom:1px solid #d7dfd0;text-align:right;white-space:nowrap}.lada-ablation th:first-child,.lada-ablation td:first-child{text-align:left}.lada-ablation tr[aria-selected=true]{background:#e4efdf}.lada-ablation p{line-height:1.8}`}</style>
    <Chips label="训练样本设置" value={shot} onChange={v => setShot(v as '16' | 'full')} options={[{ value: '16', label: '16-shot' }, { value: 'full', label: 'Full-shot' }]} />
    <div className="lada-ablation-switches"><button role="switch" aria-checked={lada} onClick={() => setLada(v => !v)}>{lada ? '已加入' : '加入'} LADA</button><button role="switch" aria-checked={dpt} onClick={() => setDpt(v => !v)}>{dpt ? '已加入' : '加入'} DPT</button></div>
    <Scene label={`${shot === '16' ? '16-shot' : 'Full-shot'} ${configNames[index]} 的三个准确率，与固定 BF 基线比较`} draw={(ctx, w, h) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const x = w * .08, width = w * .84;
      [0, 25, 50, 75, 100].forEach(v => line(ctx, x + width * v / 100, h * .14, x + width * v / 100, h * .88, '#dfe6d8'));
      scores.forEach((v, i) => {
        const y = h * (.23 + i * .27);
        roundRect(ctx, x, y, width, 20, 4, '#e3e9db');
        roundRect(ctx, x, y, width * v / 100, 20, 4, index === 0 ? C.blue : C.green);
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.8; ctx.strokeRect(x, y - 5, width * baseline[i] / 100, 30); ctx.restore();
      });
      text(ctx, '0%', x, h * .11, 12, C.muted);
      text(ctx, '100%', x + width, h * .11, 12, C.muted, 'right');
    }} />
    <p className="lada-ablation-legend">条形从上至下为 Transfer、Average、Last，统一准确率刻度 0—100%。蓝色虚线框始终表示同一设置的 BF。</p>
    <Readout items={scores.map((v, i) => ({ label: metrics[i], value: `${v.toFixed(1)}% (${v >= baseline[i] ? '+' : ''}${(v - baseline[i]).toFixed(1)})` }))} />
    <Feedback>{configNames[index]}：Transfer {scores[0].toFixed(1)}%，Average {scores[1].toFixed(1)}%，Last {scores[2].toFixed(1)}%。相对 BF，Average 增加 {(scores[1] - baseline[1]).toFixed(1)} 个百分点。</Feedback>
    <details><summary>查看 Table 3 完整消融结果与组件作用</summary>
      <p>BF 为文本侧基础框架。LADA 增加标签专属视觉记忆，DPT 引入旧类分布增强特征；两项开关对应四个独立实测配置。</p>
      {(['16', 'full'] as const).map(s => <div className="lada-ablation-table" key={s} tabIndex={0} role="region" aria-label={`${s === '16' ? '16-shot' : 'Full-shot'} 消融表，可横向滚动`}><table><caption>{s === '16' ? '16-shot' : 'Full-shot'} · Table 3 · 准确率 %</caption><thead><tr><th scope="col">配置</th>{metrics.map(m => <th scope="col" key={m}>{m}</th>)}</tr></thead><tbody>{ablation[s].map((r, i) => <tr key={i} aria-selected={s === shot && index === i}><th scope="row">{configNames[i]}</th>{r.map((v, k) => <td key={k}>{v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>)}
    </details>
    <Source page={7} label="Table 3 · BF / DPT / LADA 消融 · 单位 %" />
  </div>;
}
