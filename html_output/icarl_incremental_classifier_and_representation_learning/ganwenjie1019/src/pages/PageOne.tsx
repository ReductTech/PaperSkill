import { useState, type CSSProperties } from "react";
import { PaperTerm } from "../components/PaperTerm";

type PageOneProps = { onOpenPageTwo: () => void };

const stages = [
  { title: "初始类别", note: "第一批类别定义了模型最初的预测范围。", status: "当前预测范围：类别 1–10。" },
  { title: "新类别批次到达", note: "新的类别加入序列，学习器本身保持连续。", status: "原有类别仍然保留。" },
  { title: "统一标签空间扩展", note: "测试时，模型必须在迄今见过的所有类别中作出选择。", status: "不能依赖当前批次信息。" },
  { title: "历史增长，记忆有界", note: "类别和历史数据不断累积，但可保存的图像数量不能无限增长。", status: "记忆容量 K 保持不变。" },
  { title: "两种直接做法都不够", note: "保存所有图像会突破记忆上限；只用新图像训练又可能损害旧类能力。", status: "两种做法各自遗漏一项要求。" },
  { title: "明确学习问题", note: "系统需要学习新类、保留旧类识别、统一预测，并遵守有界记忆。", status: "下一步：打开共享模型。" },
];

const batches = [
  { name: "类别批次 1", range: "类别 1–10" },
  { name: "类别批次 2", range: "类别 11–20" },
  { name: "类别批次 3", range: "类别 21–30" },
];

function Arrow({ label }: { label: string }) {
  return (
    <div className="p1-flow-arrow" aria-hidden="true">
      <svg viewBox="0 0 72 22"><path d="M2 11h62m-8-7 8 7-8 7" /></svg>
      <span>{label}</span>
    </div>
  );
}

export function PageOne({ onOpenPageTwo }: PageOneProps) {
  const [step, setStep] = useState(0);
  const seenCount = [10, 10, 20, 30, 30, 30][step];
  const arrivedCount = step >= 3 ? 3 : step >= 1 ? 2 : 1;
  const currentBatch = step >= 3 ? 2 : step >= 1 ? 1 : 0;
  const totalSteps = stages.length;

  return (
    <article className="tutorial-page p1-page" aria-labelledby="page-one-title">
      <div className="p1-kicker"><span>第 01 页</span><i /> 类别增量学习的任务设定</div>
      <header className="page-heading p1-heading">
        <h1 id="page-one-title">类别逐批到来，分类器不能重新开始</h1>
        <p><PaperTerm termId="class-incremental-learning" /> 中，新类别会随时间出现。同一个模型要在所有已见类别中直接预测，同时面对有限的旧数据记忆。</p>
      </header>

      <section className="p1-naive-section" aria-labelledby="p1-naive-title">
        <div className="p1-section-head"><div><span className="p1-eyebrow">开始之前 · 认识两种直接做法</span><h2 id="p1-naive-title">先了解两种方法，再看增量学习的要求</h2></div><span className="p1-qualitative-note">概念对比</span></div>
        <div className="p1-naive-grid">
          <article className="p1-naive-card p1-naive-card--memory">
            <div className="p1-naive-card__visual" aria-hidden="true"><div className="p1-archive-stack">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div><span className="p1-overflow-arrow">↗</span><b>持续增长</b></div>
            <span className="p1-card-label">做法 A · 保存全部图像</span><h3>保留全部历史数据并重新训练</h3><p>旧图像可以继续使用，但存储量会随历史持续增长。</p>
            <div className="p1-verdict"><i>×</i><span>超出有界记忆限制</span></div>
          </article>
          <article className="p1-naive-card p1-naive-card--new">
            <div className="p1-naive-card__visual" aria-hidden="true"><span className="p1-model-mini">模型</span><svg viewBox="0 0 84 24"><path d="M2 12h75m-8-7 8 7-8 7" /></svg><span className="p1-new-mini">新数据</span></div>
            <span className="p1-card-label">做法 B · 只使用新数据训练</span><h3>只围绕刚到达的类别继续训练</h3><p>新类能力可以提升，但可能出现<PaperTerm termId="catastrophic-forgetting">灾难性遗忘</PaperTerm>，旧类别区分能力因此下降。</p>
            <div className="p1-verdict"><i>×</i><span>旧类别能力可能退化</span></div>
          </article>
        </div>
        <aside className="p1-next-thought" aria-label="下一步思考">
          <span>下一步思考</span>
          <p>保留全部旧数据会不断增加存储成本；完全不保留旧数据，又容易在学习新类别时忘记旧类别。那么，能否只留下<strong>少量足够有代表性的旧样本</strong>，让系统在有限记忆内继续利用历史信息？</p>
        </aside>
      </section>

      <section className="p1-guided panel" aria-labelledby="p1-guided-title">
        <div className="p1-guided__top">
          <div><span className="p1-eyebrow">引导阅读 · {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span><h2 id="p1-guided-title">{stages[step].title}</h2></div>
          <div className="p1-step-actions">
            <button type="button" className="p1-control p1-control--quiet" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} aria-label="上一步">← <span>上一步</span></button>
            <button type="button" className="p1-control p1-control--primary" onClick={() => setStep((value) => Math.min(totalSteps - 1, value + 1))} disabled={step === totalSteps - 1} aria-label="下一步"><span>下一步</span> →</button>
          </div>
        </div>
        <nav className="p1-step-nav" aria-label="第 1 页引导阶段">
          {stages.map((stage, index) => (
            <button key={stage.title} type="button" className={`p1-step-nav__item ${step === index ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} onClick={() => setStep(index)} aria-pressed={step === index}>
              <span>{String(index + 1).padStart(2, "0")}</span><b>{stage.title}</b>
            </button>
          ))}
        </nav>
        <div className="p1-guided__summary" aria-live="polite"><span className="p1-guided__pulse" /><p>{stages[step].note}</p><strong>{stages[step].status}</strong></div>
      </section>

      <section className="p1-class-stream panel" aria-labelledby="p1-stream-title">
        <div className="p1-section-head">
          <div><span className="p1-eyebrow">01 · 类别序列</span><h2 id="p1-stream-title">新类别沿时间进入同一条学习路径</h2></div>
          <span className="p1-time-label">时间 <svg viewBox="0 0 48 12" aria-hidden="true"><path d="M1 6h42m-6-5 6 5-6 5" /></svg></span>
        </div>
        <div className="p1-batch-track" data-arrived={arrivedCount}>
          <div className="p1-track-line" aria-hidden="true"><span style={{ "--progress": `${((arrivedCount - 1) / 2) * 100}%` } as CSSProperties} /></div>
          {batches.map((batch, index) => {
            const arrived = index < arrivedCount;
            return (
              <div key={batch.name} className={`p1-batch ${arrived ? "is-arrived" : "is-future"} ${index === currentBatch ? "is-current" : ""}`}>
                <div className="p1-batch__marker" aria-hidden="true"><i /></div>
                <div className="p1-batch__card">
                  <div className="p1-batch__top"><span>{batch.name}</span><em>{arrived ? (index === currentBatch ? "当前" : "已见") : "待到达"}</em></div>
                  <strong>{batch.range}</strong>
                  <div className="p1-batch__classes" aria-label={`${batch.range}，十个类别`}>
                    {Array.from({ length: 10 }, (_, classIndex) => <i key={classIndex} />)}
                  </div>
                  <small>{arrived ? "类别继续保留在预测范围中" : "尚未到达"}</small>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p1-stream-caption"><span>每批加入新的类别。</span><span>同一个学习器贯穿整个序列。</span></div>
      </section>

      <section className="p1-model-map" aria-label="同一个学习器与统一预测空间">
        <section className="p1-learner panel">
          <div className="p1-section-head"><div><span className="p1-eyebrow">02 · 持续使用的模型</span><h2>同一个学习器</h2></div><span className="p1-object-badge">共享模型</span></div>
          <div className="p1-model-diagram">
            <div className="p1-model-layers" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div><strong>同一个学习器</strong><span>参数随类别批次持续更新</span></div>
            <b className="p1-model-symbol">θ</b>
          </div>
          <div className="p1-learner-foot"><span><i /> 模型保持连续</span><span>不会为每一批新建分类器</span></div>
        </section>
        <Arrow label="统一的标签空间" />
        <section className="p1-prediction panel" aria-live="polite">
          <div className="p1-section-head"><div><span className="p1-eyebrow">03 · 统一预测</span><h2>在所有已见类别中选择</h2></div><span className="p1-count">{seenCount}<small> 个类别</small></span></div>
          <div className="p1-label-groups">
            {Array.from({ length: Math.ceil(seenCount / 10) }, (_, index) => {
              const first = index * 10 + 1;
              const last = Math.min(first + 9, seenCount);
              return <div className={`p1-label-group p1-label-group--${index}`} key={first}><span>C{first}–C{last}</span><i /><i /><i /></div>;
            })}
          </div>
          <div className="p1-query-route"><span className="p1-query-icon">x</span><svg viewBox="0 0 80 20" aria-hidden="true"><path d="M2 10h70m-7-7 7 7-7 7" /></svg><strong>在 C1–C{seenCount} 中作出统一预测</strong></div>
          <p>测试时不依赖样本来自哪个类别批次。</p>
        </section>
      </section>

      <section className={`p1-memory panel ${step >= 3 ? "is-emphasized" : ""}`} aria-label="增长的类别历史与固定容量图像记忆">
        <div className="p1-section-head"><div><span className="p1-eyebrow">贯穿全程的约束</span><h2>历史变长，可用图像记忆仍有上限</h2></div><span className="p1-fixed-tag">K · 固定容量</span></div>
        <div className="p1-memory-compare">
          <div className="p1-memory-row"><strong>已到达的类别</strong><div className="p1-history-rail" aria-label={`已到达 ${arrivedCount} 个类别批次`}>{[0, 1, 2].map((index) => <i key={index} className={index < arrivedCount ? "is-filled" : ""} />)}</div><span>{arrivedCount * 10} 个类别</span></div>
          <div className="p1-memory-row"><strong>图像记忆</strong><div className="p1-fixed-rail" aria-label="固定记忆预算 K"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>容量 K 不变</span></div>
        </div>
      </section>

      <section className={`p1-problem panel ${step === 5 ? "is-active" : ""}`} aria-labelledby="p1-problem-title">
        <div className="p1-problem__lead"><span className="p1-eyebrow">类别增量学习问题</span><h2 id="p1-problem-title">系统需要同时做到</h2><p>iCaRL 围绕以下四项要求展开。</p></div>
        <ol><li>学习新到来的类别</li><li>继续识别以前见过的类别</li><li>在统一标签空间中预测</li><li>遵守有界图像记忆</li></ol>
        <button type="button" className="p1-open-model" onClick={onOpenPageTwo}>下一页：模型怎样处理图片 <span aria-hidden="true">→</span></button>
        <p className="p1-problem__handoff">接下来，我们先打开模型，沿着一张图像从输入到输出的路径，看看它在模型内部经历了哪些处理。</p>
      </section>
    </article>
  );
}
