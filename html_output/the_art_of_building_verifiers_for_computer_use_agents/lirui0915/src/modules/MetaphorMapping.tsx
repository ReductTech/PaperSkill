import React from 'react';

const pairs = [
  { source: '代理自述', target: '作者说明', color: '#27446e', kind: 'speech' },
  { source: '轨迹截图', target: '可核查的原稿', color: '#228d5c', kind: 'page' },
  { source: '评分标准', target: '校对清单', color: '#92400e', kind: 'list' },
];

export function MetaphorMapping() {
  return <div aria-label="论文概念与校样比喻的对应关系" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,margin:'24px 0',textAlign:'center'}}>
    {pairs.map(({source,target,color,kind}) => <div key={source} style={{border:'1px solid #d7deea',borderRadius:16,padding:'18px 12px',background:'#f8faf7'}}>
      <svg aria-hidden="true" viewBox="0 0 80 64" width="72" height="58" style={{display:'block',margin:'0 auto 10px'}} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {kind==='speech' ? <><path d="M14 10h52v34H35L23 55V44h-9z" fill="#fff"/><path d="M24 22h31M24 32h22"/></> : <><path d="M18 5h34l12 12v42H18z" fill="#fff"/><path d="M52 5v13h12"/>{[28,39,50].map(y=>kind==='list'?<g key={y}><path d={`M25 ${y-2}l3 3 5-6`}/><path d={`M38 ${y}h17`}/></g>:<path key={y} d={`M27 ${y}h27`}/>)}</>}
      </svg>
      <strong style={{display:'block',color,fontSize:18}}>{source}</strong>
      <span aria-hidden="true" style={{display:'block',color:'#8792a2',margin:'3px 0'}}>↕</span>
      <span style={{display:'block',color:'#21324a',fontSize:17}}>{target}</span>
    </div>)}
  </div>;
}
