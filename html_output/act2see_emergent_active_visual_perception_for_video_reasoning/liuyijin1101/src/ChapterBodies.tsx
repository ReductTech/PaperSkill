import type { ReactNode } from 'react';
import { chapters, type ChapterId } from './content';
import { FailureStatistics, LimitsPanel } from './Reliability';
import { CaseObservatory } from './CaseObservatory';
import { EvaluationAblation, EvaluationBenchmark } from './EvaluationResults';
import { SFTLearningLab } from './SFTLearning';
import { DemonstrationSources, DemonstrationFilter, DemonstrationComposition } from './Demonstrations';
import { InterleavedCotIntro, InterleavedCotWorkbench } from './InterleavedCotWorkbench';
import { EvidenceGapExperiment } from './EvidenceGapLab';
import { FullCupAnimation } from './EvidenceGapScene';
import { EvidenceDecisionChoice, EvidenceDecisionEvidence } from './EvidenceDecision';
import { ChannelsLab } from './VisualToolsLab';

type Subsection = { title: string; content: ReactNode };
export const chapterBodies: Record<ChapterId, readonly Subsection[]> = {
  'evidence-gap': [
    { title: '原始视频：完整动作过程', content: <div className="eg-intro-section"><p className="eg-intro">这是一段杯子被移动的视频，模型是否能找到杯子被拿起的瞬间？</p><FullCupAnimation/></div> },
    { title: '固定采样：关键帧的遗漏与覆盖', content: <><EvidenceGapExperiment/><p className="eg-conclusion">视频中真实发生过的动作，不一定出现在模型看到的采样帧里。</p><p>采样结果还受到关键动作持续时间和采样起点的影响。</p><p className="eg-transition">既然初始画面可能不够，模型能否自己决定寻找新的证据？</p></> },
  ],
  'evidence-decision': [
    { title: '视觉证据与问题需求', content: <EvidenceDecisionEvidence/> },
    { title: '三种推理路径：回答、检索与生成', content: <EvidenceDecisionChoice/> },
  ],
  'visual-tools': [
    { title: '两种视觉信息来源', content: <div className="vt-concepts"><p><strong>Retrieve</strong><span>从原视频中寻找真实存在的画面。</span></p><p><strong>Generate</strong><span>结合原视频参考帧与假设描述，生成新的假设画面。</span></p></div> },
    { title: '检索与生成的执行机制', content: <ChannelsLab/> },
  ],
  'interleaved-cot': [
    { title: '初始证据与推理缺口', content: <InterleavedCotIntro/> },
    { title: '工具调用与两轮推理', content: <InterleavedCotWorkbench/> },
  ],
  'demonstrations': [
    { title: '数据来源与轨迹生成', content: <DemonstrationSources/> },
    { title: '推理轨迹的质量筛选', content: <DemonstrationFilter/> },
    { title: '最终训练集的组成', content: <DemonstrationComposition/> },
  ],
  'sft-learning': [
    { title: '训练示范与模型输出', content: <SFTLearningLab/> },
  ],
  'evaluation': [
    { title: '五项视频推理基准对比', content: <EvaluationBenchmark/> },
    { title: '工具示范的消融分析', content: <EvaluationAblation/> },
    { title: '实验发现与证据边界', content: <div className="evaluation-conclusions"><p><strong>整体趋势：</strong>同一基座模型在五项基准上均有提升。</p><p><strong>消融线索：</strong>工具调用示范的组合有助于改善本组消融结果，但不能据此认定两种工具在每个问题上都有贡献，也不能把组间差异当作已证明的独立因果效应。</p><p><strong>解释边界：</strong>这些实验不能保证所有生成画面都可靠，也不能直接证明部署延迟和计算成本更低。</p><p className="evaluation-transition">数字说明了整体趋势，接下来看看模型实际怎样检索或生成画面。</p></div> },
  ],
  'cases': [
    { title: '主动视觉行为的实际表现', content: <CaseObservatory/> },
  ],
  'reliability': [
    { title: '生成画面的错误类型', content: <FailureStatistics/> },
    { title: '方法局限与适用边界', content: <LimitsPanel/> },
  ],
};

if (chapters.some(chapter => !chapterBodies[chapter.id]) || Object.keys(chapterBodies).length !== chapters.length) {
  throw new Error('Chapter body registry does not match chapter configuration');
}
