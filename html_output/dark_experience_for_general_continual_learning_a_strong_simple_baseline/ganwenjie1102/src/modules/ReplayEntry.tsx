import { useState } from 'react';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import ModelMark from './review/ModelMark';
import { type ModelClass } from './review/ModelPixel';
import { CLASSES, LABEL_CURRENT, LABEL_OLD } from './math-model';
import { Term } from './Reference';
import { Network, Sample } from './DerPrimitives';
import { curve } from './review/lifecycle-model';
import { MotionTrail } from './review/MotionTrail';
import './der-redesign.css';
const STREAM = [{ id: '新数据持续到来', durationMs: 2000, holdMs: 800 }, { id: '同一模型处理新输入', durationMs: 1800, holdMs: 800 }, { id: '只保留少量旧样本', durationMs: 1800, holdMs: 800 }, { id: '读取副本，一起训练', durationMs: 2600, holdMs: 1000 }] as const;
const REVEAL = [{ id: '展开历史响应', durationMs: 1400, holdMs: 500 }, { id: '对照当前响应', durationMs: 1600, holdMs: 700 }] as const;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
function StreamScene() {
    const t = useSceneTimeline(STREAM), { clipIndex: step, progress: p } = t.state;
    const read = step === 3 ? clamp(p / .72) : 0, input = step === 0 ? p : 1;
    const oldRoute = [{ x: 440, y: 320 }, { x: 560, y: 320 }, { x: 594, y: 270 }, { x: 700, y: 270 }] as const;
    const newRoute = [{ x: 446, y: 130 }, { x: 560, y: 130 }, { x: 594, y: 180 }, { x: 700, y: 180 }] as const;
    const readAt = curve(read, ...oldRoute), inputAt = curve(input, ...newRoute);
    const theta = step === 3 && p === 1 ? 'θ₁' : 'θ₀';
    return <figure className="der-stream" data-front-scene="stream" data-step={step} data-progress={p} data-theta={theta} data-current-sample="x3"><div className="der-figure-top"><span>数据持续到来</span><span>同一组参数，持续学习</span></div><div className="der-diagram-scroll"><svg viewBox="0 0 1060 430" role="img" aria-label="新样本进入同一模型，少量旧记录保留在有限记忆中，读取副本参与后续训练">
 <path className="der-route der-current-route" d="M446 130C560 130 594 180 700 180"/><path className="der-arrow" d="m690 173 10 7-10 7"/><text x="55" y="65">更早的样本</text><text x="412" y="65">当前到来的新样本</text>
 <Sample x={58} y={96} id="stream:earlier" muted/><Sample x={158} y={96} model={1} id="stream:earlier-2" muted/><g className="der-stream-ellipsis" role="img" aria-label="更多样本">{[270,282,294].map(x=><circle key={x} cx={x} cy="130" r="3"/>)}</g><Sample x={380} y={96} model={2} id="stream:current"/>
 {input > 0 && input < 1 && <g opacity={Math.min(1,input*8,(1-input)*8)}><MotionTrail points={newRoute} progress={input} className="lesson-record-trail"/><Sample x={inputAt.x-33} y={inputAt.y-33} model={2} id="stream:current-read"/></g>}
 <text x="413" y="185" textAnchor="middle" className="der-svg-muted">x₃, y₃</text><text x="91" y="185" textAnchor="middle" className="der-svg-muted">x₁</text><text x="191" y="185" textAnchor="middle" className="der-svg-muted">x₂</text><Network x={700} y={115} theta={theta} active={step === 1 && p > 0 && p < 1 || step === 3 && p > .72}/><text x="809" y="365" textAnchor="middle" className="der-svg-muted">根据分类损失调整参数</text>
 <path className="der-memory-outline" d="M66 265H440V392H66Z"/><text x="82" y="292" className="der-svg-title">有限记忆 M</text><text x="425" y="292" textAnchor="end" className="der-svg-muted">容量 K</text><rect x="82" y="310" width="184" height="65" rx="8" className="der-slot"/><rect x="281" y="310" width="142" height="65" rx="8" className="der-empty-slot"/>
 <text x="352" y="350" textAnchor="middle" className="der-svg-muted">有限空位</text>
 <g><Sample x={88} y={317} id="stream:retained-x1" size={50}/><text x="153" y="346">x₁, y₁</text></g>
 <g className="der-memory-connector"><path className="der-read-route" d="M440 320C560 320 594 270 700 270m-10 -7 10 7-10 7"/><circle cx="440" cy="320" r="3" className="der-memory-port"/></g><text x="502" y="410" className="der-svg-muted">读取旧记录的副本，原记录保留</text>
 {read > 0 && read < 1 && <g opacity={Math.min(1,read*8,(1-read)*8)}><MotionTrail points={oldRoute} progress={read} className="lesson-record-trail"/><Sample x={readAt.x - 33} y={readAt.y - 33} id="stream:old-read"/></g>}{step === 3 && read === 1 && <text x="809" y="391" textAnchor="middle" className="der-svg-emphasis">新旧数据，共同监督一次更新</text>}
 </svg></div><figcaption aria-live="polite">{['x₁ / Claude、x₂ / GPT 是旧样本；当前到来的是 x₃ / DeepSeek。', '同一组参数 θ₀ 处理当前 x₃，标签 y₃ 提供分类监督；此时还没有更新参数。', '记忆只保留少量旧记录，例如 (x₁,y₁)，无法保存全部历史。', '读取旧 x₁ 的副本，与当前 x₃ 共同提供标签监督；最后只更新一次 θ₀ → θ₁。'][step]}</figcaption><SceneTransport timeline={t} clips={STREAM} label="持续学习与有限回放" showTiming={false} teachingProgress/></figure>;
}
function Prediction({ current = false, progress }: {
    current?: boolean;
    progress: number;
}) {
    const values = current ? LABEL_OLD.map((v, k) => v + (LABEL_CURRENT[k] - v) * progress) : LABEL_OLD;
    return <div className="der-prediction prediction-sheet"><h4>{current ? '现在的判断' : '保存时的判断'}</h4><p className="prediction-answer"><strong>Claude</strong><span>预测正确</span></p><div className="der-score-window"><div data-response={current ? 'current' : 'history'} className="der-score-list" aria-hidden={progress === 0} style={{ opacity: progress, clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)` }}><div className="der-scale"><span>原始分数 logits</span><span>0—3</span></div>{CLASSES.map((name, k) => <div className="der-score-row" key={name}><ModelMark model={k as ModelClass}/><span>{name}</span><div className="der-score-track"><i style={{ transform: `scaleX(${values[k] / 3})` }}/></div><output>{Number(values[k].toFixed(2))}</output></div>)}</div>{progress === 0 && <p className="der-covered">分类答案背后，还有一整组响应。<br /><span>展开后比较三类分数</span></p>}</div></div>;
}
export default function ReplayEntry() {
    const reveal = useSceneTimeline(REVEAL), [answerOnly, setAnswerOnly] = useState(true);
    const historyProgress = answerOnly ? 0 : reveal.state.clipIndex > 0 ? 1 : reveal.state.progress, currentProgress = answerOnly || reveal.state.clipIndex === 0 ? 0 : reveal.state.progress;
    const show = () => { setAnswerOnly(false); if (reveal.reducedMotion)
        reveal.start(1);
    else
        reveal.replay(); };
    return <div className="der-redesign der-u1" data-core-items="I01 I02"><section className="der-opening" aria-labelledby="training-origin-title"><div className="der-copy"><h3 id="training-origin-title">数据在流动，<br />模型在更新。</h3><p>新数据不断到来，我们用<strong>同一个模型 θ</strong>持续学习。过去的数据却未必还能取回，旧输入的判断也可能逐渐退化。</p></div><div className="der-copy"><p>最直接的想法，是把全部历史留下来。但存储与计算都有上限，数据流的总长度也未必已知。</p><p><strong>留少量，再复习。</strong>经验回放保存少量旧图与标签，让它们在后续训练中重新参与学习。</p></div></section><StreamScene />
 <aside className="der-constraints" aria-label="通用持续学习的三个约束"><p>面向真实数据流，论文采用<br /><strong>通用持续学习（GCL）</strong>的约束</p><dl><div><dt>训练</dt><dd>无须知道任务边界</dd></div><div><dt>预测</dt><dd>无须提供任务编号</dd></div><div><dt>记忆</dt><dd>始终保持容量有界</dd></div></dl></aside>
 <section className="label-investigation der-investigation" data-label-revealed={currentProgress === 1} data-history-progress={historyProgress} data-current-progress={currentProgress} aria-labelledby="label-investigation-title"><div className="der-question"><h3 id="label-investigation-title">旧图和标签留下了，<br />过去的判断也留下了吗？</h3><p>标签告诉模型“应该是哪一类”。但同一个正确答案，可能对应不同的完整响应。</p></div><div className="same-input der-shared-input"><ModelMark /><div><strong>同一张旧输入 x₁</strong><span>真实标签 y₁ = Claude</span></div><p>只改变观察时刻，<br />输入与类别坐标保持不变。</p></div><div className="der-predictions"><Prediction progress={historyProgress}/><Prediction current progress={currentProgress}/></div>
 <div className="der-reveal-controls" role="group" aria-label="观察分类答案或完整响应"><button data-label-mode="full" aria-pressed={!answerOnly} onClick={show}>显示完整响应</button><button data-label-mode="answer" aria-pressed={answerOnly} onClick={() => { setAnswerOnly(true); reveal.reset(); }}>只看分类答案</button><button data-label-replay onClick={show}>重播揭示</button>{!answerOnly && !reveal.reducedMotion && currentProgress < 1 && <button data-label-play onClick={reveal.toggle}>{reveal.state.status === 'playing' ? '暂停' : '继续'}</button>}</div><p className="der-observation" aria-live="polite">{answerOnly ? '两次都预测正确。点击“显示完整响应”，再检查其他类别的偏好。' : currentProgress < 1 ? '先固定历史分数，再观察当前 GPT 与 DeepSeek 的分数变化。' : 'Claude 仍然最高；GPT 从第 2 降到第 3，DeepSeek 从第 3 升到第 2。'}</p>
 <div className="response-finding der-finding" hidden={currentProgress < 1}><h4>答案相同，整组响应已经不同。</h4><div><p>真实标签指定正确类别。分类<Term id="ce">交叉熵</Term>会影响所有输出，却没有记录过去那组分数，因而不要求恢复这份历史响应。</p><p>要约束这种变化，可以保存 <Term id="softmax"/> 概率或原始 <Term id="logits"/>。这些超出单个类别答案的响应信息，称为 <strong>Dark Knowledge（暗知识）</strong>。</p></div></div><p className="der-footnote">合成教学示例 · 类别顺序 Claude / GPT / DeepSeek；历史 z=(2,1,0)，当前 a=(2,0,1)。</p></section></div>;
}
