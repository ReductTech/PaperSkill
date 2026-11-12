import type { ReactNode } from "react";
import { Sub } from "./lesson-math";
import "./p8-run-visuals.css";

function StateMark({ index }: { index: number }) {
  return <math aria-label={`Theta ${index}`}><Sub base="Θ" index={index} /></math>;
}

type FlowNode = {
  tone?: "retrieval" | "prompt" | "frozen" | "output";
  title: ReactNode;
  detail: ReactNode;
};

function FlowTrack({ nodes, label }: { nodes: FlowNode[]; label: string }) {
  return <ol className="p8-flow__track" aria-label={label}>
    {nodes.map((node, index) => <li key={index}>
      <div className={`p8-flow__node${node.tone ? ` p8-flow__node--${node.tone}` : ""}`}>
        <span className="p8-flow__node-title">{node.title}</span>
        <span className="p8-flow__node-detail">{node.detail}</span>
      </div>
    </li>)}
  </ol>;
}

export function P8StateLedger() {
  return <section className="p8-ledger" aria-labelledby="p8-ledger-title">
    <div className="p8-ledger__intro">
      <h3 id="p8-ledger-title">任务切换数据流，参数版本接着往下走</h3>
      <p>每个 <math><mi>Θ</mi></math> 都是同一组池与分类器的一份状态快照。批末写回产生下一版；任务边界本身不创建新参数。</p>
    </div>
    <div className="p8-ledger__scroll" role="region" tabIndex={0} aria-label="参数版本账本，可横向滚动查看">
      <table>
        <thead><tr><th scope="col">状态</th><th scope="col">由什么产生</th><th scope="col">下一次读取</th><th scope="col">状态含义</th></tr></thead>
        <tbody>
          <tr><th scope="row"><span className="p8-ledger__theta"><StateMark index={0} /></span></th><td>一次初始化</td><td>Task 1 · Batch 1</td><td>建立 Key、Prompt 与共享分类器 <math><mi>φ</mi></math></td></tr>
          <tr><th scope="row"><span className="p8-ledger__theta"><StateMark index={1} /></span></th><td>Task 1 · Batch 1 批末写回</td><td>Task 1 · Batch 2</td><td>下一批用更新后的 Key 重新检索</td></tr>
          <tr className="p8-ledger__handoff"><th scope="row"><span className="p8-ledger__theta"><StateMark index={2} /></span></th><td>Task 1 · Batch 2 批末写回</td><td>Task 2 · Batch 1</td><td>交接只换数据，<math><mi>K</mi></math>、<math><mi>P</mi></math>、<math><mi>φ</mi></math> 原样继承</td></tr>
          <tr><th scope="row"><span className="p8-ledger__theta"><StateMark index={3} /></span></th><td>Task 2 · Batch 1 批末写回</td><td>测试样本</td><td>推断只读这份状态，不再更新</td></tr>
        </tbody>
      </table>
    </div>
    <p className="p8-ledger__scroll-note">窄屏可横向滑动查看完整账本</p>
    <p className="p8-ledger__note">每次版本推进都对应一次完整 Batch 更新；单个样本不会单独创建一个新版本。</p>
  </section>;
}

function BranchSteps({ mode }: { mode: "training" | "inference" }) {
  if (mode === "training") return <ol className="p8-flow__steps" aria-label="训练步骤">
    <li><span className="p8-flow__step-main"><math><msub><mi>L</mi><mi>cls</mi></msub></math> + <math><mi>λ</mi><msub><mi>L</mi><mi>match</mi></msub></math></span><span className="p8-flow__step-detail">分类损失与匹配损失</span></li>
    <li><span className="p8-flow__step-main">累积一个 Batch</span><span className="p8-flow__step-detail">样本损失与命中选集</span></li>
    <li><span className="p8-flow__step-main">整批反向传播</span><span className="p8-flow__step-detail"><math><mi>K</mi></math>、<math><mi>P</mi></math> 与 <math><mi>φ</mi></math> 接收梯度</span></li>
    <li><span className="p8-flow__step-main">一次优化器写回</span><span className="p8-flow__step-detail"><math><msub><mi>Θ</mi><mi>b</mi></msub><mo>→</mo><msub><mi>Θ</mi><mrow><mi>b</mi><mo>+</mo><mn>1</mn></mrow></msub></math></span></li>
  </ol>;

  return <ol className="p8-flow__steps p8-flow__steps--inference" aria-label="推断步骤">
    <li><span className="p8-flow__step-main"><math><mi>argmax</mi><mo>(</mo><mi>z</mi><mo>)</mo></math></span><span className="p8-flow__step-detail">选择最高分类分数</span></li>
    <li><span className="p8-flow__step-main">输出 <math><mover><mi>y</mi><mo>^</mo></mover></math></span><span className="p8-flow__step-detail">给出预测类别</span></li>
    <li><span className="p8-flow__step-main"><StateMark index={3} /> · 只读</span><span className="p8-flow__step-detail">不算损失、不反传、不写回</span></li>
  </ol>;
}

export function P8TrainInferMap() {
  const retrievalNodes: FlowNode[] = [
    { title: <>图像 <math><mi>x</mi></math></>, detail: "当前样本" },
    { tone: "frozen", title: <>检索调用 · 冻结 ViT</>, detail: <><math><msub><mi>f</mi><mi>e</mi></msub></math> 与 <math><msub><mi>f</mi><mi>r</mi></msub></math>，不带 Prompt</> },
    { tone: "retrieval", title: <>Query <math><mi>q</mi><mo>(</mo><mi>x</mi><mo>)</mo></math></>, detail: <>从 <math><mi>[CLS]</mi></math> 位置读取</> },
    { tone: "retrieval", title: <>Key 池 · Top-N</>, detail: <>按距离读取当前 <math><mi>K</mi></math></> },
    { tone: "prompt", title: <>选中 <math><msub><mi>P</mi><mi>S</mi></msub></math></>, detail: "保留同槽配对关系" },
  ];
  const classificationNodes: FlowNode[] = [
    { tone: "prompt", title: <><math><mo>[</mo><msub><mi>P</mi><mi>S</mi></msub><mo>;</mo><msub><mi>x</mi><mi>e</mi></msub><mo>]</mo></math></>, detail: "拼接 Prompt 与图像嵌入" },
    { tone: "frozen", title: <>分类调用 · 冻结 <math><msub><mi>f</mi><mi>r</mi></msub></math></>, detail: "沿用同一组权重" },
    { title: <>Prompt 位置 <math><mi>AvgPool</mi></math></>, detail: <>只读前 <math><mi>N</mi><msub><mi>L</mi><mi>p</mi></msub></math> 个输出</> },
    { tone: "output", title: <>共享 <math><msub><mi>g</mi><mi>φ</mi></msub></math> → <math><mi>Logits</mi></math></>, detail: <>得到分类分数 <math><mi>z</mi></math></> },
  ];

  return <figure className="p8-flow" aria-labelledby="p8-flow-title">
    <div className="p8-flow__heading">
      <h3 id="p8-flow-title">检索与分类各走一次前向，再分训练和推断</h3>
      <p>两个调用共用冻结权重；只有得到 <math><mi>z</mi></math> 后，训练与测试才走向不同的结束步骤。</p>
    </div>

    <section className="p8-flow__lane" aria-labelledby="p8-retrieval-title">
      <h4 id="p8-retrieval-title">先用 Query 在 Key 池中取出配对 Prompt</h4>
      <FlowTrack nodes={retrievalNodes} label="检索调用：图像、Query、Key 池与 Top-N 选集" />
    </section>

    <div className="p8-flow__handoff">
      <span className="p8-flow__handoff-rule" aria-hidden="true" />
      <span>所选 <math><msub><mi>P</mi><mi>S</mi></msub></math> 与同一图像的嵌入 <math><msub><mi>x</mi><mi>e</mi></msub></math> 合并</span>
      <span className="p8-flow__handoff-arrow" aria-hidden="true">↓</span>
    </div>

    <section className="p8-flow__lane p8-flow__lane--classification" aria-labelledby="p8-classification-title">
      <h4 id="p8-classification-title">再用 Prompt 条件调用完成分类</h4>
      <FlowTrack nodes={classificationNodes} label="分类调用：拼接输入、冻结 Transformer、Prompt 池化与分类器" />
    </section>

    <div className="p8-flow__fork-label">共享输出 <math><mi>z</mi></math> 的两种结束方式</div>
    <div className="p8-flow__fork" aria-hidden="true">
      <span className="p8-flow__fork-stem" />
      <span className="p8-flow__fork-bar" />
      <span className="p8-flow__fork-leg p8-flow__fork-leg--training" />
      <span className="p8-flow__fork-leg p8-flow__fork-leg--inference" />
    </div>

    <div className="p8-flow__outcomes">
      <section className="p8-flow__branch p8-flow__branch--training" aria-labelledby="p8-training-title">
        <h4 id="p8-training-title">训练 · 有标签 <math><mi>y</mi></math></h4>
        <BranchSteps mode="training" />
        <p>下一批读取新版本，再重新检索。</p>
      </section>
      <section className="p8-flow__branch p8-flow__branch--inference" aria-labelledby="p8-inference-title">
        <h4 id="p8-inference-title">推断 · 无标签、无任务 ID</h4>
        <BranchSteps mode="inference" />
        <p>只输出预测；参数版本保持不变。</p>
      </section>
    </div>
    <figcaption>同一模型服务训练和测试；标签决定是否进入损失计算与参数更新。</figcaption>
  </figure>;
}
