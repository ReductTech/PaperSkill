import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { SceneArt } from './SceneArt';
import './clip-cover-animation.css';

const scenes = [
  { kind: 'cat', text: '一只坐在窗边的猫', short: '窗边的猫', english: 'a photo of a cat', angle: 28, textAngle: 32 },
  { kind: 'car', text: '一辆行驶在山间的车', short: '山间的车', english: 'a photo of a car', angle: 145, textAngle: 150 },
  { kind: 'chair', text: '一把安静的椅子', short: '一把椅子', english: 'a photo of a chair', angle: 265, textAngle: 270 },
] as const;
const stages = [
  { title: '图文编码', note: '图片与描述，分别变成可以比较的向量。' },
  { title: '比较方向', note: '在同一空间里，比较归一化向量的方向。' },
  { title: '找到匹配', note: '比较候选描述，选出方向最接近的那一个。' },
];
const duration = 4000;
const point = (angle: number, radius = 82) => ({ x: 140 + Math.cos(angle * Math.PI / 180) * radius, y: 106 - Math.sin(angle * Math.PI / 180) * radius });

/** A looping illustration of a fixed, explicitly simulated forward pass. */
export function ClipCoverAnimation() {
  const id = useId().replace(/:/g, '');
  const [scene, setScene] = useState(0);
  const [stage, setStage] = useState(0);
  const [frame, setFrame] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(() => !document.hidden);
  const generation = useRef(0);
  const remaining = useRef(duration);
  const running = !reducedMotion && visible;
  const shownStage = reducedMotion ? 2 : stage;
  const selected = scenes[scene];
  const vector = point(selected.angle);
  const matching = point(selected.textAngle);
  const scores = scenes.map(candidate => Math.cos((selected.angle - candidate.textAngle) * Math.PI / 180));
  const resetFrame = (next: number) => { generation.current += 1; remaining.current = duration; setFrame(generation.current); setStage(next); };

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update(); preference.addEventListener('change', update);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!running || frame !== generation.current) return;
    const token = generation.current;
    const started = performance.now();
    const wait = remaining.current;
    let completed = false;
    const timer = window.setTimeout(() => {
      completed = true;
      const next = (stage + 1) % stages.length;
      if (next === 0) setScene(current => (current + 1) % scenes.length);
      resetFrame(next);
    }, wait);
    return () => { window.clearTimeout(timer); if (!completed && generation.current === token) remaining.current = Math.max(0, wait - (performance.now() - started)); };
  }, [running, stage, frame]);
  return <div className={`hero-lab clip-cover${running ? ' is-running' : ' is-paused'}${reducedMotion ? ' is-static' : ''}`} style={{ '--cca-duration': `${duration}ms` } as CSSProperties} data-cover-stage={shownStage} data-cover-scene={selected.kind} aria-label="图像与文本配对预览">
    <div className="cca-top"><span><i /> 图像与语言，共享一种表示</span><span className="cca-edition" aria-hidden="true">CLIP / 01</span></div>
    <ol className="cca-steps" aria-label="封面演示阶段">{stages.map((item, index) => <li key={item.title} aria-current={shownStage === index ? 'step' : undefined} className={shownStage === index ? 'is-current' : ''}><span>0{index + 1}</span><b>{item.title}</b>{shownStage === index && <i className="cca-progress" key={frame} aria-hidden="true" />}</li>)}</ol>
    <div className={`cca-viewport cca-stage-${shownStage}`}>
      <div className="cca-picture" key={scene}><SceneArt kind={selected.kind}/><span className="cca-image-tag">图像输入</span><span className={`cca-image-caption${shownStage===0?' cca-text-source':''}`}>{shownStage===0?<><i>文本</i><b>{selected.english.replace('a photo of a ','')}</b></>:selected.short}</span></div>
      <div className="cca-stage-content" key={`${scene}-${frame}`}>
      {shownStage === 0 && <>
        <svg className="cca-encode-links" viewBox="0 0 440 220" preserveAspectRatio="none" aria-hidden="true"><path d="M165 67H245M165 159H245" /><circle cx="170" cy="67" r="5" className="cca-packet" /><circle cx="170" cy="159" r="5" className="cca-packet cca-packet-text" /></svg>
        <div className="cca-code cca-code-image"><span>图像向量</span><div aria-hidden="true">{[.35,.8,.55,.95,.65].map((height,index)=><i key={index} style={{ height: `${height*100}%`, animationDelay: `${600+index*90}ms` }} />)}</div></div>
        <div className="cca-code cca-code-text"><span>文本向量</span><div aria-hidden="true">{[.45,.75,.6,.9,.7].map((height,index)=><i key={index} style={{ height: `${height*100}%`, animationDelay: `${850+index*90}ms` }} />)}</div></div>

      </>}
      {shownStage === 1 && <div className="cca-direction"><svg viewBox="0 0 280 220" role="img" aria-label={`模拟的归一化向量，图像与匹配文本夹角${Math.abs(selected.angle-selected.textAngle)}度`}><defs><marker id={`${id}-image`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#5365ad" /></marker><marker id={`${id}-text`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#bd9254" /></marker></defs><circle cx="140" cy="106" r="82" fill="#f9f8f5" stroke="#d8dce6" strokeDasharray="4 5" /><path d="M33 106H247M140 7V207" stroke="#e1e4eb" /><path className="cca-vector" d={`M140 106L${vector.x} ${vector.y}`} stroke="#5365ad" markerEnd={`url(#${id}-image)`} /><path className="cca-vector cca-vector-text" d={`M140 106L${matching.x} ${matching.y}`} stroke="#bd9254" markerEnd={`url(#${id}-text)`} />{scenes.map((candidate,index)=>{const p=point(candidate.textAngle);return <circle key={candidate.kind} cx={p.x} cy={p.y} r={index===scene?6:5} fill={index===scene?'#bd9254':'#c8cfdd'} stroke="white" strokeWidth="2"/>})}<circle cx="140" cy="106" r="4" fill="#536074" /><g transform={`rotate(${-selected.angle} 140 106)`}><circle className="cca-vector-packet" cx="140" cy="106" r="4" fill="#5365ad" /></g></svg><div className="cca-vector-legend"><span>● 图像</span><span>● 匹配文本</span></div><span className="cca-cosine">模拟余弦 {scores[scene].toFixed(3)}</span></div>}
      {shownStage === 2 && <div className="cca-rankings"><span className="cca-ranking-label">模拟余弦 · −1 到 1</span>{scenes.map((candidate,index)=><div key={candidate.kind} className={`cca-rank-row${index===scene?' is-match':''}`}><div><span>{candidate.english.replace('a photo of a ', '')}</span><b>{scores[index].toFixed(2)}{index===scene?' ✓':''}</b></div><div className="cca-rank-track"><i className={scores[index]<0?'is-negative':'is-positive'} style={{ left:`${scores[index]<0?(scores[index]+1)*50:50}%`, width:`${Math.abs(scores[index])*50}%`, animationDelay:`${index*120}ms` }}/></div></div>)}<span className="cca-match-label">✓ 最接近这张图片的描述</span></div>}
      </div>
    </div>
    <div className="cca-caption"><span className="cca-aa">Aa</span><p>{selected.english}</p><span className={`cca-caption-check${shownStage===2?' is-visible':''}`} aria-hidden="true">✓</span></div>
    <p className="cca-status">{stages[shownStage].note}</p>
    <p className="cca-note">教学模拟 · 不调用真实 CLIP</p>
  </div>;
}
