import React, { useState } from 'react';
import { C, Stage, Feedback, clearScene, line } from './BirdKit';

const results = [
  { label: '不加位置', score: 61.382 },
  { label: '可学习一维', score: 64.206 },
  { label: '二维', score: 64.001 },
  { label: '相对位置', score: 64.032 },
];
const addedPosition = results[1].score - results[0].score;
const twoDimensional = results[2].score - results[1].score;
const relative = results[3].score - results[1].score;
const signed = (n: number, digits = 3) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;

export function PositionEvidence() {
  const [prediction, setPrediction] = useState(1);
  const [revealed, setRevealed] = useState(false);
  return <div>
    <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>你的预测：二维位置比一维高多少个百分点？</p>
    <div className="ctrl">
      <label htmlFor="position-prediction">二维 − 一维（百分点）</label>
      <input id="position-prediction" type="range" min={-1} max={3} step={0.1}
        value={prediction} disabled={revealed} aria-valuetext={`${signed(prediction, 1)} 个百分点`}
        onKeyDown={e => e.stopPropagation()}
        onChange={e => setPrediction(Number(e.target.value))} />
      <output htmlFor="position-prediction" className="val">{signed(prediction, 1)}</output>
    </div>
    <Stage height={340}
      label={revealed
        ? `差值对照，单位为百分点。你的预测：${signed(prediction, 1)}；二维减一维：${signed(twoDimensional)}；一维减不加位置：${signed(addedPosition)}；相对位置减一维：${signed(relative)}。`
        : `预测图，非实验结果：二维减一维预计为 ${signed(prediction, 1)} 个百分点。实测结果尚未揭示。`}
      render={(c, w, h) => {
        clearScene(c, w, h);
        const x = (value: number) => 370 + (value + 1) / 4 * 610;
        c.font = '600 21px sans-serif'; c.fillStyle = C.ink;
        c.fillText(revealed ? '把两种改变放在同一把尺上' : '先作预测，再用证据检验', 30, 32);
        c.font = '17px sans-serif'; c.fillStyle = C.muted;
        c.fillText('差值（百分点）；正值表示前者准确率更高', 370, 63);
        for (let tick = -1; tick <= 3; tick++) {
          line(c, x(tick), 88, x(tick), 291, tick === 0 ? C.blue : C.line, tick === 0 ? 2 : 1);
          c.textAlign = 'center'; c.font = '18px sans-serif'; c.fillStyle = C.muted;
          c.fillText(tick > 0 ? `+${tick}` : String(tick).replace('-', '−'), x(tick), 319);
        }
        c.textAlign = 'left';
        const rows = [
          { label: '你的预测：二维 − 一维', y: 110, value: prediction, color: C.orange, show: true },
          { label: '实测：二维 − 一维', y: 161, value: twoDimensional, color: C.blue, show: revealed },
          { label: '实测：一维 − 不加位置', y: 212, value: addedPosition, color: C.green, show: revealed },
          { label: '实测：相对位置 − 一维', y: 263, value: relative, color: C.blue, show: revealed },
        ];
        rows.forEach((row, index) => {
          c.font = '19px sans-serif'; c.fillStyle = row.show ? C.ink : C.muted;
          c.fillText(row.label, 30, row.y + 6);
          if (!row.show) {
            c.fillStyle = C.muted; c.fillText('待揭示', x(0) + 16, row.y + 6); return;
          }
          c.save();
          if (index === 0) c.setLineDash([6, 5]);
          line(c, x(0), row.y, x(row.value), row.y, row.color, 4);
          c.restore();
          c.beginPath(); c.arc(x(row.value), row.y, 7, 0, Math.PI * 2);
          c.fillStyle = row.color; c.fill();
          const textToLeft = row.value > 2.3;
          c.textAlign = textToLeft ? 'right' : 'left';
          c.font = '600 19px sans-serif';
          c.fillText(signed(row.value, index === 0 ? 1 : 3), x(row.value) + (textToLeft ? -15 : 15), row.y - 12);
          c.textAlign = 'left';
        });
      }} />
    <div className="ctrl">
      {revealed
        ? <button className="tiny ghost" onClick={() => setRevealed(false)}>重新预测</button>
        : <button className="tiny" onClick={() => setRevealed(true)}>揭示论文结果</button>}
    </div>
    <div aria-live="polite">
      {revealed ? <>
        <Feedback tone="green">预测 {signed(prediction,1)}，实测 {signed(twoDimensional)} 个百分点。加入一维位置提高 {addedPosition.toFixed(3)} 个百分点，改用二维未进一步提高。</Feedback>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 17, color: C.ink, margin: '14px 0' }}>
          <caption style={{ textAlign: 'left', padding: '8px 0', fontWeight: 650 }}>核对原始准确率（%，越高越好）</caption>
          <thead><tr>{results.map(r => <th key={r.label} scope="col" style={{ padding: 10 }}>{r.label}</th>)}</tr></thead>
          <tbody><tr>{results.map(r => <td key={r.label} style={{ textAlign: 'center', padding: 10 }}>{r.score.toFixed(3)}</td>)}</tr></tbody>
        </table>
        <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>这是点估计对比，不能推出二维位置在所有任务中都无用。</p>
      </> : <Feedback>拖动橙点预测：正值为更好，负值为更差；再揭示结果。</Feedback>}
    </div>
    <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>Table 8 · 冻结特征 · 每类 5 样本；不是全量微调准确率。</p><details><summary>查看评估口径</summary><p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, margin: '8px 0' }}>
      依据：论文第 17 页 Table 8，ViT-B/16 的 ImageNet 冻结特征、每类 5 个样本线性分类评估，非全量微调准确率。
      原表小数转换为百分数；图中差值单位为百分点。
    </p></details></>
  </div>;
}
