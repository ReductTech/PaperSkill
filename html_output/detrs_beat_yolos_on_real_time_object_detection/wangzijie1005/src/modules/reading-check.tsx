import { useState } from 'react';
import { Feedback } from './shared-kit';

const questions = [
  { prompt:'部署时，RT-DETR 用什么选择初始查询？', choices:['按预测分类分数取 Top-300','按每个框与真实标注的 IoU 排序'], answer:0, explain:'§5.3 明确使用分类分数。真实 IoU 可用于训练和评估；实际推理没有真实标注。' },
  { prompt:'Table 5 中哪一种比较能说明无需重训的速度调节？', choices:['四层训练模型与六层训练模型比较','固定 Det6 列，比较第 5 层与第 6 层输出'], answer:1, explain:'固定同一六层训练模型：使用前五层为 53.0 AP / 8.8 ms，使用前六层为 53.1 AP / 9.3 ms。这里取第 k 层输出，不能据此保证任意删除中间层也保持性能；总体 AP 也不保证每个框都随层数增加而变好。' },
  { prompt:'R50 的整体 AP 高于 YOLOv8-L，能推出什么？', choices:['所有尺度与下游跟踪都更好','仅支持论文设置下总体 AP 的这一项比较'], answer:1, explain:'Table 2 的 R50 APs=34.8，低于 YOLOv8-L 的 35.3；论文没有报告跟踪指标。53.1 与 52.9 是作者协议下的点估计，未给出多次随机种子或置信区间，不能仅凭 0.2 个 AP 点宣称统计显著。' },
];
const sources = [
  { label:'CVPR 2024 正文：方法、主表、消融与局限',url:'https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf' },
  { label:'CVPR 官方补充：训练设置与额外预训练',url:'https://openaccess.thecvf.com/content/CVPR2024/supplemental/Zhao_DETRs_Beat_YOLOs_CVPR_2024_supplemental.pdf' },
  { label:'作者 arXiv v3：原文备用访问',url:'https://arxiv.org/pdf/2304.08069v3' },
  { label:'官方代码快照：2026-09-07，并非 2024 锁定环境',url:'https://github.com/lyuwenyu/RT-DETR/tree/29320b6fd828f8e0987a71426cf2d961b09dfed7' },
  { label:'新芽专题三：动态场景理解中的检测基础',url:'https://grokcv.site/sprouts/understanding/' },
];

export function ReadingCheck() {
  const [answers,setAnswers] = useState<(number|null)[]>([null,null,null]);
  function answer(q:number,choice:number) { setAnswers(a=>a.map((value,i)=>i===q?choice:value)); }
  return <div onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
    <p>先解释判断依据，再选择答案。反馈会指出对应的原文证据；答案只保留在当前页面。</p>
    {questions.map((q,i)=><fieldset key={q.prompt} style={{border:'1px solid #d7deea',borderRadius:12,padding:14,margin:'12px 0'}}>
      <legend style={{fontWeight:650,padding:'0 6px'}}>{i+1}. {q.prompt}</legend>
      <div className="chip-row" style={{flexWrap:'wrap'}}>{q.choices.map((choice,j)=><button key={choice} type="button" className="chip" aria-pressed={answers[i]===j}
        onClick={()=>answer(i,j)} style={answers[i]===j?{borderColor:'#228d5c',background:'#eaf3e6'}:undefined}>{choice}</button>)}</div>
      {answers[i]!==null&&<Feedback tone={answers[i]===q.answer?'good':'bad'}><strong>{answers[i]===q.answer?'判断正确。':'再检查证据。'}</strong>{q.explain}</Feedback>}
    </fieldset>)}
    <button type="button" className="chip" onClick={()=>setAnswers([null,null,null])}>重新自测</button>
    <p style={{fontWeight:650,marginTop:20}}>回到原文核对</p>
    <ul>{sources.map(s=><li key={s.url} style={{margin:'7px 0'}}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
    <p style={{fontSize:16}}>阅读时区分三类内容：论文作者报告的结果、解释机制的教学示意，以及由证据提出的分析。查询选择、解码层数和速度比较都应回到各自的训练与评测条件。</p>
  </div>;
}
