import React, {useState} from 'react';
import type {WidgetProps} from './registry';
export function Roles({chapterId}:WidgetProps){
  const [mode,setMode]=useState<'head'|'embedding'>(chapterId==='chap-4'?'embedding':'head');
  const head=mode==='head';
  return <div className="mv-widget" data-testid="roles" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
    <div className="mv-controls"><button className={'mv-button '+(head?'mv-selected':'')} aria-pressed={head} onClick={()=>setMode('head')}>Concept Head</button><button className={'mv-button '+(!head?'mv-selected':'')} aria-pressed={!head} onClick={()=>setMode('embedding')}>Concept Embedding</button></div>
    <div className="mv-role-map" aria-label="识别与表达的分工图">
      <div className={'mv-role-lane '+(head?'mv-lane-active':'')}><div className="mv-node"><small>输入</small><b>新图片</b></div><span className="mv-arrow">→</span><div className="mv-node"><small>外部识别</small><b>Concept Head</b><span>人脸匹配 / 物品线性分类器</span></div><span className="mv-arrow">→</span><div className="mv-node"><small>输出</small><b>出现 / 未出现</b><span>决定是否追加概念向量</span></div></div>
      <div className={'mv-role-lane '+(!head?'mv-lane-active':'')}><div className="mv-node"><small>已建立</small><b>学习得到的 e*</b><span>目标文本监督优化</span></div><span className="mv-arrow">→</span><div className="mv-node"><small>条件追加</small><b>VLM 中间特征</b><span>场景信息 + 概念信息</span></div><span className="mv-arrow">→</span><div className="mv-node"><small>生成</small><b>个性化文本</b><span>使用概念名称描述新图</span></div></div>
    </div>
    <div className="mv-detail" aria-live="polite"><small>当前模块的作用</small><h5>{head?'负责“是不是这个用户概念”':'负责“把概念信息告诉 VLM”'}</h5><p>{head?'输出是身份出现与否的判定；它不生成概念向量，也不直接回答问题。':'输出是供生成使用的概念向量；它需要 head 识别后才被追加，不能替代识别器。'}</p></div>
    <div className="mv-feedback" role="status">{head?'识别：先判断目标是否在图中。':'表达：让冻结 VLM 在生成时使用已学习的概念信息。'}</div>
    <p className="mv-source">M §3.2–3.3 · 结构教学示意，不显示虚构概率或向量数值。</p>
  </div>;
}
