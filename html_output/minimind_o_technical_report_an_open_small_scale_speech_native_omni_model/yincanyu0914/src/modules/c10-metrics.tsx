import {Panel,Hint} from './lab-ui';
import { useState } from 'react';
import { Scene, Palette as P, box, line, label } from './omni-kit';
const protocols={
 consistency:{name:'英文 T2A 一致性',table:'表 4',headers:['模型','CER ↓','WER ↓'],rows:[['Mini-Omni','0.0101','0.0185'],['Mini-Omni2','0.0371','0.0431'],['MiniMind-O','0.0964','0.0973']],condition:'20 个问题、相同简短回答指令。这里是外部英文 T2A 对比，不是表 2 的内部宽度消融。',limit:'转录一致性不等于音质；ASR 和数字格式会影响错误率。',left:'生成语音转录',right:'目标文本'},
 speaker:{name:'音色相似度',table:'表 3',headers:['模型','Seen ↑','Unseen ↑','Overall ↑'],rows:[['Dense','0.6472','0.5654','0.5995'],['MoE','0.6267','0.5702','0.5937']],condition:'5 个 seen 声音、7 个 unseen 声音；使用 CAM++ 说话人相似度。',limit:'相似度反映说话人条件，不是 MOS 主观听感评分；效果依赖参考质量。',left:'生成声音特征',right:'参考说话人特征'},
 vision:{name:'视觉描述误差',table:'表 5',headers:['模型','CER ↓','WER ↓'],rows:[['MiniMind-O','0.8241','1.0293'],['Mini-Omni2','0.7609','0.9756']],condition:'仅 9 张合成图；参考由 Qwen-VL-Plus 按模型输出长度生成。',limit:'开放描述可以有多种合理说法；CER/WER 不是视觉准确率。WER 可大于 1，不能当成概率。',left:'视觉回答转录',right:'生成的参考文本'}
};
type Metric=keyof typeof protocols;
export function Ch10Metrics(){const [metric,setMetric]=useState<Metric>('consistency');const p=protocols[metric];return <Panel>
 <div className="ctrl" style={{display:'flex',flexWrap:'wrap',gap:8}}>{(Object.keys(protocols) as Metric[]).map(m=><button key={m} className="chip" aria-pressed={m===metric} onClick={()=>setMetric(m)}>{protocols[m].name}</button>)}<button onClick={()=>setMetric('consistency')}>重置</button></div>
 <div className="process-strip shot-enter" key={metric}><div className="lab-card"><span className="lab-eyebrow">被评估对象</span><strong>{p.left}</strong></div><span className="process-symbol">→</span><div className="lab-card"><span className="lab-eyebrow">比较过程</span><strong>{metric==='speaker'?'CAM++ 特征相似度':'转录与参考的编辑误差'}</strong><p>{p.right}</p></div><span className="process-symbol">→</span><div className="lab-card active"><span className="lab-eyebrow">结果如何读</span><strong>{metric==='speaker'?'相似度越高越相近':'错误率越低越一致'}</strong><p>{p.limit}</p></div></div>
 <p><strong>{p.table} · {p.condition}</strong></p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><caption>{p.name}的独立评估结果</caption><thead><tr>{p.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{p.rows.map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i}>{c}</td>)}</tr>)}</tbody></table></div>
 <div className="feedback" aria-live="polite">{p.limit} 三个协议回答不同问题，不能把数值相加或拼成一个总排行榜。</div>
 <p>CER =（替换＋删除＋插入）/ 参考字符数；WER 使用词作单位。论文没有用这些数值证明人类偏好、负载延迟或远场噪声鲁棒性。</p>
 <p><a href="https://arxiv.org/pdf/2605.03937v1#page=9" target="_blank" rel="noreferrer">来源：PDF 第 9 页表 3、4、5；第 9–10 页 §7</a>。</p>
 </Panel>;}
