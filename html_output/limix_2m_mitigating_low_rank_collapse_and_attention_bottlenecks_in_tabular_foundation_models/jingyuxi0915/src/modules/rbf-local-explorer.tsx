import { useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, MatrixTable, Detail, WidgetFrame, fmt, palette, drawPhotoCue } from './shared';
import { RBF_C, rbf } from './math';

export function RbfLocalExplorer() {
  const [x,setX]=useState(0);
  const [text,setText]=useState('0');
  const [sigma,setSigma]=useState('1');
  const [notice,setNotice]=useState('');
  const dragging=useRef(false);
  const bandwidth=Number(sigma);
  const phi=useMemo(()=>rbf(x,bandwidth),[x,bandwidth]);
  const closest=RBF_C.reduce((best,c,i)=>Math.abs(x-c)<Math.abs(x-RBF_C[best])?i:best,0);
  const update=(raw:number,round=false)=>{const clamped=Math.max(-3,Math.min(3,raw));const valid=round?Math.round(clamped*20)/20:clamped;setX(valid);setText(String(valid));setNotice(raw!==clamped?'有效范围为 −3～3，已限制到最近边界。':'');};
  const pointer=(event:PointerEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();const fraction=(event.clientX-rect.left)/rect.width;update((fraction-.08)/.73*6-3,true);};
  return <WidgetFrame id="M04-rbf-local">
    <Source kind="I + T" loc="p4 式1–4">Gaussian RBF 公式实算；M=3、中心与带宽为手工教学参数。</Source>
    <p><strong>沿横轴拖动当前数值</strong>，观察三个核在同一 x 处的响应。此处 x 是送入 RBF 的标量；列标准化在下一章补全。</p>
    <Chips label="响应带宽" value={sigma} onChange={setSigma} options={[{value:'.25',label:'窄响应 σ=0.25'},{value:'1',label:'默认 σ=1'},{value:'4',label:'宽响应 σ=4'}]} />
    <Canvas label="三个Gaussian核的响应曲线及当前数值的采样点；下方数字框提供键盘等价操作" height={260} style={{touchAction:'none',cursor:'ew-resize'}}
      onPointerDown={event=>{const rect=event.currentTarget.getBoundingClientRect();if((event.clientX-rect.left)/rect.width>.84)return;dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);pointer(event);}}
      onPointerMove={event=>{if(dragging.current)pointer(event);}}
      onPointerUp={event=>{dragging.current=false;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
      onPointerCancel={()=>{dragging.current=false;}}
      draw={(ctx,w,h)=>{
        const left=w*.08,right=w*.81,top=36,bottom=h-42;
        const mapX=(value:number)=>left+(value+3)/6*(right-left),mapY=(value:number)=>bottom-value*(bottom-top);
        ctx.strokeStyle=palette.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
        ctx.fillStyle=palette.ink;ctx.font='14px sans-serif';ctx.fillText('响应',left-26,22);
        for(let tick=-3;tick<=3;tick++){ctx.fillStyle=palette.muted;ctx.fillText(String(tick),mapX(tick)-4,bottom+20);ctx.beginPath();ctx.moveTo(mapX(tick),bottom-3);ctx.lineTo(mapX(tick),bottom+3);ctx.stroke();}
        ctx.fillText('1',left-18,top+5);ctx.fillText('0',left-18,bottom+4);
        const colors=[palette.blue,palette.green,palette.purple];
        RBF_C.forEach((_,i)=>{ctx.strokeStyle=colors[i];ctx.lineWidth=2;ctx.setLineDash(i===0?[]:i===1?[7,3]:[2,3]);ctx.beginPath();for(let j=0;j<=150;j++){const t=-3+j/25,px=mapX(t),py=mapY(rbf(t,bandwidth)[i]);j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.setLineDash([]);});
        ctx.strokeStyle=palette.orange;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(mapX(x),top-8);ctx.lineTo(mapX(x),bottom);ctx.stroke();ctx.setLineDash([]);
        phi.forEach((value,i)=>{ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(mapX(x),mapY(value),5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=palette.ink;ctx.lineWidth=1;ctx.stroke();});
        ctx.fillStyle=palette.orange;ctx.beginPath();ctx.arc(mapX(x),bottom,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.stroke();
        drawPhotoCue(ctx,w*.915,h*.45,Math.min(60,w*.1),(x+3)/6);
      }} />
    <p style={{display:'flex',gap:16,flexWrap:'wrap'}}><span style={{color:palette.blue}}>实线：c=−1</span><span style={{color:palette.green}}>长虚线：c=0</span><span style={{color:palette.purple}}>点线：c=1</span></p>
    <Controls><label>当前数值 x <input type="number" aria-label="当前数值 x" min={-3} max={3} step={.05} value={text} style={{width:100}} onChange={event=>{const raw=event.target.value;setText(raw);if(raw.trim()===''||!Number.isFinite(Number(raw))){setNotice('请输入有限数字；曲线采样保留上次有效值。');return;}update(Number(raw));}} /></label><Button onClick={()=>{setX(0);setText('0');setSigma('1');setNotice('');}}>重置本模块</Button></Controls>
    {notice&&<Feedback>{notice}</Feedback>}
    <p aria-live="polite"><strong>当前有效 x = {fmt(x,2)}，σ = {bandwidth}</strong>；φ(x) = [{phi.map(v=>fmt(v,6)).join(', ')}]</p>
    <MatrixTable matrix={[phi]} label="三个局部响应组成的向量 φ（尚不是完整RaBEL）" headers={['中心 −1','中心 0','中心 1']} />
    <p><code>κ(x,c,σ) = exp(−(x − c)² / (2σ²))</code></p>
    <p>以最近中心 c = {RBF_C[closest]} 为例：exp(−({fmt(x,2)} − ({RBF_C[closest]}))² / (2×{bandwidth}²)) = <strong>{fmt(phi[closest],6)}</strong>。</p>
    <Feedback>{bandwidth===4?'带宽增大，三条曲线更宽，当前响应也更接近；更宽不等于表示或预测一定更好。':bandwidth===.25&&Math.max(...phi)<.05?'当前数值远离窄核中心，三个响应都接近 0。局部响应需要与输入覆盖范围一起考虑。':`当前最近的中心是 ${RBF_C[closest]}，对应响应最大${RBF_C.filter(c=>Math.abs(Math.abs(x-c)-Math.abs(x-RBF_C[closest]))<1e-12).length>1?'（存在并列）':''}。不同数值会激活不同的响应组合；不只是把同一个数复制到更多通道。`}</Feedback>
    <Detail title="这一页完成了什么，还没有完成什么"><p>x=c 时 κ=1；σ 始终大于0。相同 σ 下离中心越远响应越小；σ 增大时响应范围变宽。有限宽度和有限中心不保证任意输入都得到良好区分。</p><p>这是 RBF 展开。完整 RaBEL 还包括列标准化、共享线性投影和每 token LayerNorm，下一章逐项计算。M=3 和这里的三个带宽都是教学选择，不能称为论文最终最优配置。</p><p>右侧对焦环只作“局部范围”的摄影类比，光学效果不被当成 RBF 公式或模型性能。本模块的输入和带宽不会改变后续论文 AUC。</p></Detail>
  </WidgetFrame>;
}

