import React,{useState} from 'react';
import {Controls,Button,Chips,Feedback,Source,Detail,WidgetFrame,palette} from './shared';
type Readout='target'|'all';
type Node={id:string,stage:number,col:number,label:string};
export function routingGraph(order:'FSN'|'SNF',readout:Readout,selectedCol:number,earlier:boolean) {
 const stages=order.split('');if(earlier)stages.push('F');
 const nodes:Node[]=[];const edges:[string,string][]=[];
 for(let s=0;s<stages.length;s++)for(let c=0;c<3;c++)nodes.push({id:s+':'+c,stage:s,col:c,label:stages[s]});
 for(let s=1;s<stages.length;s++)for(let c=0;c<3;c++)for(let prev=0;prev<3;prev++)if(stages[s]==='F'||c===prev)edges.push([(s-1)+':'+prev,s+':'+c]);
 const last=stages.length-1;
 for(let c=0;c<3;c++)if(readout==='all'||c===2)edges.push([last+':'+c,'out']);
 const start=stages.indexOf('S')+':'+selectedCol;
 function reach(startIds:string[],reverse=false){const seen=new Set(startIds),queue=[...startIds];while(queue.length){const here=queue.shift()!;for(const [a,b]of edges){const from=reverse?b:a,to=reverse?a:b;if(from===here&&!seen.has(to)){seen.add(to);queue.push(to);}}}return seen;}
 const forward=reach([start]),back=reach(['out'],true),reachable=forward.has('out');
 return {stages,nodes,edges,start,reachable,activeEdges:edges.filter(([a,b])=>forward.has(a)&&back.has(b)),forward};
}
const fullName=(s:string)=>s==='F'?'Feature Attention':s==='S'?'Sample Attention':'FFN';
function Graph({order,readout,col,earlier,show,onSelect}:{order:'FSN'|'SNF',readout:Readout,col:number,earlier:boolean,show:boolean,onSelect:(n:number)=>void}){
 const g=routingGraph(order,readout,col,earlier);
 const position=(id:string):[number,number]=>id==='out'?[94,90]:[8+Number(id.split(':')[0])*68/(g.stages.length-1),30+Number(id.split(':')[1])*60];
 const active=new Set(g.activeEdges.map(e=>e.join('>')));
 const rowNames=['非目标列 1','非目标列 2','目标列'];
 return <div className="routing-graph">
 <p><strong>{order==='FSN'?'原顺序':'新顺序'}：{g.stages.map(fullName).join(' → ')}</strong></p>
 <p>读出：{readout==='target'?'仅查询行目标 token':'查询行全部特征 attention pooling'}</p>
 <div className="routing-head" aria-label={order+'阶段标签'}>
   {g.stages.map((stage,s)=><span key={s} style={{left:position(s+':0')[0]+'%'}}><b>{stage}</b><small>{s===3?'后续 F':stage==='N'?'FFN':stage==='F'?'特征':'样本'}</small></span>)}
   <span style={{left:'94%'}}><b>读出</b></span>
 </div>
 <div className="routing-body">
   <div className="routing-row-labels">{rowNames.map(name=><span key={name}>{name}</span>)}</div>
   <div className="routing-surface">
    <svg viewBox="0 0 100 180" preserveAspectRatio="none" aria-hidden="true" focusable="false">
     {g.edges.map(([a,b])=>{const p=position(a),q=position(b),on=show&&active.has(a+'>'+b);return <line key={a+'>'+b} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={on?palette.green:palette.line} strokeWidth={on?3:1} vectorEffect="non-scaling-stroke"/>;})}
    </svg>
    {g.nodes.map(n=>{const [x,y]=position(n.id),selected=n.id===g.start;
      const cls='routing-node'+(selected?' selected':'')+(show&&g.forward.has(n.id)?' visited':'');
      const style={left:x+'%',top:y/180*100+'%'};
      return n.label==='S'?<button key={n.id} type="button" className={cls} style={style} aria-pressed={selected}
        aria-label={order+'：'+rowNames[n.col]+'的 Sample Attention 输出'} onClick={()=>onSelect(n.col)}><span/></button>
       :<span key={n.id} className={cls} style={style} aria-label={fullName(n.label)+'，'+rowNames[n.col]}><span/></span>;
    })}
    <span className={'routing-out'+(show&&g.reachable?' reached':'')} style={{left:'94%',top:'50%'}} aria-label="读出节点">□</span>
   </div>
 </div>
 <p className="routing-key">从左向右观察；圆点表示 token，方框表示读出。双圈是所选样本注意力输出，粗线表示通往读出的路径。</p>
 <p aria-live="polite"><strong>{show?(g.reachable?'存在到读出的路径':'当前没有到读出的路径'):'尚未高亮比较路径'}</strong></p>
 </div>;
}
export function OrderReadoutExplorer(){
 const [left,setLeft]=useState<Readout>('target'),[right,setRight]=useState<Readout>('target'),[col,setCol]=useState(0),[earlier,setEarlier]=useState(false),[show,setShow]=useState(false);
 const a=routingGraph('FSN',left,col,earlier),b=routingGraph('SNF',right,col,earlier);
 const opts=[{value:'target',label:'只读目标token'},{value:'all',label:'全部特征attention pooling'}];
 function select(c:number){setCol(c);setShow(true);}
 function reset(){setLeft('target');setRight('target');setCol(0);setEarlier(false);setShow(false);}
 return <WidgetFrame id="M08-order-readout">
 <Source kind="P / I / T" loc="pp4–6 §4.3、§5.4">选中的是<strong>查询行</strong>的Sample Attention输出；比较有向路径，不计算训练后权重。F=Feature Attention（特征注意力），S=Sample Attention（样本注意力），N=FFN（前馈网络）。</Source>
 <p>输入示意：2条已知上下文＋1条查询，3列含目标列。图中展开查询行；上下文行仅作为Sample Attention的输入参照，不开放末层节点选择。</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,320px),1fr))',gap:20}}>
 <Graph order="FSN" readout={left} col={col} earlier={earlier} show={show} onSelect={select}/>
 <Graph order="SNF" readout={right} col={col} earlier={earlier} show={show} onSelect={select}/>
 </div>
 <Controls><Button onClick={()=>setShow(true)}>比较读出路径</Button><Button onClick={()=>{setLeft('target');setRight('all');setEarlier(false);setShow(true);}}>论文描述配置</Button><Button onClick={reset}>重置本模块</Button></Controls>
 <Chips label="选择查询行的Sample Attention输出" value={String(col)} options={[{value:'0',label:'第1非目标列的Sample Attention输出'},{value:'1',label:'第2非目标列的Sample Attention输出'},{value:'2',label:'目标列的Sample Attention输出'}]} onChange={v=>select(Number(v))}/>
 <p><strong>独立读出条件</strong></p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:16}}>
 <div>原顺序的读出<Chips label="原顺序读出" value={left} options={opts} onChange={v=>{setLeft(v as Readout);setShow(true);}}/></div>
 <div>新顺序的读出<Chips label="新顺序读出" value={right} options={opts} onChange={v=>{setRight(v as Readout);setShow(true);}}/></div></div>
 <Chips label="观察的层" value={earlier?'earlier':'last'} options={[{value:'last',label:'只看最后一个block'},{value:'earlier',label:'查看更早一层'}]} onChange={v=>{setEarlier(v==='earlier');setShow(true);}}/>
 <Feedback tone={show&&!a.reachable?'bad':''}>{!show?'两边先用相同的目标token读出条件；开始比较才能区分模块顺序本身的路径差异。':earlier?'更早层的输出可以经后续Feature Attention汇合，不能把末层结论推广到每一层。':!a.reachable?'原顺序的这个末层非目标输出经逐token FFN仍到不了当前读出；新顺序后面的Feature Attention提供跨特征路径。':'当前条件下原顺序也有路径；目标列或全部特征读出不能套用“末层非目标被忽略”的结论。'}{show?' 左侧：'+(a.reachable?'可达':'不可达')+'；右侧：'+(b.reachable?'可达':'不可达')+'。路径存在不等于实际贡献必非零。':''}</Feedback>
 <Detail title="图的规则、读出条件与原文符号问题">
 <p>Feature Attention在同一行混合各列；Sample Attention在同一列汇集各样本；FFN逐token变换通道。这里从选中的Sample Attention输出向后做图可达性搜索，未模拟QKV、残差权重或具体稀疏掩码。</p>
 <p>“查看更早一层”把后续Feature Attention作为汇合位置画出；两者之间保持列身份的操作被折叠。这是路径解释，不是完整执行时序图。图中没有把上下文行末层输出误当成会直接进入查询行。</p>
 <p>“论文描述配置”同时设置原侧target-only与新侧all-feature pooling；它包含读出安排的变化，不能归因于顺序一个因素。attention pooling不是算术平均；本文没有给出精确池化权重公式。</p>
 <p>固定版本p8的SFN文字和Fig3图注存在符号冲突；这里按§4明确全称使用FSN/SNF，不把N解释成Normalization，也不把它说成QKV重排。Fig2是作者训练后的合成个案，不能由注意力图普遍证明因果关系。</p>
 </Detail></WidgetFrame>;
}
