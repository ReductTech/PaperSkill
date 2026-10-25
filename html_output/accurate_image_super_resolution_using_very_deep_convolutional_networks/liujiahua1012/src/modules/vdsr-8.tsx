import { useState } from 'react';
import { CanvasPlot, COLORS as C, clearScene, line, box, dot, text } from './vdsr-kit';
const nodes = Array.from({length:20},(_,i)=>({n:i+1,x:100+(i%10)*78,y:i<10?68:158}));
export function Vdsr8() {
  const [layer,setLayer] = useState(1);
  const rf = 1+2*layer;
  const input = layer===1?1:64, output=layer===20?1:64;
  const clamp=(n:number)=>Math.min(20,Math.max(1,n));
  return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}>
    <div className="vdsr-controls">
      <button disabled={layer===1} onClick={()=>setLayer(l=>l-1)}>前一层</button>
      <label>当前卷积层 <select value={layer} onChange={e=>setLayer(Number(e.target.value))}>{nodes.map(p=><option key={p.n} value={p.n}>第{p.n}层</option>)}</select></label>
      <button disabled={layer===20} onClick={()=>setLayer(l=>l+1)}>后一层</button>
      {[1,10,20].map(n=><button key={n} aria-pressed={n===layer} className={n===layer?'is-active':''} onClick={()=>setLayer(n)}>{n===1?'第一层':`第${n}层`}</button>)}
    </div>
    <CanvasPlot label={`20个卷积节点，当前第${layer}层。可点击节点或用方向键选择；底部绿色全局跳连从输入直达最终相加处，右上方方框是名义感受野。`} onPointer={(x,y)=>{
      const hit=nodes.find(p=>Math.abs(x-p.x)<=23&&Math.abs(y-p.y)<=23); if(hit)setLayer(hit.n);
    }} onKey={key=>{if(key==='ArrowLeft'||key==='ArrowUp')setLayer(l=>clamp(l-1));if(key==='ArrowRight'||key==='ArrowDown')setLayer(l=>clamp(l+1));if(key==='Home')setLayer(1);if(key==='End')setLayer(20);}}
    draw={(ctx,w,h)=>{
      clearScene(ctx,w,h);
      line(ctx,40,68,100,68,C.blue,4);
      for(let i=0;i<19;i++) {
        const a=nodes[i],b=nodes[i+1],color=b.n<=layer?C.blue:C.axis;
        if(i===9) {line(ctx,a.x, a.y,850,68,color,4);line(ctx,850,68,850,112,color,4);line(ctx,850,112,58,112,color,4);line(ctx,58,112,58,158,color,4);line(ctx,58,158,b.x,b.y,color,4);}
        else line(ctx,a.x,a.y,b.x,b.y,color,4);
      }
      // The single global skip bypasses every convolution, ending at final addition.
      line(ctx,40,68,40,242,C.green,4);line(ctx,40,242,902,242,C.green,4);line(ctx,902,242,902,158,C.green,4);
      line(ctx,802,158,902,158,layer===20?C.blue:C.axis,4);line(ctx,902,158,974,158,layer===20?C.green:C.axis,4);
      dot(ctx,40,68,7,C.blue);dot(ctx,974,158,7,layer===20?C.green:C.axis);
      for(const p of nodes) {
        const selected=p.n===layer;
        box(ctx,p.x-22,p.y-22,44,44,selected?C.orange:p.n<layer?C.blue:C.light,selected?C.ink:C.axis);
        text(ctx,String(p.n),p.x-(p.n<10?6:12),p.y+7,selected?C.ink:p.n<layer?'#ffffff':C.ink,19);
      }
      dot(ctx,902,158,18,'#ffffff');
      ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.arc(902,158,18,0,Math.PI*2);ctx.stroke();
      text(ctx,'+',893,166,C.green,27);
      // Same geometric scale for all layers: nominal support grows 3 to 41.
      box(ctx,978,24,88,88,'#ffffff',C.axis);
      const side=rf*2;
      box(ctx,1022-side/2,68-side/2,side,side,C.light,C.green);
      dot(ctx,1022,68,3,C.orange);
    }}/>
    <div className="vdsr-metrics"><span>第<strong>{layer}</strong>层</span><span>通道：<strong>{input}→{output}</strong></span><span>输出：<strong>H×W×{output}</strong></span><span>名义感受野：<strong>{rf}×{rf}</strong></span></div>
    <p className="vdsr-feedback" aria-live="polite">第{layer}层：{input}→{output}通道，空间保持H×W；{layer===20?'线性输出有符号残差，与原始ILR相加才得到重建图。':'卷积后接ReLU，再进入下一层。'}当前名义感受野为{rf}×{rf}，并不表示每个像素有相同的有效影响。</p>
    <p>全部20层均为3×3、步长1、零填充1：第1层1→64，18个中间层64→64，第20层64→1；前19层各接一次ReLU。蓝线为卷积主干、橙色为选中层、绿线为唯一全局相加路径，没有内部残差块。第2—3页§3.1、图2，第5页§4.1。</p>
  </div>;
}
