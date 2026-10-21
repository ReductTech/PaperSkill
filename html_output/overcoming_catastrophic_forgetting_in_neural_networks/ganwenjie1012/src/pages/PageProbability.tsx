import { Fragment, useMemo, useState } from "react";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";

import { PARAMETER_STATES, datasetLikelihood, negativeLogLikelihood, type ParameterState } from "../data/probabilityExample";
import { MathFormula } from "../shared/teaching/Math";

const CLASS_NAMES = ["class A", "class B", "class C"];
const SAMPLE_NAMES = ["(x₁, y₁=A)", "(x₂, y₂=B)", "(x₃, y₃=C)"];
const INPUT_PATTERN = [1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1];
const INPUT_NODES = [25, 61, 97];
const HIDDEN_NODES = [17, 39, 61, 83, 105];
const OUTPUT_NODES = [25, 61, 97];

function formatProbability(value: number) {
  return value.toFixed(2);
}

function ParameterStateNotation({ candidate }: { candidate: ParameterState["candidate"] }) {
  return <MathFormula tex={String.raw`\theta^{(${{ A: 1, B: 2, C: 3 }[candidate]})}`} />;
}

function InputSample() {
  return (
    <div className="p02-input-sample" role="img" aria-label="用于演示的输入样本 x 一，右侧标签 y 一为 class A">
      <div className="p02-input-sample__pixels" aria-hidden="true">{INPUT_PATTERN.map((pixel, index) => <i className={pixel ? "is-on" : ""} key={index} />)}</div>
      <div className="p02-input-sample__label"><b>x₁</b><span>true label <strong>A</strong></span></div>
      <small>输入示意 · 教学示例</small>
    </div>
  );
}

function ForwardNetwork() {
  return (
    <svg className="p02-network" viewBox="0 0 250 122" role="img" aria-labelledby="p02-network-title p02-network-description">
      <title id="p02-network-title">前向计算的神经网络</title>
      <desc id="p02-network-description">输入经过多个相连的网络层，输出由当前参数 theta 决定。</desc>
      <g className="p02-network__wires" aria-hidden="true">
        {INPUT_NODES.flatMap((inputY, inputIndex) => HIDDEN_NODES.map((hiddenY, hiddenIndex) => <line key={`ih-${inputIndex}-${hiddenIndex}`} x1="24" y1={inputY} x2="123" y2={hiddenY} />))}
        {HIDDEN_NODES.flatMap((hiddenY, hiddenIndex) => OUTPUT_NODES.map((outputY, outputIndex) => <line key={`ho-${hiddenIndex}-${outputIndex}`} x1="127" y1={hiddenY} x2="226" y2={outputY} />))}
      </g>
      <g className="p02-network__nodes p02-network__nodes--input" aria-hidden="true">{INPUT_NODES.map((y) => <circle key={`i-${y}`} cx="22" cy={y} r="7" />)}</g>
      <g className="p02-network__nodes p02-network__nodes--hidden" aria-hidden="true">{HIDDEN_NODES.map((y) => <circle key={`h-${y}`} cx="125" cy={y} r="7" />)}</g>
      <g className="p02-network__nodes p02-network__nodes--output" aria-hidden="true">{OUTPUT_NODES.map((y) => <circle key={`o-${y}`} cx="228" cy={y} r="7" />)}</g>
      <text className="p02-network__label" x="22" y="119" textAnchor="middle">input</text>
      <text className="p02-network__label" x="125" y="119" textAnchor="middle">hidden</text>
      <text className="p02-network__label" x="228" y="119" textAnchor="middle">output</text>
    </svg>
  );
}

function LogitValues({ values }: { values: ParameterState["logits"] }) {
  return (
    <div className="p02-logit-list" aria-label="神经网络输出的 logits">
      {values.map((value, index) => (
        <div className="p02-logit-row" key={CLASS_NAMES[index]}>
          <span>{CLASS_NAMES[index]}</span>
          <div className="p02-logit-row__bar"><i style={{ width: `${Math.max(4, Math.min(100, ((value + 4) / 4) * 100))}%` }} /></div>
          <b>{value.toFixed(2)}</b>
        </div>
      ))}
      <div className="p02-logit-axis"><span>−4</span><span>logit z</span><span>0</span></div>
    </div>
  );
}

function ProbabilityValues({ values }: { values: ParameterState["probabilities"] }) {
  return (
    <div className="p02-probability-list" aria-label="Softmax 后的类别概率">
      {values.map((value, index) => (
        <div className={`p02-probability-row ${index === 0 ? "is-observed" : ""}`} key={CLASS_NAMES[index]}>
          <span>{CLASS_NAMES[index]}{index === 0 ? " · y₁" : ""}</span>
          <div className="p02-probability-row__bar"><i style={{ width: `${value * 100}%` }} /></div>
          <b>{formatProbability(value)}</b>
        </div>
      ))}
      <small>合计 1.00 · 真实标签是 class A</small>
    </div>
  );
}

function ParameterComparison({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="p02-candidate-selector" role="group" aria-label="固定数据集，切换完整参数配置">
      {PARAMETER_STATES.map((state) => <button type="button" key={state.id}
        className={selectedId === state.id ? "is-selected" : ""}
        aria-pressed={selectedId === state.id} onClick={() => onSelect(state.id)}>
        <ParameterStateNotation candidate={state.candidate} /><span>完整配置 {state.index}</span>
      </button>)}
    </div>
  );
}

export function PageProbability() {
  const [selectedId, setSelectedId] = useState("theta-b");
  const [showSoftmax, setShowSoftmax] = useState(false);
  const api = useReferenceApi();
  const selected = PARAMETER_STATES.find((state) => state.id === selectedId) ?? PARAMETER_STATES[1];
  const likelihood = useMemo(() => datasetLikelihood(selected), [selected]);
  const datasetNll = useMemo(() => negativeLogLikelihood(selected), [selected]);

  return (
    <article className="ewc-page p02-page" aria-labelledby="p02-title">
      <header className="ewc-page-header p02-header">
        <div className="ewc-page-header__kicker"><span>02</span> ORDINARY TRAINING · PROBABILITY TO LOSS</div>
        <h1 id="p02-title">怎样计算旧任务的 Loss？</h1>
        <p className="ewc-page-header__dek">P1 发现同幅参数偏移可能带来不同影响。要比较这些影响，先固定 Task A 的输入和正确答案，建立一把能评价任意参数配置的尺子。</p>
      </header>

      <section className="p02-evaluation-entry" aria-labelledby="p02-evaluation-title">
        <div><span className="p02-overline">先明确评价目标</span><h2 id="p02-evaluation-title">真实标签是 A，模型给 A 多少支持？</h2>
          <p>如果给正确答案 A 的概率是 0.9，模型较支持这个答案；若只给 0.1，支持就不足。我们希望把这种差别写成一个“越小越好”的训练目标，这就是分类 Loss 的出发点。</p></div>
        <div className="p02-label-meter" aria-label="同一真实标签 A，概率 0.9 比 0.1 更支持正确答案">
          <span>真实标签 A · 概率示意</span>{[0.9, 0.1].map(value => <div key={value}><b>{value.toFixed(1)}</b><i><em style={{width: `${value * 100}%`}} /></i><span>{value > 0.5 ? "支持较强" : "支持较弱"}</span></div>)}
        </div>
      </section>

      <section className="p02-forward" id="forward-probability" aria-labelledby="p02-forward-title">
        <div className="p02-section-heading"><div><span className="p02-overline">01 · ONE INPUT THROUGH THE NETWORK</span><h2 id="p02-forward-title">这个概率怎样从网络得到？</h2></div><span className="p02-example-badge">教学示例 · 非论文实测</span></div>

        <p className="p02-mechanism-copy">输入经过网络得到分类分数 logits，Softmax 把这些分数转成和为 1 的概率。下面保持样本 x₁ 和真实标签 A 不变，切换完整参数配置，观察输出怎样改变。</p>
        <ParameterComparison selectedId={selectedId} onSelect={setSelectedId} />
        <div className="p02-forward-path" aria-label="输入经过神经网络，得到 logits 和类别概率">
          <div className="p02-flow-node p02-flow-node--input">
            <span className="p02-node-label">INPUT</span><InputSample />
          </div>
          <span className="p02-flow-arrow" aria-hidden="true">⟶</span>
          <div className="p02-flow-node p02-flow-node--network">
            <span className="p02-node-label">CURRENT MODEL</span><div className="p02-model-state"><ReferenceTrigger id="neural_network">Neural Network f<sub>θ</sub></ReferenceTrigger><b>当前候选参数状态 <ParameterStateNotation candidate={selected.candidate} /></b></div><ForwardNetwork />
          </div>
          <span className="p02-flow-arrow" aria-hidden="true">⟶</span>
          <div className="p02-flow-node p02-flow-node--logits">
            <span className="p02-node-label">RAW OUTPUT</span><h3>logits z</h3><LogitValues values={selected.logits} />
          </div>
          <span className="p02-flow-arrow" aria-hidden="true">⟶</span>
          <div className="p02-flow-node p02-flow-node--probability">
            <span className="p02-node-label">SOFTMAX</span><h3><ReferenceTrigger id="p_theta_y_given_x">p<sub>θ</sub>(y | x)</ReferenceTrigger></h3><ProbabilityValues values={selected.probabilities} />
          </div>
        </div>

        <div className="p02-forward-caption">
          <div className="p02-forward-caption__formula" aria-label="输入 x 一，经过网络得到 logits z，再经 Softmax 得到预测概率">
            <span>x₁</span><b aria-hidden="true">→</b><span>z = f<sub>θ</sub>(x₁)</span><b aria-hidden="true">→</b><span>Softmax(z)</span><b aria-hidden="true">→</b><strong>p<sub>θ</sub>(y | x₁)</strong>
          </div>
          <p className="p02-forward-caption__note"><b>真实标签概率</b>取 class A 这一项；它越低，对应的单样本负对数 Loss 越高。</p>
        </div>

        <details className="p02-softmax-detail" open={showSoftmax} onToggle={(event) => setShowSoftmax(event.currentTarget.open)}>
          <summary aria-expanded={showSoftmax}>Softmax 怎样把 logits 变成概率？</summary>
          <div className="p02-softmax-detail__body"><MathFormula tex={String.raw`p_\theta(y=c\mid x)=\frac{e^{z_c}}{\sum_j e^{z_j}}`} /><p>它把各类别分数转换成总和为 1 的分布。主路径只需记住：网络先算 logits，Softmax 再给出类别概率。</p></div>
        </details>
      </section>

      <section className="p02-likelihood" id="likelihood-origin" aria-labelledby="p02-likelihood-title">
        <div className="p02-section-heading"><div><span className="p02-overline">02 · EXPAND FROM ONE SAMPLE TO TASK-A DATA</span><h2 id="p02-likelihood-title">一条概率评价一个样本，怎样评价整个 Task A？</h2></div><span className="p02-fixed-data"><i /> D<sub>A</sub> FIXED · θ CHANGES</span></div>

        <p className="p02-mechanism-copy">一条概率只能评价一条样本。对固定的参数 θ，让 Task A 的每条样本经过网络，取出其<strong>真实标签对应的概率</strong>。在给定输入和参数后标签条件独立的假设下，将它们相乘，就得到数据 <ReferenceTrigger id="likelihood">Likelihood</ReferenceTrigger>：同一份已观察数据在这组参数下获得的支持。</p>
        <div className="p02-dataset-definition"><span className="p02-dataset-symbol">D<sub>A</sub></span><div><b>同一份 Task A 训练数据</b><span>每个样本都保留其输入和真实标签；切换 θ 时，x 和 y 不变。</span></div><div className="p02-dataset-samples" aria-label="固定的三个 Task A 训练样本">
          {SAMPLE_NAMES.map((name, index) => <span key={name}><i>{index + 1}</i><b>{name}</b></span>)}
        </div></div>

        <div className="p02-likelihood-equation">
          <div className="p02-likelihood-formula" role="math" aria-label="Task A 数据 D A 在参数 theta 下的 likelihood 等于各样本真实标签概率的乘积">
            <MathFormula tex={String.raw`p(D_A\mid\theta)=\prod_{n=1}^{N}p_\theta(y_n\mid x_n)`} />
          </div>
          <div className="p02-sample-product" aria-live="polite" aria-label={`当前参数状态下的数据 likelihood：${selected.datasetProbabilities.map(formatProbability).join(" 乘 ")} 等于 ${likelihood.toFixed(4)}`}>
            {selected.datasetProbabilities.map((probability, index) => <Fragment key={`product-${index}`}><span className="p02-product-term"><small>y<sub>{index + 1}</sub>={String.fromCharCode(65 + index)}</small><b>{formatProbability(probability)}</b></span>{index < selected.datasetProbabilities.length - 1 ? <span className="p02-product-operator" aria-hidden="true">×</span> : null}</Fragment>)}
            <b className="p02-product-equals" aria-hidden="true">=</b>
            <span className="p02-product-result"><small>p(D<sub>A</sub> | <ParameterStateNotation candidate={selected.candidate} />)</small><b>{likelihood.toFixed(4)}</b></span>
          </div>
          <small className="p02-assumption">D<sub>A</sub> = {'{'}(xₙ, yₙ){'}'}；将输入作为条件，假设给定 θ 与输入后，各标签条件独立。p(D<sub>A</sub> | θ) 简记条件标签似然，不建模输入生成。</small>
          <p className="p02-likelihood-cause">真实标签概率降低 <span aria-hidden="true">→</span> 数据 Likelihood 降低 <span aria-hidden="true">→</span> 旧任务 NLL 升高</p>
        </div>

        <div className="p02-perspective-compare" id="likelihood-comparison" aria-label="Probability 与 Likelihood 的观察视角对比">
          <div className="p02-perspective-compare__item p02-perspective-compare__item--probability"><span>PROBABILITY · 固定 θ 和已观察输入 x</span><p>看给定输入 x 时，模型为不同标签 y 预测的条件概率：<b>看哪些标签可能对应这个输入。</b></p></div>
          <div className="p02-perspective-compare__item p02-perspective-compare__item--likelihood"><span><ReferenceTrigger id="likelihood">LIKELIHOOD · 固定已观察的 (xₙ, yₙ)</ReferenceTrigger></span><p>把已观察输入和标签保持不变，改变 θ，比较哪组参数给这些标签更高的条件似然：<b>看不同参数如何解释同一批已观察标签。</b>它是关于 θ 的函数，不是 θ 的概率分布。</p></div>
        </div>

        <details className="p02-softmax-detail">
          <summary>核对当前配置的三条 Forward 输出与真实标签概率</summary>
          <div className="p02-origin-table__scroll"><table>
            <thead><tr><th>固定样本 / 标签</th><th>logits（A, B, C）</th><th>Softmax（A, B, C）</th><th>取真实标签项</th></tr></thead>
            <tbody>{selected.sampleLogits.map((row, n) => <tr key={n}><th>{SAMPLE_NAMES[n]}</th><td>{row.map(v => v.toFixed(2)).join(", ")}</td><td>{selected.sampleProbabilities[n].map(v => v.toFixed(4)).join(", ")}</td><td>{selected.datasetProbabilities[n].toFixed(4)}</td></tr>)}</tbody>
          </table></div>
        </details>
        <p className="p02-mechanism-copy">上方选择器切换的是整组网络参数。网络输出、三条真实标签概率、Likelihood 和下方 Loss 始终使用同一配置；这比较的是整体拟合，还没有测量单个参数坐标的敏感性。</p>
        <details className="p02-softmax-detail p02-calculation-detail">
          <summary>查看教学数据与数值精度说明</summary>
          <p className="p02-boundary-note">这是教学示例，非论文实测。每个候选表示完整配置 θ⁽ᵏ⁾，不是单个坐标 θᵢ；网络图只示意结构，三组 Forward logits 预先设定，Softmax 概率由 logits 计算。屏幕显示值经舍入，Likelihood 和 NLL 使用未舍入数值。P3 复用同一份数据与 Likelihood。</p>
        </details>
      </section>

      <section className="p02-loss-update" id="loss-and-update" aria-labelledby="p02-loss-title">
        <div className="p02-section-heading"><div><span className="p02-overline">03 · TURN SUPPORT INTO LOSS</span><h2 id="p02-loss-title">最大化 Likelihood，等价于最小化负对数损失</h2></div><p>负号把“概率越大越好”改写成“Loss 越小越好”；对数把样本概率的乘积改写为求和。</p></div>
        <div className="p02-nll-visual" aria-label="负对数似然计算图">
          <div className="p02-nll-visual__formula">
            <span>NEGATIVE LOG-LIKELIHOOD · NLL</span>
            <MathFormula block tex={String.raw`\begin{aligned}L_A(\theta)&=-\log p(D_A\mid\theta)\\&=-\log\prod_{n=1}^{N}p_\theta(y_n\mid x_n)\\&=-\sum_{n=1}^{N}\log p_\theta(y_n\mid x_n)\end{aligned}`} />
            <p>在样本标签条件独立的假设下，取负对数把概率乘积改写为逐样本求和。</p>
          </div>
          <div className="p02-nll-example">
            <div className="p02-nll-example__heading">
              <span>当前完整配置 <ParameterStateNotation candidate={selected.candidate} /></span>
              <span>固定 Task A · 3 个真实标签</span>
            </div>
            <div className="p02-nll-example__calculation" aria-live="polite" aria-label={`配置 ${selected.index} 的 NLL 计算：真实标签概率 ${selected.datasetProbabilities.map((probability) => probability.toFixed(4)).join(" 乘 ")}，Likelihood ${likelihood.toFixed(4)}，总 NLL ${datasetNll.toFixed(4)}`}>
              {selected.datasetProbabilities.map((probability, index) => <Fragment key={`nll-sample-${index}`}>
                <span className="p02-nll-example__sample"><small>样本 {index + 1} · y<sub>{index + 1}</sub>={String.fromCharCode(65 + index)}</small><strong>{probability.toFixed(4)}</strong></span>
                {index < selected.datasetProbabilities.length - 1 ? <span className="p02-nll-example__operator" aria-hidden="true">×</span> : null}
              </Fragment>)}
              <span className="p02-nll-example__operator" aria-hidden="true">=</span>
              <span className="p02-nll-example__likelihood"><small>Likelihood</small><strong>{likelihood.toFixed(4)}</strong></span>
              <span className="p02-nll-example__arrow" aria-hidden="true">→</span>
              <span className="p02-nll-example__result"><small>总 NLL · 越小越好</small><strong>−log({likelihood.toFixed(4)}) = {datasetNll.toFixed(4)}</strong></span>
            </div>
            <p className="p02-nll-example__note">概率显示为四位小数；Likelihood 与 NLL 使用未舍入数值。切换前面的完整参数配置时，这组计算会同步更新。</p>
          </div>
        </div>
        <details className="p02-softmax-detail p02-nll-detail">
          <summary>了解总 NLL、平均 Loss 与数值尺度</summary>
          <div className="p02-softmax-detail__body"><MathFormula tex={String.raw`L_{\mathrm{NLL}}(\theta)=-\sum_{n=1}^{N}\log p_\theta(y_n\mid x_n)`} /><p>本页以总 NLL 表示旧目标。若训练使用平均交叉熵，则为总 NLL 除以样本数 N；两者最优位置相同，但梯度及其与 Fisher 惩罚的相对尺度不同。本例 N={selected.datasetProbabilities.length}，总 NLL={datasetNll.toFixed(4)}，平均值={(datasetNll / selected.datasetProbabilities.length).toFixed(4)}。</p></div>
        </details>
        <details className="p02-softmax-detail" open><summary>这个 Loss 怎样进入普通训练？</summary>
        <div className="p02-training-chain" aria-label="Likelihood 变成 Loss，计算梯度后更新参数">
          <div className="p02-training-node p02-training-node--loss"><span>OLD TASK LOSS</span><strong>L<sub>A</sub>(θ)</strong><small>真实标签概率的负对数</small></div><span className="p02-training-arrow" aria-hidden="true">→</span>
          <div className="p02-gradient-node"><span>BACKWARD</span><strong>∇<sub>θ</sub>L</strong><div aria-hidden="true"><i /><i /><i /><i /></div><small>loss 对参数的梯度</small></div><span className="p02-training-arrow" aria-hidden="true">→</span>
          <div className="p02-update-node"><span>OPTIMIZER STEP</span><strong>θ ← θ − η∇<sub>θ</sub>L<sub>A</sub></strong><small>参数状态改变</small></div>
        </div>
        <div className="p02-update-return"><span className="p02-update-return__line" aria-hidden="true"/><p>更新后的 <em>θ</em> 返回同一个模型；下一批样本再经过新的前向计算。</p><ReferenceTrigger id="optimizer_step">反向计算梯度与 optimizer.step() 是两个不同动作</ReferenceTrigger></div>
        </details>
      </section>

      <section className="p02-handoff" aria-label="通往下一页的问题">
        <div><span className="p02-overline">NEXT · BAYESIAN PARAMETER VIEW</span><h2>能评价旧数据，还缺少怎样的记忆？</h2><p>现在可以计算任意参数配置的旧 Loss，也能通过训练找到较低 Loss 的旧解。但“最好的参数在哪里”与“偏离它会多快损害旧任务”是两个问题。Task B 还要更新参数，旧数据的影响需要持续保留下来。</p><p>EWC 选择 Bayesian 视角：用 <ReferenceTrigger id="prior">Prior</ReferenceTrigger> 表达已有参数知识，用旧数据把它更新为 Posterior，再将这个分布传给下一任务。这提供了继承、继续更新旧信息的机制；随后才提取旧解附近的约束。</p></div>
        <div className="p02-handoff__question"><span>OPEN QUESTION</span><b>p(θ) = ?</b><small>怎样保留旧数据的影响？</small></div>
      </section>

      <div className="p02-review-exit"><span>从拟合分数到参数分布</span><button type="button" onClick={() => api.navigatePage("page-03-bayes")}>下一页：参数的 Prior 与 Posterior →</button></div>
    </article>
  );
}
