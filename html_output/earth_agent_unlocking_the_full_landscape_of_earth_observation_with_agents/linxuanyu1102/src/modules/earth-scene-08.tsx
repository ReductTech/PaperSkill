import React, { useState } from 'react';
import { C, ToolIcon, Feedback, SymbolHint } from './earth-kit';

const expected = ['A', 'B', 'C'];
const labels: Record<string, string> = { A: 'Index', B: 'Analysis', C: 'Statistics', X: '额外调用' };
const metricStyle: React.CSSProperties = { padding: '7px 12px', borderRadius: 14, background: '#f5f7fa', border: `1px solid ${C.line}`, minHeight: 66 };

export function EarthScene08() {
  const [pred, setPred] = useState(['A', 'X', 'B', 'C']);
  const [bad, setBad] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(true);
  const [selected, setSelected] = useState(0);
  let matched = 0;
  for (const tool of pred) if (tool === expected[matched]) matched++;
  let prefix = 0;
  while (prefix < Math.min(expected.length, pred.length) && pred[prefix] === expected[prefix]) prefix++;
  let parameterPrefix = 0;
  while (parameterPrefix < Math.min(expected.length, pred.length) && pred[parameterPrefix] === expected[parameterPrefix] && !(bad && pred[parameterPrefix] === 'B')) parameterPrefix++;
  const tao = new Set(pred).size ? expected.filter(tool => pred.includes(tool)).length / new Set(expected).size : 0;
  const tio = matched / expected.length;
  const tem = prefix / expected.length;
  const parameterAccuracy = parameterPrefix / expected.length;

  const move = (delta: number) => {
    const nextIndex = selected + delta;
    if (nextIndex < 0 || nextIndex >= pred.length) return;
    const next = [...pred];
    [next[selected], next[nextIndex]] = [next[nextIndex], next[selected]];
    setPred(next);
    setSelected(nextIndex);
  };

  const stepMetrics = [
    { name: 'TAO · 工具集合覆盖', value: tao, desc: '必要工具是否都出现；忽略次序与重复。' },
    { name: 'TIO · 按序匹配', value: tio, desc: '专家轨迹前缀能否作为子序列按序找到。' },
    { name: 'TEM · 严格前缀', value: tem, desc: '预测轨迹从第 1 步起与专家完全相同的长度。' },
    { name: 'Parameter Accuracy', value: parameterAccuracy, desc: '工具名和参数均正确的严格前缀比例。' },
  ];

  return <div className="ea-page">
    <div style={{height:430,padding:'0 15px'}}>
      <div style={{display:'flex',gap:20,alignItems:'center',height:44}}>
        <ToolIcon kind={3} x={32} y={27} size={.38}/>
        <strong className="ea-heading" style={{margin:0}}>专家参考轨迹：A → B → C</strong>
        <span style={{color:C.muted}}>A/B/C 是本页的合成工具标签，不是论文基准记录</span>
      </div>
      <div style={{display:'flex',gap:10,margin:'5px 0 7px',height:64}}>
        {pred.map((tool,index)=><button key={`${tool}-${index}`} aria-label={`选择第${index+1}步${tool}`} aria-pressed={selected===index} onClick={()=>setSelected(index)} style={{width:210,height:60,position:'relative',borderTop:`5px solid ${tool==='X'?C.orange:C.blue}`,padding:'4px 10px'}}>
          <strong style={{display:'block'}}>{tool} · {labels[tool]}</strong><span style={{fontSize:16}}>{index===selected?'当前选择':'点选后移动'}</span>
        </button>)}
      </div>
      <div className="ea-controls" style={{marginBottom:6}}>
        <button onClick={()=>move(-1)} disabled={selected===0}>向左移动</button>
        <button onClick={()=>move(1)} disabled={selected===pred.length-1}>向右移动</button>
        <button disabled={pred.includes('X')} onClick={()=>{setPred(v=>[...v,'X']);setSelected(pred.length)}}>追加额外调用</button>
        <button disabled={pred[selected]!=='X'} onClick={()=>{setPred(v=>v.filter((_,i)=>i!==selected));setSelected(0)}}>删除所选调用</button>
        <button aria-pressed={bad} onClick={()=>setBad(!bad)}>{bad?'修正 B 的参数':'让 B 参数出错'}</button>
      </div>

      <div style={{display:'flex',alignItems:'baseline',gap:10,borderBottom:`1px solid ${C.line}`,paddingBottom:3,marginBottom:5}}>
        <strong style={{color:C.blue}}>End-to-End · 任务结果</strong><span style={{fontSize:16,color:C.muted}}>答案看对不对；轨迹长度看调用数量比，不是速度</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={metricStyle} title="单个教学任务仅示意 0 或 1；论文在基准任务集上汇总答案正确性。">
          <div><SymbolHint meaning="Accuracy：预测最终答案与标准答案一致的比例；不是工具轨迹得分。">Accuracy</SymbolHint></div>
          <strong className="ea-equation" style={{fontSize:27,color:answerCorrect?C.green:C.red}}>{answerCorrect?'100%':'0%'}</strong>
          <button onClick={()=>setAnswerCorrect(v=>!v)} style={{marginLeft:12,padding:'4px 9px',fontSize:16}}>{answerCorrect?'设为答错':'设为答对'}</button>
        </div>
        <div style={metricStyle} title="Efficiency = 预测工具调用数 / 专家工具调用数；低于 1 不单独代表答案更好。">
          <div><SymbolHint meaning="Efficiency：预测轨迹工具调用次数除以专家轨迹工具调用次数；不是用时或运行速度。">Efficiency</SymbolHint></div>
          <strong className="ea-equation" style={{fontSize:27,color:C.orange}}>{(pred.length/expected.length).toFixed(2)}×</strong>
          <span style={{marginLeft:10,fontSize:17,color:C.muted}}>{pred.length} 次 / {expected.length} 次</span>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'baseline',gap:10,borderBottom:`1px solid ${C.line}`,paddingBottom:3,margin:'6px 0 5px'}}>
        <strong style={{color:C.blue}}>Step-by-Step · 推理轨迹</strong><span style={{fontSize:16,color:C.muted}}>覆盖 → 次序 → 完全匹配 → 参数</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {stepMetrics.map(metric=><div key={metric.name} style={metricStyle} title={metric.desc}>
          <div style={{fontSize:15,fontWeight:700,color:C.ink}}><SymbolHint meaning={metric.desc}>{metric.name}</SymbolHint></div>
          <strong className="ea-equation" style={{fontSize:25,color:metric.value===1?C.green:C.blue}}>{(metric.value*100).toFixed(1)}%</strong>
        </div>)}
      </div>
      <p className="ea-note" style={{marginTop:4,fontSize:15}}>当前为单题合成轨迹；论文指标按 Earth-Bench 任务汇总。</p>
    </div>
    <Feedback tone={prefix===3&&!bad?'green':'orange'}>{pred.join(' → ')}：工具齐全不代表顺序与参数正确。Accuracy 看最终答案；TAO / TIO / TEM / 参数准确率诊断过程；Efficiency 只比较调用次数比例，不代表执行时间。</Feedback>
  </div>;
}
