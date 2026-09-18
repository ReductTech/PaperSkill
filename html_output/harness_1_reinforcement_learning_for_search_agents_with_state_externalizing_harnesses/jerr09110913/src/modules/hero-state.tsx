import React,{useSyncExternalStore} from 'react';
import './hero-state.css';
const listeners=new Set<()=>void>();let current=0;
const subscribe=(f:()=>void)=>{listeners.add(f);return()=>{listeners.delete(f)}};
const move=(n:number)=>{current=n;listeners.forEach(f=>f())};
const snapshots=[
 {action:'尚未检索',history:[],selected:[],known:'还没有证据'},
 {action:'找到并保留公告',history:['发现公告：5月2日宣布启动','决定保留公告'],selected:['公告 · 启动 5月2日'],known:'已知启动日，缺生效日'},
 {action:'找到并保留通知',history:['发现公告：5月2日宣布启动','决定保留公告','发现通知：6月15日正式生效','决定保留通知'],selected:['公告 · 启动 5月2日','通知 · 生效 6月15日'],known:'两种日期都有对应原文'},
 {action:'取消通知的精选标记',history:['发现公告：5月2日宣布启动','决定保留公告','发现通知：6月15日正式生效','决定保留通知','取消通知的精选标记'],selected:['公告 · 启动 5月2日'],known:'当前只选公告；通知原文仍保存'}
];
export function HeroState({structured}:{structured:boolean}){
 const step=useSyncExternalStore(subscribe,()=>current,()=>0);const s=snapshots[step];
 return <div className="h1-hero-state"><div className="h1-hero-event"><span>同一事件 · {step}/3</span><strong>{s.action}</strong></div>
 <div className="h1-hero-view" aria-label={structured?'当前精选视图':'按时间累积的历史'}>{structured?<><div className="h1-hero-label">当前精选 <b>{s.selected.length}</b></div>{s.selected.map(t=><div className="h1-hero-entry h1-hero-entry-selected" key={t}>{t}</div>)}{!s.selected.length&&<p>等待检索结果</p>}<div className="h1-hero-store">原文保存：{step===0?0:step===1?1:2} 篇</div></>:<><div className="h1-hero-label">历史记录 <b>{s.history.length}</b></div>{s.history.map((t,i)=><div className="h1-hero-entry" key={i}><span>{i+1}</span>{t}</div>)}{!s.history.length&&<p>等待检索结果</p>}</>}</div>
 <div className="h1-hero-caption" aria-live="polite">{structured?s.known:step===3?'最新取消操作写在历史末尾；要结合此前操作还原当前选择。':'每次发现和选择按时间追加。'}</div>
 {!structured&&<div className="h1-hero-controls"><button onClick={()=>move(Math.min(3,step+1))} disabled={step===3}>{step===0?'同步开始':'下一事件'}</button><button onClick={()=>move(0)} disabled={step===0}>重新对比</button></div>}
 {structured&&<p className="h1-hero-note">两栏资料和动作相同。这里只比较进展如何呈现，不测速度或正确率。</p>}
 </div>;
}
