import React, { useState } from 'react';
import { C, Canvas, clear, rect, text, street, softmax } from './detr-kit';

const QUERIES = [[2, 0], [0, 2], [-1, -1]];
const KEYS = [[1, 0], [0, 1], [-1, -1]];
const VALUES = [[1, 0], [0, 1], [.5, .5]];
const REGIONS = [[.22, .57, .16, .58], [.48, .57, .16, .58], [.74, .72, .28, .30]];
const feedbacks = [
  '查询1更接近第一组线索，读取时给它较大权重。',
  '查询2把更多权重给第二组线索。',
  '查询3更看重第三组线索；三个权重始终加起来等于1。',
];
function D5Content() {
  const [selected, setSelected] = useState(0);
  const query = QUERIES[selected];
  const scores = KEYS.map(k => (query[0] * k[0] + query[1] * k[1]) / Math.sqrt(2));
  const weights = softmax(scores);
  const readout = [0, 1].map(i => weights.reduce((sum, a, j) => sum + a * VALUES[j][i], 0));
  const largest = weights.indexOf(Math.max(...weights));
  return <>
    <Canvas ariaLabel="同一张街景照片上的三个读取区域，以及随查询改变的注意力权重" draw={ctx => {
      clear(ctx); street(ctx, 30, 25, 650, 245);
      REGIONS.forEach((b, i) => {
        const x = 30 + (b[0] - b[2] / 2) * 650;
        const y = 25 + (b[1] - b[3] / 2) * 245;
        ctx.save(); ctx.globalAlpha = .06 + weights[i] * .28;
        rect(ctx, x, y, b[2] * 650, b[3] * 245, C.blue, true); ctx.restore();
        rect(ctx, x, y, b[2] * 650, b[3] * 245, i === largest ? C.orange : C.border, false, i !== largest);
        text(ctx, String(i + 1), x + 6, y + 24, 22, i === largest ? C.orange : C.ink);
        rect(ctx, 765, 58 + i * 82, 250, 23, C.border, true);
        rect(ctx, 765, 58 + i * 82, 250 * weights[i], 23, i === largest ? C.blue : C.light, true);
        text(ctx, weights[i].toFixed(3), 765, 110 + i * 82, 24, C.ink);
      });
    }} />
    <div className="chip-row">
      {QUERIES.map((_, i) => <button type="button" key={i} className={`chip${selected === i ? ' selected' : ''}`} aria-pressed={selected === i}
        onClick={() => setSelected(i)}>查询{i + 1}</button>)}
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead><tr><th>图像线索</th><th>键向量 k</th><th>q · k ÷ √2</th><th>读取比例 α</th><th>内容向量 v</th></tr></thead>
        <tbody>{KEYS.map((key, i) => <tr key={i} style={{ background: i === largest ? '#f5f8f0' : undefined }}>
          <th>{i + 1}</th><td>[{key.join(', ')}]</td><td>{scores[i].toFixed(3)}</td><td>{weights[i].toFixed(3)}</td><td>[{VALUES[i].join(', ')}]</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      <div className="metric"><div className="l">当前查询 q</div><div className="v">[{query.join(', ')}]</div></div>
      <div className="metric"><div className="l">三个读取比例之和</div><div className="v">{weights.reduce((s, a) => s + a, 0).toFixed(3)}</div></div>
      <div className="metric"><div className="l">加权读取的结果</div><div className="v" style={{ fontSize: '1.35rem' }}>[{readout.map(v => v.toFixed(3)).join(', ')}]</div></div>
    </div>
    <div className="feedback" aria-live="polite">{feedbacks[selected]} 当前最受关注的是线索{largest + 1}，权重为{weights[largest].toFixed(3)}。</div>
  </>;
}

export function D5(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D5Content/></div>;}
