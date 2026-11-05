import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { C } from './coop-kit';
import { toyModel } from './coop-model';
import { SamplePortrait, CompassDial } from './learning-visuals';
import './inference-lab.css';

const NAMES = ['猫', '狗', '花'];
const LETTERS = ['A', 'B', 'C'];
const COLORS = [C.blue, C.purple, C.orange];
const FIXED_V: [number, number] = [.5, -.3];
const PHASES = ['提取图像特征', '比较固定文本特征', '得到概率与预测'];
const STAGE_TIME = [2200, 2600];
const pair = (values: number[]) => `（${values.map(value => value.toFixed(3)).join('，')}）`;

function Lock() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2.5"/><rect x="4" y="9" width="16" height="13" rx="4" fill="currentColor"/><path d="M12 14v3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>;
}

function FeatureCompass({ features, image, run }: { features: number[][]; image: number[]; run: number }) {
  const point = (vector: number[]) => [150 + vector[0] * 110, 150 - vector[1] * 110];
  const [x, y] = point(image);
  return <svg className="if6-compass" viewBox="0 0 300 300" role="img" aria-label="彩色文本特征固定；深蓝箭头是这张图片的图像特征">
    <CompassDial center={150} radius={110}/>
    {features.map((feature, index) => { const [tx, ty] = point(feature); return <g key={index}><path d={`M150 150L${tx} ${ty}`} stroke={COLORS[index]} strokeWidth="4" strokeLinecap="round"/><circle cx={tx} cy={ty} r="9" fill={COLORS[index]} stroke="#fff" strokeWidth="3"/></g>; })}
    <g key={run} className="if6-image-vector"><path d={`M150 150L${x} ${y}`} pathLength="1" stroke={C.ink} strokeWidth="5" strokeLinecap="round"/><path d="M0 -11 9 8 -9 8Z" fill={C.ink} stroke="#fffdf8" strokeWidth="2" transform={`translate(${x} ${y}) rotate(${Math.atan2(y - 150, x - 150) * 180 / Math.PI + 90})`}/></g>
    <circle cx="150" cy="150" r="6" fill={C.ink}/>
  </svg>;
}

export function InferenceLab() {
  const root = useRef<HTMLDivElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [phase, setPhase] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches ? 2 : 0);
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [run, setRun] = useState(0);
  const sequence = useRef(0);
  const { features, image, logits, probs } = toyModel(FIXED_V, imageIndex);
  const prediction = probs.indexOf(Math.max(...probs));

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => { setReduced(media.matches); if (media.matches) { sequence.current += 1; setPhase(2); setPlaying(false); } };
    const onVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .08 });
    if (root.current) observer.observe(root.current);
    media.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); media.removeEventListener('change', onMotion); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    if (!playing || !visible || !pageVisible || reduced || phase === 2) return;
    const currentSequence = sequence.current;
    const timer = window.setTimeout(() => {
      if (currentSequence !== sequence.current) return;
      setPhase(phase + 1);
      if (phase === 1) setPlaying(false);
    }, STAGE_TIME[phase]);
    return () => window.clearTimeout(timer);
  }, [playing, visible, pageVisible, reduced, phase, run]);

  const sendImage = (index: number) => {
    sequence.current += 1;
    setImageIndex(index);
    setPhase(reduced ? 2 : 0);
    setPlaying(!reduced);
    setRun(value => value + 1);
  };
  const reviewPhase = (index: number) => { sequence.current += 1; setPlaying(false); setPhase(index); };
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, action: (index: number) => void) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault(); event.stopPropagation();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus(); action(next);
  };
  const status = reduced ? '已开启减少动态效果，选图直接展示结果' : playing && !visible ? '图片已就绪，向下看推理过程' : playing ? `正在演示：${PHASES[phase]}` : phase === 2 ? '本次推理完成，可以换图继续比较' : `停在“${PHASES[phase]}”，可以慢慢看`;

  return <div className="if6-lab" data-input-index={imageIndex} data-phase={phase} data-playing={playing && visible && pageVisible && !reduced} onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="if6-intro"><div><span className="if6-kicker">换图推理台</span><h4>选一张图，完整看一次推理。</h4><p>换的是图片，已经学好的提示与文本特征一直保留。</p></div><span className="if6-simulation">二维教学模拟</span></div>

    <div className="if6-fixed-bank">
      <div className="if6-fixed-prompt"><div className="if6-lock-title"><Lock/><strong>换图时，这些保持固定</strong></div><div className="if6-v-value"><span>已学上下文</span><b>V</b><strong>（0.5，−0.3）</strong></div><p>候选类别和文本编码器也固定，三类文本特征可以提前算好。</p></div>
      <div className="if6-fixed-features">{NAMES.map((name, index) => <div key={name} style={{ '--if6-color': COLORS[index] } as CSSProperties}><span><i/>{name}的文本特征</span><strong>{pair(features[index])}</strong><Lock/></div>)}</div>
    </div>

    <div className="if6-console">
      <div className="if6-picker" role="group" aria-label="选择并送入一张待识别图片" onKeyDown={event => moveFocus(event, sendImage)}>
        {NAMES.map((name, index) => <button key={name} type="button" className="if6-photo-button" aria-label={`送入图片 ${LETTERS[index]}（${name}的图片示意）`} aria-pressed={index === imageIndex} onClick={() => sendImage(index)}><SamplePortrait kind={index}/><span><strong>图片 {LETTERS[index]}</strong><small>{index === imageIndex ? '当前图片' : '点击送入'}</small></span><i aria-hidden="true">{index === imageIndex ? '✓' : '↗'}</i></button>)}
      </div>
      <p className="if6-input-note">这里只送入图片，不提供它的正确类别。A、B、C 是挑选图片用的编号。</p>
      <div className="if6-console-top"><div className="if6-status" role="status"><i className={playing && !reduced ? 'is-playing' : ''}/><span>{status}</span></div><div className="if6-playback">
        <button type="button" onClick={() => sendImage(imageIndex)}>{reduced ? '查看本图结果' : '↻ 重播这张图'}</button>
      </div></div>
      <div className="if6-phases" role="group" aria-label="选择一个阶段复看，选中后暂停自动推进" onKeyDown={event => moveFocus(event, reviewPhase)}>{PHASES.map((name, index) => <button type="button" key={name} aria-pressed={phase === index} onClick={() => reviewPhase(index)}><span>{index + 1}</span><strong>{name}</strong><i aria-hidden="true">{phase > index ? '✓' : ''}</i></button>)}</div>
      <p className="if6-phase-hint">选图后自动依次展示；点击任意阶段，可停在这一刻复看。</p>

      <div className="if6-workspace" ref={root}>
        <div className="if6-image-side"><div className="if6-current-image"><SamplePortrait kind={imageIndex}/><div><span>本次输入</span><strong>图片 {LETTERS[imageIndex]}</strong><small>图像编码器权重固定</small></div></div><FeatureCompass features={features} image={image} run={run}/><div className="if6-plot-legend"><span className="if6-image-legend">➤ 本图特征</span>{NAMES.map((name, index) => <span key={name} style={{ color: COLORS[index] }}>● {name}</span>)}</div><div className="if6-image-coordinates"><span>本图特征</span><strong>{pair(image)}</strong></div></div>

        <div className="if6-result-side" key={`${run}-${phase}`}>
          {phase === 0 && <div className="if6-feature-explanation"><span className="if6-kicker">01 · 先看图片</span><h5>同一个编码器，<br/>读出新的图像特征。</h5><p>冻结的是编码器的参数。换一张图片，输入变了，输出的特征也会变化。</p><div className="if6-feature-output"><span>图片 {LETTERS[imageIndex]} 的图像特征</span><strong>{pair(image)}</strong><small>二维向量 · 已归一化</small></div><p className="if6-next-hint">接下来，用这条深蓝箭头与三类固定文本特征比较。</p></div>}
          {phase === 1 && <div className="if6-score-view"><span className="if6-kicker">02 · 三类一起比较</span><h5>哪类文本特征<br/>与这张图更相近？</h5><div className="if6-score-list">{NAMES.map((name, index) => <div key={name} style={{ '--if6-color': COLORS[index] } as CSSProperties}><span><i/>{name}</span><div className="if6-score-rail"><i style={{ left: logits[index] >= 0 ? '50%' : `${50 + logits[index] / 3 * 50}%`, width: `${Math.abs(logits[index]) / 3 * 50}%` }}/></div><strong>{logits[index].toFixed(3)}</strong></div>)}</div><div className="if6-score-axis"><span>负分</span><span>0</span><span>正分</span></div><p>这里用归一化特征的点积 × 3 得到比较分数。分数还不是概率，也可能为负。</p></div>}
          {phase === 2 && <div className="if6-probability-view"><span className="if6-kicker">03 · 得到本次预测</span><div className="if6-prediction"><div><span>模型预测为</span><strong>{NAMES[prediction]}</strong></div><b>{(probs[prediction] * 100).toFixed(2)}<small>%</small></b></div><div className="if6-probability-bars">{NAMES.map((name, index) => <div key={name} style={{ '--if6-color': COLORS[index] } as CSSProperties}><div><strong>{name}</strong><b>{(probs[index] * 100).toFixed(2)}%</b></div><div className="if6-probability-track"><i style={{ width: `${probs[index] * 100}%` }}/></div></div>)}</div><p>softmax 把三类分数变成总和为 1 的概率，选取概率最大的类别。现在可以换另一张图。</p></div>}
        </div>
      </div>
      <div className="if6-takeaway"><Lock/><p><strong>本次没有重新训练。</strong> 图像特征、比较分数和预测会随图片变化；V 与三类文本特征始终固定。</p></div>
    </div>

    <details className="if6-numbers"><summary>展开核对：这张图片的完整计算数值</summary><p>以下始终对应图片 {LETTERS[imageIndex]}。教学模型固定 V＝（0.5，−0.3），分数为归一化图像与文本特征的点积 × 3；不代表真实 CLIP 的维度、数值或准确率。</p><div className="if6-number-cards">{NAMES.map((name, index) => <div key={name}><h5 style={{ color: COLORS[index] }}>{name}</h5><dl><div><dt>固定文本特征</dt><dd>{pair(features[index])}</dd></div><div><dt>本图比较分数</dt><dd>{logits[index].toFixed(3)}</dd></div><div><dt>本图预测概率</dt><dd>{(probs[index] * 100).toFixed(2)}%</dd></div></dl></div>)}</div></details>
  </div>;
}
export default InferenceLab;
