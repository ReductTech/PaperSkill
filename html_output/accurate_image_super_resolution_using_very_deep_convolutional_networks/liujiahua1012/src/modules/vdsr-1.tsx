import { useState } from 'react';
import { CanvasPlot, clearScene, sketch, line, pencil, text, C } from './vdsr-kit';
export function VdsrOne() {
 const [scale,setScale]=useState(2);
 const feedback=['倍率 ×2：插值保留大轮廓，细线仍有歧义。','倍率 ×3：缺失范围扩大，只看小区域更难补全结构。','倍率 ×4：放大不会带回被采样丢掉的信息；后续预测依赖学习到的先验。'][scale-2];
 return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}><div className="vdsr-controls"><label htmlFor="vdsr-scale">放大倍率 ×{scale}</label><input id="vdsr-scale" type="range" min="2" max="4" step="1" value={scale} onChange={e=>setScale(Number(e.target.value))}/></div><CanvasPlot label="左侧插值素描与右侧目标细节示意，倍率越大，红色缺失标记越多" draw={(ctx,w,h)=>{clearScene(ctx,w,h);sketch(ctx,60,35,390,205,Math.max(0,4-scale)*.15,C.blue);sketch(ctx,610,35,390,205,1,C.green);for(let i=0;i<scale;i++){const x=100+i*58;line(ctx,x,98,x+26,85,C.red,4);}pencil(ctx,110+(scale-2)*58,92,C.orange);text(ctx,'插值输入',60,265,C.blue,20);text(ctx,'目标示意',610,265,C.green,20);}}/><div className="vdsr-metrics"><span>当前倍率 <strong>×{scale}</strong></span><span>概念缺口标记 <strong>{scale} 处</strong></span></div><p className="vdsr-feedback" aria-live="polite">{feedback}</p></div>;
}
