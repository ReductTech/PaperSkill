import { useState } from 'react';
import { C, Scene, bird, tree, branch, parkBackdrop, line, number, Chips, Feedback } from './gd-kit';

const MODES=['句子级','词级','子句级'];
const NOTES=[
  '两个短语分别编码，并把每个短语压成一个向量。内部词语可以相互注意，但最终不保留逐词输出；这里只比较表示粒度。',
  '保留 red、bird、green、tree 四个 token 的特征，但拼接后的无关类别也可以互相注意。图中跨组连线对应这种允许关系，不表示实际注意力一定很强。',
  '仍保留四个 token 的特征；只阻断两组无关类别之间的注意力。red 与 bird、green 与 tree 内部继续交流，属性信息没有被拆散。'
];

export function TextMask() {
  const [mode,setMode]=useState(1);
  const mask=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>mode===1 || Math.floor(i/2)===Math.floor(j/2) ? 1:0));
  const draw=(ctx:CanvasRenderingContext2D)=>{
    ctx.fillStyle=C.bg; ctx.fillRect(0,0,1080,280);
    // Two independent photographic subjects provide the semantic grouping.
    parkBackdrop(ctx,35,20,230,100); parkBackdrop(ctx,295,20,230,100);
    branch(ctx,47,92,251,89,5); bird(ctx,145,65,24,C.red);
    tree(ctx,410,111,85,80);
    const xs=[90,205,350,465], ny=165;
    for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) {
      if(mask[i][j]) {
        const cross=Math.floor(i/2)!==Math.floor(j/2);
        ctx.save(); ctx.strokeStyle=cross?C.orange:C.blue; ctx.lineWidth=cross?1.4:2.4;
        ctx.setLineDash(cross?[5,5]:[]); ctx.beginPath(); ctx.moveTo(xs[i],ny);
        ctx.quadraticCurveTo((xs[i]+xs[j])/2,ny-(cross?55:35),xs[j],ny); ctx.stroke(); ctx.restore();
      }
    }
    xs.forEach((x,i)=>{
      ctx.fillStyle=i<2?'#f5dce1':'#d9eadc'; ctx.beginPath(); ctx.arc(x,ny,19,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=i<2?C.red:C.green; ctx.lineWidth=2; ctx.stroke(); number(ctx,String(i+1),x,ny,C.text);
    });
    if(mode===0) {
      [147.5,407.5].forEach((x,i)=>{
        line(ctx,x-57,185,x,211,C.muted,1.5); line(ctx,x+57,185,x,211,C.muted,1.5);
        ctx.fillStyle=i===0?C.red:C.green; ctx.fillRect(x-54,215,108,18);
        number(ctx,String(i+1),x,252,C.text);
      });
    } else {
      xs.forEach((x,i)=>{line(ctx,x,185,x,212,C.muted,1.5);ctx.fillStyle=i<2?C.red:C.green;ctx.fillRect(x-28,215,56,18);});
    }
    line(ctx,578,25,578,253,C.border,1);
    ctx.fillStyle=C.muted;ctx.font='600 15px system-ui';ctx.textAlign='center';
    ctx.fillText('允许注意',820,19);ctx.fillText('输出',30,226);
    const mx=722,my=55,cell=43;
    [1,2,3,4].forEach((n,i)=>{number(ctx,String(n),mx+i*cell+19,my-15,C.muted);number(ctx,String(n),mx-25,my+i*cell+19,C.muted);});
    mask.forEach((row,i)=>row.forEach((v,j)=>{
      const x=mx+j*cell,y=my+i*cell;
      ctx.fillStyle=v?(Math.floor(i/2)===Math.floor(j/2)?'#c4d5e8':'#f5dbbf'):'#e7eae4';
      ctx.fillRect(x,y,38,38);ctx.strokeStyle=v?C.blue:C.border;ctx.lineWidth=v?1.5:1;ctx.strokeRect(x,y,38,38);
      number(ctx,String(v),x+19,y+19,v?C.blue:C.muted);
    }));
    if(mode!==1){ctx.strokeStyle=C.green;ctx.lineWidth=2.5;ctx.strokeRect(mx-3,my-3,84,84);ctx.strokeRect(mx+83,my+83,84,84);}
  };
  return <div>
    <Chips items={MODES} value={mode} onChange={setMode} label="文本表示粒度" />
    <div style={{display:'flex',gap:18,flexWrap:'wrap',margin:'14px 0',color:C.text,fontSize:14}}>
      <span>输入：<code>red bird . green tree .</code></span>
      <span>1 red · 2 bird │ 3 green · 4 tree</span>
    </div>
    <Scene label={`${MODES[mode]}示意。${mode===1?'四个token全部允许相互注意':'只允许各自短语内部相互注意'}；输出${mode===0?'两个短语向量':'四个token向量'}。`} draw={draw} />
    <div style={{display:'flex',gap:22,flexWrap:'wrap',margin:'12px 0',color:C.muted,fontSize:14}}>
      <span>1 = 允许注意，0 = 屏蔽</span><span>输出：{mode===0?'2 个短语向量':'4 个 token 向量'}</span>
      <span>{mode===0?'右图表示各短语独立编码时的允许关系':'右图表示四个词之间的允许关系'}</span>
    </div>
    <Feedback tone={mode===2?'good':'info'}>{NOTES[mode]}</Feedback>
    <p style={{margin:'12px 0 0',color:C.muted,fontSize:13}}>二值 mask 是手工教学示意，不是学到的注意力权重。此例省略标点、特殊 token 与子词切分；“red bird”内部的属性关系不会被子句级屏蔽。</p>
  </div>;
}
