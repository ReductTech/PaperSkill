import ModelMark from "./review/ModelMark";
import "./chapter-handoff.css";

const HANDOFFS = [
  { result: "旧图与标签可以回放，整组历史响应仍未被记录。", question: "怎样把响应的偏离变成可优化的损失？", action: "比较概率与原始分数", object: "response" },
  { result: "DER 直接匹配 logits，历史目标在比较时保持固定。", question: "过去的 logits 从哪里来，需要保存旧模型吗？", action: "追踪历史监督的来源", object: "snapshot" },
  { result: "记录已走过冻结、写入与回放；数据流仍在继续。", question: "记忆只有有限槽位，哪些记录能继续留下？", action: "观察在线选留", object: "memory" },
  { result: "在线记忆与联合更新，构成了 DER 的训练闭环。", question: "输入视图改变、历史目标可能出错时怎么办？", action: "探索增强与标签监督", object: "views" },
  { result: "输入、历史响应与标签监督，现在可以协同工作。", question: "从空记忆开始，这些部件怎样跨轮接力？", action: "走进四轮算法工作台", object: "state" },
  { result: "完整执行说明了方法怎样运行，效果仍需实验检验。", question: "哪些证据支持收益，结论又受哪些条件限制？", action: "阅读实验与方法边界", object: "evidence" },
] as const;

export default function ChapterHandoff({ index, nextId, nextTitle }: { index: number; nextId: string; nextTitle: string }) {
  const item = HANDOFFS[index];
  if (!item) return null;
  return <aside className="chapter-handoff front-handoff" aria-label={`下一节：${nextTitle}`}>
    <div className="handoff-object" data-object={item.object} aria-hidden="true">
      {item.object === "response" || item.object === "views" ? <><ModelMark /><span className="handoff-mini-bars"><i /><i /><i /></span></> :
       item.object === "snapshot" ? <><span className="handoff-symbol">z</span><span className="handoff-vector"><i>2</i><i>1</i><i>0</i></span></> :
       item.object === "memory" ? <span className="handoff-slots"><ModelMark /><i>?</i></span> :
       item.object === "state" ? <span className="handoff-state"><i>θ</i><i>M</i><i>N</i></span> :
       <span className="handoff-evidence"><i /><i /><i /></span>}
    </div>
    <div className="handoff-copy"><p className="handoff-kicker">接下来 · {String(index+2).padStart(2,"0")} {nextTitle}</p><p className="handoff-result">{item.result}</p><h3>{item.question}</h3></div>
    <a className="handoff-link" href={`#${nextId}`}>{item.action}<span aria-hidden="true">→</span></a>
  </aside>;
}
