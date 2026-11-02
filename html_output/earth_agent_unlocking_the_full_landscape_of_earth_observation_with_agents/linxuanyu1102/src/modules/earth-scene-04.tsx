import React,{useState} from 'react';
import {C,Notebook,ToolIcon,Feedback,SymbolHint} from './earth-kit';
export function EarthScene04(){const [file,setFile]=useState('missing');const [bands,setBands]=useState('swapped');const [result,setResult]=useState<{valid:boolean;value:number}|null>(null);
 const update=(kind:string,value:string)=>{if(kind==='file')setFile(value);else setBands(value);setResult(null)};
 const submit=()=>{const red=bands==='correct'?.2:.6,nir=bands==='correct'?.6:.2;setResult({valid:file==='valid',value:(nir-red)/(nir+red)})};
 return <div className="ea-page">
 <div style={{display:'grid',gridTemplateColumns:'530px 914px',gap:28,height:490}}>
  <div style={{padding:'8px 14px'}}>
   <h3 className="ea-heading">POMDP：底层状态并不完全可见</h3>
   <p>智能体看不到环境里的全部文件、栅格值与处理状态，只能根据工具返回的观测继续判断。</p>
   <div className="ea-equation" style={{fontSize:28,margin:'18px 0'}}>
    ⟨<SymbolHint meaning="g：任务目标。">g</SymbolHint>，<SymbolHint meaning="S：隐藏的环境状态，例如可用文件和栅格数据。">S</SymbolHint>，<SymbolHint meaning="A：可执行动作，也就是工具调用。">A</SymbolHint>，<SymbolHint meaning="O：工具返回的文本、数值或图像观测。">O</SymbolHint>，<SymbolHint meaning="T：动作作用于环境后产生状态变化的转移函数。">T</SymbolHint>⟩
   </div>
   <p><strong>执行失败：</strong>虚构文件让工具无法读取输入。</p>
   <p><strong>科学参数错误：</strong>文件存在，但 Red / NIR 传反，仍可能返回含义错误的数值。</p>
   <p className="ea-note" style={{fontSize:19}}>以下是合成数据：工具返回是观测，不等于完整真实状态。</p>
   <svg viewBox="0 0 480 100" style={{width:480,height:100}}><ToolIcon kind={0} x={240} y={52} size={.75}/></svg>
  </div>
  <div className="ea-panel" style={{padding:'26px 34px'}}>
   <h3 className="ea-heading">NDVI 测量单</h3>
   <label style={{display:'flex',alignItems:'center',gap:20,marginBottom:18}}>文件<select aria-label="测量文件" value={file} onChange={e=>update('file',e.target.value)}><option value="missing">虚构的 river-new.tif</option><option value="valid">已观察到的 river.tif</option></select></label>
   <label style={{display:'flex',alignItems:'center',gap:20}}>波段<select aria-label="波段参数配对" value={bands} onChange={e=>update('bands',e.target.value)}><option value="swapped">交换：Red=.60，NIR=.20</option><option value="correct">正确：Red=.20，NIR=.60</option></select></label>
   <div style={{display:'flex',alignItems:'center',gap:28,marginTop:24}}><button onClick={submit}>提交工具调用</button><span style={{color:result?.valid?C.green:result?C.red:C.muted}}>{!result?'等待校验':result.valid?'文件读取成功':'文件不存在：拒绝执行'}</span></div>
   <svg viewBox="0 0 820 176" style={{width:820,height:176,marginTop:12}} aria-label="测量返回值"><rect x="4" y="8" width="812" height="154" rx="16" fill={result?.valid?'#edf6ee':'#f3f5f7'}/><text x="32" y="59" fontSize="28" fill={C.blue}>工具返回</text><text key={String(result?.value)+String(result?.valid)} className="ea-write" x="32" y="126" fontSize="44" fill={!result?C.muted:result.valid?C.green:C.red}>{!result?'等待调用':result.valid?'NDVI = '+result.value.toFixed(2):'无法计算'}</text>{result?.valid&&<text x="460" y="104" fontSize="28" fill={bands==='correct'?C.green:C.red}>{bands==='correct'?'输入含义与目标一致':'数值可算，含义传反'}</text>}</svg>
  </div>
 </div>
 <Feedback tone={!result?'blue':!result.valid||bands==='swapped'?'red':'green'}>{!result?'试着先修复文件，再核对波段，观察“能执行”与“算对了”的区别。':!result.valid?'文件幻觉使调用无法完成；不能凭空引用历史中不存在的文件。':bands==='swapped'?'交换波段得到 −0.50。返回数值不代表任务正确，仍需核对输入的科学含义。':'正确文件与正确波段得到 0.50；这个单步演示不代表 Earth-Agent 的实测结果。'}</Feedback>
 </div>}
