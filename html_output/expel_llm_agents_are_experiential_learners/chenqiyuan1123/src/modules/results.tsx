import { useState } from 'react';
import type { ReactNode } from 'react';

const chartCases = [
  { key: 'HotpotQA', values: [28, 36, 31, 39], criterion: '问答：答案精确匹配', result: '只保留规则比只保留检索高 5 个百分点。' },
  { key: 'ALFWorld', values: [40, 50, 55, 59], criterion: '家庭环境：在步数上限内完成任务', result: '只保留检索比只保留规则高 5 个百分点。' },
  { key: 'WebShop', values: [35, 37, 38, 41], criterion: '网页购物：所购商品匹配全部目标属性', result: '只保留规则和只保留检索的结果接近。' },
] as const;

const conditions = ['ReAct', '仅规则', '仅检索', '完整 ExpeL'];
const colors = ['var(--red)', '#7890ae', 'var(--blue)', 'var(--green)'];
const ablations = [
  { label: 'ReAct', mean: 28, se: 1.4, color: 'var(--red)' },
  { label: '人工规则', mean: 32, se: 1.1, color: '#7890ae' },
  { label: '加入反思文本', mean: 29, se: 0.4, color: 'var(--red)' },
  { label: 'GPT-3.5 提炼规则', mean: 32, se: 0.4, color: 'var(--blue)' },
  { label: '完整 ExpeL', mean: 39, se: 1.7, color: 'var(--green)' },
];
const feverValues = [
  { label: 'Act', value: '58 ± 0.0%' },
  { label: 'ReAct', value: '63 ± 0.4%' },
  { label: '改写时无目标示范', value: '65 ± 1.7%' },
  { label: '改写时有目标示范', value: '70 ± 0.7%' },
];

const styles = [
  '.expel-evidence{height:100%;min-width:0;display:grid;gap:24px;color:var(--ink);font-size:var(--ppt-body-text);line-height:1.34}',
  '.expel-evidence h3,.expel-evidence p{margin:0}',
  '.expel-evidence h3{font-size:var(--ppt-body-heading);font-weight:750;line-height:1.2}',
  '.expel-evidence button{font:inherit;font-weight:650;border-radius:11px;padding:10px 22px;border:1px solid var(--line-2);background:#fff;color:var(--blue);cursor:pointer}',
  '.expel-evidence button[aria-pressed="true"]{background:var(--blue);border-color:var(--blue);color:#fff}',
  '.expel-evidence button:focus-visible{outline:3px solid var(--orange);outline-offset:2px}',
  '.expel-evidence .ev-buttons{display:flex;align-items:center;gap:12px}',
  '.expel-evidence .ev-card{border:1px solid var(--line);border-radius:20px;background:#fff;padding:26px 30px;min-width:0}',
  '.expel-evidence .ev-muted{color:var(--ink-2)}',
  '.expel-evidence .ev-emphasis{font-size:var(--ppt-body-emphasis);line-height:1.12;font-weight:800;font-variant-numeric:tabular-nums}',
  '.expel-evidence .ev-metric{color:var(--green)}',
  '.expel-evidence .ev-chart{display:grid;gap:10px;align-content:center}',
  '.expel-evidence .ev-row{display:grid;grid-template-columns:177px minmax(0,1fr) 105px;align-items:center;gap:15px;min-height:62px}',
  '.expel-evidence .ev-ab-row{grid-template-columns:255px minmax(0,1fr) 176px;min-height:60px}',
  '.expel-evidence .ev-track{height:22px;background:#eff3f5;border-radius:4px;position:relative}',
  '.expel-evidence .ev-fill{height:100%;border-radius:4px;transition:width 250ms ease-out}',
  '.expel-evidence .ev-ticks{display:flex;justify-content:space-between;color:var(--ink-2)}',
  '.expel-evidence .ev-line{height:11px;position:absolute;top:5px;background:linear-gradient(var(--ink),var(--ink)) center / 100% 3px no-repeat}',
  '.expel-evidence .ev-line:before,.expel-evidence .ev-line:after{content:"";height:11px;width:2px;position:absolute;top:0;background:var(--ink)}',
  '.expel-evidence .ev-line:before{left:0}.expel-evidence .ev-line:after{right:0}',
  '.expel-evidence .ev-callout{background:#f5f8f0;display:grid;align-content:center;gap:20px}',
  '.expel-evidence .ev-board{position:relative;height:130px;border-radius:18px;background:#edf3e8;border:1px solid #d7dfd7;overflow:hidden}',
  '.expel-evidence .ev-note{position:absolute;top:23px;left:15%;width:40%;height:75px;border:1px solid #b8c9a7;background:#fffdf4;border-radius:8px;display:grid;align-content:center;text-align:center;transform:rotate(-6deg);transition:transform 250ms ease, background 250ms ease}',
  '.expel-evidence .ev-note:nth-child(2){left:47%;background:#fff2e2;transform:translateY(13px) rotate(5deg)}',
  '.expel-evidence .ev-board[data-demo="true"] .ev-note:nth-child(2){background:#e2f2e7;transform:translateY(-3px) rotate(1deg)}',
  '.expel-evidence .ev-fever{display:grid;gap:8px}',
  '.expel-evidence .ev-fever-row{display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:1px solid var(--line);padding:9px 12px;border-radius:8px}',
  '.expel-evidence .ev-fever-row[data-current="true"]{background:#eaf5ed;color:#176e49;font-weight:750;outline:2px solid #a8ceba}',
].join('\n');

function Surface({ children, columns, rows }: { children: ReactNode; columns: string; rows?: string }) {
  return <div className="expel-evidence" style={{ gridTemplateColumns: columns, gridTemplateRows: rows }}>
    <style>{styles}</style>
    {children}
  </div>;
}

function RecipeBoard({ left, right, adapted }: { left: string; right: string; adapted?: boolean }) {
  return <div className="ev-board" data-demo={adapted} aria-label={left + '与' + right}>
    <span className="ev-note">{left}</span>
    <span className="ev-note">{right}</span>
  </div>;
}

function Bar({ value, scale, color, se }: { value: number; scale: number; color: string; se?: number }) {
  return <div className="ev-track" aria-hidden="true">
    <div className="ev-fill" style={{ width: 100 * value / scale + '%', backgroundColor: color }} />
    {se !== undefined && <span className="ev-line" style={{ left: 100 * (value - se) / scale + '%', width: 200 * se / scale + '%' }} />}
  </div>;
}

export function Results() {
  const [selection, setSelection] = useState(0);
  const current = chartCases[selection];
  return <Surface columns="2fr 1fr" rows="66px 1fr 48px">
    <div className="ev-buttons" role="group" aria-label="选择评测环境" style={{ gridColumn: '1 / -1' }}>
      {chartCases.map((item, index) => <button key={item.key} type="button" aria-pressed={index === selection} onClick={() => setSelection(index)}>{item.key}</button>)}
    </div>
    <section className="ev-card ev-chart" aria-label={current.key + '成功率'} aria-live="polite">
      <h3>平均任务成功率</h3>
      {conditions.map((condition, index) => <div className="ev-row" key={condition}>
        <strong>{condition}</strong>
        <Bar value={current.values[index]} scale={60} color={colors[index]} />
        <strong style={{ textAlign: 'right' }}>{current.values[index]}%</strong>
      </div>)}
      <div className="ev-row" style={{ minHeight: 36 }} aria-hidden="true">
        <span />
        <div className="ev-ticks"><span>0</span><span>20</span><span>40</span><span>60%</span></div>
      </div>
    </section>
    <section className="ev-card ev-callout" aria-live="polite">
      <RecipeBoard left="规则卡" right="示范卡" adapted />
      <strong className="ev-emphasis ev-metric">+{current.values[3] - current.values[0]} 个百分点</strong>
      <p>完整 ExpeL 相比 ReAct。{current.result}</p>
      <p className="ev-muted">{current.criterion}</p>
    </section>
    <p className="ev-muted" style={{ gridColumn: '1 / -1' }}>图 5 · 四折验证，成功率按图中整数重绘。各环境均比较单次尝试。</p>
  </Surface>;
}

export function Ablation() {
  return <Surface columns="2fr 1fr" rows="1fr 50px">
    <section className="ev-card ev-chart" aria-label="HotpotQA 成功率及标准误">
      <h3>HotpotQA 成功率</h3>
      {ablations.map((row) => <div className="ev-row ev-ab-row" key={row.label}>
        <strong>{row.label}</strong>
        <Bar value={row.mean} se={row.se} scale={45} color={row.color} />
        <strong style={{ textAlign: 'right' }}>{row.mean.toFixed(1)} ± {row.se.toFixed(1)}</strong>
      </div>)}
      <div className="ev-row ev-ab-row" style={{ minHeight: 36 }} aria-hidden="true">
        <span />
        <div className="ev-ticks"><span>0</span><span>15</span><span>30</span><span>45%</span></div>
      </div>
    </section>
    <section className="ev-card ev-callout">
      <RecipeBoard left="重试便签" right="规则手册" />
      <h3>反思可以指引重试</h3>
      <p>把反思文本也交给规则提炼器，成功率从 39% 降到 29%。</p>
      <p className="ev-muted">作者推测，反思中混入的幻觉可能误导提炼。</p>
    </section>
    <p className="ev-muted" style={{ gridColumn: '1 / -1' }}>表 3 · 四折平均成功率（%）± 标准误。细线标出标准误。</p>
  </Surface>;
}

export function Transfer() {
  const [demos, setDemos] = useState(true);
  return <Surface columns="1fr 1fr" rows="1fr 94px">
    <section className="ev-card" style={{ display: 'grid', alignContent: 'center', gap: 12 }}>
      <h3>HotpotQA → FEVER</h3>
      <p className="ev-muted">共用 Wikipedia Docstore 检索接口</p>
      <RecipeBoard left="源任务菜谱" right={demos ? '目标示范' : '目标描述'} adapted={demos} />
      <div role="group" aria-label="改写阶段的目标示范" className="ev-buttons">
        <button type="button" aria-pressed={!demos} onClick={() => setDemos(false)}>无目标示范</button>
        <button type="button" aria-pressed={demos} onClick={() => setDemos(true)}>有目标示范</button>
      </div>
      <p>原规则：围绕问题中的实体寻找来源。</p>
      <p aria-live="polite"><strong>改写示例：</strong>{demos ? '回到声明中的实体，找能支持或反驳该声明的句子。' : '围绕待核验声明的实体搜索相关资料。'}</p>
    </section>
    <section className="ev-card" style={{ display: 'grid', alignContent: 'center', gap: 15 }}>
      <h3>FEVER 成功率</h3>
      <div className="ev-fever" aria-live="polite">
        {feverValues.map((row, index) => <div key={row.label} className="ev-fever-row" data-current={index === (demos ? 3 : 2)}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>)}
      </div>
      <p className="ev-muted">表 1 · 均值 ± 标准误</p>
    </section>
    <p className="ev-muted" style={{ gridColumn: '1 / -1', alignSelf: 'center' }}>左侧为改写示意。两组迁移方法在执行 FEVER 任务时都用固定目标示范，差别在改写规则的阶段。</p>
  </Surface>;
}
