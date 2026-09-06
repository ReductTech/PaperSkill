import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';

const W=560,H=240;
const C={bg:'#f5f8f0',paper:'#b8c9a7',blue:'#27446e',green:'#228d5c',orange:'#d97706',red:'#c43f52',text:'#21324a',muted:'#68778f',border:'#d7deea'};
type Scenario='sports'|'baby'|'clothing';
type Inspect='shared'|'specific'|'fused';
type State={scenario:Scenario;visualWeight:number;inspect:Inspect;dragging:boolean;judgment:''|'right'|'wrong'};
type Props={chapterId:string;moduleId:string};
const scenarioInfo:Record<Scenario,{label:string;start:number}>={sports:{label:'挑选运动鞋',start:.68},baby:{label:'查找婴儿用品',start:.46},clothing:{label:'对比服装材质',start:.58}};

function stateFeedback(s:State){
  if(s.inspect==='shared')return{cls:'',text:'共享部分由跨模态注意力汇总，注意力参数在各模态间共享。'};
  if(s.inspect==='specific')return{cls:'',text:'特有部分 = 当前模态表示 − 模态共享特征。'};
  const v=Math.round(s.visualWeight*100),t=100-v;
  if(s.dragging)return{cls:'',text:`你把视觉特有成分设为 ${v}%、文本特有成分设为 ${t}%。`};
  if(v===50)return{cls:'',text:'等权只是一个可检查的基线，无法表达随行为变化的相对偏好。'};
  return{cls:'good',text:'行为门控已改变两种模态特有成分的贡献，共享成分仍被保留。'};
}

export const MgcnFuserMixer:React.FC<Props>=({chapterId,moduleId})=>{
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [state,setState]=useState<State>({scenario:'sports',visualWeight:.68,inspect:'fused',dragging:false,judgment:''});
  const textWeight=1-state.visualWeight;
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);}catch{return;}
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.strokeStyle=C.border;
    [[12,12,146,182],[170,12,176,182],[358,12,190,146],[358,168,190,60]].forEach(([x,y,w,h])=>{ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h)});
    ctx.fillStyle=C.text;ctx.font='bold 13px "Segoe UI",sans-serif';ctx.fillText('输入模态',26,34);ctx.fillText('拆分与门控',184,34);ctx.fillText('融合 E_mul',374,34);
    ctx.fillStyle='#dfeaf2';ctx.fillRect(28,52,112,48);ctx.strokeStyle=C.blue;ctx.strokeRect(28,52,112,48);ctx.fillStyle=C.text;ctx.font='12px "Segoe UI",sans-serif';ctx.fillText('视觉表示 Ē_visual',38,80);
    ctx.fillStyle='#f4eadf';ctx.fillRect(28,118,112,48);ctx.strokeStyle=C.orange;ctx.strokeRect(28,118,112,48);ctx.fillStyle=C.text;ctx.fillText('文本表示 Ē_text',38,146);
    const sharedStrong=state.inspect==='shared';const specificStrong=state.inspect==='specific';const fusedStrong=state.inspect==='fused';
    ctx.fillStyle=C.paper;ctx.globalAlpha=sharedStrong?1:.72;ctx.fillRect(188,54,140,30);ctx.globalAlpha=1;ctx.fillStyle=C.text;ctx.fillText('模态共享特征 E_s',198,74);
    const vLen=118*state.visualWeight,tLen=118*textWeight;
    ctx.fillStyle=C.blue;ctx.globalAlpha=specificStrong?1:.72;ctx.fillRect(188,102,vLen,22);ctx.fillStyle=C.orange;ctx.fillRect(188,140,tLen,22);ctx.globalAlpha=1;
    ctx.fillStyle=C.text;ctx.font='11px "Segoe UI",sans-serif';ctx.fillText(`视觉特有 ${Math.round(state.visualWeight*100)}%`,190,98);ctx.fillText(`文本特有 ${Math.round(textWeight*100)}%`,190,136);
    ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(188,178);ctx.lineTo(328,178);ctx.stroke();const hx=188+140*state.visualWeight;ctx.beginPath();ctx.arc(hx,178,8,0,Math.PI*2);ctx.fillStyle=C.orange;ctx.fill();
    ctx.fillStyle=C.green;ctx.globalAlpha=fusedStrong?1:.72;ctx.fillRect(376,58,154,52);ctx.globalAlpha=1;ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.strokeRect(376,58,154,52);ctx.fillStyle='#fff';ctx.font='bold 13px "Segoe UI",sans-serif';ctx.fillText('共享 + 门控特有',391,89);
    ctx.fillStyle=C.text;ctx.font='12px "Segoe UI",sans-serif';ctx.fillText(`当前：${scenarioInfo[state.scenario].label}`,374,132);
    ctx.fillStyle=C.muted;ctx.font='11px "Segoe UI",sans-serif';ctx.fillText('二维权重为教学示意',374,184);ctx.fillText('依据：第 4 页 §2.4',374,201);ctx.fillText('公式 (11)–(15) · 结构定义',374,217);
    ctx.fillStyle=C.text;ctx.fillText('P_m 门控特有部分',184,217);canvas.classList.add('is-ready');
  },[state,textWeight]);
  const setWeight=(v:number,dragging=false)=>setState(s=>({...s,visualWeight:clamp(v,0,1),dragging,judgment:''}));
  const pointerWeight=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();const x=clamp((e.clientX-r.left)*W/r.width,188,328);return(x-188)/140};
  const chooseScenario=(scenario:Scenario)=>setState({scenario,visualWeight:scenarioInfo[scenario].start,inspect:'fused',dragging:false,judgment:''});
  const fb=stateFeedback(state);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{maxWidth:'100%',height:'auto',touchAction:'none'}} aria-label="行为感知融合器画布"
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setWeight(pointerWeight(e),true)}}
      onPointerMove={e=>{if(state.dragging)setWeight(pointerWeight(e),true)}}
      onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);setState(s=>({...s,dragging:false}))}}
      onPointerCancel={()=>setState(s=>({...s,dragging:false}))}/>
    <div className="ctrl" role="group" aria-label="购物场景">{(Object.keys(scenarioInfo) as Scenario[]).map(k=><button key={k} aria-pressed={state.scenario===k} onClick={()=>chooseScenario(k)}>{scenarioInfo[k].label}</button>)}</div>
    <div className="ctrl"><label>视觉特有权重 <span className="val">{Math.round(state.visualWeight*100)}%</span></label><input type="range" min={0} max={100} value={Math.round(state.visualWeight*100)} aria-valuetext={`视觉 ${Math.round(state.visualWeight*100)}%，文本 ${Math.round(textWeight*100)}%`} onChange={e=>setWeight(Number(e.target.value)/100,true)} onPointerUp={()=>setState(s=>({...s,dragging:false}))}/><button onClick={()=>setWeight(state.visualWeight-.01)}>−1%</button><button onClick={()=>setWeight(state.visualWeight+.01)}>+1%</button></div>
    <div className="ctrl" role="group" aria-label="查看表示">{(['shared','specific','fused'] as Inspect[]).map(k=><button key={k} aria-pressed={state.inspect===k} onClick={()=>setState(s=>({...s,inspect:k,dragging:false}))}>{k==='shared'?'共享':k==='specific'?'特有':'融合'}</button>)}<button onClick={()=>chooseScenario(state.scenario)}>重置场景</button></div>
    <div className={`feedback ${fb.cls}`} aria-live="polite">{fb.text} 此处二维滑杆是门控直觉，不等同于论文参数值。</div>
    <details><summary>共享不等于平均</summary><p>α_m 通过共享参数的注意力计算各模态对共享表示的贡献；随后每个模态减去 E_s 得到特有部分。“共享”是学习得到的共同表示，不是简单各取一半。</p></details>
    <div className="ctrl" role="group" aria-label="学习判断"><strong>判断：行为门控 P_m 作用在哪一部分？</strong><button onClick={()=>setState(s=>({...s,judgment:'right'}))}>模态特有特征</button><button onClick={()=>setState(s=>({...s,judgment:'wrong'}))}>只作用于共享特征</button><button onClick={()=>setState(s=>({...s,judgment:'wrong'}))}>直接删除一种模态</button></div>
    {state.judgment&&<div className={`feedback ${state.judgment==='right'?'good':'bad'}`}>{state.judgment==='right'?'正确：E_s 直接保留，P_m 调节各模态的特有部分。':'再看融合式：E_mul = E_s + 各模态特有项的行为门控平均。'}</div>}
  </div>;
};

export default MgcnFuserMixer;
