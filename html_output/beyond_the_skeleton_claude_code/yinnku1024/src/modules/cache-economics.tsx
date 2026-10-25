import React, { useState } from 'react';
import { Dept, Feedback, HW, Switch } from './kit';

const MODELS = [
  { id: 'sonnet', name: 'Sonnet 4.6', input: 3, output: 15 },
  { id: 'opus', name: 'Opus 4.6', input: 15, output: 75 },
  { id: 'fast', name: 'Opus 4.6 Fast', input: 30, output: 150 },
];

const CACHED = 4200;
const DYNAMIC = 800;
const CALLS = 1_000_000;

/* 药房：一条分界线值多少钱。
   定价取自文章里的表：缓存读取按输入价的 10%；这里只算输入侧，1M 次调用/天。 */
export function CacheEconomics() {
  const [modelId, setModelId] = useState('sonnet');
  const [cache, setCache] = useState(true);
  const model = MODELS.find(item => item.id === modelId)!;

  const price = (tokens: number, unit: number) => (tokens * unit * CALLS) / 1_000_000;
  const cachedCost = cache ? price(CACHED, model.input * 0.1) : price(CACHED, model.input);
  const dynamicCost = price(DYNAMIC, model.input);
  const total = cachedCost + dynamicCost;
  const without = price(CACHED + DYNAMIC, model.input);
  const saved = without - total;

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.12fr) minmax(0, 1fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 8 }}>
        <div className="hw-spread">
          <p className="hw-h">系统提示词的两半</p>
          <Dept>药房</Dept>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="hw-slot" style={{ borderColor: HW.blue, background: '#eef3f9' }}>
            <p className="hw-t" style={{ fontWeight: 700, color: HW.blue }}>分界线之前</p>
            <p className="hw-t hw-t--tight">身份、安全规则、行为准则</p>
            <p className="hw-t hw-muted">全球共享缓存 · {CACHED} token</p>
          </div>
          <div className="hw-slot" style={{ borderColor: HW.orange, background: '#fdf2ea' }}>
            <p className="hw-t" style={{ fontWeight: 700, color: '#a34a17' }}>分界线之后</p>
            <p className="hw-t hw-t--tight">memory、语言、MCP、项目</p>
            <p className="hw-t hw-muted">每用户不同 · {DYNAMIC} token</p>
          </div>
        </div>

        <table className="hw-table" style={{ marginTop: 4 }}>
          <thead>
            <tr><th>模型</th><th>输入 $/Mtok</th><th>输出 $/Mtok</th><th>缓存读取</th></tr>
          </thead>
          <tbody>
            {MODELS.map(item => (
              <tr key={item.id} data-active={item.id === modelId}>
                <th scope="row">{item.name}</th>
                <td>{item.input}</td>
                <td>{item.output}</td>
                <td>输入的 10%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hw-t hw-muted" style={{ fontSize: 26 }}>
          另：默认 max output 只给 8K（p99 才 4.9K），不够时自动升到 64K。
        </p>
      </div>

      <div className="hw-col">
        <div style={{ display: 'flex', gap: 8 }}>
          {MODELS.map(item => (
            <button key={item.id} type="button" className="hw-btn"
              aria-pressed={modelId === item.id} onClick={() => setModelId(item.id)}
              style={{ fontSize: 28, padding: '6px 10px' }}>{item.name}</button>
          ))}
        </div>
        <Switch checked={cache} onChange={setCache}>启用分界线前的缓存</Switch>

        <div className="hw-card hw-card--plain">
          <p className="hw-t hw-muted">1M 次调用 / 天，输入侧成本</p>
          <p className="hw-fig" style={{ color: cache ? HW.green : HW.red }}>
            ${Math.round(total).toLocaleString('en-US')}
          </p>
          <p className="hw-t hw-muted">
            不缓存时 ${Math.round(without).toLocaleString('en-US')} · 缓存省下 ${Math.round(saved).toLocaleString('en-US')}
          </p>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={cache ? 'good' : 'bad'}>
            {cache
              ? `缓存读取只要输入价的 10%（写入的 1/12.5）：一天省下约 $${Math.round(saved).toLocaleString('en-US')}。`
              : '整段每轮重算：几千 token 乘以百万级调用，账会变得很难看。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
