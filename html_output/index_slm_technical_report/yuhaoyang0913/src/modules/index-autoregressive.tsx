import { useState } from 'react';
import { Feedback, PedagogicalLabel } from './index-kit';

const tokens=['今天','我们','学习','语言','模型'];

export function IndexAutoregressive(){
  const [step,setStep]=useState(0);
  const prefix=tokens.slice(0,step+1).join(' ');
  const message=step<4?`当前位置只能读取前缀「${prefix}」；下一目标是「${tokens[step+1]}」，未来 token 保持隐藏。`:'序列已经展开到最后一个位置；每一行仍只允许关注自身与左侧 token。';
  return <div className="causal-lab" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation()}}>
    <PedagogicalLabel detail="示例句子与注意力强度为机制演示；因果遮罩规则属于标准 Decoder-only 机制" />
    <div className="causal-console">
      <header><span>TOKEN STREAM</span><b>causal visibility · t={step+1}</b></header>
      <div className="causal-stream">{tokens.map((token,i)=><div key={token} className={i<step?'visible':i===step?'query':i===step+1?'target':'hidden'}><small>{String(i+1).padStart(2,'0')}</small><b>{token}</b><span>{i<=step?'visible':i===step+1?'next target':'masked'}</span></div>)}</div>
      <div className="causal-grid-wrap">
        <div className="grid-label y">QUERY POSITION</div>
        <div className="causal-grid">
          <i className="corner" />{tokens.map(t=><b key={`h-${t}`}>{t}</b>)}
          {tokens.flatMap((row,r)=>[<b key={`r-${row}`}>{row}</b>,...tokens.map((_,c)=><button key={`${r}-${c}`} tabIndex={r===step?0:-1} className={`${c<=r?'allowed':'masked'} ${r===step?'active-row':''}`} aria-label={`${tokens[r]} ${c<=r?'可以看到':'不能看到'} ${tokens[c]}`}><span>{c<=r?'●':'×'}</span></button>)])}
        </div>
        <div className="mask-legend"><span><i className="allowed"/>visible attention</span><span><i className="masked"/>future mask</span><p>上三角区域始终不可见；移动 t 只改变当前高亮行和 token 状态。</p></div>
      </div>
    </div>
    <div className="metrics"><div className="metric"><div className="l">当前 query</div><output className="v">t={step+1}</output></div><div className="metric"><div className="l">可见 token</div><output className="v">{step+1}/5</output></div><div className="metric"><div className="l">未来状态</div><output className="v">{4-step} masked</output></div></div>
    <div className="chip-row"><button className="chip" style={{minHeight:44}} disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))}>上一步</button><button className="chip" style={{minHeight:44}} disabled={step===4} onClick={()=>setStep(v=>Math.min(4,v+1))}>下一步</button><button className="chip" style={{minHeight:44}} disabled={step===0} onClick={()=>setStep(0)}>重置</button></div>
    <Feedback tone={step===4?'good':'neutral'}>{message}</Feedback>
    <details className="evidence-disclosure"><summary><span>Paper Evidence</span><b>§2.3 / §2.5</b><i>展开证据 ＋</i></summary><div className="evidence-grid"><div><small>SECTION</small><b>§2.3、§2.5</b></div><div><small>FIGURE / TABLE</small><b>Table 2</b></div><div><small>论文事实</small><p>Index 采用 decoder-only Transformer；训练将样本打包成完整序列，并在文档边界重置 attention mask 与 position identifiers。</p></div><div><small>本页如何解释</small><p>用标准下三角 causal mask 展示当前位置只能读取自身及左侧 token；示例句子不是论文样本。</p></div></div></details>
  </div>;
}
