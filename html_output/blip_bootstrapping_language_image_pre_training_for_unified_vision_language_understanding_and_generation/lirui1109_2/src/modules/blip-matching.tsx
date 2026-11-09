import { useState } from 'react';
import { Photo, useTween } from './blip-kit';
import { C,SvgText as T,SvgButton } from './blip-revision-kit';
export function BlipMatching(){
 const [values,setValues]=useState([true,true,false]);
 const [focus,setFocus]=useState(2);
 const labels=[values[0]?'游客':'小猫',values[1]?'撑着':'放下',values[2]?'红伞':'蓝伞'];
 const correct=values.every(Boolean);
 const points=[[405,318],[370,293],[376,193]];
 const px=useTween(points[focus][0],400),py=useTween(points[focus][1],400);
 const reason=values[2]?'': '颜色不符';
 const issues=[!values[0]?'人物不符':'',!values[1]?'动作不符':'',reason].filter(Boolean).join('、');
 function change(i:number){setFocus(i);setValues(values.map((v,j)=>j===i?!v:v));}
 return <div className="blip-page rev-page">
  <svg className="rev-scene" viewBox="0 0 1472 490" role="group" aria-label="修改句子细节并观察图文匹配">
   <rect x={0} y={0} width={720} height={470} rx={20} fill="#f1ebdf"/>
   <g transform="translate(40 14)"><Photo kind="umbrella" width={640} height={416}/></g>
   <circle cx={px} cy={py} r={focus===2?82:52} fill="#fffdf815" stroke={values[focus]?C.green:C.orange} strokeWidth={6}/>
   <path d={`M${px+65} ${py} C760 ${py} 742 144 ${870+focus*225} 144`} fill="none" stroke={values[focus]?C.green:C.orange} strokeWidth={3} strokeDasharray="10 7"/>
   <T x={360} y={451} anchor="middle" weight={700}>图里：游客撑着红伞</T>
   <T x={1115} y={47} anchor="middle" size={34} weight={750}>点一个词，制造或修复错配</T>
   {labels.map((word,i)=><SvgButton key={i} x={770+i*225} y={94} width={200} height={86} label={`替换${['人物','动作','颜色'][i]}：${word}`} onClick={()=>change(i)} active={focus===i} color={values[i]?C.blue:C.red}>{word} ↔</SvgButton>)}
   <T x={1115} y={240} anchor="middle" color={C.muted}>主题相近，仍可能有细节错误</T>
   <rect x={810} y={275} width={620} height={145} rx={18} stroke={correct?C.green:C.red} strokeWidth={4} fill={correct?'#eaf3ed':'#faedef'}/>
   <T x={1120} y={337} anchor="middle" size={44} weight={800} color={correct?C.green:C.red}>ITM：{correct?'✓ 匹配':'✕ 不匹配'}</T>
   <T x={1120} y={390} anchor="middle" color={correct?C.green:C.red}>{correct?'文字中的细节都能对应':issues}</T>
  </svg>
  <div className="rev-bottom-note"><b>ITC 找相似候选</b><span>→</span><b>ITM 融合图文，核对是否匹配</b></div>
  <p className="rev-foot" aria-live="polite">{correct?'训练用难负例练习判配；检索可重排候选，Filter 可剔除错配。':`当前：${issues}。示意连线帮助核对细节，不是真实模型注意力。`}</p>
 </div>;
}
