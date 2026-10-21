import React,{useState} from 'react';

type Quiz={type:'single'|'judge'|'multiple'|'match'|'fill'|'sort';prompt:string;choices?:string[];answer:string|string[];explanation:string;anchor:string;pairs?:string[][];items?:string[]};
const bank:Record<number,Quiz[]> = {
  "1": [
    {
      "type": "single",
      "prompt": "论文想优先缓解视频—文本预训练的哪项数据难题？",
      "choices": [
        "视频没有帧",
        "人工描述稀疏且标注成本高",
        "文本编码器无法训练"
      ],
      "answer": "人工描述稀疏且标注成本高",
      "explanation": "LaViLa 从有限人工 narration 扩展密集监督；视频本身并不缺少帧。",
      "anchor": "p1 Introduction；p2 Figure 2"
    },
    {
      "type": "judge",
      "prompt": "ASR 语音转录一定与当前画面中的动作对齐。",
      "choices": [
        "正确",
        "错误"
      ],
      "answer": "错误",
      "explanation": "说话内容可能与当前视觉动作不对应。",
      "anchor": "p2 Introduction；Figure 2"
    }
  ],
  "2": [
    {
      "type": "single",
      "prompt": "Dual Encoder 为什么把视频和文本投到共享空间？",
      "choices": [
        "让同一片段与其描述更接近",
        "直接生成新视频",
        "跳过文本数据"
      ],
      "answer": "让同一片段与其描述更接近",
      "explanation": "对比学习比较成对和不成对的嵌入相似度。",
      "anchor": "p3 §3, Eq.(1)"
    },
    {
      "type": "single",
      "prompt": "一个 batch 的相似度矩阵中，通常哪一类格子是正配对？",
      "choices": [
        "任意非对角线",
        "视频 i 与对应文本 i 的对角线",
        "最大长度文本所在列"
      ],
      "answer": "视频 i 与对应文本 i 的对角线",
      "explanation": "成对视频与其文本沿对角线对应。",
      "anchor": "p3 §3, Eq.(1)"
    }
  ],
  "3": [
    {
      "type": "match",
      "prompt": "把模型与它的输入/任务配对。",
      "pairs": [
        [
          "Narrator",
          "看视频生成描述"
        ],
        [
          "Rephraser",
          "读文字做改写"
        ],
        [
          "Dual Encoder",
          "学习视频—文本表征"
        ]
      ],
      "answer": [],
      "explanation": "生成监督与学习表征是不同阶段。",
      "anchor": "p3 §4；p4 Figure 4"
    },
    {
      "type": "single",
      "prompt": "最后用于下游视频理解表征的是哪个模块？",
      "choices": [
        "Narrator",
        "Rephraser",
        "Dual Encoder"
      ],
      "answer": "Dual Encoder",
      "explanation": "Narrator/Rephraser 是训练监督生成器，最终对比训练的是双编码器。",
      "anchor": "p3 §4；p5 §4.3"
    }
  ],
  "4": [
    {
      "type": "single",
      "prompt": "Narrator 的 cross-attention 在生成时让语言模型使用什么？",
      "choices": [
        "视觉特征",
        "仅文件名",
        "测试集标签"
      ],
      "answer": "视觉特征",
      "explanation": "文本 token 作为 query 读取视频编码特征。",
      "anchor": "p4 §4.1；Figure 4"
    },
    {
      "type": "fill",
      "prompt": "论文默认 nucleus sampling 的 top-p 是多少？填小数。",
      "answer": "0.95",
      "explanation": "论文实验配置报告 p=0.95、K=10。",
      "anchor": "p5 Experiments"
    }
  ],
  "5": [
    {
      "type": "match",
      "prompt": "区分两个 Narrator 操作。",
      "pairs": [
        [
          "Recaption",
          "重述已有标注片段"
        ],
        [
          "Pseudo Caption",
          "为未标注区间补描述"
        ]
      ],
      "answer": [],
      "explanation": "区别在取样位置；二者都用 Narrator 生成。",
      "anchor": "p4–5 §4.1"
    },
    {
      "type": "fill",
      "prompt": "论文实验中，伪描述相似度过滤阈值是多少？",
      "answer": "0.5",
      "explanation": "论文使用基线双编码器的相似度，并在实验中取阈值 0.5。",
      "anchor": "p5 §4.1 Post-processing"
    }
  ],
  "6": [
    {
      "type": "judge",
      "prompt": "Rephraser 必须直接读取视频帧才能改写文字。",
      "choices": [
        "正确",
        "错误"
      ],
      "answer": "错误",
      "explanation": "它是 text-to-text 模型，输入已有 narration。",
      "anchor": "p5 §4.2；p4 Figure 4"
    },
    {
      "type": "multiple",
      "prompt": "Rephraser 能给训练监督带来什么？",
      "choices": [
        "措辞多样性",
        "在已有片段上增加文字变体",
        "保证每句都与视频完全一致"
      ],
      "answer": [
        "措辞多样性",
        "在已有片段上增加文字变体"
      ],
      "explanation": "改写扩大语言表达，但仍需注意语义漂移和质量。",
      "anchor": "p3 Figure 3；p5 §4.2"
    }
  ],
  "7": [
    {
      "type": "single",
      "prompt": "为什么提前缓存生成的视频—文本对？",
      "choices": [
        "避免每次双编码器训练都运行生成模型",
        "让测试集标签自动增加",
        "把视频删掉"
      ],
      "answer": "避免每次双编码器训练都运行生成模型",
      "explanation": "论文明确把生成结果预先缓存，以免预训练时增加生成开销。",
      "anchor": "p5 §4.3"
    },
    {
      "type": "judge",
      "prompt": "LaViLa 训练完成后，双编码器仍须每步在线调用 Narrator 才能编码视频。",
      "choices": [
        "正确",
        "错误"
      ],
      "answer": "错误",
      "explanation": "生成模型服务于监督扩展；双编码器单独学习表征。",
      "anchor": "p5 §4.3"
    }
  ],
  "8": [
    {
      "type": "multiple",
      "prompt": "论文评价覆盖哪些视频视角？",
      "choices": [
        "第一人称",
        "第三人称",
        "仅静态图像"
      ],
      "answer": [
        "第一人称",
        "第三人称"
      ],
      "explanation": "Ego4D/EK-100/EGTEA 与 CharadesEgo/HowTo100M 相关任务涵盖两类视角。",
      "anchor": "p1 Figure 1；p5 Table 1"
    },
    {
      "type": "match",
      "prompt": "把评测缩写与含义配对。",
      "pairs": [
        [
          "ZS",
          "零样本"
        ],
        [
          "FT",
          "微调"
        ],
        [
          "LP",
          "线性探测"
        ]
      ],
      "answer": [],
      "explanation": "协议不同，不能把数值当成同一条横向排行榜。",
      "anchor": "p5 Table 1"
    }
  ],
  "9": [
    {
      "type": "judge",
      "prompt": "在 Figure 5 报告的四个指标上，LaViLa 使用较少人工标注时仍能超过只用人工标注的基线。",
      "choices": [
        "正确",
        "错误"
      ],
      "answer": "正确",
      "explanation": "论文在 10%、20%、50%、100% 预算点绘出相应曲线。",
      "anchor": "p7 Figure 5"
    },
    {
      "type": "single",
      "prompt": "Figure 5 最适合支持什么结论？",
      "choices": [
        "所有数据集都只需 10% 标注",
        "在论文设定的预算与指标内，生成监督有帮助",
        "标注数据永远没有价值"
      ],
      "answer": "在论文设定的预算与指标内，生成监督有帮助",
      "explanation": "该图证据有具体数据集、预算与评测指标边界。",
      "anchor": "p7 Figure 5；p8 §5.3"
    }
  ],
  "10": [
    {
      "type": "multiple",
      "prompt": "哪些来源共同用于论文的双编码器训练？",
      "choices": [
        "原始视频—描述对",
        "Narrator 生成对",
        "Rephraser 改写对",
        "随机错误标签"
      ],
      "answer": [
        "原始视频—描述对",
        "Narrator 生成对",
        "Rephraser 改写对"
      ],
      "explanation": "训练集合写作 (X,Y) ∪ (X′,Y′) ∪ (X,Y″)。",
      "anchor": "p3 §4；p5 §4.3"
    },
    {
      "type": "sort",
      "prompt": "按论文流程排列四个步骤。",
      "items": [
        "训练 Narrator",
        "生成／改写描述",
        "筛选并缓存配对",
        "训练 Dual Encoder 与下游评测"
      ],
      "answer": [
        "训练 Narrator",
        "生成／改写描述",
        "筛选并缓存配对",
        "训练 Dual Encoder 与下游评测"
      ],
      "explanation": "先利用人工对训练生成器，再扩展并缓存监督，最后训练表征模型。",
      "anchor": "p3 §4；p4–5 §§4.1–4.3"
    }
  ]
};

function Question({q,index}:{q:Quiz;index:number}){
  const [chosen,setChosen]=useState<string[]>([]);
  const [typed,setTyped]=useState('');
  const [matches,setMatches]=useState<Record<string,string>>({});
  const [order,setOrder]=useState<string[]>(()=>q.items?[...q.items].reverse():[]);
  const [result,setResult]=useState<boolean|null>(null);
  const submit=()=>{
    let ok=false;
    if(q.type==='single'||q.type==='judge')ok=chosen[0]===q.answer;
    if(q.type==='fill')ok=typed.trim().toLowerCase()===String(q.answer).toLowerCase();
    if(q.type==='multiple')ok=JSON.stringify([...chosen].sort())===JSON.stringify([...(q.answer as string[])].sort());
    if(q.type==='match')ok=(q.pairs||[]).every(([l,r])=>matches[l]===r);
    if(q.type==='sort')ok=JSON.stringify(order)===JSON.stringify(q.answer);
    setResult(ok);
  };
  const options=q.choices||[];
  const toggle=(x:string)=>{setChosen(q.type==='multiple'?(chosen.includes(x)?chosen.filter(y=>y!==x):[...chosen,x]):[x]);setResult(null);};
  const move=(i:number,d:number)=>{const j=i+d;if(j<0||j>=order.length)return;const v=[...order];[v[i],v[j]]=[v[j],v[i]];setOrder(v);setResult(null);};
  return <details className="lv-quiz-card"><summary>小测 {index+1} · {q.prompt}</summary><div className="lv-quiz-body">
    {(q.type==='single'||q.type==='judge'||q.type==='multiple')&&<div className="lv-controls">{options.map(x=><button key={x} className={chosen.includes(x)?'lv-option selected':'lv-option'} aria-pressed={chosen.includes(x)} onClick={()=>toggle(x)}>{q.type==='multiple'?'□ ':''}{x}</button>)}</div>}
    {q.type==='fill'&&<input className="lv-input" aria-label="填写答案" value={typed} onChange={e=>{setTyped(e.target.value);setResult(null);}} placeholder="输入小数"/>}
    {q.type==='match'&&<div className="lv-match-list">{(q.pairs||[]).map(([l])=><label key={l}>{l}<select value={matches[l]||''} onChange={e=>{setMatches({...matches,[l]:e.target.value});setResult(null);}}><option value="">请选择</option>{(q.pairs||[]).map(([,r])=><option key={r} value={r}>{r}</option>)}</select></label>)}</div>}
    {q.type==='sort'&&<ol className="lv-sort-list">{order.map((x,i)=><li key={x}><span>{x}</span><button aria-label={`将${x}上移`} disabled={i===0} onClick={()=>move(i,-1)}>↑</button><button aria-label={`将${x}下移`} disabled={i===order.length-1} onClick={()=>move(i,1)}>↓</button></li>)}</ol>}
    <button className="lv-action" onClick={submit}>检查答案</button>
    {result!==null&&<div className={result?'lv-feedback good':'lv-feedback bad'}>{result?'答对了。':'再想一想。'} {q.explanation}<span className="lv-anchor">论文线索：{q.anchor}</span></div>}
  </div></details>;
}
export const ChapterQuiz:React.FC<{chapterId:string;moduleId:string}>=({chapterId})=>{
  const n=Number(chapterId.replace('chap-',''));
  return <div className="lv-quiz"><p className="lv-small">自由点开任意题目。答错不会扣分，也不会影响章节切换。</p>{(bank[n]||[]).map((q,i)=><Question key={i} q={q} index={i}/>)}</div>;
};
