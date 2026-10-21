import { SharedTrainingHead } from "../components/SharedTrainingHead";
import { TrainingUpdateBridge } from "../components/TrainingUpdateBridge";
import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { PaperTerm } from "../components/PaperTerm";
import { ProjectionClusterChart } from "../components/ProjectionClusterChart";
import { SampleToken } from "../components/SampleToken";
import { sampleById } from "../data/icarl-runtime";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const flowStages = [
  { title: "输入图像", description: "样本 x 进入共享模型。沿着整条路径，样本身份保持不变。", tag: "原始样本" },
  { title: "特征提取器", description: "可训练参数 Θ 决定当前特征映射 φΘ。学习继续时，这部分参数会更新。", tag: "共享网络" },
  { title: "特征表示", description: "Feature Extractor 输出向量 z。它是模型内部表示，不是类别标签，也不是预测结果。", tag: "内部向量" },
  { title: "训练输出层", description: "每个已见类别都有自己的权重向量 wᵧ；同一个表示会送入每个类别节点。", tag: "逐类权重" },
  { title: "网络响应", description: "每个节点产生一个 sigmoid 响应 gᵧ(x)。这些输出用于学习表示，不是 iCaRL 的最终类别决定。", tag: "逐类响应" },
];

export function PageTwo({ onOpenPageThree }: { onOpenPageThree?: () => void }) {
  const [modelOpen, setModelOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [featureState, setFeatureState] = useState<"before" | "after">("before");
  const reducedMotion = useReducedMotion();

  const progressStyle = { "--p2-progress": `${(stage / (flowStages.length - 1)) * 100}%` } as CSSProperties;

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    if (stage === flowStages.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStage((value) => Math.min(flowStages.length - 1, value + 1)), 2100);
    return () => window.clearTimeout(timer);
  }, [isPlaying, reducedMotion, stage]);

  function selectStage(nextStage: number) {
    setIsPlaying(false);
    setStage(nextStage);
  }

  function togglePlayback() {
    if (reducedMotion) {
      setStage((value) => value >= flowStages.length - 1 ? 0 : value + 1);
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (stage === flowStages.length - 1) setStage(0);
    setIsPlaying(true);
  }

  function replayFlow() {
    setStage(0);
    if (reducedMotion) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
  }

  return (
    <article className="tutorial-page p2-page" aria-labelledby="page-two-title">
      <div className="p1-kicker p2-kicker"><span>第 02 页</span><i /> 从图像到特征表示</div>
      <header className="page-heading p2-heading">
        <h1 id="page-two-title">打开模型：图片怎样变成可比较的特征表示</h1>
        <p>iCaRL 持续更新共享的 <PaperTerm termId="feature-extractor">feature extractor</PaperTerm>。先看一张图像如何穿过模型，再区分内部<PaperTerm termId="representation">表示</PaperTerm>、训练输出和最终分类。</p>
      </header>

      {!modelOpen ? (
        <section className="p2-blackbox panel" aria-label="模型概览">
          <div className="p2-blackbox__path">
            <div className="p2-blackbox__item p2-blackbox__image"><span className="p2-eyebrow">输入</span><SampleToken sample={sampleById("x_7")} role="raw" /><small>一张图像 · x</small></div>
            <span className="p2-blackbox__arrow" aria-hidden="true"><svg viewBox="0 0 58 20"><path d="M1 10h51m-8-7 8 7-8 7" /></svg></span>
            <div className="p2-blackbox__model"><span className="p2-eyebrow">共享学习器</span><strong>神经网络</strong><small>内部结构尚未展开</small></div>
            <span className="p2-blackbox__arrow" aria-hidden="true"><svg viewBox="0 0 58 20"><path d="M1 10h51m-8-7 8 7-8 7" /></svg></span>
            <div className="p2-blackbox__item p2-blackbox__outputs"><span className="p2-eyebrow">输出</span><strong>逐类网络响应</strong><small>每个已见类别各有一个输出</small></div>
          </div>
          <div className="p2-blackbox__action"><p>展开从原始图像到逐类响应的处理路径。</p><button type="button" className="p2-action" onClick={() => setModelOpen(true)}>打开模型 <span aria-hidden="true">↗</span></button></div>
        </section>
      ) : (
        <>
          <section className="p2-opened-model panel" aria-labelledby="p2-flow-title">
            <div className="p2-panel-heading">
              <div><span className="p2-eyebrow">共享模型 · 同一张图像经过五个阶段</span><h2 id="p2-flow-title">图像 x → 特征提取器 → 表示 z → 训练输出层 → 网络响应</h2></div>
              <button className="p2-quiet-action" type="button" onClick={() => { setIsPlaying(false); setModelOpen(false); }}>收起模型</button>
            </div>

            <div className="p2-playback">
              <div className="p2-playback__steps" role="group" aria-label="模型处理阶段">
                {flowStages.map((item, index) => <button key={item.title} type="button" className={`p2-step-chip ${stage === index ? "is-active" : ""} ${index < stage ? "is-complete" : ""}`} aria-pressed={stage === index} onClick={() => selectStage(index)}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</button>)}
              </div>
              <div className="p2-playback__controls">
                <button className="p2-quiet-action" type="button" onClick={() => selectStage(Math.max(0, stage - 1))} disabled={stage === 0}>← 上一步</button>
                <button className="p2-action p2-action--small" type="button" onClick={togglePlayback} disabled={reducedMotion} title={reducedMotion ? "减少动态效果已启用；请用阶段按钮逐步查看。" : undefined}>{reducedMotion ? "减少动态效果" : isPlaying ? "Ⅱ 暂停" : stage === flowStages.length - 1 ? "↺ 从头播放" : stage > 0 ? "▶ 继续播放" : "▶ 播放完整路径"}</button>
                {!reducedMotion && stage > 0 && stage < flowStages.length - 1 ? <button className="p2-quiet-action" type="button" onClick={replayFlow}>↺ 从头播放</button> : null}
                <button className="p2-quiet-action" type="button" onClick={() => selectStage(Math.min(flowStages.length - 1, stage + 1))} disabled={stage === flowStages.length - 1}>下一步 →</button>
              </div>
            </div>

            <div className="p2-progress" aria-hidden="true"><span style={progressStyle} /></div>

            <div className="p2-pipeline" aria-label="模型处理的五个阶段">
              {flowStages.map((item, index) => (
                <Fragment key={item.title}>
                  <div className={`p2-node ${stage === index ? "is-active" : ""} ${index < stage ? "is-complete" : ""}`} aria-current={stage === index ? "step" : undefined}>
                    <div className="p2-node__top"><span>{String(index + 1).padStart(2, "0")}</span><small>{item.tag}</small></div>
                    <h3>{item.title}</h3>
                    {index === 0 ? <div className="p2-node__sample"><SampleToken sample={sampleById("x_7")} role="raw" /><span>同一张样本 x</span></div> : null}
                    {index === 1 ? <div className="p2-extractor-visual"><div className="p2-feature-blocks"><i /><i /><i /><i /></div><span>卷积与特征块</span><b>φ<sub>Θ</sub></b></div> : null}
                    {index === 2 ? <div className="p2-vector-visual"><div aria-hidden="true">{[26, 43, 32, 52, 36, 48].map((height, bar) => <i key={bar} style={{ height: `${height}px` }} />)}</div><strong>z = φ<sub>Θ</sub>(x)</strong><small>z ∈ R<sup>d</sup></small></div> : null}
                    {index === 3 ? <div className="p2-head-visual"><div><i>w<sub>1</sub></i><i>w<sub>2</sub></i><i>w<sub>3</sub></i><b>···</b><i>w<sub>t</sub></i></div><strong>每个已见类别<br />对应一个权重向量</strong></div> : null}
                    {index === 4 ? <div className="p2-output-visual"><div><span>g<sub>1</sub>(x)</span><i /><b>σ</b></div><div><span>g<sub>2</sub>(x)</span><i /><b>σ</b></div><div><span>g<sub>t</sub>(x)</span><i /><b>σ</b></div><small>逐类独立响应</small></div> : null}
                  </div>
                  {index < flowStages.length - 1 ? <div className={`p2-pipeline-arrow ${index < stage ? "is-complete" : ""}`} aria-hidden="true"><svg viewBox="0 0 48 22"><path d="M2 11h39m-7-7 7 7-7 7" /></svg></div> : null}
                </Fragment>
              ))}
            </div>

            <div className="p2-stage-caption" aria-live="polite"><span className="p2-stage-caption__dot" /><div><b>{flowStages[stage].tag}</b><p>{flowStages[stage].description}</p></div><span className="p2-stage-caption__count">{stage + 1} / {flowStages.length}</span></div>
            <p className="p2-carrier-note"><strong>教学示意。</strong> 图中表达 iCaRL 所需的组件与数据流，不代表论文实验所用 ResNet 的精确拓扑。</p>
          </section>

          <TrainingUpdateBridge onRepresentationUpdated={() => setFeatureState("after")} />

          <section className="p2-representation-layout" aria-label="特征表示与特征空间">
            <section className="p2-feature-panel panel">
              <div className="p2-panel-heading"><div><span className="p2-eyebrow">同一批样本 · 两种模型状态</span><h2>更新 Θ 后，表示空间会改变</h2></div>
                <div className="p2-state-switch" role="group" aria-label="特征提取器状态">
                  <button type="button" aria-pressed={featureState === "before"} onClick={() => setFeatureState("before")}>更新前</button>
                  <button type="button" aria-pressed={featureState === "after"} onClick={() => setFeatureState("after")}>更新后</button>
                </div>
              </div>
              <ProjectionClusterChart state={featureState} />
              <div className="p2-projection-note"><span className="p2-note-mark">i</span><p>实际 representation 通常位于高维 R<sup>d</sup>。这里用二维教学投影展示相对位置和类簇变化；点的颜色表示类别，同一编号样本在更新前后保持身份不变。</p></div>
            </section>

          </section>

          <section className="p2-next-task panel" aria-label="第一轮训练结束，下一批类别到来">
            <div><span className="p2-eyebrow">ROUND 1 COMPLETE</span><strong>第一批训练结束，模型已完成一次参数更新</strong><p>接下来到达的是包含新类别的第 2 批任务；输入会换成新类样本，训练输出层也要追加对应的类别节点。</p></div>
            <div className="p2-next-task__flow" aria-hidden="true"><span>Θ′</span><i>→</i><span>新类 image x<sub>new</sub></span><i>→</i><span>C6–C10</span></div>
          </section>

          <SharedTrainingHead />

          <section className="p2-handoff">
            <span className="p2-eyebrow">沿着问题继续想</span>
            <div className="p2-handoff__path">
              <div className="p2-handoff__step p2-handoff__step--known">
                <span>01 · 已经知道</span>
                <p>图片可以经过特征提取器变成可比较的<strong>特征向量</strong>，训练输出层也能随着新类别到来继续扩展。</p>
              </div>
              <div className="p2-handoff__connector" aria-hidden="true" />
              <div className="p2-handoff__step p2-handoff__step--constraint">
                <span>02 · 回到限制</span>
                <p>但学习要不断继续，旧类别的全部图片却不能一直保存。我们希望只用<strong>少量有代表性的图片</strong>，帮助模型保留对旧类别的认识。</p>
              </div>
              <div className="p2-handoff__connector" aria-hidden="true" />
              <div className="p2-handoff__step p2-handoff__step--question">
                <span>03 · 下一问</span>
                <p>那么，<strong>假设每个类别的代表图片已经选好了</strong>，一张新图片到来时，我们究竟怎样利用这些代表，判断它属于哪一类？</p>
                <button type="button" className="icarl-button icarl-button--primary" onClick={onOpenPageThree}>下一页：用代表图片完成一次预测 <b aria-hidden="true">→</b></button>
              </div>
            </div>
          </section>
        </>
      )}
    </article>
  );
}
