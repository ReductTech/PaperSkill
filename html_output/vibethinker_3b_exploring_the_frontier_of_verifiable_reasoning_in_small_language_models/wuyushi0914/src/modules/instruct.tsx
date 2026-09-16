import React,{useState} from 'react';
import {Canvas,Chips,Feedback,Stats,C,rect,target,label} from './notebook-scene';
const outputs=['好的！{"results":[2,4]}','{"results":[2,4,6]}','{"results":[2,4]}'];
export function Instruct(){const [mode,setMode]=useState(0);const text=outputs[mode];let data:any;try{data=JSON.parse(text);}catch{data=null;}const checks=[data!==null,!!data&&Object.keys(data).length===1&&Array.isArray(data.results)&&data.results.length===2,!!data&&Array.isArray(data.results)&&data.results.every((v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v%2===0)];return <>
 <Canvas label="三条显式指令约束的验证结果" draw={c=>{checks.forEach((ok,i)=>{rect(c,35+i*265,35,240,167,'#fff');label(c,String(i+1),58+i*265,75,28);target(c,155+i*265,129,ok,2);});}}/>
 <Chips options={['附加说明文字','多给一个数字','严格符合要求']} value={mode} onChange={setMode}/>
 <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',padding:16,background:C.bg,border:`1px solid ${C.line}`,borderRadius:8}}>{text}</pre>
 <Stats items={[["1 纯JSON",checks[0]?'通过':'失败'],["2 仅results且恰好两项",checks[1]?'通过':'失败'],["3 均为偶数",checks[2]?'通过':'失败']]}/>
 <Feedback tone={checks.every(Boolean)?'good':'bad'}>{mode===0?'虽然其中有正确数字，但额外文字使整个响应无法解析成JSON，严格格式检查失败。':mode===1?'JSON格式成立，数字也都是偶数，但数量不符合“恰好两个”的要求。':'三条显式约束都通过；这是规则验证的小例子，不是完整IFEval评测。'}</Feedback>
 </>;}
