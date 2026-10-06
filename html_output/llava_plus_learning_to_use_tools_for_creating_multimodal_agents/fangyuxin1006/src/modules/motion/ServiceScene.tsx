import React from 'react';
import {Stage,Panel,Caption,T,C,ramp,Arrow,Packet,Gear,ToolIcon} from './art';
export function ServiceDispatch({p,t}:{p:number;t:number}){const job=Math.min(2,Math.floor(p*3)),q=p*3%1,direct=job===2,toolStarted=!direct&&q>=.35,returned=!direct&&q>=.72,done=q>=.9;const initial=[[278,150],[316,150],[316,66],[718,66],[731,89]],call=[[853,154],[853,171],[674,171],[674,236],[730,236]],back=[[999,235],[1009,235],[1009,169],[921,169],[921,154]],answer=[[734,104],[707,104],[707,302],[292,302],[292,202],[278,202]];
return <Stage kind="model-first-service-dispatch" label="网页请求先进入多模态模型，模型决定是否使用工具；控制器协调工作进程，工具结果返回模型后形成回复">
 <T x={20} y={28} size={21} weight={650}>所有请求先由模型理解，再按需要执行工具</T>
 <Panel x={20} y={72} w={258} h={213} title="网页请求">{['读取车票时间','分割雨伞区域','判断图片底色'].map((v,i)=><g key={v}><rect x="36" y={115+i*50} width="226" height="37" rx="5" fill={job===i?'#dce8f7':'#f5f7fa'} stroke={job===i?C.blue:C.line}/><T x={48} y={140+i*50} size={17}>{v}</T></g>)}</Panel>
 <Panel x={356} y={110} w={269} h={175} title="控制器 · 协调工作进程"><Gear x={399} y={193} t={t} r={24}/><T x={442} y={183} size={16}>进程协调与通信</T><T x={442} y={216} size={16}>按指定目标派发</T><T x={374} y={263} size={15} fill={C.muted}>工具选择由模型完成</T></Panel>
 <Panel x={731} y={43} w={268} h={111} title="多模态模型工作进程" active={!toolStarted||returned}><ToolIcon kind="server" x={748} y={90} s={.58}/><T x={796} y={108} size={16}>{direct?'可直接判断底色':returned?'整合工具结果':job===0?'选择 EasyOCR':'选择检测与分割'}</T><T x={796} y={137} size={14} fill={C.muted}>{done?'返回面向用户的 value':'理解图像、形成调用或回答'}</T></Panel>
 <Panel x={731} y={187} w={268} h={99} title="专业工具工作进程" active={toolStarted&&!returned}><ToolIcon kind={job===0?'ocr':'mask'} x={748} y={228} s={.58} t={toolStarted?t:0}/><T x={796} y={255} size={16}>{direct?'本次无需工具':job===0?'执行文字识别':'执行检测与分割'}</T></Panel>
 <Arrow points={initial}/><Packet points={initial} p={ramp(q,0,.3)} color={C.blue}/>
 {!direct&&<><Arrow points={call} color={toolStarted?C.orange:'#dce2e9'}/>{toolStarted&&<Packet points={call} p={ramp(q,.35,.58)}/>}<Arrow points={back} color={returned?C.green:'#dce2e9'}/>{q>=.62&&<Packet points={back} p={ramp(q,.62,.8)} color={C.green}/>}</>}
 <Arrow points={answer} color={C.green}/>{q>=(direct?.5:.84)&&<Packet points={answer} p={ramp(q,direct?.5:.84,.98)} color={C.green}/>}
 <Caption>服务通信路线为示意：模型先决定工具，执行返回再交给模型；控制器不负责理解用户意图。</Caption>
 </Stage>;}
