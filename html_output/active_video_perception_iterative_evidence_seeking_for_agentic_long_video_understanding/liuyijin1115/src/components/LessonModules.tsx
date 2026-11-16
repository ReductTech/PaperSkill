import { createContext, useContext } from 'react';
import { S6Search, S6Trace } from './S6Case';
import { QuestionLab, SamplingLab } from './S1VisualLabs';
import { S2Flow, S2Replan } from './S2Flow';
import { S3What, S3WhereHow, S3Replanning } from './S3Planner';
import { S4Observation, S4EvidenceMemory } from './S4Observer';
import { S5EvidenceGap, S5StopDecision } from './S5Reflector';
import { S7Allocation, S7Results } from './S7Efficiency';
import { S8Benchmarks, S8Results } from './S8Benchmarks';
import { S9Assembly, S9Explorer } from './S9Ablations';
import { S10Replay, S10Evidence, S10Research } from './S10Limits';

type Props = { onComplete: () => void };
type ModuleProps = Props & { id: string; chapterNumber: number };
const ModuleNumber = createContext('');

function ModuleFrame({ title, children }: { label: string; title: string; note?: string; children: React.ReactNode }) {
  const number = useContext(ModuleNumber);
  return <div className="module"><div className="module-head"><span className="num">{number}</span><h4>{title}</h4></div><div className="module-body">{children}</div></div>;
}
function Problem({ onComplete }: Props) {
  return <ModuleFrame label="" title="固定采样与证据遗漏"><SamplingLab onComplete={onComplete} /></ModuleFrame>;
}

function Environment({ onComplete }: Props) {
  return <ModuleFrame label="" title="被动描述与主动观察"><QuestionLab onComplete={onComplete} /></ModuleFrame>;
}


export function LessonModule({ id, chapterNumber, onComplete }: ModuleProps) {
  let modules: React.ReactElement[];
  switch (id) {
    case 'problem': modules = [<Problem onComplete={onComplete}/>, <Environment onComplete={onComplete}/>]; break;
    case 'loop': modules = [<ModuleFrame label="" title="三模块协作"><S2Flow onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="证据反馈与再次观察"><S2Replan onComplete={onComplete}/></ModuleFrame>]; break;
    case 'planner': modules = [<ModuleFrame label="" title="问题条件化的观察目标"><S3What onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="时间区间与采样粒度"><S3WhereHow onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="历史反馈与重新规划"><S3Replanning onComplete={onComplete}/></ModuleFrame>]; break;
    case 'observer': modules = [<ModuleFrame label="" title="定向视频观察"><S4Observation onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="时间戳证据与工作记忆"><S4EvidenceMemory onComplete={onComplete}/></ModuleFrame>]; break;
    case 'reflector': modules = [<ModuleFrame label="" title="证据充分性与缺失信息"><S5EvidenceGap onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="置信度、迭代上限与停止"><S5StopDecision onComplete={onComplete}/></ModuleFrame>]; break;
    case 'case': modules = [<ModuleFrame label="" title="粗略搜索与精细观察"><S6Search onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="多轮执行与证据整合"><S6Trace onComplete={onComplete}/></ModuleFrame>]; break;
    case 'efficiency': modules = [<ModuleFrame label="" title="通用 Caption 与按需观察"><S7Allocation onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="推理时间与 Token 成本"><S7Results onComplete={onComplete}/></ModuleFrame>]; break;
    case 'benchmarks': modules = [<ModuleFrame label="" title="五个 Benchmark 的任务差异"><S8Benchmarks onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="主实验与 Baseline 比较"><S8Results onComplete={onComplete}/></ModuleFrame>]; break;
    case 'ablations': modules = [<ModuleFrame label="" title="三模块组件消融"><S9Assembly onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="模型配置与关键超参数"><S9Explorer onComplete={onComplete}/></ModuleFrame>]; break;
    case 'limits': modules = [<ModuleFrame label="" title="短暂事件与证据遗漏"><S10Replay onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="高置信度错误"><S10Evidence onComplete={onComplete}/></ModuleFrame>, <ModuleFrame label="" title="研究贡献与开放问题"><S10Research onComplete={onComplete}/></ModuleFrame>]; break;
    default: return null;
  }
  return <>{modules.map((module, index) => <ModuleNumber.Provider value={`${chapterNumber}.${index + 1}`} key={`${id}-${index}`}>{module}</ModuleNumber.Provider>)}</>;
}
