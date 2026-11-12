import "./p8-algorithm-guide.css";

const training = [
  { id: "init", depth: 0, title: "初始化", description: "训练开始时只做一次。", code: ["K, P, φ ← 初始化()", "冻结(fₑ, fᵣ)"] },
  { id: "task", depth: 0, title: "Task", description: "换任务数据，沿用当前参数。", code: ["for task in 数据流:"] },
  { id: "epoch", depth: 1, title: "Epoch", description: "在当前任务数据上再走一轮。", code: ["  for epoch in task:"] },
  { id: "batch", depth: 2, title: "Batch", description: "新批次清空损失和选集，读取当前模型。", code: ["    for B in epoch:", "      L_B ← 0; S_B ← ∅"] },
  { id: "sample", depth: 3, title: "Sample", description: "每张图走完下面三步。", code: ["      for (x, y) in B:"] },
  { id: "lookup", depth: 4, title: "寻址", description: "用图像的 Query 选槽位。", code: [
    "        q ← 冻结 ViT(x)[CLS]  # 无 Prompt",
    "        S ← TopN(γ(q, K))     # 式 (3)",
  ] },
  { id: "classify", depth: 4, title: "分类", description: "拼接 Prompt，读出类别分数。", code: [
    "        H ← fᵣ([P[S]; fₑ(x)])",
    "        z ← gφ(AvgPool(H[0 : N·Lₚ, :]))",
  ] },
  { id: "collect", depth: 4, title: "累积", description: "加上损失、并入选集，参数仍保持原值。", code: [
    "        L_B += CE(z, y) + λ Σⱼ∈S γ(q, kⱼ)",
    "        S_B ← S_B ∪ S",
  ] },
  { id: "write", depth: 2, title: "回到 Batch", description: "样本循环结束，整批只写回一次。", code: ["      Backward(L_B)", "      OptimizerStep(K[S_B], P[S_B], φ)"] },
];

const inference = [
  "q ← 冻结 ViT(x)[CLS]  # 无 Prompt",
  "S ← TopN(γ(q, K))     # 式 (3)",
  "H ← fᵣ([P[S]; fₑ(x)])",
  "预测 ← argmax gφ(AvgPool(H[0 : N·Lₚ, :]))",
];

export function P8AlgorithmGuide() {
  return <figure className="p8-algorithm" aria-label="训练循环与伪代码逐段对照">
    <div className="p8-algorithm__frame">
      <div className="p8-algorithm__head"><span>循环层级</span><span>Algorithm 1 · 基础训练伪代码</span></div>
      <ol>
        {training.map(row => <li key={row.id} data-depth={row.depth} data-step={row.id}>
          <div className="p8-algorithm__label"><strong>{row.title}</strong><span>{row.description}</span></div>
          <pre><code>{row.code.join("\n")}</code></pre>
        </li>)}
      </ol>
      <div className="p8-algorithm__inference">
        <div className="p8-algorithm__label"><strong>推断 · 只读</strong><span>只给图像，输出类别；已有参数继续保留。</span></div>
        <pre><code>{inference.join("\n")}</code></pre>
      </div>
    </div>
    <figcaption>左边读执行范围，右边读实际缩进。<code>OptimizerStep</code> 退回到了 <code>for (x, y) in B</code> 的缩进，表示写回在样本循环之外、批次循环之内。</figcaption>
  </figure>;
}
