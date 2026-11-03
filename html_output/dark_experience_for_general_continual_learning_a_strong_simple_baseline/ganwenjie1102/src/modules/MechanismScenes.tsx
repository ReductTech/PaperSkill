import { useEffect, useRef, useState } from 'react';
import ModelMark from './review/ModelMark';
import { type ModelClass } from './review/ModelPixel';
import { CLASSES, HISTORY_Z, RESPONSE_CASES, logitComparison, probabilityComparison, formatValue } from './math-model';
import { KLDefinition, SquaredDefinition, KLGradientDerivation } from './MathNotation';
import { ReferenceButton } from './Reference';
import './der-redesign.css';
const number = (n: number) => Number(n.toFixed(3)).toString();
const vector = (v: readonly number[]) => `(${v.map(number).join(', ')})`;
export default function ResponseComparison() {
    const [selected, setSelected] = useState(1), [a, setA] = useState<readonly number[]>(RESPONSE_CASES[1].values), [focus, setFocus] = useState(1), [lens, setLens] = useState<'kl' | 'squared'>('kl'), [playing, setPlaying] = useState(false), [progress, setProgress] = useState(1);
    const origin = useRef<readonly number[]>(HISTORY_Z), position = useRef(1);
    const r = logitComparison(HISTORY_Z, a), probability = probabilityComparison(r.p, r.q);
    function begin(index: number, replay = false) {
        setSelected(index);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setA(RESPONSE_CASES[index].values);
            setProgress(1);
            position.current = 1;
            setPlaying(false);
            return;
        }
        origin.current = replay ? HISTORY_Z : a;
        setA(origin.current);
        position.current = 0;
        setProgress(0);
        setPlaying(true);
    }
    useEffect(() => {
        if (!playing)
            return;
        let frame: number, previous: number | undefined;
        const tick = (time: number) => { if (previous !== undefined)
            position.current = Math.min(1, position.current + (time - previous) / 1400); previous = time; const t = position.current, eased = t * t * (3 - 2 * t); setA(origin.current.map((v, k) => t === 1 ? RESPONSE_CASES[selected].values[k] : v + (RESPONSE_CASES[selected].values[k] - v) * eased)); setProgress(t); if (t < 1)
            frame = requestAnimationFrame(tick);
        else
            setPlaying(false); };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, selected]);
    useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const settle = () => { if (media.matches) {
        setA(RESPONSE_CASES[selected].values);
        position.current = 1;
        setProgress(1);
        setPlaying(false);
    } }; media.addEventListener('change', settle); return () => media.removeEventListener('change', settle); }, [selected]);
    return <div className="der-redesign der-u2" data-core-items="I03 I04"><section className="der-lab response-lab" data-design="response-comparison" data-case={RESPONSE_CASES[selected].id} data-z={r.z.join(',')} data-a={r.a.join(',')} data-p={r.p.join(',')} data-q={r.q.join(',')} data-kl={r.probabilityKL} data-l2={r.squaredDistance} data-progress={progress} data-playing={playing}>
 <header className="der-lab-header"><div className="der-lab-input"><ModelMark /><div><strong>同一输入 x₁</strong><span>历史 z = (2, 1, 0) · 始终固定</span></div></div><div className="der-cases" role="group" aria-label="响应比较情形">{RESPONSE_CASES.map((item, i) => <button key={item.id} data-response-case={item.id} aria-pressed={i === selected} onClick={() => begin(i)}>{i === 2 ? '共同平移 +1' : item.label}</button>)}</div></header>
 <div className="der-lab-body"><div className="der-track-panel"><h3>固定过去，观察现在。</h3><p className="der-chart-legend"><span>○ 历史 z</span><span>● 当前 a</span><small>原始 logits · 共用尺度 0—3</small></p><div className="der-coordinates">{CLASSES.map((name, k) => <button className="der-coordinate" key={name} aria-pressed={focus === k} onClick={() => setFocus(k)}><span className="der-coordinate-label"><ModelMark model={k as ModelClass}/><strong>{name}</strong><small>差 {number(r.differences[k])}</small></span><svg viewBox="0 0 390 62" role="img" aria-label={`${name} 历史 ${r.z[k]}，当前 ${number(r.a[k])}`}>
 {[0, 1, 2, 3].map(v => <g key={v}><line x1={16 + v * 117} x2={16 + v * 117} y1="6" y2="42" className="der-tick"/><text x={16 + v * 117} y="60" textAnchor="middle">{v}</text></g>)}<line x1="16" x2="367" y1="24" y2="24" className="der-axis"/><line x1={16 + r.z[k] * 117} x2={16 + r.a[k] * 117} y1="24" y2="24" className="der-difference"/><circle cx={16 + r.z[k] * 117} cy="17" r="5" className="der-old-dot"/><circle cx={16 + r.a[k] * 117} cy="31" r="5" className="der-new-dot"/>
 </svg><span className="der-coordinate-values">z {number(r.z[k])}<br />a {number(r.a[k])}</span></button>)}</div><p className="der-track-note">点击类别，在右侧追踪它对损失的贡献。当前分数变化时，历史标记留在原处。</p><div className="der-lab-transport"><button data-response-replay onClick={() => begin(selected, true)}>重播变化</button><button data-response-play disabled={progress === 1} onClick={() => setPlaying(!playing)}>{playing ? '暂停' : '继续'}</button></div></div>
 <div className="der-inspector"><div className="der-lens-tabs" role="group" aria-label="选择观察空间"><button aria-pressed={lens === 'kl'} onClick={() => setLens('kl')}>概率空间 · KL</button><button aria-pressed={lens === 'squared'} onClick={() => setLens('squared')}>分数空间 · 平方差</button></div>
 {lens === 'kl' ? <section className="der-lens kl-explanation"><h4>归一化后，偏离了多少？</h4><p>p = softmax(z) 固定，q = softmax(a) 随当前模型改变。</p><table><thead><tr><th>类别</th><th>旧 p</th><th>当前 q</th><th>KL 贡献</th></tr></thead><tbody>{CLASSES.map((name, k) => <tr key={name} data-focused={focus === k}><th scope="row">{name}</th><td>{formatValue(r.p[k])}</td><td>{formatValue(r.q[k])}</td><td>{number(probability.terms[k])}</td></tr>)}</tbody></table><KLDefinition /><p>按历史概率加权，再把各类贡献相加。方向是 <strong>p ∥ q</strong>；单项贡献可以为负，总和非负。</p><p className="der-gradient">{CLASSES[focus]} 的输出梯度 qₖ−pₖ = <strong>{number(probability.gradient[focus])}</strong>。{probability.gradient[focus] < 0 ? '梯度下降倾向提高该类相对分数。' : probability.gradient[focus] > 0 ? '梯度下降倾向降低该类相对分数。' : '这一项无需调整。'}</p></section> : <section className="der-lens squared-explanation" id="logit-matching"><h4>逐类平方，让正负偏离不抵消。</h4><p>直接使用原始分数。历史 z 为常量，当前 a 是需要约束的输出。</p><table><thead><tr><th>类别</th><th>a − z</th><th>平方贡献</th><th>输出梯度</th></tr></thead><tbody>{CLASSES.map((name, k) => <tr key={name} data-focused={focus === k}><th scope="row">{name}</th><td>{number(r.differences[k])}</td><td data-square={k}>{number(r.squares[k])}</td><td>{number(r.gradient[k])}</td></tr>)}</tbody></table><SquaredDefinition /><p>{r.squares.map(number).join(' + ')} = <strong>{number(r.squaredDistance)}</strong>。每个类别都参与匹配，不只比较最高分。</p><p className="der-gradient">输出梯度 2(a−z) = <strong>{vector(r.gradient)}</strong>，再经当前网络反向传播至参数 θ。</p></section>}
 </div></div><footer className="der-lab-results"><div><span>概率 KL(p ∥ q)</span><output data-kl-value>{formatValue(r.probabilityKL, 4)}</output></div><div><span>logits 平方距离</span><output data-l2-value>{number(r.squaredDistance)}</output></div><p aria-live="polite">{progress < 1 ? '当前分数正在变化，历史目标保持固定。可暂停查看中间值。' : RESPONSE_CASES[selected].conclusion}</p></footer></section>
 <div className="der-math-reading"><div><h3>为什么比较这两个空间？</h3><p>共同平移时，softmax 的分子、分母同时乘以相同常数，概率完全不变，因此 KL 为 0；原始分数各增加 1，平方距离为 3。</p><p>DER 选择匹配 logits，还约束整体分数水平。这个反例说明约束不同，不能据此断言平方匹配总优于 KL。</p></div><div><h4>让偏离成为训练信号。</h4><p>历史 p 固定时，KL = H(p,q) − H(p)。由于 H(p) 不变，最小化 KL 等价于最小化软标签交叉熵，输出梯度为 q−p。</p><details className="math-derivation"><summary>展开 KL 梯度的短推导</summary><KLGradientDerivation /></details><div className="der-reference-links"><ReferenceButton term="kl">KL 背景</ReferenceButton><ReferenceButton term="squared">平方匹配推导</ReferenceButton></div></div></div><p className="der-footnote">合成教学响应 · 自然对数，softmax 温度 1；切换演示响应比较，不执行优化器训练。</p></div>;
}
