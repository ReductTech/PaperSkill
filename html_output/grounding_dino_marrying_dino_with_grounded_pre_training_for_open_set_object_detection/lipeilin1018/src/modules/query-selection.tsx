import { useState } from 'react';
import { C, Scene, photo, frame, line, number, Chips, Feedback } from './gd-kit';

const SCORES = [[.92,.18],[.81,.22],[.35,.87],[.25,.79],[.45,.30],[.18,.26]];
const CROPS = [[.30,.42],[.35,.48],[.12,.35],[.12,.56],[.80,.64],[.53,.78]];
const promptNames = ['鸟', '树', '鸟＋树'];

export function QuerySelection() {
  const [prompt, setPrompt] = useState(0);
  const [k, setK] = useState(2);
  const active = prompt === 2 ? [0,1] : [prompt];
  const maxima = SCORES.map(row => Math.max(...active.map(j => row[j])));
  const ranked = maxima.map((score,index) => ({score,index})).sort((a,b) => b.score-a.score || a.index-b.index);
  const selected = new Set(ranked.slice(0,k).map(item => item.index));
  const indices = ranked.slice(0,k).map(item => item.index+1);
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0,0,1080,280);
    CROPS.forEach(([cx,cy],i) => {
      const x = 26+(i%3)*140, y=22+Math.floor(i/3)*121, w=124, h=103;
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
      photo(ctx,x+w/2-cx*650,y+h/2-cy*285,650,285);
      ctx.restore();
      frame(ctx,x,y,w,h,selected.has(i)?C.green:C.border,!selected.has(i));
      ctx.fillStyle = '#ffffffee'; ctx.fillRect(x+5,y+5,26,24);
      number(ctx,String(i+1),x+18,y+18,selected.has(i)?C.green:C.text);
    });
    line(ctx,460,23,460,256,C.border,1);
    ctx.font='600 15px system-ui'; ctx.textAlign='center'; ctx.fillStyle=C.muted;
    ctx.fillText('图像',505,19); ctx.fillText('文本',626,19);
    [1,2].forEach((n,j)=>number(ctx,String(n),590+j*74,41,active.includes(j)?C.blue:C.muted));
    SCORES.forEach((row,i)=> {
      const y=68+i*32;
      number(ctx,String(i+1),505,y,selected.has(i)?C.green:C.text);
      row.forEach((v,j)=>{
        const x=568+j*74;
        ctx.fillStyle=active.includes(j)?`rgba(39,68,110,${.08+v*.26})`:'#e9ece7';
        ctx.fillRect(x,y-13,58,26);
        ctx.strokeStyle=active.includes(j)?C.blue:C.border; ctx.lineWidth=active.includes(j)?1.5:1;
        ctx.strokeRect(x,y-13,58,26);
        number(ctx,v.toFixed(2),x+29,y,active.includes(j)?C.blue:C.muted);
      });
      line(ctx,715,y,750,y,selected.has(i)?C.green:C.border,selected.has(i)?3:1.5);
      ctx.fillStyle='#e4e9df'; ctx.fillRect(771,y-10,226,20);
      ctx.fillStyle=selected.has(i)?C.green:C.light; ctx.fillRect(771,y-10,226*maxima[i],20);
      if(selected.has(i)) { ctx.strokeStyle=C.green; ctx.lineWidth=2; ctx.strokeRect(768,y-13,232,26); }
      number(ctx,maxima[i].toFixed(2),1030,y,selected.has(i)?C.green:C.text);
    });
  };
  return <div>
    <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',marginBottom:14}}>
      <Chips items={promptNames} value={prompt} onChange={setPrompt} label="参与查询选择的文本" />
      <label htmlFor="gd-query-k" style={{display:'flex',alignItems:'center',gap:12,color:C.text,fontWeight:600}}>
        保留候选数 K = {k}
        <input id="gd-query-k" type="range" min={1} max={3} step={1} value={k} onChange={e=>setK(Number(e.target.value))} onKeyDown={e=>{if(e.key.startsWith('Arrow')) e.stopPropagation();}} style={{accentColor:C.green,width:150}} />
      </label>
    </div>
    <Scene label={`人工分数矩阵。当前文本${promptNames[prompt]}，沿文本轴取最大后选中图像位置${indices.join('、')}。`} draw={draw} />
    <div style={{display:'flex',gap:18,flexWrap:'wrap',margin:'12px 0',color:C.muted,fontSize:14}}>
      <span>矩阵列：1 = 鸟，2 = 树</span><span>行：6 个图像位置</span><span>右侧条：当前有效列的行最大值</span>
    </div>
    <Feedback tone="info">
      <strong>先 max，再 TopK：</strong>选中位置 {indices.join('、')}，对应分数 {ranked.slice(0,k).map(item=>item.score.toFixed(2)).join('、')}。
      这里只保留 {k} 个候选位置，尚未确认有 {k} 个物体。真实配置默认 Nq = 900、d = 256；位置部分来自编码器预测的动态锚框，内容部分仍是可学习参数。
    </Feedback>
    <p style={{margin:'12px 0 0',color:C.muted,fontSize:13}}>人工教学矩阵，不是真实网络输出；点积分数没有做 softmax，也不应解释为概率。切换单词只选取本例的有效列，真实模型的文本特征还会随上下文变化。</p>
  </div>;
}
