"use client";

import { Fragment, useState, type ReactNode } from "react";
import {
  ArrowRight, CircleAlert, Lightbulb, ShieldCheck,
} from "lucide-react";
import { equationOneSymbols, equationTwoSymbols } from "@/src/data/vista4d";
import { FormulaExplorer } from "@/src/modules/FormulaExplorer";
import { LearningModule } from "@/src/modules/LearningModule";
import { HeroOfficialDemo } from "@/src/modules/OfficialMedia";
import { PointCloudLab } from "@/src/modules/PointCloudLab";
import {
  ApplicationCards, CameraDeviationLab, ConditioningOverview, FinalQuiz, HeroCameraLab, HeroMethodComparison,
  FullPipelineOverview, PlaybackReview, PointCloudSourceComparison, ProblemMonitor, TemporalPersistenceLab, TrainingComparison,
} from "@/src/modules/LearningLabs";

function FlowMini({ total, current }: { total: number; current: number }) {
  return <div className="flow-mini">
    {Array.from({ length: total }).map((_, index) => {
      const section = index + 1;
      const className = section < current
        ? "flow-step done"
        : section === current
          ? "flow-step active"
          : "flow-step";

      return <Fragment key={section}>
        {index > 0 ? <span className="flow-arrow">→</span> : null}
        <div className={className} data-step={section}>§{section}</div>
      </Fragment>;
    })}
  </div>;
}

function ChapterBridge({ children }: { children: ReactNode }) {
  return <div className="chap-bridge">
    <div className="cb-icon">🔗</div>
    <div className="cb-body">
      <div className="cb-title">本节作用</div>
      <div className="cb-text">{children}</div>
    </div>
  </div>;
}

function SectionHeading({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: ReactNode }) {
  const currentSection = Number(number);
  const isTutorialSection = Number.isInteger(currentSection) && currentSection >= 1 && currentSection <= 9;

  if (!isTutorialSection) {
    return <header className="section-heading"><div className="section-kicker"><span>{number}</span>{eyebrow}</div><h2>{title}</h2><p>{children}</p></header>;
  }

  const badge = currentSection <= 3 ? "inf" : currentSection === 5 ? "trn" : "both";

  return <>
    <h2 className="chap-title">
      <span className="num">§{currentSection}.</span>
      {title}
      <span className={`badge-tag ${badge}`}>{eyebrow}</span>
    </h2>
    <FlowMini total={9} current={currentSection} />
    <ChapterBridge>{children}</ChapterBridge>
  </>;
}

function NextLesson({ label, onClick }: { label: string; onClick: () => void }) {
  return <div className="lesson-footer"><button onClick={onClick}>{label}<ArrowRight /></button></div>;
}

export function HeroSection({ onStart, started }: { onStart: () => void; started: boolean }) {
  return <section id="hero" className="hero hero-section">
    <div className="hero-inner">
      <div className="hero-venue">交互式论文教程</div>
      <h1>Vista4D: Video Reshooting with 4D Point Clouds</h1>
      <div className="hero-sub">Vista4D：基于 4D 点云的视频重拍</div>
      <p className="hero-abs">给定一段已拍摄的源视频，Vista4D 以 4D 点云显式约束场景内容与目标摄影机，并结合视频扩散先验，在用户指定的新轨迹和视点下合成保持原动态的重拍视频。</p>
      <div className="hero-meta" aria-label="论文关键词">{["视频重拍","4D 点云","摄影机控制","视频扩散模型","动态场景"].map((item) => <span className="tag" key={item}>{item}</span>)}</div>
      <HeroMethodComparison />
      {!started ? <div className="chap-loader">
        <div className="chap-loader-hint">准备好了吗？</div>
        <button className="chap-loader-btn" onClick={onStart}>开始学习 §1 <span className="chap-loader-arrow">→</span></button>
      </div> : null}
    </div>
  </section>;
}

export function SectionOne({ onNext }: { onNext: () => void }) {
  return <section id="section-1" className="chapter">
    <SectionHeading number="01" eyebrow="重拍之前 · 为何重拍" title="摄影机已经停机，镜头还能重新拍吗？">先理解视频重拍（Video Reshooting）为什么比普通视频生成更难：既要保留已有内容，又要补全未见区域，还要精确控制摄影机。</SectionHeading>
    <div className="section-one-flow">
      <LearningModule number="1.1" eyebrow="理解任务" title="什么是视频重拍" description="给定已经拍摄完成的源视频，在保持同一场景内容与动态事件的前提下，根据用户指定的新摄影机轨迹或视点，重新合成同一动态场景的新机位视频。" className="section-one-subsection">
        <div className="section-camera-lab"><HeroCameraLab /></div>
      </LearningModule>

      <LearningModule number="1.2" eyebrow="观看实际效果" title="Vista4D 能实现什么" className="section-one-subsection">
        <div className="reshoot-io" aria-label="Vista4D 视频重拍的输入、控制与输出">
          <div><span>输入</span><b>输入：已经拍摄的源视频</b></div><i>→</i>
          <div><span>控制</span><b>控制：用户指定的目标摄影机</b></div><i>→</i>
          <div><span>输出</span><b>输出：同一动态场景的新机位视频</b></div>
        </div>
        <HeroOfficialDemo />
      </LearningModule>

      <LearningModule number="1.3" eyebrow="理解核心难题" title="视频重拍为什么困难" description="依次点击三个难题，看看一次可信的视频重拍为什么同时受到这三类约束。" className="section-one-subsection">
        <ProblemMonitor />
      </LearningModule>
    </div>
    <div className="takeaway"><Lightbulb /><div><span>本节结论</span><b>视频重拍 ≠ 普通视频生成</b><p>它同时要求：已见内容忠实重建 + 未见内容写实且合理地生成 + 精确运镜。未见区域没有可恢复的唯一真实答案。</p></div></div>
    <NextLesson label="继续学习 §2" onClick={onNext} />
  </section>;
}

export function SectionTwo({ onNext }: { onNext: () => void }) {
  const [highlight, setHighlight] = useState<string | null>(null);
  return <section id="section-2" className="chapter">
    <SectionHeading number="02" eyebrow="4D 点云构建" title="Vista4D 的 4D 点云从哪里来？">把二维源视频提升到统一世界坐标，并理解 Vista4D 如何构建时间持久性 4D 点云。</SectionHeading>
    <PointCloudLab
      highlightedStage={highlight}
      equationOne={<FormulaExplorer
          number="公式 1"
          title="将像素反投影为世界坐标中的点云"
          symbols={equationOneSymbols}
          onStageChange={setHighlight}
          renderFormula={(s) => <>{s("P")} = {s("omega")} ( {s("inverse")} ( [ {s("Xsrc", <>X<sup>src</sup></>)}, {s("Dsrc", <>D<sup>src</sup></>)} ], {s("Ksrc", <>K<sup>src</sup></>)} ), {s("Tsrc", <>T<sup>src</sup></>)} )</>}
        />}
    />
    <div className="chapter-question"><CircleAlert /><div><span>接下来想一想</span><h3>如果一个静态物体下一帧没有被拍到，它应该从虚拟片场中消失吗？</h3></div></div>
    <NextLesson label="继续学习 §3" onClick={onNext} />
  </section>;
}

export function SectionThree({ onNext }: { onNext: () => void }) {
  return <section id="section-3" className="chapter memory-chapter">
    <SectionHeading number="03" eyebrow="时间持久性 4D 点云" title="让静态场景跨时间存在">理解为什么静态像素需要跨帧持续存在，以及这种设计如何帮助内容保持和摄影机控制。</SectionHeading>
    <LearningModule number="3.1" eyebrow="时间持续性 4D 点云" title="时间持续性" description="理解为什么静态像素需要跨帧持续存在，以及这种设计如何帮助内容保持和摄影机控制。">
      <TemporalPersistenceLab />
    </LearningModule>
    <NextLesson label="继续学习 §4" onClick={onNext} />
  </section>;
}

export function SectionFour({ onNext }: { onNext: () => void }) {
  return <section id="section-4" className="chapter frustum-chapter">
    <SectionHeading number="04" eyebrow="摄影机偏离与几何伪影" title="目标摄影机越偏离，几何问题越容易暴露">观察目标摄影机偏离原始视角后，为什么不完美的 4D 重建会暴露几何伪影。</SectionHeading>
    <LearningModule number="4.1" eyebrow="摄影机偏离与几何伪影" title="偏离源视角时会发生什么" description="观察目标摄影机偏离原始视角后，为什么不完美的 4D 重建会暴露几何伪影。">
      <CameraDeviationLab />
      <div className="chapter-question"><CircleAlert /><div><span>接下来想一想</span><h3>推理时会遇到不完美点云，训练时是不是也应让模型见过这些几何伪影？</h3></div></div>
    </LearningModule>
    <NextLesson label="继续学习 §5" onClick={onNext} />
  </section>;
}

export function SectionFive({ onNext }: { onNext: () => void }) {
  return <section id="section-5" className="chapter dual-path-chapter">
    <SectionHeading number="05" eyebrow="训练对构建" title="训练时，主动看见推理时的不完美">比较双重重投影（Double Reprojection）与 Vista4D 的多视角训练方式，理解模型为什么要在训练时见到真实重建伪影。</SectionHeading>
    <LearningModule number="5.1" eyebrow="训练对构建" title="Double Reprojection vs Vista4D Multiview" description="比较双重重投影（Double Reprojection）与 Vista4D 的多视角训练方式，理解模型为什么要在训练时见到真实重建伪影。">
      <TrainingComparison />
    </LearningModule>
    <NextLesson label="继续学习 §6" onClick={onNext} />
  </section>;
}

export function SectionSix({ onNext }: { onNext: () => void }) {
  const [highlight, setHighlight] = useState<string | null>(null);
  return <section id="section-6" className="chapter token-flow-chapter">
    <SectionHeading number="06" eyebrow="联合条件与训练目标" title="点云、原视频与 DiT 如何协同？">用两个核心交互理解为什么点云仍需要源视频，以及 Vista4D 最终给 DiT 哪些条件。</SectionHeading>
    <LearningModule number="6.1" eyebrow="条件为何互补" title="为什么点云还不够？" description="已经有 4D 点云了，为什么还需要原视频？">
      <PointCloudSourceComparison />
    </LearningModule>
    <LearningModule number="6.2" eyebrow="联合条件输入" title="Vista4D 最终给模型什么条件？" description="选择任意一种条件，查看它在生成目标视频时提供什么信息。">
      <ConditioningOverview highlightedStage={highlight} />
    </LearningModule>
    <LearningModule number="6.3" eyebrow="训练目标" title="模型如何学习？" description="这些条件告诉模型依据什么生成，而 Flow Matching 决定模型如何学习。">
      <FormulaExplorer
        number="公式 2"
        title="条件 Flow Matching 目标"
        symbols={equationTwoSymbols}
        onStageChange={setHighlight}
        renderFormula={(s) => <>{"ℒ"} = ‖ {s("model", <>ε<sub>θ</sub></>)}( {s("Xtgt", <>X<sub>t</sub><sup>tgt</sup></>)}, {s("render", <>X<sup>src→tgt</sup></>)}, {s("mask", <>M<sup>src→tgt</sup></>)}, {s("source", <>X<sup>src</sup></>)}, {s("camera", <>C<sup>tgt</sup></>)}, {s("time")} ) − {s("velocity", <>V</>)} ‖<sup>2</sup></>}
      />
      <p className="equation-summary">Vista4D 使用 Flow Matching 学习目标视频状态的速度场，而不是普通 noise-prediction MSE。</p>
    </LearningModule>
    <NextLesson label="继续学习 §7" onClick={onNext} />
  </section>;
}

export function SectionSeven({ onNext }: { onNext: () => void }) {
  return <section id="section-7" className="chapter pipeline-chapter">
    <SectionHeading number="07" eyebrow="完整流程" title="数据如何穿过 Vista4D 完整流程">把前面学过的模块重新连接起来，看看源视频如何一步步变成目标视角视频。</SectionHeading>
    <LearningModule number="7.1" eyebrow="完整流程" title="Full Pipeline" description="把前面学过的模块重新连接起来，看看源视频如何一步步变成目标视角视频。">
      <FullPipelineOverview />
    </LearningModule>
    <NextLesson label="继续学习 §8" onClick={onNext} />
  </section>;
}

export function SectionEight({ onNext }: { onNext: () => void }) {
  return <section id="section-8" className="chapter">
    <SectionHeading number="08" eyebrow="实验与消融" title="实验结果与消融">通过定量实验、用户研究和消融实验，检查 Vista4D 的摄影机控制、几何一致性与视频质量。</SectionHeading>
    <LearningModule number="8.1" eyebrow="实验与消融" title="实验结果与消融" description="通过定量实验、用户研究和消融实验，检查 Vista4D 的摄影机控制、几何一致性与视频质量。">
      <p className="experiment-footnote">评估设置：51 段视频、110 个视频–摄影机对，并使用同步多视角 iPhone 数据检查真实新视角；对比方法统一采用 672×384 模型检查点。</p>
      <PlaybackReview />
    </LearningModule>
    <NextLesson label="继续学习 §9" onClick={onNext} />
  </section>;
}

export function SectionNine({ onNext }: { onNext: () => void }) {
  return <section id="section-9" className="chapter">
    <SectionHeading number="09" eyebrow="应用与局限" title="显式 4D 场景还能做什么？">理解 Vista4D 如何进一步扩展到动态场景扩展、4D 场景重组和带记忆的长视频推理。</SectionHeading>
    <LearningModule number="9.1" eyebrow="应用与局限" title="显式 4D 场景还能做什么？" description="Vista4D 的显式 4D 表示还可以进一步支持场景扩展、场景重组和长视频生成。">
      <ApplicationCards />
      <div className="limitations-panel"><h3>局限｜显式几何 vs 视频模型先验</h3><div className="prior-scale" aria-label="显式点云先验与隐式视频先验之间尚不可由用户调节的取舍"><span>显式点云先验</span><i /><span>隐式视频先验</span></div><p>当不完美的点云几何与视频模型先验发生冲突时，Vista4D 目前缺少让用户主动调节二者权重的机制。</p></div>
      <div className="responsible-use"><ShieldCheck /><div><span>负责任使用 / 更广影响</span><p>重新操纵摄影机可能改变视频的情感影响与公众观感，也涉及内容所有权与改编作品。创作自由应配合来源披露、授权与审慎发布。</p></div></div>
    </LearningModule>
    <NextLesson label="继续最终回顾" onClick={onNext} />
  </section>;
}

export function FinalSection({ onComplete, onRestart }: { onComplete: () => void; onRestart: () => void }) {
  return <section id="final" className="chapter final-section">
    <SectionHeading number="终" eyebrow="最终复习" title="最终回顾">这里不再引入新知识。用三个问题重建整篇论文的因果链，再回顾完整流程。</SectionHeading>
    <LearningModule number="Final" eyebrow="最终复习" title="掌握度检查" description="这里不再引入新知识。用三个问题重建整篇论文的因果链，再回顾完整流程。">
      <FinalQuiz onComplete={onComplete} onRestart={onRestart} />
    </LearningModule>
  </section>;
}
