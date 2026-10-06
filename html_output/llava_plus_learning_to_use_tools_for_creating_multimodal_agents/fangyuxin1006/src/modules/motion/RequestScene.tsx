import React from 'react';
import {Stage,Panel,Caption,T,C,ramp,ease,Ticket,Arrow,Packet} from './art';
import type {Props} from './art';
export function Request({mode,p}:Props){const direct=mode===2,scan=ramp(p,.28,.67),ready=direct||p>=.75,q=ease(ramp(p,.75,.9));return <Stage kind="ticket-two-assistant-turns" label="助手先输出调用格式，工具执行识字后，助手再次输出带空动作列表的最终答案">
 <T x={20} y={28} size={20} weight={650}>用户：{['这张车票几点发车？','应该去哪个站台？','车票的底色是什么？'][mode]}</T>
 <T x={20} y={67} size={16} fill={C.muted}>{direct?'直接看图即可回答':p<.28?'先形成调用请求':p<.75?'执行 EasyOCR，读取车票':'工具返回后再次生成回复'}</T>
 <Ticket x={20} y={89} scan={direct||p<.28?-1:scan}/>
 <Panel x={333} y={53} w={356} h={223} title={direct?'助手直接输出':'助手第一次输出 · 请求技能'} active={!ready}>
 <T x={350} y={110} size={16} fill={C.muted}>thoughts</T><T x={350} y={134} size={17}>{direct?'直接看图判断底色':'需要读取车票文字'}</T>
 <T x={350} y={162} size={16} fill={C.muted}>actions · JSON 调用列表</T><T x={350} y={187} size={16}>{direct?'[]':'[{ API_name: EasyOCR,'}</T><T x={350} y={214} size={16}>{direct?'不发起工具请求':'  API_params: { image } }]'}</T>
 <T x={350} y={253} size={16}>{direct?'value: 车票底色是米黄色。':'value: 我将读取车票文字。'}</T>
 </Panel>
 <Panel x={722} y={53} w={278} h={223} title={direct?'向用户显示本轮 value':'助手第二次输出 · 汇总结果'} active={ready}>
 <T x={738} y={110} size={14}>{direct?'无需等待工具返回':'thoughts: 结合图像和返回作答'}</T><T x={738} y={132} size={14}>{direct?'actions: []':'actions: [] · 本轮不再调用'}</T>
 {ready?mode===0?<><g transform="translate(800 187)"><circle r="34" fill="#f8fafc" stroke={C.blue} strokeWidth="2.5"/>{[0,90,180,270].map(a=><path key={a} d="M0 -29V-25" stroke={C.blue} transform={`rotate(${a})`}/>)}<path data-motion="clock-hour" d="M0 0V-19" stroke={C.blue} strokeWidth="4" transform={`rotate(${255*q})`}/><path data-motion="clock-minute" d="M0 0V-27" stroke={C.orange} strokeWidth="3" transform={`rotate(${180*q})`}/></g><T x={855} y={196} size={25} weight={650}>08:30</T><T x={739} y={251} size={17}>value: 发车时间是 08:30。</T></>:mode===1?<><rect data-motion="platform-reveal" x={776-8*q} y="148" width={87+16*q} height="76" rx="7" fill={C.blue}/><T x={819} y={202} size={44} anchor="middle" fill="white">5</T><T x={739} y={251} size={17}>value: 请前往 5 站台。</T></>:<><circle data-motion="color-sample" cx={820} cy={185} r={29+7*ease(ramp(p,0,.7))} fill="#fff8e6" stroke="#d7c29e" strokeWidth="3"/><T x={739} y={251} size={17}>车票底色是米黄色。</T></>:<T x={745} y={199} size={18} fill={C.muted}>等待工具执行结果</T>}
 </Panel>
 <Arrow points={[[160,288],[860,288]]}/><Packet points={[[160,288],[860,288]]} p={p} color={direct?C.blue:C.orange}/>
 <Caption>{direct?'直接回答沿用统一字段；空 actions 表示当前输出不发起工具调用。':'第一次输出请求技能；工具执行后，第二次输出整合结果。两次都包含 thoughts、actions、value。'}</Caption>
 </Stage>;}
