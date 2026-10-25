import { useRef, useState } from 'react';
import { Stage, C, box, line, label, arrow, Chips, Notice, Stat, Lab, Legend } from './maple-kit';

export function MapleBudget() {
  const [depth, setDepth] = useState(9);
  const [length, setLength] = useState(2);
  const [evidence, setEvidence] = useState(0);
  const count = depth * length;
  const layerFade=useRef<number[]>(Array.from({length:12},(_,i)=>i<9?1:0));
  const tokenFade=useRef<number[]>(Array.from({length:8},(_,i)=>i<2?1:0));
  return <Lab>
    <div className="maple-tag">结构计算 · 滑动调参，也可点击图中层位置</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 15 }}>
      <label htmlFor="maple-budget-depth">提示深度 J：<strong>{depth}</strong> 层<input id="maple-budget-depth" type="range" min="1" max="12" step="1" value={depth} onChange={e => setDepth(Number(e.target.value))} style={{ display: 'block', width: '100%' }} /></label>
      <label htmlFor="maple-budget-length">每层长度 b：<strong>{length}</strong> 个<input id="maple-budget-length" type="range" min="1" max="8" step="1" value={length} onChange={e => setLength(Number(e.target.value))} style={{ display: 'block', width: '100%' }} /></label>
    </div>
    <button type="button" className="maple-chip" onClick={() => { setDepth(9); setLength(2); }}>恢复论文默认 J=9、b=2</button>
    <Chips items={['看深度证据', '看长度证据', '看参数代价']} value={evidence} onChange={setEvidence} label="解释当前结构" />
    <Stage width={1080} height={340} onPoint={(x,y)=>{const xx=x*1080,yy=y*340;if(xx>=117&&xx<=702&&yy>=65&&yy<=265)setDepth(Math.min(12,Math.floor((xx-117)/50)+1))}} label={'前 ' + depth + ' 层各有 ' + length + ' 个提示。每个分支共有 ' + count + ' 个层级提示位置；标准设计有 ' + depth + ' 个耦合映射。'} draw={(ctx,w,h)=>{
      ctx.save();ctx.scale(w/1080,h/340);
      const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      layerFade.current=layerFade.current.map((v,i)=>v+((i<depth?1:0)-v)*(reduce?1:.19));tokenFade.current=tokenFade.current.map((v,i)=>v+((i<length?1:0)-v)*(reduce?1:.19));
      box(ctx,25,26,733,286,'#fff',C.border,20);box(ctx,782,26,273,286,'#fff',C.border,20);
      label(ctx,'提示分布',49,50,13,C.muted);label(ctx,'文字',48,122,13,C.green);label(ctx,'视觉',48,232,13,C.purple);
      for(let i=0;i<12;i++){
        const x=117+i*50,a=layerFade.current[i];label(ctx,String(i+1),x+17,65,12,i<depth?C.ink:C.muted,'center');
        box(ctx,x,84,35,70,'#fff5f8',C.border,7);box(ctx,x,194,35,70,'#fff5f8',C.border,7);
        ctx.save();ctx.globalAlpha=a;box(ctx,x,84,35,70,'#fff',C.green,7);box(ctx,x,194,35,70,'#fff',C.purple,7);
        for(let j=0;j<8;j++){ctx.globalAlpha=a*tokenFade.current[j];box(ctx,x+7,92+j*7,21,4,C.green,undefined,2);box(ctx,x+7,202+j*7,21,4,C.purple,undefined,2);}
        ctx.globalAlpha=a;arrow(ctx,x+17,162,x+17,185,C.purple,1.5);ctx.restore();
        if(i>=depth){line(ctx,x+9,119,x+26,119,C.light,2,[2,3]);line(ctx,x+9,229,x+26,229,C.light,2,[2,3]);}
      }
      line(ctx,117,285,117+(depth-1)*50+35,285,C.blue,2);line(ctx,117,280,117,289,C.blue,2);line(ctx,117+(depth-1)*50+35,280,117+(depth-1)*50+35,289,C.blue,2);
      label(ctx,'前 '+depth+' 层加入各自的提示',423,301,12,C.muted,'center');
      label(ctx,['层级覆盖','单层长度','耦合映射'][evidence],919,53,13,C.muted,'center');
      if(evidence===0){for(let i=0;i<12;i++){const x=842+(i%4)*43,y=92+Math.floor(i/4)*40;box(ctx,x,y,29,27,'#fff5f8',C.border,7);ctx.save();ctx.globalAlpha=layerFade.current[i];box(ctx,x,y,29,27,C.green,undefined,7);ctx.restore();}label(ctx,'J = '+depth,919,253,26,C.green,'center');}
      else if(evidence===1){for(let i=0;i<8;i++){box(ctx,842,91+i*16,153,9,'#fff5f8',undefined,4);ctx.save();ctx.globalAlpha=tokenFade.current[i];box(ctx,842,91+i*16,153,9,C.green,undefined,4);ctx.restore();}label(ctx,'b = '+length,919,253,26,C.green,'center');}
      else{for(let i=0;i<12;i++){const x=842+(i%4)*43,y=92+Math.floor(i/4)*40;box(ctx,x,y,29,27,'#fff5f8',C.border,7);ctx.save();ctx.globalAlpha=layerFade.current[i];box(ctx,x,y,29,27,'#faf3fd',C.purple,7);label(ctx,'F',x+14.5,y+13.5,12,C.purple,'center');ctx.restore();}label(ctx,'F × '+depth,919,253,26,C.purple,'center');}
      label(ctx,'结构示意 · 非准确率',919,288,11,C.muted,'center');ctx.restore();
    }} />
    <Legend items={[{ label: '独立可学习的文字提示', color: C.green }, { label: '由 F_i(P_i) 得到的视觉提示', color: C.purple }, { label: '不再加入新提示的后层', color: C.light }]} />
    <div className="maple-grid"><Stat label="文字分支的层级位置" value={count} note={depth + ' 层 × 每层 ' + length + ' 个'} /><Stat label="对应的视觉提示位置" value={count} note="由文字提示经映射生成" /><Stat label="标准设计的映射数" value={depth} note="每个提示层一个 F_i" /></div>
    <Notice tone="blue">J×b 是跨层的提示位置总数，不是同时塞进一层的序列长度。图中后层没有新增可学习提示，仍会传播前层留下的隐藏状态。</Notice>
    {evidence === 0 && <Notice tone="green"><strong>深度实验：</strong>Figure 4 的验证集比较中，MaPLe 已报告的最佳深度为 J=9；增加深度并非一直有效。当前 J={depth}、b={length} 的任意组合没有对应的准确率预测。</Notice>}
    {evidence === 1 && <Notice tone="orange"><strong>长度实验：</strong>Figure 4 中，长度增加时 Base 大体维持，New 准确率下降；作者将其解释为过拟合迹象。这是报告的验证集趋势，不是“每加一个提示就下降固定数值”。</Notice>}
    {evidence === 2 && <>
      <Notice tone="purple"><strong>参数主要花在耦合映射上：</strong>每层 F_i 把 512 维文字提示映射到 768 维视觉提示。视觉提示位置虽然能数出来，却不是另一套独立自由参数。下表是论文配置的测量，数值不会随本页滑块变化。</Notice>
      <div style={{ overflowX: 'auto' }}><table><caption style={{ textAlign: 'left', margin: '12px 0' }}>Table 6：可训练参数，不是总模型参数或运行时间</caption><thead><tr><th scope="col">方法</th><th scope="col">可训练参数</th><th scope="col">报告 HM</th></tr></thead><tbody>
        <tr><th scope="row">CoOp</th><td>2,048</td><td>71.66</td></tr><tr><th scope="row">Co-CoOp</th><td>35,360</td><td>75.83</td></tr><tr><th scope="row">Independent V-L</th><td>31,488</td><td>77.90</td></tr><tr><th scope="row">MaPLe</th><td>3.55M</td><td>78.55</td></tr><tr><th scope="row">MaPLe†（共享 F）</th><td>0.41M</td><td>78.11</td></tr>
      </tbody></table></div>
      <p>MaPLe 比全量微调参数高效，但可训练参数明显多于 CoOp 与 Co-CoOp。不同设计的训练设置也有差异，不能直接把参数量换算成速度或精度。</p>
    </>}
    <p className="maple-source">结构：§3.2；默认设置：§4.1；验证趋势：Figure 4；参数：Table 6。深度与长度的单因素实验不能拼成任意 J×b 组合的性能曲面。</p>
  </Lab>;
}
