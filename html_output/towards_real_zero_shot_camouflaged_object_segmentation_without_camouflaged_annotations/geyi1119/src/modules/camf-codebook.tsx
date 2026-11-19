import {useState} from 'react';
import {Feedback,Range,Term,fmt} from './camf-kit';
export function CodebookScene(){
  const [angle,setAngle]=useState(100);
  const [inference,setInference]=useState(true);
  const cosine=Math.cos((angle-30)*Math.PI/180);
  const endpoint=(degrees:number)=>[290+190*Math.cos(degrees*Math.PI/180),265-190*Math.sin(degrees*Math.PI/180)];
  const target=endpoint(30), query=endpoint(angle);
  return <div className="camf-page"><div className="camf-split"><div><svg viewBox="0 0 640 360" role="img" aria-label={`练习卡方向误差${angle-30}度`}><rect x="45" y="20" width="550" height="310" fill="#f1f5f5" stroke="#c3ced5" strokeWidth="3"/><path d={`M290 265 L${target.join(' ')}`} stroke="#228d5c" strokeWidth="10"/><path d={`M290 265 L${query.join(' ')}`} stroke="#f07e47" strokeWidth="10"/><text x="70" y="65" fill="#228d5c" fontSize="28">描述方向 I：30°</text><text x="70" y="105" fill="#92400e" fontSize="28">查询方向 Q：{angle}°</text></svg><Range label="查询向量角度" value={angle} min={0} max={180} onChange={setAngle}/></div><section className="camf-stack"><h3>方向越接近，余弦损失越小</h3><div className="camf-equation"><Term meaning="Lq：对应尺度分组特征的余弦对齐损失">Lq</Term> = 1 − <Term meaning="cos(I,Q)：caption与query非零向量的余弦相似度">cos(I,Q)</Term></div><div className="camf-big" data-testid="query-loss">{fmt(1-cosine)}</div><p>合成单尺度单位向量；论文对四个尺度取平均，与掩码损失共同优化。</p><label className="camf-check"><input type="checkbox" checked={inference} onChange={event=>setInference(event.target.checked)}/>推理阶段</label><strong>{inference?'query → 分组 Q → 解码器':'M-LLM 描述 → 分组 I → 解码器'}</strong><p>零样本：BCE 权重 1，Dice 0.5，query 损失 0.5，不使用 UAL。</p></section></div><Feedback tone={Math.abs(angle-30)<10?'green':'blue'}>{angle===30?'方向一致，教学损失为 0。':`方向差 ${angle-30}°，余弦相似度 ${fmt(cosine)}。`}码本不是逐字保存文本，而是学习可替代的语义表示。</Feedback></div>;
}
