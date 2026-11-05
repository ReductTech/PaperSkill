import React,{useEffect,useState} from 'react';
import {C,Chips,Feedback} from './coop-kit';
import {useAnimatedNumbers} from './motion-hooks';
import './learning-visuals.css';
const results:[string,number][]=[['ImageNet',4.77],['Caltech101',5.54],['OxfordPets',1.24],['StanfordCars',17.75],['Flowers102',28.37],['Food101',-2.64],['FGVCAircraft',13.98],['SUN397',10.74],['DTD',21.26],['EuroSAT',45.97],['UCF101',14.25]];
export const ResultsLab:React.FC=()=>{
 const [index,setIndex]=useState(0),[progress,setProgress]=useState(1),[run,setRun]=useState(0),[answer,setAnswer]=useState(''),[k,setK]=useState('10'),[shots,setShots]=useState('16');
 const [name,gain]=results[index];
 const [shownGain]=useAnimatedNumbers([gain],900);
 useEffect(()=>{if(!run||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setProgress(1);return;}setProgress(0);let raf=0;const start=performance.now();const tick=(now:number)=>{const p=Math.min(1,(now-start)/850);setProgress(p);if(p<1)raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[run,index]);
 const selectResult=(i:number)=>{setIndex(i);setRun(0);setProgress(1);};
 const reset=()=>{setIndex(0);setRun(0);setProgress(1);setAnswer('');setK('10');setShots('16');};
 return <>
  <Chips label="查看 16-shot 结果" value={String(index)} options={results.map((r,i)=>({value:String(i),label:r[0]}))} onChange={v=>selectResult(Number(v))}/>
  <div className="ctrl"><strong>本章换了一组实验</strong><span>第 9 章使用 ViT-B/16，本章使用 RN50。它们是 CLIP 的不同图像编码器配置（也称骨干）；比较本章的方法时保持配置相同，不直接横比两章的准确率。</span></div>
  <p>本章固定：RN50、M=16、共享上下文、类别名在末尾。CoOp 用每类 16 张标注图片适配；人工提示的零样本 CLIP 不使用这些下游训练标注。柱形表示两者测试准确率相减，单位是百分点。</p>
  {index===0&&<div className="ctrl"><strong>跟算 ImageNet 这根柱</strong><span>CoOp 62.95% − 零样本 58.18% = <strong>+4.77 个百分点</strong>。</span><span>这是准确率的绝对差，来源见论文 p.11 表 5；它与图 4 的差值一致。</span></div>}
  <div className="ctrl"><button type="button" className="tiny" onClick={()=>setRun(r=>r+1)}>播放差值展开</button><button type="button" className="chip" onClick={()=>selectResult(index===5?0:5)}>{index===5?'回到 ImageNet 算例':'查看反例：Food101'}</button><button type="button" className="tiny ghost" onClick={reset}>重置本实验</button><span>{progress<1?'动画正在展开；下方始终显示最终差值。':'当前展示完整结果。'}</span></div>
  <div className="lv-stage lv-results">
   <div className="lv-result-current" style={{background:gain<0?'#9e4649':undefined}}><span>{name}</span><strong>{shownGain>=0?'+':''}{shownGain.toFixed(2)}</strong><small>准确率变化 · 百分点</small><p>{gain<0?'这一次，学习提示后反而下降。':'在这组实验条件下，学习提示带来提升。'}</p></div>
   <div className="lv-result-list" aria-label="11个数据集的准确率变化">{results.map(([label,value],i)=><button key={label} type="button" className="lv-result-row" aria-pressed={index===i} onClick={()=>selectResult(i)}><span>{label}</span><span className="lv-result-rail"><i style={{left:`${(Math.min(0,value)+5)/55*100}%`,width:`${Math.abs(value)/55*100*(1-Math.pow(1-progress,3))}%`,background:value<0?'#c55158':'#2c8b78'}}/></span><b style={{color:value<0?'#b24b50':undefined}}>{value>0?'+':''}{value.toFixed(2)}</b></button>)}</div>
  </div>
  <div className="ctrl"><strong>{name}：{gain>=0?'+':''}{gain.toFixed(2)} 个百分点</strong><span>11 项显示差值的平均：+14.66 个百分点</span></div>
  <Feedback tone={gain<0?'bad':'good'}>{gain<0?'Food101 是一个反例：在这组实验里，适配后反而下降 2.64 个百分点。论文将其与训练标签噪声联系起来，但这不是证明唯一原因的控制实验。':`${name} 在这组条件下提升 ${gain.toFixed(2)} 个百分点。它说明这一任务受益，不能推出每种数据、骨干或提示长度都受益。`} 动画只用于展示差值，不表示运行速度。</Feedback>
  <details><summary>核对全部结果与额外证据</summary>
   <p>数据来自 p.7 图 4。平均数是对图中 11 个显示差值计算的算术平均，约 14.66 个百分点。</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left'}}>数据集</th><th>准确率变化（百分点）</th></tr></thead><tbody>{results.map(([label,value])=><tr key={label}><td style={{padding:'8px',borderBottom:`1px solid ${C.line}`}}>{label}</td><td style={{textAlign:'center',color:value<0?C.red:C.ink,borderBottom:`1px solid ${C.line}`}}>{value>0?'+':''}{value.toFixed(2)}</td></tr>)}</tbody></table></div>
   <p><strong>与其他适配方法比较：</strong>p.11 表 5，ImageNet 16-shot、RN50。零样本 58.18%，线性探针 55.87%，图像编码器微调 18.28%，文本变换 58.86%，文本偏置 60.93%，CoOp 62.95%。小样本下，更多可训练参数未必更好；这组数值不能证明其他微调策略永远无效。</p>
   <p><strong>附录的实验要另读：</strong>p.12 表 7 的 DOSCO-2k 用 7 个数据集、1,600 张训练图与 400 张验证图、M=4 和人工短语初始化，并选验证集最佳检查点。ViT-B/16 的 CLIP / CoOp / CoCoOp 为 67.2 / 73.3 / 72.7%；RN50 为 60.9 / 64.7 / 65.5%。这不属于上面的每类 16 张协议，后续方法也并非在所有骨干上占优。</p>
  </details>
  <details><summary>算一算：“16-shot”到底用了多少张图？</summary>
   <p>下面只计算标注预算，不会改变上方固定的 16-shot 论文结果。</p>
   <Chips label="类别数 K" value={k} options={['10','100','1000'].map(v=>({value:v,label:v+' 类'}))} onChange={setK}/>
   <Chips label="每类图片数" value={shots} options={['1','2','4','8','16'].map(v=>({value:v,label:v+' 张/类'}))} onChange={setShots}/>
   <p role="status"><strong>{k} × {shots} = {(Number(k)*Number(shots)).toLocaleString()} 张标注训练图片</strong>。论文主实验考察 1、2、4、8、16-shot，并对 3 次运行取平均；对照零样本 CLIP 不使用这些下游训练标注。</p>
  </details>
  <p><strong>离开这一章前，选出你会写进读书报告的结论：</strong></p>
  <Chips label="我的结论" value={answer} options={[{value:'all',label:'CoOp 在所有任务中都更好'},{value:'conditional',label:'多数任务受益，但收益有条件'},{value:'zero',label:'CoOp 完全不使用任务标注'}]} onChange={setAnswer}/>
  {answer&&<p role="status" style={{color:answer==='conditional'?C.green:C.red}}>{answer==='conditional'?'这与证据相符。核心贡献是：冻结预训练模型，通过少量标注图像学习连续上下文，提升多种任务的适配效果，同时仍需检查泛化与数据质量。':answer==='all'?'回看 Food101 的负值，以及第 9 章的迁移比较。平均提升不能替代逐任务判断。':'训练 CoOp 要用下游图像及类别标签。零样本对照与少样本 CoOp 的监督预算不同。'}</p>}
  <p>继续核对：<a href="https://arxiv.org/abs/2109.01134v6" target="_blank" rel="noreferrer">论文原文</a> · <a href="https://github.com/KaiyangZhou/CoOp" target="_blank" rel="noreferrer">作者代码</a>。本教程依据用户提供的 v6 PDF；页码指该文件的页码。</p>
 </>;
};
