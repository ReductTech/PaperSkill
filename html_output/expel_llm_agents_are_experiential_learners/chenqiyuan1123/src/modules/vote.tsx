import React, { useEffect, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const style = `
.expel-method {display:grid; gap:18px; width:100%; height:100%; align-content:start; color:var(--ink);
  font-size:var(--ppt-body-text); line-height:1.35; }
.expel-method * {box-sizing:border-box}
.expel-method h2,.expel-method p {margin:0}
.expel-method h2 {font-size:var(--ppt-body-heading); line-height:1.22}
.expel-method .em-controls {display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:60px}
.expel-method .em-group {display:flex; align-items:center; gap:10px; flex-wrap:wrap}
.expel-method .em-btn {border:1px solid #9fb0c8; color:var(--blue); background:white; border-radius:12px;
  padding:10px 20px; font-weight:700; min-height:56px; white-space:nowrap;}
.expel-method .em-btn[aria-pressed=true] {background:var(--blue); color:white; border-color:var(--blue)}
.expel-method .em-btn:hover:not([aria-pressed=true]):not(:disabled) {background:#edf3fb}
.expel-method .em-section {display:grid; gap:14px; min-width:0; align-content:start}
.expel-method .em-card {padding:24px; border:1px solid #d7deea; border-radius:18px; background:white; min-width:0}
.expel-method .em-life {background:#f5f8f0; border-color:#d4dec9}
.expel-method .em-muted {color:#586984}
.expel-method .em-rule {border-left:6px solid var(--green); background:#eef7f1; padding:18px 24px;
  border-radius:12px; display:grid; gap:5px; color:#214c38; align-content:center}
.expel-method .em-rule strong {font-size:var(--ppt-body-heading)}
.expel-method .em-figure {font-size:var(--ppt-body-emphasis); font-weight:800; color:var(--blue); line-height:1.12}
.expel-method .em-icon {display:block; flex:none}
.expel-method .em-head {display:flex; align-items:center; gap:14px; min-width:0}
.expel-method .em-good {color:#167347}
.expel-method .em-bad {color:#ab3042}
.expel-method .em-chip {padding:6px 11px; border-radius:8px; background:#edf4e5; color:#37553f; align-self:center}
.expel-method .em-ranked {display:grid; gap:10px; padding-bottom:7px}
.expel-method .em-rank {display:grid; grid-template-columns:54px minmax(0,1fr) 128px; align-items:center; padding:13px 16px;
  min-height:84px; border:1px solid #d7deea; border-radius:12px; gap:12px; background:#fff}
.expel-method .em-rank[data-selected=true] {border-color:#9cc5ac; background:#eef7f1}
.expel-method .em-rank[data-selected=true] .em-figure {color:#167347}
.expel-method .em-rank .em-figure {text-align:right; font-variant-numeric:tabular-nums}
.expel-method .em-enter {animation:expel-method-in .34s ease-out both}
@keyframes expel-method-in {from {opacity:.58; transform:translateY(6px)} to {opacity:1; transform:translateY(0)}}
@media (prefers-reduced-motion: reduce) {.expel-method .em-enter {animation:none}}
`;

function Frame({children}: {children: React.ReactNode}) {
  return <section className="expel-method"><style>{style}</style>{children}</section>;
}

type ObjectName = 'pan' | 'board' | 'book' | 'card';

function KitchenObject({name, width = 84}: {name: ObjectName; width?: number}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = canvas.current?.getContext('2d');
    if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, 120, 84);
    const round = (x: number, y: number, w: number, h: number, r: number, color: string) => {
      g.fillStyle = color;
      g.beginPath();
      g.roundRect(x, y, w, h, r);
      g.fill();
    };
    const oval = (x: number, y: number, rx: number, ry: number, color: string) => {
      g.fillStyle = color;
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    };
    oval(59, 72, 49, 5, '#dce6d3');

    if (name === 'pan') {
      g.save();
      g.translate(71, 51);
      g.rotate(-.46);
      round(0, -5, 42, 10, 5, '#92400e');
      g.restore();
      oval(46, 49, 37, 22, '#27446e');
      oval(46, 45, 29, 15, '#52677e');
      oval(42, 45, 11, 9, '#f7f1d0');
      oval(43, 46, 4, 4, '#f07e47');
    } else if (name === 'board') {
      round(10, 22, 94, 48, 12, '#92400e');
      round(16, 25, 82, 38, 9, '#dba276');
      oval(57, 49, 11, 9, '#d59b64');
      oval(76, 46, 10, 8, '#228d5c');
      round(26, 32, 64, 9, 4, '#d7deea');
      round(23, 31, 22, 11, 4, '#27446e');
    } else {
      round(name === 'book' ? 14 : 20, 13, 83, 53, 7, name === 'book' ? '#27446e' : '#f07e47');
      round(27, 19, 61, 41, 4, '#fffcf2');
      const lines = [29, 38, 47];
      lines.forEach((y, i) => round(35, y, i === 2 ? 25 : 43, 3, 2, '#76906a'));
      if (name === 'book') round(74, 14, 7, 21, 2, '#f07e47');
    }
  }, [name]);
  return <canvas className="em-icon" aria-hidden="true" width={240} height={168}
    style={{width, height:width * .7}} ref={canvas} />;
}

const pair = [
  {id:'fail', name:'煎蛋 · 第一次', action:'先打蛋，才发现锅没预热。', outcome:'失败 · 鸡蛋粘锅', success:false},
  {id:'success', name:'煎蛋 · 第二次', action:'先预热平底锅，再打蛋下锅。', outcome:'成功 · 鸡蛋完整', success:true},
];
const batch = [
  {id:'egg', name:'煎蛋', action:'预热平底锅 → 下蛋', outcome:'成功 · 鸡蛋完整', success:true},
  {id:'tofu', name:'煎豆腐', action:'预热平底锅 → 下豆腐', outcome:'成功 · 表面上色', success:true},
  {id:'greens', name:'炒青菜', action:'预热炒锅 → 下菜', outcome:'成功 · 青菜断生', success:true},
];

export function Compare() {
  const [mode, setMode] = useState<'pair'|'batch'>('pair');
  const isPair = mode === 'pair';
  const source = isPair ? pair : batch;
  return <Frame>
    <div className="em-controls">
      <div className="em-group" aria-label="样本类型">
        <button className="em-btn" aria-pressed={isPair} onClick={() => setMode('pair')}>同任务成功与失败</button>
        <button className="em-btn" aria-pressed={!isPair} onClick={() => setMode('batch')}>不同任务的多条成功</button>
      </div>
      <span className="em-muted">示例 · 料理练习记录</span>
    </div>
    <div className="em-life em-card" style={{display:'grid', gap:16, minHeight:346}}>
      <div className="em-head"><KitchenObject name={isPair ? 'pan' : 'board'} />
        <h2>{isPair ? '找出同一任务的关键差异' : '提炼不同任务的共同模式'}</h2>
      </div>
      <div key={mode} className="em-enter" style={{display:'grid', gap:14, gridTemplateColumns:`repeat(${source.length}, minmax(0,1fr))`}}>
        {source.map(record => <article className="em-card em-section" key={record.id}>
          <h2>{record.name}</h2>
          <p>{record.action}</p>
          <strong className={record.success ? 'em-good' : 'em-bad'}>{record.outcome}</strong>
        </article>)}
      </div>
    </div>
    <div className="em-rule" role="status">
      <strong>{isPair ? '改进步骤：煎蛋前先预热平底锅' : '归纳做法：煎炒类任务先预热锅具'}</strong>
      <span>{isPair ? '材料只支持比较当前任务的操作顺序。' : '不同菜品的成功轨迹呈现相同的步骤顺序，可提炼为更通用的候选规则。'}</span>
    </div>
  </Frame>;
}

type Operation = 'ADD' | 'EDIT' | 'UPVOTE' | 'DOWNVOTE';
const operations: {code: Operation; label: string; change: string}[] = [
  {code:'ADD', label:'新增', change:'初始为 2'},
  {code:'EDIT', label:'改写', change:'计数 +1'},
  {code:'UPVOTE', label:'赞同', change:'计数 +1'},
  {code:'DOWNVOTE', label:'反对', change:'计数 −1'},
];

export function Vote() {
  const [rule, setRule] = useState({count:2, edited:false, last:'ADD 已新增规则，计数初始化为 2。', version:0});
  function apply(op: Operation) {
    setRule(current => {
      const version = current.version + 1;
      if (op === 'ADD') return {...current, count:2, edited:false, last:'ADD 已新增规则，计数初始化为 2。', version};
      const count = current.count + (op === 'DOWNVOTE' ? -1 : 1);
      const last = count === 0 ? 'DOWNVOTE 使计数归零，规则已移除。'
        : op === 'EDIT' ? 'EDIT 改写内容，同时增加 1 点支持。'
          : op === 'UPVOTE' ? 'UPVOTE 保留内容，增加 1 点支持。' : 'DOWNVOTE 保留内容，减少 1 点支持。';
      return {count, edited:op === 'EDIT' ? !current.edited : current.edited, last, version};
    });
  }
  return <Frame>
    <div className="em-controls">
      <span>四种操作可以随每批轨迹证据更新规则。</span>
      <span className="em-muted">示例 · 料理便签</span>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'1.13fr 1fr', gap:18, minHeight:435}}>
      <div className="em-card em-life em-section" style={{padding:32, gap:22}}>
        <div className="em-head"><KitchenObject name="book" width={118}/><h2>经验规则表</h2></div>
        <div className={rule.count ? 'em-rule em-enter' : 'em-card em-enter'} key={rule.version} style={{minHeight:140}}>
          <strong>{rule.count ? rule.edited ? '煎炒之前，按锅具类型与菜品要求预热。' : '煎炒前先预热锅具。' : '这张规则卡已取下。'}</strong>
          <span className={rule.count ? 'em-figure' : 'em-bad'}>{rule.count ? `重要性计数 ${rule.count}` : '计数 0 · 已移除'}</span>
        </div>
        <p role="status">{rule.last}</p>
      </div>
      <div className="em-card em-section" style={{padding:30, gap:17}}>
        <h2>对这张便签操作</h2>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {operations.map(op => <button className="em-btn" type="button" key={op.code}
            disabled={op.code === 'ADD' ? rule.count > 0 : rule.count === 0}
            onClick={() => apply(op.code)} style={{display:'grid', justifyItems:'start', gap:2}}>
            <strong>{op.code} · {op.label}</strong><span>{op.change}</span>
          </button>)}
        </div>
        <p className="em-muted">论文中由模型根据新样本提出操作。这里可直接操作并查看计数变化。</p>
      </div>
    </div>
  </Frame>;
}

const recipes = [
  {id:'egg', name:'煎鸡蛋', description:'预热平底锅 → 下蛋', vector:[.9,.2]},
  {id:'tofu', name:'煎豆腐', description:'热锅加油 → 下豆腐', vector:[.7,.4]},
  {id:'soup', name:'煮蔬菜汤', description:'锅中加水 → 放入蔬菜', vector:[.1,.9]},
];
const queries = [
  {name:'煎蘑菇', vector:[.9,.1]},
  {name:'煮番茄汤', vector:[.1,.9]},
];

export function Retrieve() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [k, setK] = useState(1);
  const query = queries[queryIndex];
  const ranks = recipes.map(recipe => ({...recipe,
    score: recipe.vector.reduce((sum, weight, index) => sum + weight * query.vector[index], 0),
  })).sort((a,b) => b.score - a.score);
  const best = ranks[0];
  return <Frame>
    <div className="em-controls">
      <div className="em-group" aria-label="新任务">
        <span>新任务</span>
        {queries.map((q, i) => <button className="em-btn" key={q.name} aria-pressed={queryIndex === i} onClick={() => setQueryIndex(i)}>{q.name}</button>)}
      </div>
      <div className="em-group" aria-label="示范数">
        <span>召回数量 <SymbolHint meaning="保留排名最靠前的成功轨迹条数">k</SymbolHint></span>
        {[1, 2, 3].map(n => <button className="em-btn" key={n} aria-pressed={k === n} onClick={() => setK(n)}>{n}</button>)}
      </div>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'1.42fr 1fr', gap:18}}>
      <div className="em-card em-life em-section" style={{minHeight:448}}>
        <div className="em-head"><KitchenObject name="card" /><h2>成功轨迹 · 按任务内积排序</h2></div>
        <div className="em-ranked" key={queryIndex} aria-label="相似度排序">
          {ranks.map((recipe, i) => <div className="em-rank em-enter" data-selected={i < k} key={recipe.id}>
            <strong>{i+1}</strong>
            <span><strong>{recipe.name}</strong> · {recipe.description}</span>
            <span className="em-figure">{recipe.score.toFixed(2)}</span>
          </div>)}
        </div>
        <p className="em-good" role="status">已取 {k} 条示范，排第一的是「{best.name}」。</p>
      </div>
      <div className="em-card em-section" style={{gap:17, alignContent:'center'}}>
        <h2>最高分怎样算出来？</h2>
        <p>依次按「煎炒、汤煮」的两个示例特征计算内积。</p>
        <p className="em-figure" aria-label="最高相似度">
          {best.score.toFixed(2)}
        </p>
        <p>{query.vector[0]} × {best.vector[0]} + {query.vector[1]} × {best.vector[1]}</p>
        <p className="em-muted">实作用任务文本向量和 Faiss 近邻检索。此处二维向量为手设示例。</p>
      </div>
    </div>
  </Frame>;
}

export function Prompt() {
  const [rules, setRules] = useState(true);
  const [demos, setDemos] = useState(true);
  return <Frame>
    <div className="em-controls">
      <div className="em-group" aria-label="装入提示词">
        <button className="em-btn" aria-pressed={rules} onClick={() => setRules(on => !on)}>经验规则</button>
        <button className="em-btn" aria-pressed={demos} onClick={() => setDemos(on => !on)}>相似示范</button>
      </div>
      <span className="em-muted">示例 · 新任务「煎蘑菇」</span>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'1.46fr 1fr', gap:18}}>
      <div className="em-card em-section" style={{minHeight:450, gap:12}}>
        <div className="em-head"><KitchenObject name="book" /><h2>本次执行看到的提示词</h2></div>
        <div className="em-card" style={{padding:'14px 18px', background:'#eef3fb'}}><strong>任务说明</strong>　煎蘑菇，确保表面上色。</div>
        <div className={rules ? 'em-rule em-enter' : 'em-card em-muted em-enter'} key={String(rules)} style={{padding:'14px 18px'}}>
          <span><strong>经验规则</strong>　{rules ? '煎炒前预热锅，留意粘锅。' : '当前未装入规则。'}</span>
        </div>
        <div className="em-card em-enter" key={`demo-${demos}`} style={{padding:'14px 18px', background:demos ? '#f1f5ed' : '#fff'}}>
          <strong>{demos ? '相似示范' : '固定示范'}</strong>　{demos ? '煎蛋 → 热锅 → 下蛋 → 翻面。' : '煮汤 → 加水 → 加菜。'}
        </div>
        <div className="em-card" style={{padding:'14px 18px', background:'#eef3fb'}}><strong>当前轨迹</strong>　看见干净的平底锅和蘑菇。</div>
      </div>
      <div className="em-card em-life em-section" style={{alignContent:'center', gap:20}}>
        <div className="em-head"><KitchenObject name="pan" /><h2>一次尝试，允许多步行动</h2></div>
        <p role="status">{rules && demos ? '当前配置同时提供可迁移的做法和相似任务的步骤。' : rules ? '当前配置有一般做法，任务示范仍沿用固定样例。' : demos ? '当前配置有相似动作可参考，提示词未载入抽象规则。' : '当前配置从固定样例和当前观测出发。'}</p>
        <p className="em-muted">ExpeL 将规则列表接在任务说明中，用召回的成功轨迹替换固定示范。开关仅展示提示词组成。</p>
      </div>
    </div>
  </Frame>;
}
