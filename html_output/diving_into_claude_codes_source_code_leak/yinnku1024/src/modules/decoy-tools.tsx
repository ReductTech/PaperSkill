import React, { useState } from 'react';
import { Feedback, INK, Switch } from './kit';

const REAL = ['Read', 'Write', 'Bash', 'Grep', 'Glob', 'Task'];
const DECOYS = ['get_weather', 'send_email', 'query_db', 'deploy_app', 'book_flight',
  'translate_doc', 'scan_pdf', 'order_food', 'pay_invoice', 'take_photo'];

/* 版面刻意换一次骨架：顶部整条是"发出去的请求"，底部整条是控件。
   假工具数量是唯一变量；摘要开关说明第二层防御拦掉的是推理链，而不是工具表。 */
export function DecoyTools() {
  const [decoys, setDecoys] = useState(3);
  const [summary, setSummary] = useState(false);
  const total = REAL.length + decoys;
  const share = decoys / total;

  return (
    <div className="ps" style={{ gridTemplateRows: 'auto minmax(0, 1fr) auto', gap: 16 }}>
      <div className="ps-card ps-card--plain" style={{ padding: '14px 18px' }}>
        <div className="ps-spread" style={{ marginBottom: 8 }}>
          <p className="ps-h">一次请求里的工具定义</p>
          <span className="ps-chip" data-tone="orange">{total} 个工具</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
          {REAL.map(name => (
            <span key={name} className="ps-chip" data-tone="blue" style={{ justifyContent: 'center', padding: '6px 6px' }}>{name}</span>
          ))}
          {DECOYS.slice(0, decoys).map(name => (
            <span key={name} className="ps-chip" data-tone="red"
              style={{ justifyContent: 'center', padding: '6px 6px', borderStyle: 'dashed' }}>{name}</span>
          ))}
        </div>
      </div>

      <div className="ps-card ps-card--plain" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 24, alignItems: 'center' }}>
        <div>
          <p className="ps-t ps-muted">抄书人拿到的样本</p>
          <div style={{ display: 'flex', height: 54, borderRadius: 10, overflow: 'hidden', margin: '8px 0 10px', border: `1px solid ${INK.edge}` }}>
            <div style={{ width: `${(REAL.length / total) * 100}%`, background: '#dce6f2', display: 'grid', placeItems: 'center', color: INK.blue }}>真 {REAL.length}</div>
            {decoys > 0 && (
              <div style={{ width: `${share * 100}%`, background: '#f3d5da', display: 'grid', placeItems: 'center', color: INK.red }}>假 {decoys}</div>
            )}
          </div>
          <p className="ps-t ps-t--tight">
            按样本学到的工具去调用：Read 成功，{decoys > 0 ? `${DECOYS[0]} 不存在，` : ''}Bash 成功{decoys > 1 ? `，${DECOYS[1]} 不存在` : ''}。
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <p className="ps-fig" style={{ color: INK.red }}>{Math.round(share * 100)}%</p>
            <p className="ps-t ps-muted">样本被污染</p>
          </div>
          <div>
            <p className="ps-fig" style={{ color: INK.blue }}>{summary ? 0 : 100}%</p>
            <p className="ps-t ps-muted">推理链可读</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 300px minmax(0, 1fr)', gap: 16, alignItems: 'end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ps-t ps-nowrap">假工具</span>
          <input className="ps-range" type="range" min="0" max="10" step="1" value={decoys}
            aria-label="假工具数量" style={{ flex: '1 1 auto' }}
            onChange={e => setDecoys(Number(e.target.value))} />
          <b className="ps-t" style={{ color: INK.red, fontWeight: 700 }}>{decoys}</b>
        </div>
        <Switch checked={summary} onChange={setSummary}>只回传摘要</Switch>
        <Feedback tone={decoys === 0 ? 'neutral' : 'bad'}>
          {decoys === 0
            ? summary ? '工具表干净，但只拿到摘要：推理过程没有被抄走。' : '样本干净：6 个真工具，抄到就能直接用。'
            : `混进 ${decoys} 个不存在的工具；若按出现频率选择，约 ${Math.round(share * 100)}% 的调用会落空。`}
        </Feedback>
      </div>
    </div>
  );
}
