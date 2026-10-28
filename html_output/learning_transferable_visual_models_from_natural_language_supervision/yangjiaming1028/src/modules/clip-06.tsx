import { useRef, useState, type CSSProperties } from 'react';
import type { WidgetProps } from './registry';
import { SceneArt, type SceneKind } from '../components/SceneArt';
import { MathText } from '../components/MathText';
import './matching.css';
import './interaction-workbenches.css';
import './prompt-probability-motion.css';
import { ProbabilityRedistribution, probabilityColors } from './probability-redistribution';

const categories: { name:string; kind:SceneKind; prompt:string }[] = [
  {name:'猫',kind:'cat',prompt:'a photo of a cat'},
  {name:'狗',kind:'dog',prompt:'a photo of a dog'},
  {name:'汽车',kind:'car',prompt:'a photo of a car'},
];
// Fixed illustrative cosine similarities, not CLIP measurements.
export const ZERO_SHOT_SIMILARITIES = [[0.84,0.31,0.08],[0.23,0.81,0.10],[0.07,0.12,0.87]];
export function zeroShotProbabilities(similarities:number[], temperature:number):number[] {
  if(similarities.length===0) return [];
  if(!Number.isFinite(temperature)||temperature<=0) throw new RangeError('温度必须大于零');
  const logits=similarities.map(value=>value/temperature), maximum=Math.max(...logits);
  const weights=logits.map(value=>Math.exp(value-maximum)), total=weights.reduce((sum,value)=>sum+value,0);
  return weights.map(value=>value/total);
}

/** Never round a nonzero probability to 0%, or a near-one value to 100%. */
export function formatProbability(probability: number): string {
  if (probability === 0) return '0%';
  if (probability === 1) return '100%';
  if (probability < 0.001) return '<0.1%';
  if (probability > 0.999) return '>99.9%';
  return (probability * 100).toFixed(1) + '%';
}
export function Clip06({chapterId,moduleId}:WidgetProps) {
  const [input,setInput]=useState(1);
  const [included,setIncluded]=useState([true,true,true]);
  const [temperature,setTemperature]=useState(0.2);
  const [comparison,setComparison]=useState({before:zeroShotProbabilities(ZERO_SHOT_SIMILARITIES[1],0.2),cause:'拖动温度或移除候选，比较调整前后的分配。'});
  const temperatureDragging=useRef(false);
  const retained=categories.map((_,index)=>index).filter(index=>included[index]);
  const scores=ZERO_SHOT_SIMILARITIES[input];
  const probabilities=zeroShotProbabilities(retained.map(index=>scores[index]),temperature);
  const winnerPosition=probabilities.length?probabilities.reduce((best,value,index)=>value>probabilities[best]?index:best,0):-1;
  const winner=winnerPosition>=0?retained[winnerPosition]:-1, correctMissing=!included[input];
  const probabilityFor=(index:number)=>probabilities[retained.indexOf(index)]??0;
  const capture=(cause:string)=>setComparison({before:categories.map((_,index)=>probabilityFor(index)),cause});
  const toggle=(index:number)=>{capture(included[index]?`移除${categories[index].name}：剩余候选重新分配概率。`:`恢复${categories[index].name}：它重新参与概率分配。`);setIncluded(old=>old.map((value,i)=>i===index?!value:value));};
  const reset=()=>{capture('恢复初始图片、三个候选与温度 0.20。');setInput(1);setIncluded([true,true,true]);setTemperature(0.2);temperatureDragging.current=false;};
  const updateTemperature=(value:number)=>{if(!temperatureDragging.current)capture('改变温度：相似度与排名不变，概率重新分配。');setTemperature(value);};
  const temperatureId='temperature-'+chapterId+'-'+moduleId;
  const temperatureEffective = retained.length > 1;
  return <div className="clip-lab zero-shot-lab wb-zero" onKeyDown={event=>{if(event.key.startsWith('Arrow'))event.stopPropagation();}}>
    <div className="m-lab-topline"><span className="m-simulation"><span/>教学模拟 · 实时计算 Softmax</span><button type="button" className="m-text-button" onClick={reset}>重置实验 ↺</button></div>
    <div className="m-section-intro"><div><h3>换张图片，或拿走一个候选答案</h3><p>先选图片，再尝试移除一个候选。最后调节温度，观察概率变化。</p></div></div>
    <div className="m-zero-layout">
      <section className="m-input-panel" aria-label="输入图片">
        <div className="m-panel-heading"><span className="m-step-number">01</span><h4>选择输入图片</h4></div>
        <div className="m-input-switch" role="group" aria-label="选择要分类的图片">{categories.map((category,index)=><button type="button" key={category.kind} aria-pressed={input===index} onClick={()=>{capture(`切换为${category.name}图片：相似度随输入更新。`);setInput(index);}}>{category.name}</button>)}</div>
        <div className="m-input-art"><SceneArt kind={categories[input].kind} className="m-scene"/><span className="m-input-label">当前输入：{categories[input].name}</span></div>
        <div className="wb-live-prediction" aria-live="polite"><span>当前判断</span><strong>{winner<0?'没有候选':categories[winner].name}</strong><b>{winner>=0?formatProbability(probabilities[winnerPosition]):'—'}</b><small>{correctMissing?'正确类别不在候选内':'候选内相对概率'}</small></div>
        <div className="m-input-description"><span className="m-lock-dot" aria-hidden="true"/><span>模型参数固定。切换图片会保留当前候选列表。</span></div>

      </section>
      <section className="m-candidates-panel" aria-label="候选类别与概率">
        <div className="m-panel-heading"><span className="m-step-number">02</span><h4>用文字构建候选类别</h4><span className="m-candidate-count">{retained.length} 个参与比较</span></div>
    <div className="m-temperature-panel">
      <div className="m-temperature-heading"><label htmlFor={temperatureId}>温度 <span>τ</span></label><output htmlFor={temperatureId}>{temperature.toFixed(2)}</output></div>
      <input id={temperatureId} type="range" min="0.05" max="1" step="0.01" disabled={!temperatureEffective} value={temperature} onPointerDown={()=>{temperatureDragging.current=true;capture('改变温度：相似度与排名不变，概率重新分配。');}} onPointerUp={()=>{temperatureDragging.current=false;}} onPointerCancel={()=>{temperatureDragging.current=false;}} onLostPointerCapture={()=>{temperatureDragging.current=false;}} onBlur={()=>{temperatureDragging.current=false;}} onChange={event=>updateTemperature(Number(event.target.value))} aria-label="调整 Softmax 温度"/>
      <div className="m-temperature-scale"><span>0.05 · 更集中</span><span>1.00 · 更平缓</span></div><ProbabilityRedistribution before={comparison.before} current={categories.map((_,index)=>probabilityFor(index))} cause={retained.length===0?'候选为空，没有可分配的概率。恢复任一类别后继续。':retained.length===1?'只剩一个候选：它获得全部概率，仍不保证判断正确。':comparison.cause}/><div className="wb-temperature-preview" aria-hidden="true">{categories.map((category,index)=><div key={category.kind} style={{'--probability-color':probabilityColors[index]} as CSSProperties} className={winner===index?'is-leading':''}><span><em/>{category.name}</span><b>{included[index]?formatProbability(probabilityFor(index)):'—'}</b><small>{winner===index?'当前最高':included[index]?'参与比较':'已移除'}</small></div>)}</div>

    </div>

        <div className="m-challenge"><button type="button" className={'m-button '+(correctMissing?'m-secondary':'m-outline-warm')} onClick={()=>toggle(input)}>{correctMissing?'恢复“'+categories[input].name+'”候选':'移除正确类别“'+categories[input].name+'”'}<span aria-hidden="true">{correctMissing?'+':'−'}</span></button></div>
        <div className="m-candidate-list">{categories.map((category,index)=>{
          const active=included[index],selected=winner===index,probability=probabilityFor(index);
          return <article key={category.kind} style={{'--probability-color':probabilityColors[index]} as CSSProperties} className={'m-candidate'+(!active?' is-removed':'')+(selected?' is-winner':'')+(selected&&correctMissing?' is-missing':'')}>
            <div className="m-candidate-heading"><div><strong>{category.name}</strong>{selected&&<span className="m-winner-label probability-winner-label" key={`${input}-${included.join('')}`}>最高</span>}</div><strong className="wb-candidate-prob">{active?formatProbability(probability):'—'}</strong><button type="button" className="m-candidate-toggle" aria-label={(active?'移除':'恢复')+category.name+'候选'} onClick={()=>toggle(index)}>{active?'移除 −':'恢复 +'}</button></div>
            <div className="m-candidate-values"><span className="m-english">{category.prompt}</span><span>{active?'相似度':'未参与比较'} <b>{scores[index].toFixed(2)}</b></span></div>
            <div className="m-probability-track" role="meter" aria-label={category.name+'在当前候选中的相对概率'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={active?probability*100:0} aria-valuetext={active?formatProbability(probability):'已移除，未参与计算'}><span style={{width:active?probability*100+'%':'0%'}}/><i className="probability-before-marker" aria-hidden="true" style={{left:`${comparison.before[index]*100}%`}}/></div>
          </article>;
        })}</div>
        <div className="m-candidate-footer"><span>细刻线标记调整前的位置。小于 0.1% 不等于 0%；大于 99.9% 也不等于确定正确。</span><button type="button" className="m-text-button" disabled={retained.length===3} onClick={()=>{capture('恢复全部：三个候选一起重新分配概率。');setIncluded([true,true,true]);}}>恢复全部</button></div>
      <p className="wb-temperature-help" aria-live="polite">{retained.length===0 ? '没有候选，暂时不能计算概率。先恢复一个候选。' : retained.length===1 ? '只剩一个候选，概率恒为 100%，调温度也不会变化。恢复第二个候选后再试。' : '拖动滑块，观察概率条：温度改变分配的集中程度，不改变相似度和排序。'}</p>
      </section>
    </div>
    <div className={'m-prediction'+(winner<0||correctMissing?' is-warning':'')} aria-live="polite" aria-atomic="true">
      <div className="m-prediction-result"><span>当前判断</span><strong>{winner<0?'没有候选':categories[winner].name}</strong>{winner>=0&&<b>{formatProbability(probabilities[winnerPosition])}<small>候选内相对概率</small></b>}</div>
      <div className="m-prediction-explanation">{winner<0?<><strong>候选列表为空，无法进行分类。</strong><p>恢复至少一个类别，模型才能比较。没有候选时，本实验不会生成概率或虚构答案。</p></>:correctMissing?<><strong>正确类别“{categories[input].name}”已经不在候选列表里。</strong><p>输入仍然是{categories[input].name}，但模型只能从{retained.map(index=>categories[index].name).join('、')}中选最高分。{retained.length===1?'只剩一个候选时，Softmax 必然给它 100%。':'即使相对概率很高，也不代表答案正确。'}</p></>:<><strong>“{categories[winner].name}”在当前候选里最相似。</strong><p>{retained.length===1 ? '只保留这一个类别时，Softmax 必然给它 100%。这来自候选列表，不代表模型一定正确。' : '预测由模拟相似度的最高分决定。概率只描述当前候选之间的相对分配，不是现实准确率。'}</p></>}</div>
    </div>
    <section className="m-calculation" aria-labelledby={temperatureId+'-formula-title'}><h4 id={temperatureId+'-formula-title'}>这些概率是怎样算出来的？</h4><div><p>先把每个保留候选的相似度除以正温度 τ，再用 Softmax 归一化：</p><div className="m-softmax-formula"><MathText display tex="p_j = \frac{\exp(s_j / \tau)}{\sum_{k\in\mathcal{C}} \exp(s_k / \tau)}"/></div><p><MathText tex="s_j"/> 是第 j 个候选的模拟相似度，<MathText tex="\tau &gt; 0"/> 是温度，<MathText tex="\mathcal{C}"/> 是当前保留的候选集合。移除类别会改变分母，所以其余候选的概率也会变化。</p><p>所有图片是原创示意插画，相似度来自固定教学表；概率在浏览器中按公式实时计算，未调用真实 CLIP。</p></div></section>
  </div>;
}
export default Clip06;
