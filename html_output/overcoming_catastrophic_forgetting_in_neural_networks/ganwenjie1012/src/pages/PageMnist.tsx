import { useMemo, useState } from "react";
import { PaperFigure } from "../shared/core/paper-figure/PaperFigure";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import "../styles/page8.css";

const TASKS = [
  { id: "A", seed: 7409, permutation: "π_A" },
  { id: "B", seed: 19073, permutation: "π_B" },
  { id: "C", seed: 32603, permutation: "π_C" },
] as const;

const DIGIT_THREE = ["0111110", "1100011", "0000011", "0011100", "0000011", "1100011", "0111110"];
const MNIST_PIXELS = DIGIT_THREE.flatMap((row) => {
  const expandedRow = Array.from(row).flatMap((pixel) => Array(4).fill(pixel === "1" ? 1 : 0));
  return Array(4).fill(expandedRow).flat();
});

function createFixedPermutation(length: number, seed: number): number[] {
  const positions = Array.from({ length }, (_, index) => index);
  let state = seed >>> 0;
  for (let index = positions.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [positions[index], positions[target]] = [positions[target], positions[index]];
  }
  return positions;
}

const FIXED_PERMUTATIONS = TASKS.map((task) => createFixedPermutation(MNIST_PIXELS.length, task.seed));

function PixelGrid({ pixels, label, className = "" }: { pixels: number[]; label: string; className?: string }) {
  return (
    <div className={`p08-pixel-grid ${className}`} role="img" aria-label={label}>
      {pixels.map((pixel, index) => <span key={index} className={pixel ? "is-ink" : ""} aria-hidden="true" />)}
    </div>
  );
}

const METHODS = [
  {
    id: "sgd", label: "Sequential SGD", color: "blue",
    title: "先观察没有旧任务约束的更新",
    description: "每个阶段只优化当前任务的 Loss。读 Figure 2A 蓝线：训练转到后续任务后，较早任务的正确率会下降。",
    question: "旧任务的测试表现，在后续训练后还剩多少？",
  },
  {
    id: "l2", label: "Uniform L2", color: "green",
    title: "统一限制每个参数的偏移",
    description: "Uniform L2 给所有参数同样的约束强度。Figure 2A 的绿色曲线用于比较统一约束与按参数 Fisher 加权后的表现。",
    question: "统一约束能否同时保留旧任务并让新任务学好？",
  },
  {
    id: "ewc", label: "EWC", color: "red",
    title: "按 Fisher 调整参数约束强度",
    description: "在论文这组顺序分类实验中，EWC 曲线保持较高的旧任务表现，同时继续学习后续任务。结论限定在该实验设置。",
    question: "参数级权重怎样影响旧任务保持与新任务学习？",
  },
] as const;

export function PageMnist() {
  const [taskIndex, setTaskIndex] = useState(0);
  const [methodIndex, setMethodIndex] = useState(0);
  const api = useReferenceApi();
  const task = TASKS[taskIndex];
  const method = METHODS[methodIndex];
  const permutedPixels = useMemo(() => {
    const shuffled = new Array<number>(MNIST_PIXELS.length).fill(0);
    FIXED_PERMUTATIONS[taskIndex].forEach((targetIndex, sourceIndex) => {
      shuffled[targetIndex] = MNIST_PIXELS[sourceIndex];
    });
    return shuffled;
  }, [taskIndex]);

  return (
    <article className="p08-page">
      <header className="p08-header ewc-page-header">
        <span className="p08-eyebrow">PAGE 08 · CONTROLLED CLASSIFICATION</span>
        <h1>Permuted MNIST：受控顺序分类实验</h1>
        <p className="ewc-page-header__dek">先看任务怎样构造，再看论文如何比较遗忘与新任务学习。</p>
      </header>

      <section className="p08-dataset" id="permuted-mnist-task" aria-labelledby="p08-dataset-title">
        <div className="p08-section-heading">
          <div><span className="p08-overline">DATASET · TASK CONSTRUCTION</span><h2 id="p08-dataset-title"><ReferenceTrigger id="permuted_mnist">MNIST</ReferenceTrigger> 的输入如何变成多个任务</h2></div>
          <span className="p08-source-note">像素图是操作示意，不是论文样本</span>
        </div>
        <p className="p08-section-lead">MNIST 用 28 × 28 灰度图像识别手写数字。每张图展开为 784 个像素值，类别仍是 0–9。</p>

        <div className="p08-transform" aria-label="图像像素经过固定排列后用于分类">
          <div className="p08-transform__input">
            <span>输入图像</span>
            <PixelGrid pixels={MNIST_PIXELS} label="教学示意的 28 乘 28 灰度数字图像" />
            <b>28 × 28</b>
            <small>手写数字 · 灰度像素</small>
          </div>
          <div className="p08-transform__link" aria-hidden="true"><i /></div>
          <div className="p08-transform__vector">
            <span>展开 Flatten</span>
            <div className="p08-vector-example" aria-label="像素向量 x 属于实数 784 维">
              <code>[x₁, x₂, x₃, …, x₇₈₄]</code>
              <b>x ∈ ℝ<sup>784</sup></b>
            </div>
            <small>每个像素对应一个位置</small>
          </div>
          <div className="p08-transform__link" aria-hidden="true"><i /></div>
          <div className="p08-transform__output">
            <span>{task.permutation} · 固定排列</span>
            <PixelGrid pixels={permutedPixels} label={`${task.id} 任务固定像素排列后的 28 乘 28 示意图`} />
            <b>x<sup>({task.id})</sup> = {task.permutation}(x)</b>
            <small>输出类别仍为 0–9</small>
          </div>
        </div>

        <div className="p08-task-picker" role="group" aria-label="选择一个任务的固定像素排列">
          <div><span className="p08-overline">CHOOSE A TASK</span><p>不同 Task 使用不同的固定排列</p></div>
          <div className="p08-task-picker__buttons">{TASKS.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={taskIndex === index} className={taskIndex === index ? "is-active" : ""} onClick={() => setTaskIndex(index)}>
              <b>Task {item.id}</b><small>{item.permutation}</small>
            </button>
          ))}</div>
        </div>

        <div className="p08-fixed-permutation">
          <div className="p08-fixed-permutation__label"><b>{task.permutation} 在 Task {task.id} 内保持不变</b><span>不同图像使用同一个映射</span></div>
          <div className="p08-sample-flow" aria-label={`Task ${task.id} 中的样本共用固定排列 ${task.permutation}`}>
            {[1, 2, 3].map((sample) => <div key={sample}><span>x<sub>{sample}</sub></span><i>{task.permutation}</i><b>x<sub>{sample}</sub><sup>({task.id})</sup></b></div>)}
          </div>
          <p>随机的是每个任务所选的映射；训练与测试样本都使用该任务的同一映射，标签不变。置换可逆，没有删掉像素信息，所以仍可学习数字分类；但同一输入坐标在不同任务中对应不同原图位置，网络必须适应不同映射，共享参数更新便可能干扰旧任务。</p>
        </div>
      </section>

      <section className="p08-protocol" id="protocol-before-results" aria-labelledby="p08-protocol-title">
        <div className="p08-section-heading">
          <div><span className="p08-overline">PROTOCOL BEFORE RESULTS</span><h2 id="p08-protocol-title">用同一个模型依次学习多个任务</h2></div>
        </div>
        <ol className="p08-protocol-flow">
          <li><span>01</span><b>构造任务</b><p>Task A、B、C 分别使用 π_A、π_B、π_C，类别保持为数字 0–9。</p></li>
          <li><span>02</span><b>顺序训练</b><p>同一个网络依次训练各 Task；切换后不再用旧任务样本继续训练。</p></li>
          <li><span>03</span><b>分别评估</b><p>检查当前任务的学习效果，也复测前面任务的测试集表现。</p></li>
        </ol>
        <p className="p08-protocol-note">十类输出始终共用，类别空间没有增长。每个任务的测试 Accuracy 是预测正确样本数 / 该任务测试样本数；复测旧任务观察保持程度，当前任务正确率观察学习能力。Figure 2B 的平均正确率汇总已训练任务，可能掩盖单任务差异，需与 2A 一起读。</p>
      </section>

      <section className="p08-baselines" aria-labelledby="p08-baselines-title">
        <div className="p08-section-heading">
          <div><span className="p08-overline">THREE COMPARISONS</span><h2 id="p08-baselines-title">每个 Baseline 回答一个问题</h2></div>
        </div>
        <div className="p08-baseline-list">
          <article><span className="p08-method-mark p08-method-mark--blue" /><div><h3>Sequential SGD / Fine-tuning</h3><p>只优化当前任务；检验不保护旧参数时遗忘会怎样累积。</p></div><small>没有旧任务惩罚</small></article>
          <article><span className="p08-method-mark p08-method-mark--green" /><div><h3>Uniform L2</h3><p>围绕旧解对所有参数施加相同强度的偏移约束。</p></div><small>每个坐标权重相同</small></article>
          <article><span className="p08-method-mark p08-method-mark--red" /><div><h3>EWC</h3><p>同样围绕旧解约束偏移，但按 Fisher 对参数逐项加权。</p></div><small>坐标权重由 Fisher 区分</small></article>
        </div>
      </section>

      <section className="p08-results" id="forgetting-and-plasticity" aria-labelledby="p08-results-title">
        <div className="p08-section-heading">
          <div><span className="p08-overline">READ THE EVIDENCE</span><h2 id="p08-results-title">遗忘与新任务学习要一起看</h2></div>
          <p>选择一种方法，先明确读图问题，再回到论文曲线比较。</p>
        </div>
        <div className="p08-reading-focus" role="group" aria-label="选择结果阅读重点">
          {METHODS.map((item, index) => <button key={item.id} type="button" aria-pressed={methodIndex === index} className={`p08-reading-focus__button p08-reading-focus__button--${item.color} ${methodIndex === index ? "is-active" : ""}`} onClick={() => setMethodIndex(index)}>{item.label}</button>)}
        </div>
        <div className={`p08-method-reading p08-method-reading--${method.color}`} aria-live="polite">
          <span className={`p08-method-mark p08-method-mark--${method.color}`} />
          <div><h3>{method.title}</h3><p>{method.description}</p></div>
          <strong>{method.question}</strong>
        </div>

        <div className="p08-result-figure">
          <PaperFigure
            src={new URL("images/figure-2.png", document.baseURI).toString()}
            mode="crop"
            figureLabel="论文 Figure 2A–C"
            alt="论文 Figure 2 的三个面板：A 为 EWC、L2 和普通 SGD 在三个依次训练任务上的正确率曲线；B 为任务数增加时 EWC 与 SGD 加 Dropout 的平均正确率；C 为两种像素排列幅度下，不同网络深度的 Fisher overlap。"
            caption="A 比较三个顺序任务上的 EWC、Uniform L2 与普通 SGD。B 比较 EWC 与 SGD 加 Dropout 的平均表现，虚线表示单任务表现。原图的三个面板与曲线均完整保留。"
            source="Kirkpatrick et al., PNAS 2017, Figure 2, PDF pp. 3–4. Reproduced unchanged for noncommercial educational use."
          />
        </div>

        <div className="p08-reading-questions">
          <article><span>FORGETTING</span><h3>后续训练后，旧任务还能做对多少？</h3><p>看 Task A、B 的测试表现如何随训练推进而变化。</p></article>
          <article><span>PLASTICITY</span><h3>模型还能学会当前的新任务吗？</h3><p>同时检查模型是否能在每个新 Task 上获得较好的表现。</p></article>
        </div>
        <p className="p08-result-boundary"><b>证据范围（R01，PDF pp. 3–4，§2.1 / Figure 2）：</b>论文使用全连接 ReLU 网络、固定任务训练时长与清晰边界。2A 是三个置换任务的 EWC / Uniform L2 / SGD 对照；2B 随任务数增加比较 EWC 与 SGD + Dropout。结果在这些网络、置换和训练设置下支持保持旧任务并继续学习，不能推为所有持续学习环境的保证。</p>
      </section>

      <details className="p08-overlap" id="fisher-overlap">
        <summary><span><small>SECOND-LAYER ANALYSIS</small><b>Fisher overlap：不同任务依赖的参数方向重合多少？</b></span><i aria-hidden="true" /></summary>
        <div className="p08-overlap__content">
          <p>Figure 2C 比较 8 × 8 与 26 × 26 区域的像素排列。论文报告，更相似的排列有较高的 Fisher overlap；排列差异较大的任务，在浅层显示出较低的 overlap。这是对参数依赖的分析，<strong>不是 EWC 的训练步骤。</strong></p>
          <p>这个趋势只对应论文所用的置换方案、网络与 overlap 指标，不能当作网络容量普遍分解的结论。</p>
          <button type="button" onClick={() => api.openHub("fisher_information")}>在 Reference Hub 回顾 Fisher</button>
        </div>
      </details>

      <aside className="p08-boundary" aria-label="Permuted MNIST 的证据边界">
        <div><span className="p08-overline">WHAT THIS EXPERIMENT ESTABLISHES</span><h2>这是一个可控的机制检验</h2></div>
        <p>Permuted MNIST 提供清晰的任务边界与受控输入变化。它支持我们观察顺序分类中的参数干扰；后续页面会看 EWC 放入强化学习系统后，Replay、Task Recognition 与参数保护如何分工。</p>
        <button type="button" onClick={() => api.navigatePage("page-09-atari")}>继续到 Page 9 · Atari 系统与边界</button>
      </aside>
    </article>
  );
}
