import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W=560,H=240;
type Method='raw'|'guided';

export const MgcnNoiseLab:React.FC<WidgetProps>=({chapterId,moduleId})=>{
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [state,setState]=useState({noiseLevel:35,method:'raw' as Method,judgment:''});
  const noise=state.noiseLevel/100;
  const retention=state.method==='raw'?1-.65*noise:1-.2*noise;
  const feedback=state.method==='raw'
    ? (state.noiseLevel<25?'当前噪声较低，但直接混合仍无法判断哪些线索与偏好有关。':'直接混合：偏好无关线索正在进入传播路径。')
    : (state.noiseLevel<60?'行为线索已介入：目标信息得到更多保留。':'已减轻污染，但高噪声下仍需谨慎。');
  useEffect(()=>{const cv=canvasRef.current;if(!cv)return;let c:CanvasRenderingContext2D;try{c=setupCanvas(cv,W,H);}catch{return;}c.clearRect(0,0,W,H);c.fillStyle='#f5f8f0';c.fillRect(0,0,W,H);c.fillStyle='#fff';c.strokeStyle='#d7deea';c.beginPath();c.roundRect(10,10,540,220,12);c.fill();c.stroke();c.fillStyle='#b8c9a7';c.fillRect(24,42,190,130);c.fillStyle='#76906a';c.fillRect(42,58,154,96);for(let i=0;i<Math.round(state.noiseLevel/6);i++){const x=35+((i*37)%168),y=49+((i*53)%112);c.fillStyle='rgba(196,63,82,.55)';c.fillRect(x,y,5,5);}c.strokeStyle=state.method==='raw'?'#c43f52':'#228d5c';c.lineWidth=3;c.strokeRect(state.method==='raw'?136:82,70,54,58);c.strokeStyle='#27446e';c.setLineDash(state.method==='guided'?[7,5]:[2,8]);c.beginPath();c.moveTo(214,108);c.lineTo(322,108);c.stroke();c.setLineDash([]);c.fillStyle='#21324a';c.font='12px "Segoe UI",sans-serif';c.fillText(state.method==='raw'?'偏好无关路径':'行为引导路径',232,96);const ox=350,oy=185,pw=176,ph=128;c.strokeStyle='#68778f';c.lineWidth=1;c.beginPath();c.moveTo(ox,oy-ph);c.lineTo(ox,oy);c.lineTo(ox+pw,oy);c.stroke();c.strokeStyle=state.method==='raw'?'#c43f52':'#228d5c';c.lineWidth=3;c.beginPath();for(let i=0;i<=100;i++){const n=i/100,q=state.method==='raw'?1-.65*n:1-.2*n;const x=ox+pw*n,y=oy-ph*q;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();c.fillStyle='#d97706';c.beginPath();c.arc(ox+pw*noise,oy-ph*retention,6,0,Math.PI*2);c.fill();c.fillStyle='#21324a';c.fillText('目标保留教学代理 q',366,43);c.fillText(`q=${retention.toFixed(2)}（非论文指标）`,366,211);},[state,noise,retention]);
  const setNoise=(v:number)=>setState(s=>({...s,noiseLevel:clamp(Math.round(v),0,100)}));
  const good=state.judgment==='优先用行为判断模态成分';
  return <div className="mgcn-widget">
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="模态噪声与行为引导的交互教学代理曲线" />
    <div className="ctrl"><label>噪声强度 <span className="val">{state.noiseLevel}</span></label><input type="range" min="0" max="100" step="1" value={state.noiseLevel} onChange={e=>setNoise(Number(e.target.value))} /></div>
    <div className="ctrl mgcn-buttons" role="group" aria-label="处理方式"><button aria-pressed={state.method==='raw'} onClick={()=>setState(s=>({...s,method:'raw'}))}>直接混合</button><button aria-pressed={state.method==='guided'} onClick={()=>setState(s=>({...s,method:'guided'}))}>行为引导</button><button onClick={()=>setNoise(state.noiseLevel-10)}>减少噪声</button><button onClick={()=>setNoise(state.noiseLevel+10)}>增加噪声</button><button onClick={()=>setState({noiseLevel:35,method:'raw',judgment:''})}>重置</button></div>
    <div className={`feedback ${state.method==='raw'&&state.noiseLevel>=25?'bad':state.method==='guided'?'good':''}`} aria-live="polite">{feedback}</div>
    <div className="mgcn-judgment"><strong>判断：</strong>当显眼背景与历史收藏冲突，应优先保留什么？ {['直接保留全部模态','优先用行为判断模态成分','只看最亮区域'].map(v=><button key={v} onClick={()=>setState(s=>({...s,judgment:v}))}>{v}</button>)}{state.judgment&&<p className={`feedback ${good?'good':'bad'}`}>{good?'判断成立：行为可帮助识别偏好相关成分，但不等于彻底消除所有噪声。':'再看红色路径：显眼或信息量大，并不保证偏好相关。'}</p>}</div>
  </div>;
};
export default MgcnNoiseLab;
