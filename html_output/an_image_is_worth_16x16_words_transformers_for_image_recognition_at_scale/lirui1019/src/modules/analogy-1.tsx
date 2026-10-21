import React,{useRef} from 'react';
import {C,Stage,clearScene,drawBird,line} from './BirdKit';

export function Analogy1(){
 const source=useRef<HTMLCanvasElement|null>(null);
 return <Stage width={560} height={400}
  label="三种切法与局部放大对照：1×1像素、16×16图块、32×32图块分别得到50,176、196、49个输入单位；下方显示各自橙框内的内容。"
  render={(c,w,h)=>{
   clearScene(c,w,h);
   if(!source.current){const image=document.createElement('canvas');image.width=224;image.height=224;const ctx=image.getContext('2d');if(ctx)drawBird(ctx,0,0,224);source.current=image;}
   const src=source.current;
   const text=(s:string,x:number,y:number,size=17,color:string=C.ink)=>{c.fillStyle=color;c.font=`${size}px sans-serif`;c.fillText(s,x,y);};
   const sizes=[1,16,32],left=[20,204,388],side=152,py=40;
   sizes.forEach((p,i)=>{
    const x=left[i],n=224/p,sx=Math.floor(190/p)*p,sy=Math.floor(94/p)*p;
    text(i===0?'每次 1 个像素':`每块 ${p}×${p} 像素`,x,26,17,C.blue);
    c.drawImage(src,x,py,side,side);
    // Pixel grid is sampled for legibility; the count below is exact.
    const grid=p===1?28:n;
    for(let j=0;j<=grid;j++){const k=j*side/grid;line(c,x+k,py,x+k,py+side,'rgba(39,68,110,.32)',.7);line(c,x,py+k,x+side,py+k,'rgba(39,68,110,.32)',.7);}
    const bx=x+sx/224*side,by=py+sy/224*side,bs=p/224*side;
    c.strokeStyle=C.orange;c.lineWidth=2.5;c.strokeRect(bx,by,Math.max(2,bs),Math.max(2,bs));
    if(p===1){c.beginPath();c.arc(bx+bs/2,by+bs/2,6,0,Math.PI*2);c.stroke();}
    text(`${(n*n).toLocaleString('zh-CN')} 个单位`,x,220,20,i===0?C.support:C.blue);
    const zx=x+36,zy=258,z=80;
    c.save();c.imageSmoothingEnabled=false;c.drawImage(src,sx,sy,p,p,zx,zy,z,z);c.restore();
    c.strokeStyle=C.orange;c.lineWidth=2;c.strokeRect(zx,zy,z,z);
    text(['只含一个颜色像素','一小片鸟嘴内容','含更多周围内容'][i],x+9,364,16);
    text(['单位很多，序列很长','多像素合成一个单位','单位更少，划分更粗'][i],x+3,387,15,C.muted);
   });
   text('取出橙框内的一块，放到同样大的窗口观察',76,246,16,C.support);
  }}/>;
}
