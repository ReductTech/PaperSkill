import React,{useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,MetricsTable,Source} from '../components/Evidence';
const configs=[
 {d:512,c:250,fd:'89.51',ds:'0.50'},
 {d:256,c:500,fd:'62.69',ds:'0.49'},
 {d:200,c:640,fd:'60.75',ds:'0.48'},
 {d:160,c:800,fd:'59.43',ds:'0.49'},
];
export const Ch2WaveformPatchify:React.FC<WidgetProps>=()=>{
 const [d,setD]=useState(200);const current=configs.find(c=>c.d===d)!;
 return <div className="widget-container">
 <Choices label="每 token 采样点数" value={d} onChange={setD} options={configs.map(c=>({value:c.d,label:'D='+c.d+(c.d===200?' · 默认':'')}))}/>
 <div className="evidence-panel" aria-live="polite">
 <p className="evidence-flow">128,000 个采样点 → {current.c} 行 × {d} 个采样点</p>
 <div className="patch-grid" aria-hidden="true">{Array.from({length:4},(_,i)=><div key={i}>{Array.from({length:8},(_,j)=><span key={j}>{j===7?'…':i*d+j}</span>)}</div>)}</div>
 <p>索引网格为局部示意：每一行是一个 token，保留其中所有采样点。</p>
 <p>每 token {d/16} ms；音频自注意力 C² 项相对 D=200 为 {(current.c/640)**2} 倍。</p>
 </div>
 <MetricsTable caption="Table 3 · 3M 数据规模（统一比较）"
 headers={['D','C','FDPaSST ↓','DeSync ↓']} rows={configs.map(c=>[String(c.d),c.c,c.fd,c.ds])} highlight={String(d)}/>
 <div className="widget-feedback good">较大的 D 增加单 token 建模难度，分块本身仍无损。D=160 相比 200 的 C² 项增加 56.25%，不能直接视为整网计算量增长。时长不是实测同步精度。</div>
 <Source>第 9 页 Table 3：WavFlow-M-16k，3M 数据规模，VGGSound-Test。第 18–19 页 Appendix D：补零并在重组时截去填充。</Source>
 </div>;
};
export default Ch2WaveformPatchify;
