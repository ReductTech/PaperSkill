import React, {useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';

const verbs=['寻找空白字幕位','将文字对齐画面','补写另一段字幕','逐词描述所见','补上未标注时间','改写一句原有描述','送入配对学习','核对一项基准','压缩标注预算','放大论文证据'];
export const SubtitleAnalogy: React.FC<{chapterId:string;moduleId:string}> = ({chapterId}) => {
  const idx=Math.max(0,Math.min(9,Number(chapterId.replace('chap-',''))-1));
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    let ctx:CanvasRenderingContext2D;
    try{ctx=setupCanvas(canvas,640,148);}catch{return;}
    let raf=0;let frame=0;
    const render=()=>{
      frame++;const t=(Math.sin(frame/35)+1)/2;
      ctx.clearRect(0,0,640,148);
      ctx.fillStyle='#f5f8f9';ctx.fillRect(0,0,640,148);
      ctx.fillStyle='#e1e9ed';ctx.fillRect(18,18,604,57);
      for(let i=0;i<7;i++){ctx.fillStyle=i===idx%7?'#cdebdc':'#fff';ctx.fillRect(25+i*85,26,77,41);ctx.strokeStyle='#a8b9c2';ctx.strokeRect(25+i*85,26,77,41);}
      ctx.strokeStyle='#8299a8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(28,98);ctx.lineTo(612,98);ctx.stroke();
      ctx.fillStyle='#fff';ctx.fillRect(125,108,390,28);ctx.strokeStyle='#b2c5cd';ctx.strokeRect(125,108,390,28);
      ctx.fillStyle='#315c80';ctx.font='15px Segoe UI';ctx.fillText(verbs[idx],140,127);
      const x=50+t*535;ctx.fillStyle='#e29a4b';ctx.beginPath();ctx.moveTo(x,85);ctx.lineTo(x-9,70);ctx.lineTo(x+9,70);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#e29a4b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,85);ctx.lineTo(x,106);ctx.stroke();
      if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready');
      raf=requestAnimationFrame(render);
    };
    const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;};
    const start=()=>{if(!raf)raf=requestAnimationFrame(render);};
    const disconnect=observeCanvas(canvas,start,stop);
    return()=>{stop();disconnect();};
  },[idx]);
  return <canvas className="lv-analogy-canvas" ref={ref} role="img" aria-label={`字幕编辑桌上，光标正在${verbs[idx]}`}/>;
};
