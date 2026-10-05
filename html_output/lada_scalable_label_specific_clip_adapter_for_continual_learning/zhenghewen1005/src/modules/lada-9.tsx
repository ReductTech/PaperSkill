import { useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, drawAlbum, roundRect, text } from './lada-kit';

const capacityRows = [
  [8, 1, 60.9, 74.7, 86.7, .280, 17.84, 4.51],
  [8, 4, 61.7, 75.1, 86.7, .287, 18.14, 4.51],
  [8, 16, 62.2, 75.1, 86.7, .318, 19.05, 4.51],
  [16, 1, 61.4, 75.1, 86.9, .281, 18.01, 9.01],
  [16, 4, 61.9, 75.2, 86.9, .289, 18.51, 9.01],
  [16, 16, 62.3, 74.8, 86.9, .330, 20.62, 9.01],
  [32, 1, 60.9, 74.7, 86.9, .282, 18.42, 17.51],
  [32, 4, 61.2, 74.6, 86.9, .297, 18.97, 17.51],
  [32, 16, 61.9, 74.0, 86.9, .358, 23.13, 17.51],
];

export function Lada9() {
  const [l1, setL1] = useState('16');
  const [l2, setL2] = useState('4');
  const row = capacityRows.find(r => r[0] === Number(l1) && r[1] === Number(l2))!;
  const [, , transfer, average, last, seconds, memory, params] = row;
  return <div className="lada-nine" onKeyDown={e => e.stopPropagation()}>
    <style>{`.lada-nine details{margin-top:16px}.lada-nine summary{cursor:pointer;color:#27446e}.lada-nine .lada-nine-legend{font-size:13px;line-height:1.8;color:#586354}.lada-nine .lada-nine-table{max-width:100%;overflow-x:auto;margin:12px 0}.lada-nine table{border-collapse:collapse;font-size:13px;min-width:650px;width:100%;font-variant-numeric:tabular-nums}.lada-nine th,.lada-nine td{padding:8px 10px;border-bottom:1px solid #d7dfd0;text-align:right;white-space:nowrap}.lada-nine tr[aria-selected=true]{background:#e4efdf;color:#195f3e}.lada-nine th{font-weight:600;color:#27446e}.lada-nine p{line-height:1.8}`}</style>
    <Chips label="λ₁ · 每类记忆向量" value={l1} onChange={setL1} options={['8', '16', '32'].map(value => ({ value, label: value }))} />
    <Chips label="λ₂ · 每类分布原型" value={l2} onChange={setL2} options={['1', '4', '16'].map(value => ({ value, label: value }))} />
    <Scene label={`每类${l1}个记忆向量与${l2}个原型；右侧从上到下为参数量、峰值显存和每批耗时`} draw={(ctx, w, h) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      drawAlbum(ctx, w * .035, h * .17, w * .38, h * .68);
      const slot = w * .038, gap = w * .038;
      for (let j = 0; j < 32; j++) {
        const x = w * .072 + (j % 8) * gap, y = h * .29 + Math.floor(j / 8) * h * .105;
        roundRect(ctx, x, y, slot * .70, h * .066, 2, j < Number(l1) ? C.green : '#e7ecdf', j < Number(l1) ? C.green : C.line);
      }
      for (let j = 0; j < 16; j++) { ctx.beginPath(); ctx.arc(w * .075 + (j % 8) * gap, h * .76 + Math.floor(j / 8) * 12, Math.max(2, w * .005), 0, Math.PI * 2); ctx.fillStyle = j < Number(l2) ? C.purple : C.line; ctx.fill(); }
      text(ctx, '记忆与原型', w * .23, h * .10, 13, C.muted, 'center');
      text(ctx, '资源成本', w * .70, h * .10, 13, C.muted, 'center');
      [params / 20, memory / 25, seconds / .4].forEach((ratio, i) => {
        const x = w * .49, y = h * (.24 + i * .24), bw = w * .43;
        roundRect(ctx, x, y, bw, 17, 4, '#e3e9da');
        roundRect(ctx, x, y, bw * ratio, 17, 4, [C.blue, C.purple, C.orange][i]);
        for (let k = 0; k <= 4; k++) { ctx.fillStyle = C.line; ctx.fillRect(x + bw * k / 4, y + 22, 1, 4); }
      });
    }} />
    <p className="lada-nine-legend">右侧独立刻度，自上而下：参数 0—20 M（蓝）、显存 0—25 GB（紫）、耗时 0—0.4 s/batch（橙）。左侧矩形为记忆向量，圆形为分布原型。</p>
    <Readout items={[{ label: 'Transfer', value: `${transfer.toFixed(1)}%` }, { label: 'Average', value: `${average.toFixed(1)}%` }, { label: 'Last', value: `${last.toFixed(1)}%` }, { label: 'LADA 参数', value: `${params.toFixed(2)} M` }, { label: '峰值显存', value: `${memory.toFixed(2)} GB` }, { label: '最终任务每批耗时', value: `${seconds.toFixed(3)} s` }]} />
    <Feedback>λ₁={l1}、λ₂={l2}：Average {average.toFixed(1)}%，Last {last.toFixed(1)}%；LADA 参数 {params.toFixed(2)} M，峰值显存 {memory.toFixed(2)} GB，每批 {seconds.toFixed(3)} s。{l1 === '16' && l2 === '4' ? '这是论文的默认配置。' : `相对默认 16/4，Average ${(average - 75.2).toFixed(1)} 个百分点，峰值显存 ${memory >= 18.51 ? '+' : ''}${(memory - 18.51).toFixed(2)} GB。`}{l1 === '32' ? '此设置中部分类别的训练样本数少于 32。' : ''}</Feedback>
    <details><summary>查看 Table 4 全部九组实测配置</summary>
      <div className="lada-nine-table" tabIndex={0} role="region" aria-label="Table 4 容量实验数据，可横向滚动"><table><caption>Full-shot · Table 4 · 准确率单位 %</caption><thead><tr>{['λ₁', 'λ₂', 'Transfer', 'Average', 'Last', 's/batch', 'GB', '参数 M'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{capacityRows.map(r => <tr key={`${r[0]}-${r[1]}`} aria-selected={r === row}>{r.map((v, i) => <td key={i}>{i < 2 ? v : v.toFixed(i === 5 ? 3 : i > 5 ? 2 : 1)}</td>)}</tr>)}</tbody></table></div>
      <p>λ₁控制可学习记忆向量数，λ₂控制保留的 GMM 成分数。时间取最后任务每个 batch 的训练耗时，显存取整个训练过程峰值，参数仅统计 LADA。默认 16/4 的 Average 为 75.2%；32/16 的参数为 17.51 M，Average 为 74.0%。</p>
    </details>
    <Source page={7} label="Table 4 · Full-shot · CLIP ViT-B/16" />
  </div>;
}
