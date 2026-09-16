import { useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import { Scene, C, rounded, label, Feedback, Chips, Stat } from './hero-old';

const paper = 'https://arxiv.org/pdf/2606.13392v2';
const source = (page: number, text: string) => <a href={`${paper}#page=${page}`} target="_blank" rel="noreferrer">{text}</a>;
const probabilities = (logits: number[]) => {
  const m = Math.max(...logits), exp = logits.map(v => Math.exp(v - m)), sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(v => v / sum);
};
function line(ctx: CanvasRenderingContext2D, points: number[][], color: string, width = 3, dashed = false) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath(); points.forEach(([x, y], n) => n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}
function arrow(ctx: CanvasRenderingContext2D, points: number[][], color: string, width = 3, dashed = false) {
  line(ctx, points, color, width, dashed);
  const [x, y] = points[points.length - 1], [px, py] = points[points.length - 2], a = Math.atan2(y - py, x - px);
  ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10 * Math.cos(a - .5), y - 10 * Math.sin(a - .5)); ctx.lineTo(x - 10 * Math.cos(a + .5), y - 10 * Math.sin(a + .5)); ctx.closePath(); ctx.fill(); ctx.restore();
}
function num(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 19) {
  ctx.save(); ctx.font = `${size}px sans-serif`; ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}

export function Msa7() {
  const [state, setState] = useState({ step: 0, logits: [0, 0, 0, 0] });
  const teacher = [.1, .2, .6, .1], p = probabilities(state.logits);
  const kl = teacher.reduce((v, t, i) => v + t * Math.log(t / p[i]), 0);
  const update = () => setState(s => {
    if (s.step >= 20) return s;
    const current = probabilities(s.logits);
    return { step: s.step + 1, logits: s.logits.map((v, i) => v - .8 * (current[i] - teacher[i])) };
  });
  return <div>
    <div className="step-ctrl"><button className="tiny" onClick={update} disabled={state.step === 20}>训练一步</button><span className="step-label">第 <b>{state.step}</b> / 20 步</span><button className="tiny ghost" onClick={() => setState({ step: 0, logits: [0, 0, 0, 0] })}>重置</button></div>
    <Scene label="四个选中 token 的固定教师概率与索引概率成对柱图；数据同时列于下表" draw={ctx => {
      line(ctx, [[85, 224], [1028, 224]], C.axis, 2);
      [0, .2, .4, .6].forEach(v => { const y = 224 - v * 275; line(ctx, [[85, y], [1028, y]], C.axis, 1); num(ctx, v.toFixed(1), 35, y + 6, C.muted, 17); });
      teacher.forEach((t, i) => {
        const x = 145 + i * 215;
        rounded(ctx, x, 224 - t * 275, 52, t * 275, C.blue);
        rounded(ctx, x + 62, 224 - p[i] * 275, 52, p[i] * 275, C.orange);
        num(ctx, t.toFixed(2), x + 5, 215 - t * 275, C.blue); num(ctx, p[i].toFixed(3), x + 62, 215 - p[i] * 275, C.orange);
        num(ctx, `j${i + 1}`, x + 43, 253);
      });
    }} />
    <div className="ctrl"><Stat label="固定教师" value="蓝色左柱" /><Stat label="索引分布" value="橙色右柱" /><Stat label="KL（自然对数）" value={kl.toFixed(6)} /></div>
    <table className="paper"><caption>相同选中支持集上的教学模拟，非论文实测</caption><thead><tr><th>token</th><th>教师概率</th><th>索引概率</th></tr></thead><tbody>{teacher.map((t, i) => <tr key={i}><th scope="row">j{i + 1}</th><td>{t.toFixed(3)}</td><td>{p[i].toFixed(6)}</td></tr>)}</tbody></table>
    <Feedback tone={state.step ? 'green' : 'blue'}>教师保持不动；KL = {kl.toFixed(6)}。这是选中支持集上的分布优化演示，不是 109B 模型训练复现。{state.step === 20 ? '已完成 20 步，可重置比较起点。' : '橙柱表示当前索引概率。'}</Feedback>
    <details><summary>展开：真实训练与这个玩具更新有什么区别？</summary><p>这里直接更新四个 logits：logits ← logits − 0.8 ×（索引概率 − 教师概率），只演示 KL 的方向。真实 MSA 从组内各主注意力头的 softmax 概率取平均，得到教师分布；不能先平均 logits 再 softmax。教师与索引分布都限制在同一组选中 token 上。</p><p>Top-k 的离散块编号没有常规可微路由梯度，因此引入 KL（教师 ∥ 索引）监督索引分支。教师概率停止梯度，索引输入 X 也停止梯度；辅助 KL 只更新索引 Q/K 投影，语言建模损失仍训练主模型。{source(5, '原文 p.5，Eqs.9–11')}。</p></details>
  </div>;
}

const architecture = [
  { title: '隐藏状态', shape: 'X [N, 3072]', text: '同一个隐藏状态送入两条分支。进入索引分支的是 detach(X)，避免辅助 KL 通过 X 改动主模型；主分支仍接受语言建模梯度。', x: 35, y: 108, w: 155, h: 62, symbol: 'X' },
  { title: '索引投影', shape: 'Qidx [N, 4, 128]；Kidx [N, 1, 128]', text: '每个 KV 组有一个索引 Q 头，四组共享一个索引 K 头；没有索引 value 头。128 是本图明示的索引维度演示配置。', x: 270, y: 32, w: 205, h: 70, symbol: 'Qidx, Kidx' },
  { title: '选块', shape: 'I [N, 4, 16]（块编号）', text: 'token 点积经块内 max 后选择块；每个 query、每组保留 16 个块，包含当前块。索引只提供块编号，不贡献另一份注意力输出。', x: 555, y: 32, w: 190, h: 70, symbol: 'Top-k → I' },
  { title: '主注意力', shape: 'Q [N, 64, 128]；K/V [N, 4, 128] → Oheads [N, 64, 128]', text: '主分支按 I 读取所选块内因果可见的 K/V，在这个支持集重新 softmax。组内 16 个 query 头共享 KV 与块集合，各头仍有自己的 Q。教师来自这些头的概率平均，并 detach 后监督索引器。', x: 555, y: 178, w: 205, h: 62, symbol: 'Attention' },
  { title: '输出', shape: 'Oheads → Wo → O [N, 3072]', text: '拼接主注意力各头的输出后经输出投影 Wo 回到隐藏维度。图中没有“索引输出 + 主输出”这条加法路径。', x: 890, y: 178, w: 155, h: 62, symbol: 'Wo → O' },
];
export function Msa8() {
  const [node, setNode] = useState(0);
  const choosePoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect(), x = (event.clientX - box.left) * 1080 / box.width, y = (event.clientY - box.top) * 280 / box.height;
    const found = architecture.findIndex(v => x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h);
    if (found >= 0) setNode(found);
  };
  return <div>
    <Chips items={architecture.map(v => v.title)} value={node} onChange={setNode} />
    <Scene label={`双分支结构热点图。当前：${architecture[node].title}。可点击节点，或使用左右方向键切换；下方有完整形状说明。`} tabIndex={0} onPointerDown={choosePoint} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setNode(n => (n + (e.key === 'ArrowRight' ? 1 : 4)) % 5); } }} draw={ctx => {
      const paths = [
        { ids: [0, 1], points: [[190, 127], [223, 127], [223, 67], [270, 67]], dashed: true },
        { ids: [1, 2], points: [[475, 67], [555, 67]], dashed: false },
        { ids: [0, 3], points: [[190, 150], [240, 150], [240, 209], [555, 209]], dashed: false },
        { ids: [2, 3], points: [[650, 102], [650, 178]], dashed: true },
        { ids: [3, 4], points: [[760, 209], [890, 209]], dashed: false },
      ];
      paths.forEach(path => arrow(ctx, path.points, path.ids.includes(node) ? C.blue : C.axis, path.ids.includes(node) ? 5 : 2, path.dashed));
      arrow(ctx, [[750, 186], [822, 186], [822, 81]], node === 3 ? C.purple : C.muted, 2, true);
      arrow(ctx, [[804, 48], [485, 13], [362, 32]], node === 1 ? C.orange : C.muted, 2, true);
      rounded(ctx, 795, 35, 65, 45, C.light, C.purple); num(ctx, 'KL', 813, 65, C.purple);
      num(ctx, 'detach(X)', 192, 99, C.purple, 17);
      num(ctx, 'detach(Pteacher)', 833, 123, C.purple, 16);
      num(ctx, 'Wq, Wk', 532, 24, C.orange, 16);
      architecture.forEach((v, i) => {
        rounded(ctx, v.x, v.y, v.w, v.h, node === i ? C.blue : C.paper, node === i ? C.orange : C.line);
        num(ctx, v.symbol, v.x + 18, v.y + v.h / 2 + 7, node === i ? C.paper : C.ink, 22);
        if (node === i) { ctx.save(); ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(v.x - 4, v.y - 4, v.w + 8, v.h + 8); ctx.restore(); }
      });
    }} />
    <div className="hotspot-info" aria-live="polite"><b>{architecture[node].title}</b><p style={{ overflowWrap: 'anywhere' }}>{architecture[node].shape}</p><p>{architecture[node].text}</p></div>
    <Feedback>点击图中节点会同时高亮节点及相连路径。简化示意采用 64 个 Q 头、4 个 KV 头、主头维 128、k = 16；不是逐层执行追踪。{source(4, 'Fig.1、Eq.5、Eq.8')}；{source(5, 'Eq.11')}；{source(30, 'Appendix C.3')}。</Feedback>
  </div>;
}

const trainingModes = [
  { title: '原生预训练', text: 'PT 总计 3T tokens：先 40B warmup，再 2960B 稀疏训练。warmup 先让索引器获得信号，避免一开始随机选块破坏主模型学习。' },
  { title: '从 GQA 转换', text: 'CPT 路线先完成 2.6T 稠密训练，再继续训练 400B，其中含 40B warmup 与 360B 稀疏训练；总计仍为 3T。转换需要继续训练，不能理解成无训练替换。' },
  { title: '隔离 KL 梯度', text: '紫色教师路径与索引输入 X 都停止梯度。辅助 KL 只更新索引 Q/K 投影；语言建模损失通过主分支训练主模型。附录稳定性曲线来自 10.53B pilot，不能当作 109B 主实验结果。' },
  { title: '省去选块 exp', text: 'softmax 不改变分数顺序，所以选块阶段可省去 exp 与归一化：先比较原分数即可得到同样的 Top-k 排序。这里四个数是教学模拟；主注意力的 softmax 仍保留。' },
  { title: 'KV 外循环', text: '把选中同一 KV 块的 query 聚起来，让矩阵乘更饱满；分块调度后的局部结果按 log-sum-exp（LSE）合并。图示只表达重排计算的关系，不测量延迟，也不意味着不同 query 的块集合相同。' },
];
export function Msa9() {
  const [mode, setMode] = useState(0);
  return <div>
    <Chips items={trainingModes.map(v => v.title)} value={mode} onChange={setMode} />
    <Scene label={`${trainingModes[mode].title}示意图；精确预算和作用见下方文字`} draw={ctx => {
      if (mode < 2) {
        const x0 = 175, width = 820, scale = width / 3000;
        const routes = [{ name: 'PT', segments: [40, 2960], colors: [C.orange, C.green] }, { name: 'CPT', segments: [2600, 40, 360], colors: [C.neutral, C.orange, C.green] }];
        routes.forEach((r, i) => {
          const y = 80 + i * 90; num(ctx, r.name, 68, y + 32, mode === i ? C.blue : C.muted, 26);
          let x = x0;
          r.segments.forEach((amount, j) => { const w = amount * scale; ctx.fillStyle = r.colors[j]; ctx.globalAlpha = mode === i ? 1 : .4; ctx.fillRect(x, y, w, 44); ctx.globalAlpha = 1; if (w > 90) num(ctx, `${amount}B`, x + 14, y + 29, C.ink); x += w; });
          if (mode === i) { ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.strokeRect(x0 - 4, y - 4, width + 8, 52); }
        });
        num(ctx, '0', x0, 248); num(ctx, '3T', x0 + width - 26, 248); num(ctx, '40B', x0 + (mode === 1 ? 2600 * scale : 0), mode === 1 ? 158 : 65, C.orange, 18);
      } else if (mode === 2) {
        rounded(ctx, 65, 95, 140, 70, C.paper, C.line); num(ctx, 'X', 122, 138, C.ink, 27);
        rounded(ctx, 405, 35, 220, 64, C.light, C.orange); num(ctx, 'Widx', 477, 75, C.orange, 26);
        rounded(ctx, 405, 178, 220, 64, C.light, C.blue); num(ctx, 'Attention', 455, 218, C.blue, 25);
        rounded(ctx, 850, 35, 145, 64, C.light, C.orange); num(ctx, 'KL', 905, 75, C.orange, 26);
        rounded(ctx, 850, 178, 145, 64, C.light, C.blue); num(ctx, 'LM', 900, 218, C.blue, 26);
        arrow(ctx, [[205, 125], [300, 125], [300, 67], [405, 67]], C.purple, 3, true);
        arrow(ctx, [[205, 147], [300, 147], [300, 210], [405, 210]], C.blue, 4);
        arrow(ctx, [[850, 67], [625, 67]], C.orange, 4, true);
        arrow(ctx, [[850, 210], [625, 210]], C.blue, 4);
        arrow(ctx, [[625, 190], [745, 190], [745, 90], [850, 90]], C.purple, 3, true);
        line(ctx, [[270, 111], [285, 140]], C.red, 5); line(ctx, [[726, 132], [761, 132]], C.red, 5);
        num(ctx, 'detach(X)', 224, 91, C.purple, 18); num(ctx, 'detach(Pteacher)', 641, 163, C.purple, 17);
      } else if (mode === 3) {
        const raw = [.2, 1.2, 2.8, .5], probs = probabilities(raw);
        [0, 1].forEach(side => {
          const x0 = 80 + side * 540; num(ctx, side ? 'softmax' : 'logits', x0 + 115, 42, C.blue, 23);
          line(ctx, [[x0, 221], [x0 + 365, 221]], C.axis, 2);
          raw.forEach((v, i) => { const value = side ? probs[i] : v, h = side ? value * 190 : value * 55, x = x0 + 22 + i * 87; rounded(ctx, x, 221 - h, 57, h, i === 2 ? C.green : C.neutral); num(ctx, value.toFixed(side ? 2 : 1), x + 7, 213 - h, C.ink, 18); num(ctx, `j${i + 1}`, x + 14, 250, C.ink, 18); });
        });
        arrow(ctx, [[470, 126], [553, 126]], C.blue, 4);
      } else {
        const selections = [[0, 3], [1, 3], [0, 2], [2, 3], [0, 3], [1, 2]];
        label(ctx, 'Q-outer', 100, 45); label(ctx, 'KV-outer', 675, 45);
        selections.forEach((blocks, q) => { num(ctx, `q${q}`, 42, 79 + q * 28, C.ink, 18); for (let b = 0; b < 4; b++) rounded(ctx, 102 + b * 69, 61 + q * 28, 60, 20, blocks.includes(b) ? C.blue : C.light); });
        for (let b = 0; b < 4; b++) {
          const qs = selections.flatMap((blocks, q) => blocks.includes(b) ? [q] : []), x = 635 + b * 102;
          num(ctx, `B${b}`, x + 16, 78, C.blue, 21);
          qs.forEach((q, r) => { rounded(ctx, x, 95 + r * 33, 78, 26, C.green); num(ctx, `q${q}`, x + 24, 115 + r * 33, C.paper, 17); });
        }
        arrow(ctx, [[405, 142], [555, 142]], C.orange, 5);
      }
    }} />
    <Feedback>{trainingModes[mode].text}</Feedback>
    {mode < 2 && <table className="paper"><caption>109B MoE 主实验预算：单位 B tokens；1000B = 1T</caption><thead><tr><th>路线</th><th>已有稠密训练</th><th>warmup</th><th>之后稀疏训练</th><th>总计</th></tr></thead><tbody><tr><th scope="row">PT</th><td>0B</td><td>40B</td><td>2960B</td><td>3000B</td></tr><tr><th scope="row">CPT</th><td>2600B</td><td>40B</td><td>360B</td><td>3000B</td></tr></tbody></table>}
    <details><summary>展开：哪些细节有实验依据，哪些不能外推？</summary><p>当前块始终保留，占用 k 的一个名额；仍只读其中因果可见的 token，不额外强制首块，也不额外添加大局部窗口。learnable sink 没有一致收益；报告的 agent PPL 上，同预算动态选块优于固定滑窗。这些稳定性证据主要来自 10.53B pilot，而非 109B 主模型的全面结论。</p><p>选块省去 exp 是利用 softmax 保序；KV 外循环改善矩阵乘形状，分块调度后按 LSE 合并。理论省算量和硬件实际加速要分开看。{source(5, 'p.5 §3.2')}、{source(6, 'pp.6–8 §4')}、{source(8, 'pp.8–10 §5.1–5.2')}、{source(23, 'pp.23–30 Appendix B/C')}。</p></details>
  </div>;
}

type ResultMetric = { name: string; values: (number | null)[]; lower?: boolean; decimals: number; long?: boolean };
const results: ResultMetric[] = [
  { name: 'MMLU', values: [67.0, 67.2, 66.8], decimals: 1 },
  { name: 'HumanEval', values: [61.0, 64.0, 57.9], decimals: 1 },
  { name: 'MMMU', values: [46.8, 45.9, 44.5], decimals: 1 },
  { name: 'VideoMME', values: [41.11, 45.48, 39.65], decimals: 2 },
  { name: 'TAU2 PPL', values: [1.155, 1.148, 1.150], decimals: 3, lower: true },
  { name: 'RULER 32K', values: [75.0, 77.5, 75.7], decimals: 1 },
  { name: 'HELMET 128K', values: [46.53, null, 45.93], decimals: 2, long: true },
  { name: 'RULER 128K', values: [72.00, null, 72.12], decimals: 2, long: true },
];
const modelNames = ['Full', 'PT', 'CPT'];
export function Msa10() {
  const [metric, setMetric] = useState(0), [run, setRun] = useState(0), [progress, setProgress] = useState(1);
  useEffect(() => {
    if (!run || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); return; }
    let raf = 0, start = 0;
    const frame = (now: number) => { if (!start) start = now; const p = Math.min(1, (now - start) / 1400); setProgress(1 - Math.pow(1 - p, 3)); if (p < 1) raf = requestAnimationFrame(frame); };
    setProgress(0); raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [run, metric]);
  const selected = results[metric], values = selected.values.filter((v): v is number => v !== null), base = selected.values[0]!, max = Math.max(...values) * 1.15;
  const relation = (v: number) => v === base ? '与 Full 相同' : (selected.lower ? v < base : v > base) ? '优于 Full' : '低于 Full';
  const color = (v: number, i: number) => i === 0 ? C.blue : v === base ? C.muted : (selected.lower ? v < base : v > base) ? C.green : C.red;
  return <div>
    <Chips items={results.map(v => v.name)} value={metric} onChange={n=>{setMetric(n);setRun(0);setProgress(1);}} />
    <div className="step-ctrl"><button className="tiny" onClick={() => setRun(r => r + 1)}>开始比较</button><span>{selected.lower ? '↓ PPL 越低越好' : '↑ 分数越高越好'}</span></div>
    <Feedback tone="blue">{selected.long ? '独立长上下文组：CPT 另做约 140B 长上下文训练，再评测 128K；PT 未报告，不当作 0。不能把这组当成同一 3T 主实验。' : 'Table 2 主实验：109B MoE，Full / PT / CPT 使用匹配的 3T tokens 总预算。'}{selected.lower ? ' PPL 是困惑度，不是任务成功率。' : ''}</Feedback>
    <Scene label={`${selected.name} 原始数值比较，${selected.lower ? '越低越好' : '越高越好'}；精确值及缺失状态在下表`} draw={ctx => {
      line(ctx, [[165, 35], [165, 252]], C.axis, 2); num(ctx, '0', 155, 269, C.muted, 17);
      selected.values.forEach((v, i) => {
        const y = 50 + i * 73;
        num(ctx, modelNames[i], 65, y + 30, C.ink, 23);
        if (v === null) { line(ctx, [[180, y + 22], [350, y + 22]], C.muted, 2, true); num(ctx, '未报告', 370, y + 30, C.muted, 22); return; }
        const w = v / max * 740 * progress;
        if (w > 0) rounded(ctx, 166, y, w, 44, color(v, i));
        num(ctx, v.toFixed(selected.decimals), 184 + w, y + 29, C.ink, 22);
        if (i > 0) num(ctx, (selected.lower ? v < base : v > base) ? '✓' : '−', 1020, y + 30, color(v, i), 27);
      });
    }} />
    <table className="paper"><caption>{selected.name} · {selected.long ? 'Table 3，额外长上下文训练组' : 'Table 2，3T 匹配预算组'}</caption><thead><tr><th>模型</th><th>{selected.lower ? 'PPL ↓' : '分数 ↑'}</th><th>相对 Full</th></tr></thead><tbody>{selected.values.map((v, i) => <tr key={i}><th scope="row">{modelNames[i]}</th><td>{v === null ? '未报告' : v.toFixed(selected.decimals)}</td><td>{v === null ? '无数据，不参与比较' : i === 0 ? '基线' : `${relation(v)}（${v >= base ? '+' : ''}${(v - base).toFixed(selected.decimals)}）`}</td></tr>)}</tbody></table>
    <Feedback>{selected.long ? `${selected.name} 只比较论文列出的 Full 和 CPT；这些是 128K 质量结果，不能当作 1M 质量分数。` : `${selected.name}：PT ${relation(selected.values[1]!) }，CPT ${relation(selected.values[2]!)}。不同任务结果有升有降，“总体接近”不等于逐项胜出。`}{source(selected.long ? 12 : 11, selected.long ? 'pp.11–12 Table 3' : 'p.11 Table 2')}。</Feedback>
    <details><summary>展开：Tables 4–6 的消融为什么不能只挑好看的数？</summary><p>以下实验减少了训练迭代并使用评测子集，条件与主实验不同。只在各表内部比较；不要把不同消融表拼成一个排行榜。</p><table className="paper"><caption>p.29 Table 4：块大小消融，选中 token 总预算固定</caption><thead><tr><th>Bk</th><th>RULER 32K ↑</th><th>TAU2 PPL ↓</th></tr></thead><tbody><tr><td>32</td><td>66.1</td><td>1.176</td></tr><tr><td>64</td><td>65.3</td><td>1.176</td></tr><tr><td>128</td><td>64.6</td><td>1.176</td></tr></tbody></table><p>较小块在此项 RULER 更高，TAU2 PPL 相同；不能据此断言所有任务都随块缩小而提升。</p><table className="paper"><caption>p.30 Table 5：强制首块与大局部窗口（当前块仍保留）</caption><thead><tr><th>设置</th><th>RULER 32K ↑</th></tr></thead><tbody><tr><td>不强制首块/大局部窗口</td><td>61.5</td></tr><tr><td>强制首块/大局部窗口</td><td>65.8</td></tr></tbody></table><table className="paper"><caption>p.30 Table 6：warmup 后的索引 value 头消融</caption><thead><tr><th>设置</th><th>MMLU ↑</th><th>HumanEval ↑</th></tr></thead><tbody><tr><td>保留 value</td><td>66.4</td><td>60.4</td></tr><tr><td>取消 value</td><td>67.3</td><td>59.1</td></tr></tbody></table><p>取消 value 后，MMLU 上升、HumanEval 下降，收益混合；作者采用索引无 value 的简洁设计，不等于每项分数都提高。{source(29, '原文 pp.29–30，Tables 4–6')}。</p></details>
  </div>;
}

const judgments = [
  { title: '整个 MSA 的复杂度严格线性', text: '不成立。主分支在固定 k 和 Bk 时随 N 线性增长，但索引分支仍有 Hkv × didx × N² 项；“稀疏”并不自动等于整个算法严格线性。', locator: 'p.6 §3.3 Eq.12', page: 6 },
  { title: '1M 加速证明所有 1M 任务无损', text: '不成立。1M 报告的是 H800 上特定配置的注意力效率；Table 3 的质量评测到 128K。速度证据无法替代所有 1M 任务的质量证据，也不代表完整应用加速。', locator: 'p.12 §5.4 Fig.4；pp.11–12 Table 3', page: 12 },
  { title: '给定设置下效率提高，质量收益因任务而异', text: '证据支持。论文报告指定 H800 / 1M 配置下注意力 FLOPs 缩减 28.4×、prefill 加速 14.2×、decode 加速 7.6×；匹配预算的质量总体接近，各项有升有降。', locator: 'p.11 Table 2；p.12 §5.4 Fig.4', page: 12 },
];
export function MsaBoundary() {
  const [choice, setChoice] = useState<number | null>(null);
  return <div>
    <div className="chip-row" role="group" aria-label="选择能被论文支持的结论">{judgments.map((v, i) => <button key={v.title} className={`chip ${choice === i ? 'selected' : ''}`} aria-pressed={choice === i} onClick={() => setChoice(i)} style={{ whiteSpace: 'normal', textAlign: 'left' }}>{v.title}</button>)}</div>
    <Scene label={choice === null ? '证据边界标尺：请选择一个判断' : `证据边界反馈：${choice === 2 ? '有条件成立' : '证据不足'}`} draw={ctx => {
      const columns = [{ x: 70, title: '算量', value: 'N² + N' }, { x: 400, title: '速度', value: 'H800 · 1M' }, { x: 730, title: '质量', value: '3T / 128K' }];
      columns.forEach((v, i) => {
        const wrong = (choice === 0 && i === 0) || (choice === 1 && i >= 1), current = choice === 2 || wrong;
        rounded(ctx, v.x, 56, 265, 134, current ? C.light : C.paper, current ? wrong ? C.red : C.green : C.line);
        num(ctx, v.title, v.x + 30, 91, current ? wrong ? C.red : C.green : C.muted, 24);
        num(ctx, v.value, v.x + 30, 140, C.ink, 23);
        num(ctx, current ? wrong ? '×' : '✓' : '·', v.x + 210, 148, current ? wrong ? C.red : C.green : C.muted, 37);
      });
      line(ctx, [[70, 223], [995, 223]], C.axis, 5);
      if (choice !== null) { const x = choice === 2 ? 615 : 980; rounded(ctx, 70, 216, x - 70, 14, choice === 2 ? C.green : C.red); ctx.beginPath(); ctx.fillStyle = choice === 2 ? C.green : C.red; ctx.arc(x, 223, 11, 0, Math.PI * 2); ctx.fill(); }
    }} />
    <Feedback tone={choice === null ? 'blue' : choice === 2 ? 'green' : 'red'}>{choice === null ? '先选一个判断，图中将标出它是否越过算量、速度或质量证据的边界。' : <>{judgments[choice].text} {source(judgments[choice].page, judgments[choice].locator)}。</>}</Feedback>
    <details><summary>展开：我还应该保留哪些问题？</summary><p>索引可能漏掉重要块；只读取最多 2048 个 token 不等于 KV cache 只存 2048 个 token。质量比较没有普适无损保证，作者对 RL 与 agent 部署的拓展仍属展望。完整评测 split 和提示细节未全部披露，这里不补造；本页面没有重新训练或独立复现实验。{source(13, 'pp.13–14 §7 Outlook')}。</p><p>继续核查：<a href="https://arxiv.org/abs/2606.13392v2" target="_blank" rel="noreferrer">论文 arXiv v2</a> · <a href="https://github.com/MiniMax-AI/MSA" target="_blank" rel="noreferrer">MiniMax 官方 MSA 仓库</a>。</p></details>
  </div>;
}
