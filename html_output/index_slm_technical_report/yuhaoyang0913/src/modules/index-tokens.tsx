import React, { useEffect, useState } from 'react';
import { Feedback, PedagogicalLabel } from './index-kit';

const modes = [
  { name:'字符级示意', pieces:['语','言','模','型'], ids:['ID₁','ID₂','ID₃','ID₄'], note:'4 个汉字 → 4 个 token' },
  { name:'子词级示意', pieces:['语言','模型'], ids:['ID₁','ID₂'], note:'4 个汉字 → 2 个 token' },
  { name:'长片段示意', pieces:['语言模型'], ids:['ID₁'], note:'4 个汉字 → 1 个 token' },
];

export const IndexTokens:React.FC = () => {
  const [mode,setMode]=useState(1);
  const [playing,setPlaying]=useState(true);
  useEffect(()=>{if(!playing||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=window.setInterval(()=>setMode(x=>(x+1)%modes.length),2200);return()=>clearInterval(timer)},[playing]);
  const current=modes[mode];
  return <div className="token-lab-v3">
    <PedagogicalLabel detail="切分方案与 ID₁ 等索引槽位为机制演示；65,029 词表等明确数字来自论文" />
    <div className="token-console">
      <div className="token-console-head"><span>INPUT SEQUENCE</span><b>Index Tokenizer · vocab 65,029</b><i className={playing?'live':''}/></div>
      <div className="raw-sequence"><small>raw text</small><code>语 言 模 型</code><span>4 Chinese characters</span></div>
      <div className="token-transform"><span>BPE + SentencePiece</span><i>↓</i></div>
      <div className="token-blocks" aria-live="polite">{current.pieces.map((piece,i)=><div key={`${mode}-${piece}`}><span>{piece}</span><small>token id</small><b>{current.ids[i]}</b></div>)}</div>
      <div className="sequence-tape"><span>sequence length</span><div>{[0,1,2,3].map(i=><i key={i} className={i<current.pieces.length?'filled':''}/>)}</div><b>{current.pieces.length}</b></div>
    </div>
    <div className="v2-controls"><div className="v2-segment">{modes.map((item,i)=><button key={item.name} aria-selected={mode===i} onClick={()=>{setPlaying(false);setMode(i)}}>{item.name}</button>)}</div><button className="autoplay-toggle" aria-pressed={playing} onClick={()=>setPlaying(x=>!x)}><i/>{playing?'自动切分演示 · 暂停':'继续自动演示'}</button></div>
    <Feedback tone={mode===1?'good':'neutral'}>{current.note}。ID₁ 等只表示词表索引槽位，不冒充真实 token ID；论文事实是 BPE + SentencePiece、中文子词单独训练、最大 piece 长度从 16 调至 5，以及 65,029 词表。</Feedback>
    <details className="evidence-disclosure"><summary><span>Paper Evidence</span><b>§2.2 · Tokenizer</b><i>展开证据 ＋</i></summary><div className="evidence-grid"><div><small>SECTION</small><b>§2.2</b></div><div><small>FIGURE / TABLE</small><b>Table 1</b></div><div><small>论文结论</small><p>中文词表单独训练；最大 piece length 16→5；最终词表 65,029；输入前不自动添加空格。</p></div><div><small>本页解释</small><p>用块数量展示压缩率直觉；具体切分和 token ID 不作为模型实测。</p></div></div></details>
  </div>;
};
