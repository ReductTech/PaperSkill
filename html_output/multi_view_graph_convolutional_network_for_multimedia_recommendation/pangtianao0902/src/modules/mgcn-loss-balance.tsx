import React,{useEffect,useRef,useState}from'react';
import{clamp,setupCanvas}from'../lib/canvasKit';

const W=560,H=240;
const C={bg:'#f5f8f0',blue:'#27446e',green:'#228d5c',purple:'#7c3aed',orange:'#d97706',red:'#c43f52',text:'#21324a',muted:'#68778f',border:'#d7deea'};
type Dataset='Baby'|'Sports'|'Clothing';type Readout='losses'|'downstream';type Zone='tooSmall'|'balanced'|'tooLarge';
type State={logLambda:number;dataset:Dataset;readout:Readout;judgment:''|'right'|'wrong'};type Props={chapterId:string;moduleId:string};
const lambda=(x:number)=>Math.pow(10,x);const zone=(v:number):Zone=>v<.004?'tooSmall':v>.03?'tooLarge':'balanced';
function fmt(v:number){return v>=.1?v.toFixed(2):v>=.01?v.toFixed(3):v.toPrecision(2)}
function fb(z:Zone){if(z==='tooSmall')return{cls:'',text:'辅助信号较弱：模型主要由 BPR 排序目标驱动。'};if(z==='tooLarge')return{cls:'bad',text:'λ_C 过大：辅助任务可能压过主任务，使下游表现下降。'};return{cls:'good',text:'当前位于论文所示的合适范围附近，辅助一致性与主排序保持平衡。'}}

export const MgcnLossBalance:React.FC<Props>=({chapterId,moduleId})=>{
 const canvasRef=useRef<HTMLCanvasElement>(null);const[state,setState]=useState<State>({logLambda:-2,dataset:'Sports',readout:'losses',judgment:''});const value=lambda(state.logLambda),z=zone(value);
 useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H)}catch{return}
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.strokeStyle=C.border;ctx.fillRect(12,12,336,178);ctx.strokeRect(12,12,336,178);ctx.fillRect(360,12,188,148);ctx.strokeRect(360,12,188,148);ctx.fillRect(360,170,188,58);ctx.strokeRect(360,170,188,58);
  const x0=34,x1=330;const xFor=(l:number)=>x0+(l+4)/4*(x1-x0);ctx.fillStyle='rgba(217,119,6,.08)';ctx.fillRect(x0,30,xFor(Math.log10(.004))-x0,140);ctx.fillStyle='rgba(34,141,92,.09)';ctx.fillRect(xFor(Math.log10(.004)),30,xFor(Math.log10(.03))-xFor(Math.log10(.004)),140);ctx.fillStyle='rgba(196,63,82,.08)';ctx.fillRect(xFor(Math.log10(.03)),30,x1-xFor(Math.log10(.03)),140);
  ctx.strokeStyle=C.border;ctx.lineWidth=1;for(let i=0;i<5;i++){const y=42+i*28;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke()}
  ctx.strokeStyle=C.blue;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=80;i++){const l=-4+i/20;const peak=Math.exp(-Math.pow((l+2)/.72,2));const y=151-72*peak-(state.dataset==='Baby'?3:state.dataset==='Clothing'?-2:0);i?ctx.lineTo(xFor(l),y):ctx.moveTo(xFor(l),y)}ctx.stroke();
  ctx.strokeStyle=C.purple;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=80;i++){const l=-4+i/20;const y=154-24*(l+4);i?ctx.lineTo(xFor(l),y):ctx.moveTo(xFor(l),y)}ctx.stroke();
  const cursor=xFor(state.logLambda);ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cursor,26);ctx.lineTo(cursor,174);ctx.stroke();ctx.beginPath();ctx.arc(cursor,174,7,0,Math.PI*2);ctx.fillStyle=C.orange;ctx.fill();
  ctx.fillStyle=C.text;ctx.font='bold 12px "Segoe UI",sans-serif';ctx.fillText('相对下游表现（示意）',26,28);ctx.fillStyle=C.blue;ctx.fillText('主排序趋势',42,55);ctx.fillStyle=C.purple;ctx.fillText('辅助一致性',42,72);ctx.fillStyle=C.muted;ctx.font='10px "Segoe UI",sans-serif';['0.0001','0.001','0.01','0.1','1'].forEach((t,i)=>ctx.fillText(t,x0+i*74-8,187));
  ctx.fillStyle=C.text;ctx.font='bold 13px "Segoe UI",sans-serif';ctx.fillText(state.readout==='losses'?'损失组成':'下游读法',376,34);if(state.readout==='losses'){const widths=[118,Math.min(118,25+28*(state.logLambda+4)),70];[['BPR 排序',C.blue],['自监督对比',C.purple],['L2 正则',C.muted]].forEach(([label,color],i)=>{ctx.fillStyle=color as string;ctx.fillRect(376,48+i*30,widths[i],18);ctx.fillStyle=C.text;ctx.font='10px "Segoe UI",sans-serif';ctx.fillText(label as string,500,61+i*30)})}else{ctx.fillStyle=C.text;ctx.font='12px "Segoe UI",sans-serif';ctx.fillText('Recall/NDCG 越高越好',376,62);ctx.fillStyle=C.orange;ctx.fillText('曲线只表达敏感性趋势',376,85);ctx.fillStyle=C.muted;ctx.fillText('不生成未报告数值',376,108)}
  ctx.strokeStyle=z==='balanced'?C.green:z==='tooLarge'?C.red:C.orange;ctx.lineWidth=3;ctx.strokeRect(382,124,148,22);ctx.fillStyle=C.text;ctx.font='11px "Segoe UI",sans-serif';ctx.fillText(`教学区间：${z==='balanced'?'平衡':z==='tooLarge'?'过强':'偏弱'}`,394,139);
  ctx.fillStyle=C.muted;ctx.font='10px "Segoe UI",sans-serif';ctx.fillText('依据：第4页公式(16)(19)',374,187);ctx.fillText('第7页 §3.4.2',374,202);ctx.fillText('约 0.01；过大会下降',374,217);canvas.classList.add('is-ready')
 },[state,z]);
 const setLog=(v:number)=>setState(s=>({...s,logLambda:clamp(v,-4,0),judgment:''}));const response=fb(z);
 return <div onKeyDown={e=>{if(e.key==='0')setLog(-2);if(e.key.toLowerCase()==='v')setState(s=>({...s,readout:s.readout==='losses'?'downstream':'losses'}))}}>
  <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{maxWidth:'100%',height:'auto'}} aria-label="辅助损失权重敏感性示意图"/>
  <div className="ctrl" role="group" aria-label="数据集">{(['Baby','Sports','Clothing']as Dataset[]).map(d=><button key={d} aria-pressed={state.dataset===d} onClick={()=>setState(s=>({...s,dataset:d}))}>{d}</button>)}</div>
  <div className="ctrl"><label>λ_C <span className="val">{fmt(value)}</span></label><input type="range" min={-4} max={0} step={.05} value={state.logLambda} aria-valuetext={`λ_C 等于 ${fmt(value)}`} onChange={e=>setLog(Number(e.target.value))}/><button onClick={()=>setLog(-2)}>回到论文附近</button></div>
  <div className="ctrl" role="group" aria-label="查看内容"><button aria-pressed={state.readout==='losses'} onClick={()=>setState(s=>({...s,readout:'losses'}))}>查看损失组成</button><button aria-pressed={state.readout==='downstream'} onClick={()=>setState(s=>({...s,readout:'downstream'}))}>查看下游指标</button></div>
  <div className={`feedback ${response.cls}`} aria-live="polite">{response.text} {state.readout==='losses'?'总目标同时包含 BPR、自监督对比损失与 L2 正则。':'Recall/NDCG 越高越好，但画布曲线只表达论文的敏感性趋势。'}</div>
  <details><summary>辅助目标在对齐什么？</summary><p>对用户和物品分别使用温度缩放的对比项，让融合多模态表示与对应行为表示更一致。τ 在论文实现细节中取 0.2，但不意味着所有任务都应固定该值。</p></details>
  <div className="ctrl" role="group" aria-label="学习判断"><strong>判断：既然辅助任务有帮助，是否应把 λ_C 调到最大？</strong><button onClick={()=>setState(s=>({...s,judgment:'right'}))}>否，过大会压过主任务</button><button onClick={()=>setState(s=>({...s,judgment:'wrong'}))}>是，辅助越强越好</button><button onClick={()=>setState(s=>({...s,judgment:'wrong'}))}>λ_C 与训练无关</button></div>
  {state.judgment&&<div className={`feedback ${state.judgment==='right'?'good':'bad'}`}>{state.judgment==='right'?'正确：辅助目标用于加强一致性，但排序仍是主任务。':'不成立：论文的敏感性结果显示 λ_C 过大时性能明显下降。'}</div>}
 </div>
};

export default MgcnLossBalance;
