import { useEffect, useRef, useState } from 'react';
import { Feedback } from './coop-kit';
import { MechanismGraph } from './mechanism-graph';
import { SamplePortrait } from './learning-visuals';
import { toyModel } from './coop-model';
import { useAnimatedNumbers } from './motion-hooks';
import './gradient-lab.css';

type Vec = [number, number];
type NodeId = 'context' | 'class' | 'text' | 'image' | 'similarity' | 'loss';
type Trial = 'A' | 'B';
type Phase = 'ready' | 'forward' | 'backward' | 'done';
const NODES: { id: NodeId; number: number; name: string; short: string; x: number; y: number; fixed: boolean; text: string }[] = [
  { id: 'context', number: 1, name: '上下文 V', short: '上下文 V', x: 100, y: 190, fixed: false, text: '这是交给优化器更新的参数。它与类别名称拼成文本输入；共享上下文用于当前任务的全部类别。改变 V 就能改变生成的类别文本特征。' },
  { id: 'class', number: 2, name: '类别名称嵌入', short: '类别名', x: 100, y: 290, fixed: true, text: '猫、狗、花的名称先变成数字表示，即词嵌入。它们告诉模型正在描述哪个类别；这些数值固定，不交给优化器更新。' },
  { id: 'text', number: 3, name: '文本编码器', short: '文本编码', x: 430, y: 240, fixed: true, text: '同一个冻结编码器处理每个类别的提示，输出各自的文本特征。固定的是处理规则，输入 V 的变化仍会影响输出，所以还能追溯 V 对损失的影响。' },
  { id: 'image', number: 4, name: '图像编码器', short: '图像编码', x: 430, y: 80, fixed: true, text: '图片经它变成图像特征。它的权重固定；对同一张固定图片，更新 V 不会改变这个图像特征。换图片或图片增强视图，特征仍可能变化。' },
  { id: 'similarity', number: 5, name: '相似度与概率', short: '相似度', x: 755, y: 160, fixed: false, text: '把图像特征与所有类别文本特征比较，再通过 softmax 算出概率。它依赖两条输入支路，但没有另外一套需要训练的分类器权重。' },
  { id: 'loss', number: 6, name: '分类交叉熵', short: '分类损失', x: 960, y: 160, fixed: false, text: '训练标签告诉我们正确类别是猫，L = −ln p猫 衡量给猫的概率是否足够高。反向传播从这里开始，逐段计算：哪个输入变化会怎样影响损失？' },
];

const initial = toyModel([0, 0], 0);
const nextV: Vec = [-.15 * initial.gradient[0], -.15 * initial.gradient[1]];
const updated = toyModel(nextV, 0);
const pair = (v: number[]) => `[${v[0].toFixed(4)}, ${v[1].toFixed(4)}]`;
const percent = (p: number) => `${(p * 100).toFixed(2)}%`;
function Lock() { return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 14V9a7 7 0 0 1 14 0v5" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="5" y="13" width="22" height="17" rx="5" fill="currentColor"/><circle cx="16" cy="19.4" r="2.2" fill="#1c2945"/><path d="M16 20v4" stroke="#1c2945" strokeWidth="2.5" strokeLinecap="round"/></svg>; }

export function GradientLab() {
  const [trial, setTrial] = useState<Trial>('A');
  const [phase, setPhase] = useState<Phase>('ready');
  const [run, setRun] = useState(0);
  const [records, setRecords] = useState({ A: false, B: false });
  const [selected, setSelected] = useState<NodeId>('text');
  const scene = useRef<HTMLDivElement>(null);
  const running = phase === 'forward' || phase === 'backward';
  const detached = trial === 'B';
  const complete = records.A && records.B;
  const changed = phase === 'done' && !detached;
  const current = changed ? updated : initial;
  const animated = useAnimatedNumbers([...(changed ? nextV : [0, 0]), current.probs[0] * 100, current.loss], changed ? 650 : 0);
  const display = changed ? animated : [0, 0, initial.probs[0] * 100, initial.loss];
  const node = NODES.find(n => n.id === selected)!;

  useEffect(() => {
    if (!run) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => { setPhase('done'); setRecords(r => ({ ...r, [trial]: true })); };
    if (media.matches || document.hidden) { finish(); return; }
    let timers: ReturnType<typeof setTimeout>[] = [];
    const settle = () => { timers.forEach(clearTimeout); finish(); };
    const onVisibility = () => { if (document.hidden) settle(); };
    const onPreference = () => { if (media.matches) settle(); };
    timers = [setTimeout(() => setPhase('backward'), 650), setTimeout(finish, 1900)];
    document.addEventListener('visibilitychange', onVisibility);
    media.addEventListener('change', onPreference);
    return () => { timers.forEach(clearTimeout); document.removeEventListener('visibilitychange', onVisibility); media.removeEventListener('change', onPreference); };
  }, [run, trial]);

  const start = (which: Trial, reveal = false) => { setTrial(which); setPhase('forward'); setRun(n => n + 1); if (reveal) scene.current?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
  const reset = () => { setRun(0); setTrial('A'); setPhase('ready'); setRecords({ A: false, B: false }); };
  const primary = () => { if (complete) reset(); else start(records.A ? 'B' : 'A'); };
  const headline = phase === 'ready' ? '先做 A：冻结权重，保留求导路径'
    : phase === 'forward' ? '① 先算预测：两次试验的起点相同'
    : phase === 'backward' ? (detached ? '② 梯度遇到断点，无法回到 V' : '② 梯度穿过固定编码器，回到 V')
    : detached ? 'B 的结果：V 没变，损失也没变' : 'A 的结果：编码器没动，V 成功更新';
  const explanation = phase === 'ready' ? '先点击“运行 A”。观察锁始终不动，而学习信号能否传回左侧的上下文。'
    : phase === 'forward' ? '两次都从 V = [0, 0] 出发，用同一张猫图计算预测。切断求导关系不会改变前向计算。'
    : phase === 'backward' ? detached ? '当前预测和损失仍可计算，但分类损失无法提供 V 的梯度。' : '沿计算关系追溯损失对 V 的影响；求到梯度之后，才执行参数更新。'
    : detached ? '路径断开后，V 没有从这个损失收到梯度，无法执行这次更新。这不等于算出了数值为零的梯度。'
    : '锁住的是编码器权重。固定函数仍能对输入 V 求导，所以只有上下文发生改变。' + (records.B ? '下方可直接对照 B 的结果。' : '接着做 B，看看切断路径会怎样。');
  return <div className="gl-lab">
    <div className="gl-intro"><SamplePortrait kind={0}/><div><strong>只改变一件事：梯度能不能通过</strong><p>同一张猫图、同一个起点 V = [0, 0]。两次都冻结编码器，先做 A，再做 B。</p><span>教学模型 · 每次只尝试更新一步 · 步长 0.15</span></div></div>
    <ol className="gl-guide" aria-label="实验顺序"><li data-current={!records.A}><b>{records.A ? '✓' : '1'}</b><span>保持连通，试一次</span></li><li data-current={records.A && !records.B}><b>{records.B ? '✓' : '2'}</b><span>切断路径，再试一次</span></li><li data-current={complete}><b>3</b><span>对照两个结果</span></li></ol>
    <div className="gl-workbench" ref={scene} data-phase={phase} data-detached={detached} data-changed={changed}>
      <div className="gl-experiment-title"><span>试验 {trial}</span><strong>{headline}</strong></div>
      <div className="gl-action"><div><b>{running ? '正在计算，请观察下方变化' : complete ? '两次试验已完成' : records.A ? '下一步，只改变求导路径' : '从这里开始'}</b><p>{running ? '编码器的锁一直保持不变。' : complete ? '下方保留 A 与 B 的结果，可以直接比较。' : records.A ? 'B 会回到相同初始值，并在文本输出处切断梯度。' : '无需先认识图里所有符号，点击按钮即可运行第一组。'}</p><div className="gl-live"><span>当前 V <strong>{pair(display.slice(0,2))}</strong></span><span>当前损失 <strong>{display[3].toFixed(4)}</strong></span></div></div><button className="tiny gl-primary" onClick={primary} disabled={running}>{running ? '计算中…' : complete ? '重新做两次试验' : records.A ? '切断路径，运行 B →' : '运行 A：让梯度通过 →'}</button></div>
      <div className="gl-stations">
        <div className="gl-context"><span>唯一可学习的部分</span><h5>上下文 V</h5><div className="gl-vector">{display.slice(0,2).map((v,i)=><div key={i}><span>第 {i+1} 个数值</span><strong>{v.toFixed(4)}</strong><i><b style={{height:`${35 + v * 80}%`}}/></i></div>)}</div><b className="gl-card-note">{changed ? '已更新一次' : '仍是初始值'}</b></div>
        <div className="gl-encoder"><Lock/><h5>文本编码器</h5><strong>权重始终固定</strong><p>不训练它的参数<br/>仍可求它对输入的导数</p></div>
        <div className="gl-outcome"><span>同一张猫图</span>{detached && <b className="gl-mobile-break" aria-hidden="true">×</b>}<h5>分类损失</h5><strong>{display[3].toFixed(4)}</strong><div>给猫的概率 <b>{display[2].toFixed(2)}%</b></div><span className="gl-card-note">{changed ? '重新前向计算后，损失下降' : phase === 'done' ? '本次没有更新，损失保持不变' : '先计算预测，再尝试更新'}</span></div>
      </div>
      <div className="gl-return" aria-label={detached ? '文本输出的求导关系断开' : '损失经过文本编码器回到上下文'}>
        <svg viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M835 0V12Q835 34 813 34H187Q165 34 165 12V4" className="gl-base-line"/><path d={detached ? 'M835 0V12Q835 34 813 34H640' : 'M835 0V12Q835 34 813 34H187Q165 34 165 12V4'} className="gl-signal-line" pathLength="100"/><path d={detached ? 'M655 25L640 34L655 43' : 'M156 15L165 4L174 15'} className="gl-arrow-head"/></svg>
        {detached && <span className="gl-cut">×</span>}
        <strong>{phase === 'forward' || phase === 'ready' ? '从损失往回追溯：V 的变化怎样影响损失？' : detached ? '求导路径在文本输出处断开' : '梯度 ← 固定编码器 ← 分类损失'}</strong>
      </div>
      <div className="gl-status" role="status">{explanation}</div>
    </div>
    <div className="gl-comparison" aria-label="两次试验的结果对照">
      {(['A','B'] as Trial[]).map(key=>{const done=records[key],success=key==='A',end=success?updated:initial;return <article key={key} data-done={done} data-success={success}><div className="gl-result-heading"><b>{key}</b><div><h5>{success ? '冻结，但连通' : '冻结，并切断'}</h5><span>编码器权重固定 · {success ? '梯度保留' : '梯度断开'}</span></div></div><strong className="gl-verdict">{done ? success ? '上下文可以更新' : '上下文无法更新' : '等待运行这组试验'}</strong>{done ? <dl><div><dt>V</dt><dd>{pair([0,0])} → <strong>{pair(success?nextV:[0,0])}</strong></dd></div><div><dt>猫的概率</dt><dd>{percent(initial.probs[0])} → <strong>{percent(end.probs[0])}</strong></dd></div><div><dt>损失</dt><dd>{initial.loss.toFixed(4)} → <strong>{end.loss.toFixed(4)}</strong></dd></div></dl> : <p>两组从相同输入开始，运行后在这里对照变化。</p>}{complete && <button className="chip" onClick={()=>start(key,true)} disabled={running}>重看试验 {key}</button>}</article>})}
    </div>
    {complete && <Feedback tone="good">两次都冻结了编码器，只有 A 更新成功。<strong>冻结权重 ≠ 切断梯度：</strong>CoOp 固定模型参数，同时保留损失到上下文的求导路径。</Feedback>}
    <details className="gl-advanced"><summary>继续拆开看：完整计算图与每个节点</summary><p>现在再点图中的节点，查看它的作用。蓝色表示前向计算，橙色表示从损失回到 V 的求导路径。</p><MechanismGraph nodes={NODES} selected={selected} direction={phase==='ready'||phase==='forward'?'forward':'backward'} detached={detached} onSelect={id=>setSelected(id as NodeId)}/><div className="lv-node-detail" aria-live="polite"><h5>{node.name}</h5><p>{node.text}{selected==='text'&&detached?' 当前试验切断了它的输出与上游求导关系，分类损失无法继续求到 V 的梯度。':''}</p></div><p>CLIP 从文本结束符位置的表示经投影得到文本特征；同一个文本编码器分别处理各类别提示。本实验的数值来自微型教学模型，并非真实 CLIP 推理。</p></details>
  </div>;
}
