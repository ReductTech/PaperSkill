import {CerWorkbench} from './cer-workbench';

import {Panel,Hint} from './lab-ui';
import { useRef, useState } from 'react';
import { Scene, Palette as P, box, line, label } from './omni-kit';
const widths=[768,512,384] as const;
const results={dense:[{cer:.0897,param:'115.29M'},{cer:.1745,param:'96.13M'},{cer:.2767,param:'88.72M'}],moe:[{cer:.0900,param:'317.05M 总量 / 115.33M 激活'},{cer:.1265,param:'261.32M 总量 / 96.17M 激活'},{cer:.3280,param:'240.04M 总量 / 88.75M 激活'}]};
export function Ch10Main(){
 const [variant,setVariant]=useState<'dense'|'moe'>('dense');const [width,setWidth]=useState<number>(768);const [started,setStarted]=useState(true);const start=useRef<number|null>(null);
 const resetAnimation=()=>{setStarted(true);start.current=null;};
 const values=results[variant];const chosen=values[widths.findIndex(w=>w===width)];
 return <Panel chapter={10} state={JSON.stringify({实验:'论文表2',变体:variant,宽度:width,CER:chosen.cer,参数标签:chosen.param})}>
  <div className="ctrl" style={{display:'flex',flexWrap:'wrap',gap:8}}>{(['dense','moe'] as const).map(v=><button className="chip" key={v} aria-pressed={variant===v} onClick={()=>{setVariant(v);resetAnimation();}}>{v==='dense'?'Dense':'MoE'}</button>)}<Hint text="选择论文实际测试的 Talker 隐藏宽度。宽度减小可以减少参数，但表 2 中内容一致性误差增大；这不是音质分数。"><label>Talker 宽度 <select value={width} onChange={e=>{setWidth(Number(e.target.value));resetAnimation();}}>{widths.map(w=><option key={w}>{w}</option>)}</select></label></Hint><button onClick={()=>{setVariant('dense');setWidth(768);resetAnimation();}}>重置</button></div>
  <div className="lab-card"><strong>表 2 · 同轴 CER 对比（0–0.35）</strong>{values.map((v,i)=><div key={widths[i]} style={{display:'grid',gridTemplateColumns:'80px 1fr 65px',gap:10,alignItems:'center',margin:'16px 0'}}><button aria-pressed={width===widths[i]} onClick={()=>{setWidth(widths[i]);resetAnimation();}}>{widths[i]}</button><div role="button" tabIndex={0} aria-label={`查看 ${widths[i]} 宽度的实验依据`} onClick={()=>setWidth(widths[i])} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setWidth(widths[i]);}}} style={{height:26,background:'#edf2f7',cursor:'pointer'}}><div style={{height:'100%',width:`${v.cer/.35*100}%`,background:width===widths[i]?'#27446e':'#aabed3',transition:'width .8s ease, background .4s'}}/></div><strong>{v.cer.toFixed(4)}</strong></div>)}<div className="lab-grid shot-enter" key={variant+width}><div><div className="lab-note">当前检查点</div><strong>{variant} · {width}</strong><p>{chosen.param}</p></div><div><div className="lab-note">相对本变体 768 宽度的 CER 增量</div><div className="lab-metric">+{(chosen.cer-values[0].cer).toFixed(4)}</div><p>由表 2 数据相减，越大表示转录一致性误差增加。</p></div></div></div>
  <details className="lab-card" style={{marginTop:12}}><summary style={{cursor:"pointer"}}>展开精确数据表与参数标签</summary><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><caption>表 2 · {variant==='dense'?'Dense':'MoE'} 内部一致性评估</caption><thead><tr><th>宽度</th><th>平均 CER ↓</th><th>检查点参数标签</th></tr></thead><tbody>{values.map((v,i)=><tr key={widths[i]} style={{fontWeight:width===widths[i]?700:400}}><td>{width===widths[i]?'▶ ':''}{widths[i]}</td><td>{v.cer.toFixed(4)}</td><td>{v.param}</td></tr>)}</tbody></table></div></details>
  <div className="lab-card" style={{marginTop:14}} aria-label="当前实验的证据卡"><strong>证据卡 · {variant === 'dense' ? 'Dense' : 'MoE'} / {width}</strong><div className="lab-grid"><div><span className="lab-eyebrow">比较对象</span><p>生成语音的 ASR 转录 ↔ 同次 Thinker 输出文字</p></div><div><span className="lab-eyebrow">数值与方向</span><p>CER {chosen.cer.toFixed(4)}，越低表示本协议的内容更一致。</p></div><div><span className="lab-eyebrow">结论边界</span><p>不能证明音色自然或答案事实正确；参数保留检查点标签。</p></div></div><a href="https://arxiv.org/pdf/2605.03937v1#page=8" target="_blank" rel="noreferrer">查看论文 p8 表 2 ↗</a></div>
  <div className="feedback" aria-live="polite">当前 {variant==='dense'?'Dense':'MoE'} / {width}：平均 CER {chosen.cer.toFixed(4)}。{started?'横柱呈现论文数据，动画时长不表示模型耗时。':'点击柱条查看对应实验与评估口径。'} 两个变体均在所测 768 宽度取得最低平均 CER。</div>
  <p>CER 是字符错误率：把生成语音交给 Qwen3-ASR-Flash 转录，再与 Thinker 文字比较。越低表示此协议下内容更一致，不说明声音更自然。</p>
  <p>参数栏保留表 2 检查点标签；MoE 总参数与激活参数不同。约 0.1B 不包含所有冻结的外部组件；表 6 的组件拆分口径不能直接替换表 2 标签。</p>
  <p><a href="https://arxiv.org/pdf/2605.03937v1#page=8" target="_blank" rel="noreferrer">来源：PDF 第 8 页表 2；第 13 页表 6</a>。这些结果不保证未测试场景下的表现。</p>
 <CerWorkbench/></Panel>;
}
