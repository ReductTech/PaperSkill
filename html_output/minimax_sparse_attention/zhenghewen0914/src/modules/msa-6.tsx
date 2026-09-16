import { useEffect, useRef, useState } from 'react';
import { Scene, C, rounded, book, label, Feedback, Chips, Stat } from './hero-old';

const controls = { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12, margin: '16px 0' };
const stats = { display: 'flex', flexWrap: 'wrap' as const, gap: 16, margin: '16px 0' };
const fmt = (n: number) => n.toLocaleString('zh-CN');
const fixed = (n: number, places = 4) => n.toFixed(places);
const tableWrap = { maxWidth: '100%', overflowX: 'auto' as const };

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string = C.ink, size = 20) {
  ctx.save();
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

/** Eq.12 FLOPs only: projection, scheduling, memory traffic and kernel overhead are outside this model. */
export function Msa4() {
  const lengths = [32768, 131072, 524288, 1048576];
  const [lengthIndex, setLengthIndex] = useState(3);
  const [k, setK] = useState(16);
  const N = lengths[lengthIndex];
  const Bk = 128;
  const tokens = k * Bk;
  const fraction = tokens / N;
  const full = 2 * 64 * 128 * N * N;
  const index = 4 * 128 * N * N;
  const main = 4 * 64 * 128 * N * k * Bk;
  const sparse = index + main;
  const ratio = full / sparse;
  const pf = (value: number) => (value / 1e15).toFixed(4);

  return <div>
    <div style={controls}>
      <span>上下文长度 N</span>
      <Chips items={['32K', '128K', '512K', '1M']} value={lengthIndex} onChange={setLengthIndex} />
    </div>
    <div className="ctrl" style={{ flexWrap: 'wrap' }}>
      <label htmlFor="msa-budget-k">选块预算 k（含当前块） <span className="val">{k}</span></label>
      <input id="msa-budget-k" aria-label="选块预算 k，包含当前块" type="range" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}} min={1} max={32} step={1} value={k} onChange={e => setK(Number(e.target.value))} />
    </div>
    <Scene label={`理论预算图：N=${N}，k=${k}，最多${tokens}个token；GQA与MSA的理论FLOPs比为${ratio.toFixed(2)}`} draw={ctx => {
      label(ctx, '读取预算', 40, 46);
      label(ctx, '理论 FLOPs', 400, 46);
      book(ctx, 62, 72, 262, 133, C.blue);
      rounded(ctx, 72, 213, 242, 13, C.line);
      ctx.fillStyle = C.orange;
      ctx.fillRect(72, 213, 242 * fraction, 13);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(72 + 242 * fraction, 204); ctx.lineTo(72 + 242 * fraction, 234); ctx.stroke();
      text(ctx, `${fmt(tokens)} / ${fmt(N)}`, 72, 256);
      const x = 490, width = 530;
      text(ctx, 'GQA', 400, 101, C.blue);
      text(ctx, 'MSA', 400, 187, C.green);
      rounded(ctx, x, 74, width, 42, C.blue);
      rounded(ctx, x, 160, width, 42, C.light);
      ctx.fillStyle = C.purple; ctx.fillRect(x, 160, width * index / full, 42);
      ctx.fillStyle = C.green; ctx.fillRect(x + width * index / full, 160, width * main / full, 42);
      text(ctx, `${pf(full)} PFLOPs`, x, 144);
      text(ctx, `${pf(sparse)} PFLOPs`, x, 230);
      text(ctx, `${ratio.toFixed(2)}×`, 907, 250, C.ink, 25);
    }} />
    <div style={stats}>
      <Stat label="每 query 每组 token 上限" value={fmt(tokens)} />
      <Stat label="占完整 N 的比例" value={`${(fraction * 100).toFixed(3)}%`} />
      <Stat label="理论 FLOPs 缩减比" value={`${ratio.toFixed(2)}×`} />
    </div>
    <Feedback>主分支预算是 {fmt(tokens)} 个 token（k={k} 含当前块），占 N 的 {(fraction * 100).toFixed(3)}%；索引仍扫描全部因果可见上下文。理论计算比例不能直接当作应用加速。</Feedback>
    <details style={{ marginTop: 16 }}>
      <summary>展开核算：索引项、主分支项与实测边界</summary>
      <div style={tableWrap}>
        <table className="paper"><thead><tr><th>计算项</th><th>颜色</th><th>当前 PFLOPs</th></tr></thead>
          <tbody><tr><td>完整 GQA</td><td>蓝色</td><td>{pf(full)}</td></tr><tr><td>MSA 索引项 Hkv·didx·N²</td><td>紫色</td><td>{pf(index)}</td></tr><tr><td>MSA 主分支项 4Hq·dh·N·k·Bk</td><td>绿色</td><td>{pf(main)}</td></tr><tr><td>MSA 合计</td><td>紫色 + 绿色</td><td>{pf(sparse)}</td></tr></tbody></table>
      </div>
      <p>PFLOPs 是 10¹⁵ 次浮点运算，不是每秒性能。固定 Hq=64、Hkv=4、dh=128、Bk=128，并为演示选 didx=128。当前块在因果边界处可能未填满，所以 k·Bk 是上限。图中预算条按比例绘制，橙色细线标记比例端点。</p>
      <p>本计算器复算 p.6 Eq.12，不计投影、调度和内存等开销。论文 p.12 §5.4 Fig.4 的 H800、1M 注意力效率结果为：FLOPs 缩减 28.4×，prefill 14.2×，decode 7.6×；它们不是完整模型或应用的统一加速比。</p>
    </details>
  </div>;
}

const blockScores = [
  [0.3, 3.4, 0.8, 2.9, 0.5, 1.1, 0.2, -0.1],
  [0.1, 0.5, 3.1, 0.4, 0.2, 3.5, 0.3, -0.1],
];
const ownBlocks = [[1, 3, 7], [2, 5, 7]];

export function Msa5() {
  const [group, setGroup] = useState(0);
  const [mode, setMode] = useState(0);
  const chosen = ownBlocks[mode === 0 ? 0 : group];
  const own = ownBlocks[group];
  const missed = own.filter(b => !chosen.includes(b));
  const feedback = mode === 0 && group === 1
    ? '组二被迫共用 {B1, B3, B7}，漏掉本组更高分的 B2 与 B5。红色虚线标出遗漏；这是固定分数构造的教学反例。'
    : mode === 1
      ? `组${group === 0 ? '一' : '二'}使用自己的索引查询，选择 {${chosen.map(b => `B${b}`).join(', ')}}。当前块 B7 占一个名额，同组 query 头共享这套集合。`
      : '先看组一的 {B1, B3, B7}：当前块占一个名额。再切换到组二，检查强制共用这套集合是否仍能保留它的高分块。';

  return <div>
    <div style={controls}><span>当前检索组</span><Chips items={['组一', '组二']} value={group} onChange={setGroup} /></div>
    <div style={controls}><span>选块方式</span><Chips items={['共用索引', '分组索引']} value={mode} onChange={setMode} /></div>
    <Scene label={`组${group + 1}，${mode === 0 ? '强制共用组一集合' : '各组选自己的块'}；当前选择${chosen.map(b => `B${b}`).join('、')}${missed.length ? '；遗漏高分块' + missed.map(b => `B${b}`).join('、') : ''}`} draw={ctx => {
      label(ctx, '翻阅页组', 40, 46);
      label(ctx, '当前组选块', 410, 46);
      book(ctx, 52, 72, 290, 136, C.blue);
      for (let b = 0; b < 8; b++) {
        const x = 70 + b * 32;
        rounded(ctx, x, 98, 25, 78, chosen.includes(b) ? C.green : C.light, b === 7 ? C.orange : C.line);
        text(ctx, String(b), x + 7, 201, C.ink, 17);
      }
      text(ctx, `r = ${group + 1}      k = 3`, 75, 246);
      for (let b = 0; b < 8; b++) {
        const x = 416 + b * 77;
        const selected = chosen.includes(b);
        const h = Math.max(3, blockScores[group][b] / 3.5 * 116);
        rounded(ctx, x, 71, 60, 142, C.paper, selected ? C.green : C.line);
        ctx.fillStyle = selected ? C.green : C.muted;
        ctx.fillRect(x + 10, 201 - h, 40, h);
        if (b === 7) { ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(x + 4, 75, 52, 134); }
        if (missed.includes(b)) { ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 3; ctx.strokeStyle = C.red; ctx.strokeRect(x - 3, 68, 66, 148); ctx.restore(); }
        text(ctx, blockScores[group][b].toFixed(1), x + 13, 96, C.ink, 18);
        text(ctx, `B${b}`, x + 17, 243);
      }
    }} />
    <div style={stats}><Stat label="当前选块集合" value={`{${chosen.map(b => `B${b}`).join(', ')}}`} /><Stat label="当前块 / 总预算" value="B7 / 3 块" /></div>
    <Feedback tone={missed.length ? 'red' : mode === 1 ? 'green' : 'blue'}>{feedback}</Feedback>
    <details style={{ marginTop: 16 }}>
      <summary>展开两组的块内 max 得分与选择规则</summary>
      <div style={tableWrap}>
        <table className="paper"><thead><tr><th>块</th><th>组一分数</th><th>组二分数</th><th>当前状态</th></tr></thead><tbody>{blockScores[0].map((_, b) => <tr key={b}><td>B{b}{b === 7 ? '（当前）' : ''}</td><td>{blockScores[0][b].toFixed(1)}</td><td>{blockScores[1][b].toFixed(1)}</td><td>{b === 7 ? '必选，占 1 名额' : missed.includes(b) ? '本组高分但遗漏' : chosen.includes(b) ? '选中' : '未选中'}</td></tr>)}</tbody></table>
      </div>
      <p>每组从非当前块中取最高两块，再加当前块。共用模式仅为反例，强制所有组使用组一的集合；分组模式才对应 MSA 的组选块机制。所有分数是预设教学数据，不是论文实测。</p>
      <p>每组一个索引 Q 头，所有组共享单个索引 K 头；不同 Q 可以产生不同块分数。同组主分支 query 头仍有各自的投影与概率分布。组号不被硬编码为特定语义任务（pp.3–5 Eqs.3–8；Appendix A Fig.5）。</p>
    </details>
  </div>;
}

const logits = [2, 1, 0, -1, 3, 0, 1, 2];
const values = [1, 2, 3, 4, 5, 6, 7, 8];

function stableSoftmax(input: number[]) {
  const max = Math.max(...input);
  const exp = input.map(v => Math.exp(v - max));
  const denominator = exp.reduce((sum, v) => sum + v, 0);
  return exp.map(v => v / denominator);
}

export function Msa6() {
  const [mode, setMode] = useState(0);
  const [run, setRun] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);
  const selectedBlocks = mode === 0 ? [2, 3] : [0, 3];
  const selectedTokens = logits.map((_, i) => i).filter(i => selectedBlocks.includes(Math.floor(i / 2)));
  const dense = stableSoftmax(logits);
  const selectedProbabilities = stableSoftmax(selectedTokens.map(i => logits[i]));
  const sparse = logits.map((_, i) => {
    const position = selectedTokens.indexOf(i);
    return position === -1 ? 0 : selectedProbabilities[position];
  });
  const denseOutput = dense.reduce((sum, p, i) => sum + p * values[i], 0);
  const sparseOutput = sparse.reduce((sum, p, i) => sum + p * values[i], 0);
  const error = Math.abs(denseOutput - sparseOutput);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setRunning(false), 1500);
    return () => window.clearTimeout(timer);
  }, [run, running]);

  const changeMode = (value: number) => {
    setMode(value);
    setRun(0);
    setRunning(false);
    startedAt.current = 0;
  };
  const start = () => {
    startedAt.current = performance.now();
    setRun(v => v + 1);
    setRunning(true);
  };

  return <div>
    <div style={controls}>
      <Chips items={['保留高分块', '漏掉高分块']} value={mode} onChange={changeMode} />
      <button className="tiny" type="button" onClick={start} disabled={running}>{running ? '同步展示中…' : run ? '重新对比' : '开始对比'}</button>
    </div>
    <Scene animate={running} label={`蓝色为完整注意力概率，绿色为稀疏概率；选中${selectedBlocks.map(b => 'B' + b).join('和')}；完整输出${fixed(denseOutput)}，稀疏输出${fixed(sparseOutput)}，绝对差${fixed(error)}`} draw={(ctx, time) => {
      const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const progress = run === 0 ? 0 : !running || reduceMotion ? 1 : Math.min(1, Math.max(0, (time - startedAt.current) / 1500));
      label(ctx, '完整 / 稀疏', 30, 43);
      label(ctx, '共同概率轴', 863, 43);
      const baseline = 224;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      [0, 0.25, 0.5, 0.75].forEach(p => {
        const y = baseline - p * 218;
        ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(1044, y); ctx.stroke();
        text(ctx, String(p), 22, y + 6, C.muted, 16);
      });
      for (let i = 0; i < 8; i++) {
        const x = 94 + i * 120;
        const selected = selectedTokens.includes(i);
        if (i % 2 === 0) {
          rounded(ctx, x - 10, 54, 222, 186, C.paper, selectedBlocks.includes(i / 2) ? C.green : C.line);
          if (i / 2 === 3) { ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.strokeRect(x - 6, 58, 214, 178); }
        }
        const denseH = dense[i] * 218 * progress;
        const sparseH = sparse[i] * 218 * progress;
        ctx.fillStyle = C.blue; ctx.fillRect(x + 13, baseline - denseH, 30, denseH);
        ctx.fillStyle = C.green; ctx.fillRect(x + 49, baseline - sparseH, 30, sparseH);
        if (!selected) { ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.moveTo(x + 49, baseline - 8); ctx.lineTo(x + 79, baseline - 8); ctx.stroke(); }
        text(ctx, `t${i}`, x + 33, 264, C.ink, 18);
      }
    }} />
    <div style={stats}>
      <Stat label="完整输出" value={fixed(denseOutput)} />
      <Stat label="稀疏输出" value={fixed(sparseOutput)} />
      <Stat label="输出绝对差" value={fixed(error)} />
    </div>
    <Feedback>所选集合内归一化正确，但与全注意力仍有差异。当前保留 {selectedBlocks.map(b => `B${b}`).join('、')}，两者概率和都为 1；输出绝对差为 {fixed(error)}。{mode === 1 ? '高 logit 所在的 B2 被遗漏。' : 'B2 被保留，也不能据此声称输出完全相同。'}误差还取决于 value：本例漏掉高分块时，标量输出差反而更小；不能只凭分数判断输出误差。</Feedback>
    <div style={tableWrap}>
      <table className="paper"><thead><tr><th>token / 块</th><th>logit</th><th>value</th><th>完整概率</th><th>稀疏概率</th></tr></thead><tbody>{logits.map((v, i) => <tr key={i}><td>t{i} / B{Math.floor(i / 2)}{selectedTokens.includes(i) ? ' ✓' : ''}</td><td>{v}</td><td>{values[i]}</td><td>{fixed(dense[i])}</td><td>{selectedTokens.includes(i) ? fixed(sparse[i]) : '0（未选）'}</td></tr>)}</tbody></table>
    </div>
    <details style={{ marginTop: 16 }}>
      <summary>展开数值算法与动画含义</summary>
      <p>给定 logits=[2,1,0,−1,3,0,1,2]，values=[1,2,3,4,5,6,7,8]。完整分支对 8 个 token 做稳定 softmax；稀疏分支只对选中的 4 个 token 减去各自集合的最大 logit、取指数、归一化，再加权 value。图中未选 token 的概率记为 0。</p>
      <p>每两 token 为一块，k=2 已包含当前块 B3。本例把 8 个 token 都设为因果可见；主分支 logits 已视为经过 √dh 缩放。输出差由实际数值计算得出，不是预设评分（p.4 Eq.8）。</p>
      <p>点击后两套概率柱共用同一条 0–0.75 概率轴，并在 1.5 秒内同步展开。播放进度只是展示方式，不是推理耗时、胜负或计算速度。启用减少动态效果时直接显示最终柱高。教学模拟，非论文实测。</p>
    </details>
  </div>;
}
