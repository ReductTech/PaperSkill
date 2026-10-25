import { useEffect, useRef, useState } from 'react';
import { Stage, C, box, line, label, Chips, Notice, Lab, Legend } from './maple-kit';

const ablations = [
  { name: 'Shallow MaPLe', short: '浅层', value: 76.67 },
  { name: 'Deep vision', short: '视觉', value: 76.68 },
  { name: 'Deep language', short: '文字', value: 77.56 },
  { name: 'Independent V-L', short: '独立 V-L', value: 77.90 },
  { name: 'MaPLe', short: 'MaPLe', value: 78.55 },
];
const domains = ['V2','Sketch','A','R'];
const cocoDomain = [64.07,48.75,50.63,76.18];
const mapleDomain = [64.07,49.15,50.90,76.98];
const transfer = [{ name: 'CoOp', value: 63.88 }, { name: 'Co-CoOp', value: 65.74 }, { name: 'MaPLe', value: 66.30 }];

export function MapleEvidence() {
  const [claim, setClaim] = useState(0);
  const captions = ['耦合是否有用？', '是否处处最好？', '能否跨数据集？'];
  const entered=useRef(0);
  useEffect(()=>{entered.current=performance.now();},[claim]);
  return <Lab>
    <Chips items={captions} value={claim} onChange={setClaim} label="选择待检验的主张" />
    <Stage width={1080} height={340} label={claim === 0 ? '五种提示设计的HM：76.67、76.68、77.56、77.90、78.55。' : claim === 1 ? '四个ImageNet目标域的比较，V2持平，其他三个MaPLe更高。' : '跨数据集平均准确率：CoOp63.88，Co-CoOp65.74，MaPLe66.30；MaPLe超过Co-CoOp的8个目标数据集。'} draw={(ctx,w,h)=>{
      ctx.save();ctx.scale(w/1080,h/340);
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const progress=reduced?1:Math.min(1,Math.max(0,(performance.now()-entered.current)/460)),ease=1-Math.pow(1-progress,3);
      box(ctx,24,24,1032,292,'#fff',C.border,20);ctx.save();ctx.globalAlpha=.35+.65*ease;ctx.translate(0,6*(1-ease));
      if(claim===0){
        const left=207,scale=7.2;
        for(let tick=0;tick<=100;tick+=20){line(ctx,left+tick*scale,48,left+tick*scale,279,C.border,1);label(ctx,String(tick),left+tick*scale,297,12,C.muted,'center');}
        ablations.forEach((row,i)=>{const y=53+i*45;if(i===4)box(ctx,36,y-7,1004,41,'#fff5f8',undefined,10);label(ctx,row.short,left-22,y+13,15,i===4?C.blue:C.ink,'right');box(ctx,left,y,720,26,'#f7eff3',undefined,6);box(ctx,left,y,row.value*scale*ease,26,i===4?C.green:C.blue,undefined,6);label(ctx,row.value.toFixed(2),1008,y+13,17,i===4?C.blue:C.ink,'right');});
      }else if(claim===1){
        const base=263,scale=1.88;
        for(let tick=0;tick<=100;tick+=25){line(ctx,76,base-tick*scale,1024,base-tick*scale,C.border,1);label(ctx,String(tick),60,base-tick*scale,11,C.muted,'right');}
        domains.forEach((name,i)=>{const x=132+i*237;const a=cocoDomain[i]*scale*ease,b=mapleDomain[i]*scale*ease;box(ctx,x,base-a,52,a,C.orange,undefined,6);box(ctx,x+63,base-b,52,b,C.green,undefined,6);label(ctx,cocoDomain[i].toFixed(2),x+26,base-a-15,13,C.orange,'center');label(ctx,mapleDomain[i].toFixed(2),x+89,base-b-15,13,C.green,'center');label(ctx,name,x+57,292,15,C.ink,'center');if(i===0){line(ctx,x-4,base-a-33,x+119,base-b-33,C.purple,1.5);label(ctx,'持平',x+57,base-a-50,12,C.purple,'center');}});
      }else{
        const left=184,scale=5.86;
        for(let tick=0;tick<=100;tick+=25){line(ctx,left+tick*scale,57,left+tick*scale,263,C.border,1);label(ctx,String(tick),left+tick*scale,286,12,C.muted,'center');}
        transfer.forEach((row,i)=>{const y=79+i*62;label(ctx,row.name,left-20,y+15,16,C.ink,'right');box(ctx,left,y,586,30,'#f7eff3',undefined,7);box(ctx,left,y,row.value*scale*ease,30,i===2?C.green:C.blue,undefined,7);label(ctx,row.value.toFixed(2),left+row.value*scale*ease+12,y+15,16,C.ink);});
        box(ctx,812,53,216,235,'#fff5f8',C.border,16);label(ctx,'胜出目标数',920,78,12,C.muted,'center');
        for(let i=0;i<10;i++){const x=854+(i%2)*71,y=104+Math.floor(i/2)*26;ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(ease-i*.035)*1.5));box(ctx,x,y,58,16,i<8?C.green:C.light,undefined,5);ctx.restore();}
        label(ctx,'8 / 10',920,262,27,C.green,'center');
      }
      ctx.restore();ctx.restore();
    }} />
    {claim === 0 && <>
      <Notice tone="green"><strong>证据支持设计价值：</strong>独立双分支 HM 为 77.90，耦合后的 MaPLe 为 78.55。深层文字提示本身也是很强的基线；不能把所有收益都归给某一个组件。</Notice>
      <div style={{overflowX:'auto'}}><table><caption style={{textAlign:'left',margin:'12px 0'}}>Table 1 · 11 数据集汇总 HM（%）</caption><thead><tr><th scope="col">提示设计</th><th scope="col">HM</th></tr></thead><tbody>{ablations.map(row=><tr key={row.name}><th scope="row">{row.name}</th><td>{row.value.toFixed(2)}</td></tr>)}</tbody></table></div>
      <Notice tone="orange"><strong>控制变量检查：</strong>Table 7 中深层单分支基线为 12 层、长度 4；独立双分支为 12 层、长度 2。标准 MaPLe 为 9 层、长度 2。各行并非只改变一个因素，因此 0.65 个百分点不是耦合机制的严格因果分解。</Notice>
      <details><summary>独立分支真的完全不互动吗？</summary><p>独立 V-L 提示仍受到同一个分类损失的约束。MaPLe 增加的是提示参数之间的显式函数依赖 P̃_i=F_i(P_i)，不能把“没有显式耦合”讲成“没有共同训练目标”。</p></details>
      <p className="maple-source">来源：Table 1、Table 7 与 §4.1。柱形使用完整 0–100 刻度。</p>
    </>}
    {claim === 1 && <>
      <Legend items={[{label:'Co-CoOp',color:C.orange},{label:'MaPLe',color:C.green}]} />
      <Notice tone="orange"><strong>“处处最好”被反例否定：</strong>ImageNetV2 上 MaPLe 与 Co-CoOp 都是 64.07；CoOp 为 64.20，比二者略高。其余三个目标域，MaPLe 高于 Co-CoOp。</Notice>
      <div style={{overflowX:'auto'}}><table><caption style={{textAlign:'left',margin:'12px 0'}}>Table 5 · ImageNet 源模型直接迁移（%）</caption><thead><tr><th scope="col">目标域</th><th scope="col">Co-CoOp</th><th scope="col">MaPLe</th></tr></thead><tbody>{domains.map((name,i)=><tr key={name}><th scope="row">ImageNet-{name}</th><td>{cocoDomain[i].toFixed(2)}</td><td>{mapleDomain[i].toFixed(2)}</td></tr>)}</tbody></table></div>
      <p>比较对象也很重要：Table 3 中，MaPLe 在 11/11 个数据集的新类别上超过 Co-CoOp，却只在 6/11 个数据集超过原始 CLIP。</p>
      <p className="maple-source">来源：Table 5、Table 3。域泛化不使用目标数据训练；本图中的 V2 是 ImageNetV2。</p>
    </>}
    {claim === 2 && <>
      <Notice tone="green"><strong>支持平均迁移能力改善：</strong>10 个目标数据集的平均准确率为 66.30，高于 Co-CoOp 的 65.74。MaPLe 超过 Co-CoOp 的目标数据集数量为 8/10；右侧格子只表示数量，不对应具体数据集顺序。</Notice>
      <div style={{overflowX:'auto'}}><table><caption style={{textAlign:'left',margin:'12px 0'}}>Table 4 · 10 个目标数据集的平均准确率（%）</caption><thead><tr><th scope="col">方法</th><th scope="col">平均准确率</th></tr></thead><tbody>{transfer.map(row=><tr key={row.name}><th scope="row">{row.name}</th><td>{row.value.toFixed(2)}</td></tr>)}</tbody></table></div>
      <Notice tone="orange"><strong>这里换了训练设置：</strong>源模型在 ImageNet 全部 1000 类上按每类 16 张训练，使用 J=3、2 epochs、学习率 0.0026，再直接测试目标数据。不能把这里的平均准确率和 Base-to-new 的 HM 当成同一个指标相减。</Notice>
      <p className="maple-source">来源：Table 4、§4.1。平均提升不意味着每个目标数据集都提升。</p>
    </>}
    <details><summary>把结论带到新任务前，保留哪些边界？</summary><p>论文的主要实验是 CLIP ViT-B/16 上的 16-shot 二维图像分类。它没有直接验证三维点云分割、任意其他骨干或所有少样本数量。更强的类间可分性与分布差异分析是支持性证据，也不能单独证明泛化改善的因果机制。</p><p>作者对“罕见概念更受益”的解释带有推测性质，并没有直接测量 CLIP 预训练图文数据中的类别出现频率。</p></details>
    <p><a href="https://arxiv.org/abs/2210.03117" target="_blank" rel="noreferrer">阅读原论文</a> · <a href="https://github.com/muzairkhattak/multimodal-prompt-learning" target="_blank" rel="noreferrer">官方项目与代码</a></p>
  </Lab>;
}
