import type { ReferenceRegistry } from "../shared/reference/types";

/** EWC 统一知识来源：summary/role 用于速览，details 用于 Hub。 */
export const referenceRegistry: ReferenceRegistry = {
  continual_learning: {
    hoverCopy: {
      title: "持续学习 · Continual learning",
      summary: "任务数据按顺序到来，模型用同一组参数继续学习，并尽量保留旧任务能力。",
      role: "新任务持续修改共享参数，可能破坏旧任务预测；需要同时考虑适应与保持。",
    },
    "id": "continual_learning",
    "kind": "term",
    "title": "Continual learning",
    "summary": "Sequentially learn new tasks with the same model while preserving performance on earlier tasks.",
    "role": "Sets up the parameter-interference problem: updates for Task B can change weights that Task A also needs.",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B06",
      "C10"
    ],
    "relatedIds": [
      "catastrophic_forgetting",
      "parameter_interference"
    ],
    "relatedPages": [
      {
        "pageId": "page-01-problem",
        "anchorId": "problem-context"
      }
    ],
    "details": [
      {
        "label": "Task-IL · Task-incremental learning",
        "text": "The task identity is available at test time, so the model can predict within the current task's label set."
      },
      {
        "label": "Domain-IL · Domain-incremental learning",
        "text": "The label set stays fixed while the input context changes; task identity is not supplied at test time."
      },
      {
        "label": "Class-IL · Class-incremental learning",
        "text": "New classes arrive over time; without a task ID, the model must predict among all classes seen so far."
      },
      {
        "label": "EWC paper · Permuted MNIST",
        "text": "Each task applies a different fixed pixel permutation to the same digit-classification data. Labels remain 0–9 and the classifier output is shared, so this setup corresponds to Domain-IL."
      }
    ],
    "keywords": [
      "continual learning",
      "lifelong learning",
      "持续学习",
      "Task-IL",
      "Domain-IL",
      "Class-IL"
    ]
  },
  catastrophic_forgetting: {
    hoverCopy: {
      title: "灾难性遗忘 · Catastrophic Forgetting",
      summary: "继续训练新任务时，模型参数可能改变，导致旧任务上的表现明显下降。",
      role: "当新任务更新了旧任务也依赖的共享参数，旧任务能力就可能丢失。",
      confusion: "它描述的是连续学习的一种失效现象，不是一种参数更新规则。",
    },
    "id": "catastrophic_forgetting",
    "kind": "term",
    "title": "Catastrophic Forgetting",
    "summary": "Later-task updates to a shared network can reduce performance on an earlier task.",
    "role": "Names a possible failure of sequential learning when later updates reduce earlier-task performance.",
    "confusion": "It is a failure mode of sequential learning, not a separate parameter-update rule.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C01"
    ],
    "relatedIds": [
      "parameter_interference",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-01-problem",
        "anchorId": "parameter-conflict"
      }
    ],
    "keywords": [
      "forgetting",
      "遗忘",
      "旧任务性能",
      "shared parameters"
    ]
  },
  parameter_interference: {
    hoverCopy: {
      title: "共享参数干扰 · Shared-parameter interference",
      summary: "Task A 和 Task B 会共同依赖同一组网络参数。",
      role: "Task B 的更新因此可能改变 Task A 所需的参数状态，这是连续训练导致遗忘的机制线索。",
      confusion: "本页的性能变化是机制示意，不是论文报告的准确率数据。",
    },
    "id": "parameter_interference",
    "kind": "term",
    "title": "Shared-parameter interference",
    "summary": "Task A and Task B depend on the same model parameters.",
    "role": "Connects continued training to the risk of damaging an earlier task.",
    "confusion": "The comparison on Page 1 is schematic and does not report accuracy measurements.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C01",
      "C02"
    ],
    "relatedIds": [
      "catastrophic_forgetting",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-01-problem",
        "anchorId": "parameter-conflict"
      }
    ],
    "keywords": [
      "shared weights",
      "参数冲突",
      "parameter update"
    ]
  },
  ewc: {
    hoverCopy: {
      title: "弹性权重固结（EWC）",
      summary: "EWC 按旧任务参数的重要性，对偏离旧解的幅度施加不同强度的二次惩罚。",
      role: "约束旧任务依赖的参数位置，同时允许模型继续学习新任务。",
      confusion: "EWC 不会冻结所有参数；重要参数仍可变化，只是变化代价更高。",
    },
    "id": "ewc",
    "kind": "term",
    "title": "Elastic Weight Consolidation",
    "fullName": "Elastic Weight Consolidation",
    "summary": "EWC adds an importance-weighted quadratic constraint around an earlier task solution.",
    "role": "Preserves selected earlier-task parameter constraints while learning a later task.",
    "confusion": "EWC constrains parameter movement; it does not freeze all important parameters.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C02",
      "C06"
    ],
    "relatedIds": [
      "theta_a_star",
      "fisher_a",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "EWC",
      "parameter consolidation",
      "regularization"
    ]
  },
  normal_training: {
    hoverCopy: {
      title: "普通训练 · Normal training",
      summary: "针对当前任务的 Loss 计算梯度，并由 optimizer.step() 更新参数。",
      role: "Page 5 用它和 Fisher Estimation 对照：普通训练会移动 θ；估计 Fisher 时参数固定。",
      confusion: "Backward 计算梯度；只有执行 optimizer.step() 才会更新参数。",
    },
    "id": "normal_training",
    "kind": "method",
    "title": "Normal training",
    "summary": "The ordinary parameter-updating pass that optimizes the current task's loss.",
    "role": "Contrasts with the Fisher-estimation pass, which computes gradients while keeping parameters fixed.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M03"
    ],
    "relatedIds": [
      "optimizer_step",
      "fisher_estimation",
      "task_b_loss"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "training-vs-estimation"
      }
    ],
    "keywords": [
      "ordinary training",
      "normal training",
      "普通训练",
      "optimizer update"
    ],
    "confusion": "Backward computes gradients; parameters change only when optimizer.step() is called."
  },
  fisher_information: {
    hoverCopy: {
      title: "Fisher Information · Fisher 信息",
      summary: "完整 Fisher 矩阵的一般形式是 score gradient 的外积期望；EWC 使用其对角近似来表示参数级局部敏感性。",
      role: "在 EWC 中，对角 Fisher 近似 Task A 解附近的局部精度，用来区分参数约束的相对强弱。",
      confusion: "Page 5 / 10 的 observed-label empirical-Fisher 逐样本梯度平方是教学背景示例；2017 年论文没有规定这一通用估计配方。对角 Fisher 也不是完整 Hessian 的精确值。",
    },
    "id": "fisher_information",
    "kind": "term",
    "title": "Fisher Information",
    "summary": "The full Fisher matrix is an expectation of score-gradient outer products; EWC uses its diagonal approximation for local precision.",
    "role": "Weights the quadratic penalty differently for different parameters.",
    "confusion": "It is an approximation, not an exact parameter-importance score or an exact full Hessian.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05",
      "C11"
    ],
    "relatedIds": [
      "fisher_a",
      "fisher_a_i",
      "laplace_approximation",
      "ewc_penalty"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "fisher-handoff"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "F_A",
      "local sensitivity",
      "precision",
      "局部敏感性",
      "参数重要性"
    ],
    "details": [
      {
        "label": "General definition",
        "text": "F(θ)=Eₓ,y∼pθ[ggᵀ], where g=∇θ log pθ(y|x). The model-distribution expectation of score outer products is positive semidefinite; for a small displacement, the change in predictive KL is approximately ½ΔθᵀFΔθ.",
        "sourceRefs": [
          "B05"
        ]
      },
      {
        "label": "EWC approximation",
        "text": "A full matrix requires P² values; the diagonal approximation stores P coordinate-wise values and ignores coupling. The paper uses diagonal Fisher to approximate local precision; it is not exactly the finite-data posterior Hessian.",
        "sourceRefs": [
          "C04",
          "C05",
          "C11"
        ]
      },
      {
        "label": "Empirical-estimator boundary",
        "text": "Page 5 uses the per-sample squared score of observed labels as a teaching estimator. Because labels come from the dataset rather than the model distribution, this generally differs from the expected Fisher; the 2017 paper does not prescribe this estimator.",
        "sourceRefs": [
          "B02",
          "B03"
        ]
      }
    ]
  },
  laplace_approximation: {
    hoverCopy: {
      title: "Laplace 局部近似 · Laplace approximation",
      summary: "在 Task A 学到的参数位置附近，用 Gaussian 近似复杂的参数 Posterior。",
      role: "它把局部曲率与 Gaussian 的宽窄联系起来，为后续理解 EWC 的参数约束作准备。",
      confusion: "局部 Hessian 是解释近似的数学视图；论文使用对角 Fisher 作为精度近似，并非精确的完整 Hessian。",
    },
    "id": "laplace_approximation",
    "kind": "term",
    "title": "Laplace approximation",
    "summary": "A local Gaussian approximation around a trained parameter solution, using local curvature information.",
    "role": "Connects the earlier-task solution to the local precision approximation used to motivate EWC.",
    "confusion": "EWC uses a diagonal Fisher approximation for local precision; it is not the exact posterior Hessian.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05"
    ],
    "relatedIds": [
      "fisher_information",
      "fisher_a",
      "local_precision",
      "theta_a_star"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "laplace-local-view"
      }
    ],
    "keywords": [
      "local Gaussian",
      "posterior approximation",
      "Laplace"
    ]
  },
  local_precision: {
    hoverCopy: {
      title: "局部精度 · Local Precision",
      summary: "描述局部 Gaussian 沿不同参数方向收缩得有多紧。",
      role: "在近似的数学视图中，精度越高的方向越窄，同等距离的参数移动对应更大的局部变化。",
      confusion: "论文用对角 Fisher 近似局部精度；不能据此说它等于完整 Hessian。",
    },
    "id": "local_precision",
    "kind": "term",
    "title": "Local precision",
    "summary": "The local Gaussian's inverse covariance, which indicates how narrowly it concentrates in each direction.",
    "role": "Connects curvature and posterior width to the diagonal-Fisher approximation used to motivate EWC.",
    "confusion": "The diagonal Fisher used by EWC approximates local precision; it is not the exact full Hessian.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05"
    ],
    "relatedIds": [
      "laplace_approximation",
      "fisher_information",
      "fisher_a"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "narrow-wide-directions"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      }
    ],
    "keywords": [
      "local precision",
      "Gaussian width",
      "局部精度",
      "曲率"
    ],
    "details": [
      {
        "label": "Curvature and width",
        "text": "For a positive-definite local precision H, the Gaussian covariance is H⁻¹. A displacement Δθ increases the negative log density by ½ΔθᵀHΔθ; greater precision means a narrower distribution along that direction.",
        "sourceRefs": [
          "C04"
        ]
      }
    ]
  },
  fisher_estimation: {
    hoverCopy: {
      title: "Fisher 估计流程",
      summary: "Task A 训练结束后，在固定的 θ_A* 附近计算所选敏感性估计。",
      role: "本教程的流程开启梯度计算、关闭 optimizer.step()，因此不会更新模型参数。",
      confusion: "固定参数与具体经验 Fisher 配方属于教程实现映射；论文没有规定这里展示的逐样本经验 Fisher 算法。",
    },
    "id": "fisher_estimation",
    "kind": "phase",
    "title": "Fisher estimation",
    "summary": "A fixed-parameter pass accumulates the selected sensitivity estimate after Task A training.",
    "role": "Produces the earlier-task Fisher values used by the following EWC objective.",
    "confusion": "The tutorial mode computes gradients but keeps optimizer.step() off, so parameters stay fixed.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M03"
    ],
    "relatedIds": [
      "theta_a_star",
      "fisher_a",
      "empirical_fisher_estimator_background"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-estimation"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "training-vs-estimation"
      }
    ],
    "keywords": [
      "consolidation",
      "no optimizer update",
      "不更新参数"
    ]
  },
  empirical_fisher_estimator_background: {
    hoverCopy: {
      title: "观测标签 Empirical Fisher · 教学背景",
      summary: "对每个观测标签样本计算 log probability 的 score gradient，外积后按样本求和或平均。",
      role: "本页取对角项，即逐参数梯度平方，再跨 Task A 样本平均，演示估计值如何进入 Fisher accumulator。",
      confusion: "这不是 2017 年 EWC 论文规定的 Fisher 估计配方，也不同于对模型预测分布取期望的 Fisher。",
    },
    "id": "empirical_fisher_estimator_background",
    "kind": "advanced",
    "title": "Observed-label empirical Fisher (background)",
    "summary": "The W6 walkthrough uses an observed-label per-example score-gradient square and sample average as a selected background estimator.",
    "role": "Makes the estimator-to-accumulator path concrete for the slice.",
    "confusion": "The 2017 EWC paper does not specify this general per-example empirical-Fisher recipe; it is distinct from expected Fisher.",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B02",
      "B03"
    ],
    "relatedIds": [
      "fisher_estimation",
      "fisher_information"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "square-and-aggregate"
      }
    ],
    "boundary": "A selected teaching example, not a claim about the estimator used by Kirkpatrick et al.",
    "keywords": [
      "empirical Fisher",
      "observed label",
      "gradient square",
      "background"
    ]
  },
  theta_a_star: {
    hoverCopy: {
      title: "Task A 参数锚点 · θ_A*",
      summary: "Task A 普通训练结束时学到的参数位置。",
      role: "Laplace 近似以它为局部中心；后续 Fisher 与 EWC 使用这个旧任务参考位置。",
      confusion: "θ_A* 是固定的旧参数快照，不会跟着当前参数 θ 一起变化。",
    },
    "id": "theta_a_star",
    "kind": "symbol",
    "title": "Task-A anchor",
    "summary": "The parameter vector reached at the end of ordinary Task-A training.",
    "role": "Centers the later quadratic constraint and stays fixed as the current parameters change.",
    "confusion": "The anchor is a frozen snapshot, not a live reference to the changing parameter vector.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C06"
    ],
    "symbol": "θ_A*",
    "createdWhen": "After normal training on Task A.",
    "usedWhen": "During Fisher estimation and Task-B EWC updates.",
    "runtimeObject": "task-a-anchor",
    "trainable": "No; this saved reference stays fixed.",
    "relatedIds": [
      "fisher_a",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "posterior-global-to-local"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-estimation"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "anchor",
      "theta A star",
      "旧任务位置",
      "saved parameters"
    ]
  },
  fisher_a: {
    hoverCopy: {
      title: "Task A 对角 Fisher · F_A",
      summary: "与 Task A 已学参数位置对应的 Fisher 局部敏感性近似。",
      role: "它逐参数提供相对敏感程度，供 Task B 的 EWC 约束使用。",
      confusion: "本页逐样本观测标签梯度平方的估计流程是教学背景示例；论文没有规定这一具体配方。",
    },
    "id": "fisher_a",
    "kind": "symbol",
    "title": "Task-A Fisher estimate",
    "summary": "The parameter-wise diagonal Fisher estimate associated with Task A.",
    "role": "Supplies relative weights for the Task-A constraint during later-task training.",
    "confusion": "The particular per-example estimator illustrated on Page 5 is tutorial background, not a recipe stated by the paper.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05"
    ],
    "symbol": "F_A",
    "createdWhen": "At the Task-A boundary, after its solution is reached.",
    "usedWhen": "As a weight in the Task-B EWC penalty.",
    "runtimeObject": "task-a-fisher",
    "typicalShape": "Aligned with parameter blocks; mathematically parameter-wise.",
    "relatedIds": [
      "fisher_information",
      "theta_a_star",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "Fisher",
      "F_A",
      "Task A importance"
    ]
  },
  fisher_a_i: {
    hoverCopy: {
      title: "单参数 Fisher 权重 · F_A,i",
      summary: "Task A 局部敏感性近似中，与参数 θ_i 对应的对角值。",
      role: "它为 Task B 中同一参数的偏移设置相对约束强度。",
      confusion: "图中的 Layer 只是分组显示；每个参数仍有自己的 Fisher 值。",
    },
    "id": "fisher_a_i",
    "kind": "symbol",
    "title": "Per-parameter Fisher weight",
    "summary": "The diagonal Fisher value associated with parameter θ_i for Task A.",
    "role": "Sets the relative penalty for the displacement of one parameter.",
    "confusion": "The displayed layer groups are visual organization; the EWC weight is parameter-wise.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C06"
    ],
    "symbol": "F_{A,i}",
    "runtimeObject": "task-a-fisher",
    "relatedIds": [
      "fisher_a",
      "lambda_ewc",
      "ewc_penalty"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "F_i",
      "diagonal Fisher",
      "parameter-wise"
    ]
  },
  lambda_ewc: {
    hoverCopy: {
      title: "EWC 整体强度 · λ",
      summary: "λ 调整 EWC 旧任务约束在整体目标中的强弱。",
      role: "F_A,i 区分参数之间的相对约束强弱；λ 同时缩放整条 EWC 约束。",
      confusion: "λ 是全局系数，F_A,i 是逐参数的 Fisher 权重，两者作用不同。",
    },
    "id": "lambda_ewc",
    "kind": "symbol",
    "title": "Global EWC strength",
    "summary": "λ scales the overall earlier-task constraint.",
    "role": "Controls overall penalty strength; Fisher values differentiate parameters within that penalty.",
    "confusion": "λ and F_{A,i} are not interchangeable: one is global, the other varies by parameter.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "symbol": "λ",
    "runtimeObject": "ewc-penalty",
    "relatedIds": [
      "fisher_a_i",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "lambda",
      "global scale",
      "整体强度"
    ]
  },
  ewc_objective: {
    hoverCopy: {
      title: "Task B 的 EWC 目标",
      summary: "Equation (3) 把当前任务 Loss 与旧任务的 Fisher 加权二次惩罚相加。",
      role: "Task B 的梯度与 EWC 惩罚梯度共同进入优化器。",
      confusion: "惩罚提高远离 θ_A* 的代价，不会冻结参数；页面上的梯度是对公式求导得到的实现对应。",
    },
    "id": "ewc_objective",
    "kind": "formula",
    "title": "Task-B EWC objective",
    "summary": "Current-task loss plus a Fisher-weighted quadratic constraint around the Task-A anchor.",
    "role": "Joins learning the new task with the old-task parameter constraint.",
    "confusion": "This is the paper's Equation (3); the displayed gradient on the page is derived from it, not separately printed there.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "expression": "L_B(θ) + (λ/2) Σ_i F_{A,i}(θ_i − θ_{A,i}*)²",
    "variables": [
      "task_b_loss",
      "lambda_ewc",
      "fisher_a_i",
      "theta",
      "theta_a_star"
    ],
    "derivationFrom": [
      "sequential_bayes",
      "laplace_approximation"
    ],
    "runtimeMapping": [
      "task-b-loss",
      "ewc-penalty",
      "total-gradient"
    ],
    "usedIn": [
      "page-06-ewc-objective"
    ],
    "relatedIds": [
      "ewc_penalty",
      "ewc_gradient",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Equation 3",
      "EWC loss",
      "penalty",
      "目标函数"
    ],
    "boundary": "The penalty uses diagonal Fisher entries as an approximation; it does not freeze parameters."
  },
  task_b_loss: {
    hoverCopy: {
      title: "Task B 新任务 Loss · L_B(θ)",
      summary: "模型当前参数对新任务数据 D_B 的普通训练损失。",
      role: "它提供 EWC 目标中的新任务学习信号，并产生 Task-B gradient。",
    },
    "id": "task_b_loss",
    "kind": "symbol",
    "title": "Task-B loss",
    "summary": "The ordinary loss from the current Task-B data.",
    "role": "Preserves the objective of learning the new task.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "symbol": "L_B(θ)",
    "runtimeObject": "task-b-loss",
    "trainable": "The parameters it depends on are updated during Task-B training.",
    "relatedIds": [
      "ewc_objective",
      "task_b_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "new task loss",
      "Task B",
      "L_B"
    ]
  },
  ewc_penalty: {
    hoverCopy: {
      title: "旧任务二次约束 · EWC Penalty",
      summary: "以 θ_A* 为中心，对参数偏移平方，并按 F_A,i 逐参数加权。",
      role: "高 Fisher 参数偏离旧锚点时会产生更高代价；λ 再调整整体约束强度。",
      confusion: "它改变参数偏移的代价，不会把参数更新量设为零。",
    },
    "id": "ewc_penalty",
    "kind": "formula",
    "title": "Earlier-task quadratic constraint",
    "summary": "A diagonal-Fisher-weighted cost for moving away from the Task-A anchor.",
    "role": "Adds stronger cost to displacements in parameters assigned greater Fisher weight.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "expression": "(λ/2) Σ_i F_{A,i}(θ_i − θ_{A,i}*)²",
    "variables": [
      "lambda_ewc",
      "fisher_a_i",
      "theta",
      "theta_a_star"
    ],
    "runtimeMapping": [
      "ewc-penalty"
    ],
    "usedIn": [
      "page-06-ewc-objective"
    ],
    "relatedIds": [
      "fisher_a_i",
      "theta_a_star",
      "lambda_ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "boundary": "Constrains parameter movement; does not set parameter updates to zero.",
    "confusion": "It changes the cost of parameter displacement; it does not set the parameter update to zero."
  },
  likelihood: {
    hoverCopy: {
      title: "Likelihood · 似然",
      summary: "固定已观察的输入与真实标签，改变 θ；各真实标签条件概率的乘积评价这组参数对同一数据的解释力。",
      role: "本页把输入 xₙ 作为已给定条件，将每个真实标签概率 pθ(yₙ | xₙ) 相乘，得到条件似然。",
      confusion: "Likelihood 是 θ 的函数，未在参数空间归一化，不能把它当成 p(θ | D)。",
    },
    "id": "likelihood",
    "kind": "term",
    "title": "Likelihood",
    "fullName": "Likelihood / 似然",
    "summary": "For supervised classification, condition on the observed inputs and compare how well different parameters support the observed labels.",
    "role": "Connects each network's true-label probabilities to the dataset score used in ordinary training and later Bayesian reasoning.",
    "confusion": "Probability fixes θ and an observed input x, then asks about possible labels y. Likelihood fixes the observed input-label pairs and compares θ. It is a function of θ, not a probability distribution over θ.",
    "sourceCategory": "GENERAL_BACKGROUND",
    "relatedIds": [
      "p_D_given_theta",
      "p_theta_y_given_x"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "likelihood-comparison"
      },
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "likelihood",
      "似然",
      "probability",
      "概率",
      "假阳性",
      "base rate"
    ],
    "details": [
      {
        "label": "Computed from Page 2",
        "text": "Let D_A={(xₙ,yₙ)} and condition on the observed inputs. Under conditional independence, p(D_A | θ)=∏ₙ pθ(yₙ | xₙ). Each factor is the Softmax probability assigned to that sample's true label; taking the negative log gives the NLL.",
        "sourceRefs": [
          "B01",
          "C12"
        ]
      },
      {
        "label": "Comparing parameter configurations",
        "text": "For the same D_A, a configuration that assigns higher probabilities to the true labels generally has a larger product and lower NLL. Page 3 reuses these scores, multiplies them by the Prior, and normalizes."
      }
    ]
  },
  p_D_given_theta: {
    hoverCopy: {
      title: "数据的 Likelihood · Dataset likelihood",
      summary: "把已观察输入 xₙ 作为条件，在样本条件独立假设下相乘各真实标签的预测概率。",
      role: "固定已观察的 (xₙ,yₙ)，切换 θ；乘积越大，这组参数给观测标签的条件似然越高。",
      confusion: "这里组合的是 pθ(yₙ | xₙ)，不建模输入 xₙ 的生成概率；作为 θ 的函数时也不是归一化的参数概率分布。",
    },
    "id": "p_D_given_theta",
    "kind": "symbol",
    "title": "Dataset likelihood",
    "summary": "The product of each observed sample's true-label probability at the current parameters.",
    "role": "Scores a fixed parameter setting by the conditional probabilities of observed labels given the observed inputs, under a conditional independence assumption.",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": ["B01", "C12"],
    "symbol": "p(D | θ)",
    "relatedIds": [
      "likelihood",
      "p_theta_y_given_x"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "likelihood-origin"
      },
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "p(D|θ)",
      "dataset likelihood",
      "数据似然"
    ],
    "confusion": "This combines pθ(yₙ | xₙ) and does not model how the inputs xₙ are generated. As a function of θ, it is not a normalized probability distribution over parameters."
  },
  prior: {
    hoverCopy: {
      title: "参数先验 · Prior",
      summary: "数据到来前，对不同参数配置合理性的概率描述。",
      role: "它与数据 Likelihood 一起，构成看完数据后的 Posterior。",
      confusion: "Prior 不是网络 Forward 自动得到的输出，而是 Bayesian 模型中的先验选择。",
    },
    "id": "prior",
    "kind": "term",
    "title": "Prior",
    "summary": "A distribution that describes prior plausibility across parameter configurations before the current data are used.",
    "role": "Supplies the parameter-side belief that combines with the data likelihood in Bayes' rule.",
    "confusion": "A network forward pass does not produce p(θ); a prior is specified as part of the Bayesian model.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C13"
    ],
    "relatedIds": [
      "p_theta",
      "likelihood",
      "posterior",
      "sequential_bayes"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "prior",
      "parameter prior",
      "先验",
      "参数分布"
    ],
    "details": [
      {
        "label": "Modeling constraints",
        "text": "Specify the Prior before using the current data; it must be nonnegative and normalized. This Bayes update cannot restore a region assigned zero Prior mass. The Prior expresses assumptions or existing knowledge; it is not a Forward-pass output.",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Gaussian Prior and L2",
        "text": "The negative log of a zero-mean isotropic Gaussian produces an L2 penalty. This is a background example; the paper does not require a general Prior to have this form.",
        "sourceRefs": [
          "B04"
        ]
      }
    ]
  },
  posterior: {
    hoverCopy: {
      title: "后验 · Posterior",
      summary: "Bayes 用 Likelihood × Prior 重新加权参数配置，再除以 Evidence；数据解释力高的区域在相同 Prior 下得到更高相对支持。",
      role: "Task A 的 Posterior 将旧任务信息带入 Task B 的顺序更新。",
      confusion: "Posterior 表示对参数配置的分布，不是神经网络的一次前向输出。",
    },
    "id": "posterior",
    "kind": "term",
    "title": "Posterior",
    "summary": "The updated distribution over parameter configurations after combining prior information with observed data.",
    "role": "Carries what earlier task data imply about the parameters into the next sequential Bayesian update.",
    "confusion": "The posterior is a distribution over parameter configurations, not a new network output or one additional parameter vector.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C13"
    ],
    "relatedIds": [
      "prior",
      "likelihood",
      "p_theta_given_D",
      "task_a_posterior",
      "task_b_posterior"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      },
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      }
    ],
    "keywords": [
      "posterior",
      "后验",
      "parameter belief",
      "参数分布"
    ],
    "details": [
      {
        "label": "Update mechanics",
        "text": "p(θ | D_A)=p(D_A | θ)p(θ)/p(D_A). The posterior odds between two configurations equal their Likelihood ratio times their Prior ratio; the shared Evidence cancels, so it does not affect their relative odds.",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Location and shape",
        "text": "The MAP estimate gives the center. Local curvature of Φ=−log Posterior determines how density falls with displacement: p(θ)/p(θ*)≈exp(−½ΔθᵀHΔθ). A higher-curvature direction is narrower and makes movement more costly.",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "Teaching example",
        "text": "For ½(8Δθ₁²+0.5Δθ₂²), displacing each coordinate by 0.5 gives density factors of about 0.368 and 0.939. These values are illustrative, not paper measurements."
      }
    ]
  },
  sequential_bayes: {
    hoverCopy: {
      title: "顺序 Bayes 更新 · Sequential Bayesian update",
      summary: "把 Task A 的参数 Posterior 与 Task B 的数据 Likelihood 结合。",
      role: "Page 6 从这个关系出发，将 Task-B Likelihood 转为 Loss，并把旧 Posterior 的局部近似转为惩罚项。",
    },
    "id": "sequential_bayes",
    "kind": "formula",
    "title": "Sequential Bayesian update",
    "summary": "The Task-A posterior becomes the prior contribution when the model incorporates Task-B data.",
    "role": "Connects one task's posterior to the next task's parameter update.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C13"
    ],
    "expression": "p(θ | D_A, D_B) ∝ p(D_B | θ) p(θ | D_A)",
    "variables": [
      "task_a_posterior",
      "task_b_posterior",
      "task_a_data",
      "task_b_data",
      "theta"
    ],
    "derivationFrom": [
      "prior",
      "posterior",
      "likelihood"
    ],
    "usedIn": [
      "page-03-bayes",
      "page-06-ewc-objective"
    ],
    "relatedIds": [
      "task_a_posterior",
      "task_b_posterior",
      "task_a_data",
      "task_b_data"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "sequential Bayesian update",
      "Bayes Rule",
      "顺序更新",
      "task posterior"
    ]
  },
  p_theta: {
    hoverCopy: {
      title: "参数先验 · p(θ)",
      summary: "数据到来前，对不同参数配置合理性的概率描述。",
      role: "它与数据 Likelihood 一起，构成看完数据后的 Posterior。",
      confusion: "Prior 不是网络 Forward 自动得到的输出，而是 Bayesian 模型中的先验选择。",
    },
    "id": "p_theta",
    "kind": "symbol",
    "title": "Parameter prior",
    "summary": "The prior distribution over parameter configurations before conditioning on the current data.",
    "role": "Combines with the data likelihood to form a posterior.",
    "confusion": "It is selected as part of the Bayesian model; the neural network does not output it during a forward pass.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C13"
    ],
    "symbol": "p(θ)",
    "relatedIds": [
      "prior",
      "p_D_given_theta",
      "p_theta_given_D"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "p(theta)",
      "parameter prior",
      "参数先验"
    ],
    "details": [
      {
        "label": "Modeling constraints",
        "text": "Specify the Prior before using the current data; it must be nonnegative and normalized. This Bayes update cannot restore a region assigned zero Prior mass. The Prior expresses assumptions or existing knowledge; it is not a Forward-pass output.",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Gaussian Prior and L2",
        "text": "The negative log of a zero-mean isotropic Gaussian produces an L2 penalty. This is a background example; the paper does not require a general Prior to have this form.",
        "sourceRefs": [
          "B04"
        ]
      }
    ]
  },
  p_theta_given_D: {
    hoverCopy: {
      title: "参数后验 · p(θ | D)",
      summary: "Bayes 用 Likelihood × Prior 重新加权参数配置，再除以 Evidence；数据解释力高的区域在相同 Prior 下得到更高相对支持。",
      role: "Task A 的 Posterior 将旧任务信息带入 Task B 的顺序更新。",
      confusion: "Posterior 表示对参数配置的分布，不是神经网络的一次前向输出。",
    },
    "id": "p_theta_given_D",
    "kind": "symbol",
    "title": "Parameter posterior",
    "summary": "The parameter distribution after observing data D.",
    "role": "Records how the observed data reweight parameter configurations.",
    "confusion": "It is a probability distribution over parameters, not the network's conditional prediction p_θ(y | x).",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C13"
    ],
    "symbol": "p(θ | D)",
    "relatedIds": [
      "posterior",
      "p_theta",
      "p_D_given_theta"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "p(theta|D)",
      "parameter posterior",
      "参数后验"
    ],
    "details": [
      {
        "label": "Update mechanics",
        "text": "p(θ | D_A)=p(D_A | θ)p(θ)/p(D_A). The posterior odds between two configurations equal their Likelihood ratio times their Prior ratio; the shared Evidence cancels, so it does not affect their relative odds.",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Location and shape",
        "text": "The MAP estimate gives the center. Local curvature of Φ=−log Posterior determines how density falls with displacement: p(θ)/p(θ*)≈exp(−½ΔθᵀHΔθ). A higher-curvature direction is narrower and makes movement more costly.",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "Teaching example",
        "text": "For ½(8Δθ₁²+0.5Δθ₂²), displacing each coordinate by 0.5 gives density factors of about 0.368 and 0.939. These values are illustrative, not paper measurements."
      }
    ]
  },
  task_a_posterior: {
    hoverCopy: {
      title: "Task A 参数后验 · p(θ | D_A)",
      summary: "观察 Task A 数据后，对参数配置形成的 Posterior。",
      role: "顺序 Bayes 更新会把它带入 Task B；本页再从完整 Posterior 聚焦到 θ_A* 附近做局部近似。",
      confusion: "这是推导中的分布对象，不表示程序必须保存完整的高维分布。",
    },
    "id": "task_a_posterior",
    "kind": "symbol",
    "title": "Task-A posterior",
    "summary": "The parameter posterior after observing Task-A data D_A.",
    "role": "Carries Task-A information into the Bayesian update for the next task.",
    "confusion": "This is a distribution in the paper's mathematical derivation, not a prescribed software checkpoint format.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C13"
    ],
    "symbol": "p(θ | D_A)",
    "relatedIds": [
      "sequential_bayes",
      "task_b_posterior",
      "theta_a_star",
      "laplace_approximation"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-04-laplace",
        "anchorId": "posterior-global-to-local"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Task A posterior",
      "p(theta|D_A)",
      "旧任务后验"
    ],
    "details": [
      {
        "label": "Update mechanics",
        "text": "p(θ | D_A)=p(D_A | θ)p(θ)/p(D_A). The posterior odds between two configurations equal their Likelihood ratio times their Prior ratio; the shared Evidence cancels, so it does not affect their relative odds.",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Location and shape",
        "text": "The MAP estimate gives the center. Local curvature of Φ=−log Posterior determines how density falls with displacement: p(θ)/p(θ*)≈exp(−½ΔθᵀHΔθ). A higher-curvature direction is narrower and makes movement more costly.",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "Teaching example",
        "text": "For ½(8Δθ₁²+0.5Δθ₂²), displacing each coordinate by 0.5 gives density factors of about 0.368 and 0.939. These values are illustrative, not paper measurements."
      }
    ]
  },
  task_b_posterior: {
    hoverCopy: {
      title: "Task B 后验 · p(θ | D_A, D_B)",
      summary: "把 Task A 的 Posterior 与 Task B 的数据 Likelihood 结合后得到的参数分布。",
      role: "它是顺序 Bayes 关系的左侧结果；本页从右侧两部分继续构造可优化的 EWC Loss。",
    },
    "id": "task_b_posterior",
    "kind": "symbol",
    "title": "Posterior after Task B",
    "summary": "The parameter posterior after both Task-A and Task-B data are incorporated.",
    "role": "Shows the result of carrying the Task-A posterior into the next sequential update.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03"
    ],
    "symbol": "p(θ | D_A, D_B)",
    "relatedIds": [
      "sequential_bayes",
      "task_a_posterior"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Task B posterior",
      "p(theta|D_A,D_B)",
      "顺序 Bayes"
    ]
  },
  optimizer_step: {
    hoverCopy: {
      title: "优化器更新 · Optimizer update",
      summary: "使用反向计算得到的梯度，更新当前模型参数。",
      role: "Page 5 估计 Fisher 时关闭这一步；Page 6 Task B 训练时，它接收总梯度并更新 θ。",
      confusion: "反向计算得到梯度；optimizer.step() 才真正更新参数。EWC 不会替代优化器。",
    },
    "id": "optimizer_step",
    "kind": "method",
    "title": "Optimizer update",
    "summary": "Applies an update to the current trainable parameters using the total gradient.",
    "role": "Moves the current parameter vector during normal training, but stays off during the shown Fisher-estimation pass.",
    "confusion": "Backward computes gradients; optimizer.step() is the operation that changes parameters.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M03"
    ],
    "relatedIds": [
      "fisher_estimation",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "training-vs-estimation"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "optimizer.step",
      "backward",
      "update",
      "不更新参数"
    ]
  },
  p_theta_y_given_x: {
    hoverCopy: {
      title: "网络预测概率 · Network prediction probability",
      summary: "给定输入 x 和当前参数 θ，网络输出各标签的预测概率。",
      role: "它把网络前向计算连接到数据似然与训练损失。",
    },
    "id": "p_theta_y_given_x",
    "kind": "symbol",
    "title": "Network prediction probability",
    "summary": "The probability distribution produced by the current network for an input.",
    "role": "Starting point for the selected Page-5 score-gradient walkthrough.",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B01"
    ],
    "symbol": "p_θ(y | x)",
    "runtimeObject": "prediction-probabilities",
    "usedWhen": "Before taking the log-probability gradient in the selected estimator walkthrough.",
    "relatedIds": [
      "neural_network",
      "empirical_fisher_estimator_background"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "forward-probability"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "score-gradient"
      }
    ],
    "keywords": [
      "probability",
      "forward pass",
      "prediction",
      "预测概率"
    ]
  },
  theta: {
    hoverCopy: {
      title: "当前模型参数 · θ",
      summary: "Task B 训练过程中继续更新的同一组模型参数。",
      role: "EWC 比较当前 θ 与固定的 Task-A 快照 θ_A*，惩罚的是高敏感坐标上的偏移。",
      confusion: "当前 θ 是可训练参数；θ_A* 是保存下来的旧任务锚点，二者不会一起移动。",
    },
    "id": "theta",
    "kind": "symbol",
    "title": "Current parameters",
    "summary": "The trainable parameter vector of the same shared model.",
    "role": "Moves in ordinary training and Task-B training; remains fixed during the shown Fisher pass.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C01",
      "C06"
    ],
    "symbol": "θ",
    "runtimeObject": "current-parameters",
    "relatedIds": [
      "theta_a_star",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "parameters",
      "weights",
      "模型参数"
    ],
    "confusion": "Current θ is trainable; θ_A* is the saved anchor from the previous task. They do not move together."
  },
  task_b_gradient: {
    hoverCopy: {
      title: "Task B 梯度 · g_B",
      summary: "由当前任务 Loss 对模型参数求导得到。",
      role: "它提供学习新任务的更新信号，并与 EWC gradient 相加后送入优化器。",
    },
    "id": "task_b_gradient",
    "kind": "symbol",
    "title": "Task-B gradient",
    "summary": "The gradient contributed by the current task's loss.",
    "role": "Keeps the update directed toward learning Task B.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M02"
    ],
    "symbol": "g_B",
    "runtimeObject": "task-b-gradient",
    "relatedIds": [
      "task_b_loss",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "new task gradient",
      "g_B"
    ]
  },
  ewc_gradient: {
    hoverCopy: {
      title: "EWC 约束梯度 · g_EWC",
      summary: "由 Fisher 加权二次惩罚对参数求导得到。",
      role: "它与 Task-B gradient 相加；优化器按总梯度执行更新。",
      confusion: "偏移为正时该梯度向外；Gradient Descent 减去它，更新便指向 Anchor。此导数不是原文另列的公式。",
    },
    "id": "ewc_gradient",
    "kind": "symbol",
    "title": "EWC gradient term",
    "summary": "The derivative of the quadratic constraint; gradient descent subtracts it and shifts the update back toward the Task-A anchor.",
    "role": "Offsets Task-B movement away from the Task-A anchor, with strength set by λ and the parameter's Fisher value.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M02"
    ],
    "symbol": "g_EWC",
    "runtimeObject": "ewc-gradient",
    "confusion": "The gradient points outward from the anchor when the parameter is displaced; gradient descent subtracts this term, producing an update toward the anchor. This derivative is not printed as a separate equation in the paper.",
    "relatedIds": [
      "ewc_penalty",
      "fisher_a_i",
      "theta_a_star",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "restoring gradient",
      "constraint gradient",
      "g_EWC"
    ]
  },
  total_gradient: {
    hoverCopy: {
      title: "合并后的总梯度 · g_total",
      summary: "g_B 与 g_EWC 两路信号相加后的结果。",
      role: "optimizer.step() 使用总梯度更新当前参数 θ。",
      confusion: "EWC 加入训练目标与梯度计算，不会取代原有优化器。",
    },
    "id": "total_gradient",
    "kind": "symbol",
    "title": "Combined gradient",
    "summary": "The Task-B gradient plus the gradient from the EWC constraint.",
    "role": "The combined signal passed to the optimizer during Task-B training.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M02"
    ],
    "symbol": "g_total",
    "runtimeObject": "total-gradient",
    "confusion": "The optimizer receives the combined gradient; EWC does not replace the optimizer.",
    "relatedIds": [
      "task_b_gradient",
      "ewc_gradient",
      "optimizer_step"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "total gradient",
      "combined gradient",
      "optimizer input"
    ]
  },
  task_boundary: {
    hoverCopy: {
      title: "任务边界 · Task Boundary",
      summary: "当前任务结束、下一任务开始的时间点。",
      role: "先固定当前解，再趁当前任务数据仍可用时估计 Fisher；完成后新任务继续训练同一个模型。",
      confusion: "边界本身不会由原始 EWC 自动发现；Atari 实验使用了额外的 task-recognition 机制。",
    },
    "id": "task_boundary",
    "kind": "term",
    "title": "Task Boundary",
    "summary": "The transition between finishing one task and beginning the next in the sequential training schedule.",
    "role": "Marks when the current solution is anchored and its Fisher estimate is prepared while the current task data are still available.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M01",
      "C09"
    ],
    "relatedIds": [
      "consolidation",
      "theta_a_star",
      "fisher_a"
    ],
    "relatedPages": [
      {
        "pageId": "page-07-lifecycle",
        "anchorId": "task-boundary"
      }
    ],
    "keywords": [
      "task boundary",
      "任务边界",
      "task switch",
      "consolidation"
    ],
    "confusion": "Original EWC does not detect task boundaries on its own; the Atari experiment uses an additional task-recognition mechanism."
  },
  consolidation: {
    hoverCopy: {
      title: "任务固结 · Consolidation",
      summary: "任务结束后建立可供后续训练读取的旧任务状态。",
      role: "固定当前参数并估计 Fisher；这一阶段会计算梯度，但不会执行 optimizer.step()。",
      confusion: "Fisher estimation 本身不更新模型参数。",
    },
    "id": "consolidation",
    "kind": "phase",
    "title": "Consolidation",
    "summary": "The boundary pass that stores a task anchor and estimates its Fisher information before moving to the next task.",
    "role": "Makes the saved old-task state available to the next task's EWC objective.",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M01",
      "C09"
    ],
    "relatedIds": [
      "task_boundary",
      "theta_a_star",
      "fisher_a"
    ],
    "relatedPages": [
      {
        "pageId": "page-07-lifecycle",
        "anchorId": "task-boundary"
      }
    ],
    "keywords": [
      "consolidation",
      "任务固结",
      "Fisher estimation"
    ],
    "confusion": "Fisher estimation itself does not update model parameters."
  },
  permuted_mnist: {
    hoverCopy: {
      title: "置换 MNIST · Permuted MNIST",
      summary: "每个任务给所有输入图像使用同一个固定随机像素排列。",
      role: "保持数字分类目标，改变任务之间的输入映射，便于观察顺序学习时旧任务表现如何变化。",
      confusion: "Task k 的排列对该任务内所有图像相同；不会对每张图重新洗牌。",
    },
    "id": "permuted_mnist",
    "kind": "dataset",
    "title": "Permuted MNIST",
    "summary": "A sequence of digit-classification tasks where each task applies its own fixed random permutation to input pixels.",
    "role": "Creates controlled sequential input changes while retaining the digit labels, making it possible to inspect forgetting and retention in one shared model.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C10",
      "R01"
    ],
    "details": [
      {
        "label": "Across tasks",
        "text": "Each task uses one fixed random pixel permutation; training and test examples within that task use the same mapping. Labels remain 0–9 and the output space is shared. The reversible permutation preserves information but changes how input positions map to classification patterns.",
        "sourceRefs": [
          "C10"
        ]
      },
      {
        "label": "Measures and comparison",
        "text": "Figure 2A reports test accuracy on three tasks; Figure 2B reports average accuracy across trained tasks. The comparison with uniform L2 and SGD is specific to the paper’s network, permutations, and training setup.",
        "sourceRefs": [
          "R01"
        ]
      }
    ],
    "relatedPages": [
      {
        "pageId": "page-08-mnist",
        "anchorId": "permuted-mnist-task"
      }
    ],
    "keywords": [
      "MNIST",
      "permuted MNIST",
      "像素置换",
      "固定排列",
      "handwritten digits"
    ],
    "confusion": "Task k uses the same permutation for every image in that task; images are not shuffled independently."
  },
  atari: {
    hoverCopy: {
      title: "Atari 连续强化学习实验",
      summary: "Agent 通过与多个 Atari 游戏交互，依次学习不同任务。",
      role: "完整系统的绝对成绩与保留其他 Atari 机制的 EWC / no-penalty 对照，分别说明系统表现和 EWC 在该设置下的贡献。",
      confusion: "绝对多游戏分数属于包含 Replay、Task Recognition 与 task-specific gains / biases 的完整系统；该结果不能推广到所有 continual RL，也没有达到每个游戏各用一个 DQN 的表现。",
    },
    "id": "atari",
    "kind": "environment",
    "title": "Atari continual reinforcement learning",
    "summary": "An Atari agent learns a sequence of games through interaction, using Replay, task recognition, task-specific parameters, and EWC.",
    "role": "Separates the full system's absolute scores from the EWC versus no-penalty comparison, which supports an EWC contribution under the reported setup.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08",
      "C09",
      "R03",
      "R05"
    ],
    "details": [
      {
        "label": "System components",
        "text": "A DQN-like network, per-task Replay buffers, task recognition, task-specific gains and biases, and EWC form the complete system.",
        "sourceRefs": [
          "C08"
        ]
      },
      {
        "label": "Game sequence",
        "text": "Ten games are selected from a pool of nineteen and trained in repeated sequences. Absolute scores in Figure 3B belong to the full system; the controlled comparison keeps the other mechanisms and changes whether the EWC penalty is present, supporting an EWC contribution to retention in this setup.",
        "sourceRefs": [
          "R03"
        ]
      },
      {
        "label": "EWC timing and Fisher",
        "text": "Protection begins only after a game has at least 20 million frames. At each switch, the diagonal Fisher is recomputed from 100 mini-batches sampled from Replay and scaled by 400 (PDF pp. 5, 12, §2.2 and Table 2).",
        "sourceRefs": [
          "C09"
        ]
      },
      {
        "label": "Network configuration",
        "text": "The input is 84 × 84 pixels, and each state contains the four most recent frames. Every game uses the full 18-action set and the same network structure (PDF pp. 10–11, Appendix §4.2).",
        "sourceRefs": [
          "C08"
        ]
      },
      {
        "label": "Results boundary",
        "text": "Human-normalized score scales game score relative to random and human baselines; it is not accuracy. The agent did not reach the score of ten independent DQNs. Appendix Figure 4 reports per-game curves.",
        "sourceRefs": [
          "R05",
          "R06"
        ]
      }
    ],
    "relatedIds": [
      "replay",
      "task_recognition",
      "task_specific_modulation",
      "fisher_perturbation"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "system-responsibilities"
      }
    ],
    "keywords": [
      "Atari",
      "reinforcement learning",
      "continual RL",
      "DQN"
    ],
    "confusion": "Absolute multi-game scores belong to the full system, which includes Replay, task recognition, and task-specific gains and biases. The result does not generalize to all continual RL settings, and the agent did not match using a separate DQN for each game."
  },
  replay: {
    hoverCopy: {
      title: "经验回放 · Replay",
      summary: "把环境交互产生的 transition 存入 Replay buffer，再用于强化学习更新。",
      role: "Atari 系统按任务使用 replay buffers。Replay 支持任务内部训练；EWC 负责边界之间的参数约束。",
      confusion: "Replay 与 EWC 的作用不同；论文 Atari 实验保留了 Replay。",
    },
    "id": "replay",
    "kind": "method",
    "title": "Replay buffer",
    "summary": "A per-task buffer of interaction transitions used by the Atari agent's reinforcement-learning training.",
    "role": "Provides current-task experience for DQN updates while EWC provides an across-task parameter constraint.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08"
    ],
    "relatedIds": [
      "atari",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "replay-timescale"
      }
    ],
    "keywords": [
      "Replay",
      "experience replay",
      "Replay buffer",
      "经验回放"
    ],
    "confusion": "Replay and EWC serve different roles; the paper's Atari experiment retains Replay."
  },
  task_recognition: {
    hoverCopy: {
      title: "任务识别 · Task Recognition",
      summary: "Atari 系统另设模块判断当前处于哪个游戏任务。",
      role: "任务上下文由系统中的其他组件提供，EWC 使用任务切换信息建立参数约束。",
      confusion: "Task Recognition 不属于 EWC penalty，也不能把它的作用归到 EWC 名下。",
    },
    "id": "task_recognition",
    "kind": "method",
    "title": "Task Recognition",
    "summary": "A separate Atari-system mechanism that infers the active game context.",
    "role": "Supplies task identity/context to the full Atari system; EWC itself is not a task-boundary discovery method.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08"
    ],
    "relatedIds": [
      "atari",
      "task_specific_modulation",
      "task_boundary"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "system-responsibilities"
      }
    ],
    "keywords": [
      "task recognition",
      "game context",
      "task identity",
      "任务识别"
    ],
    "confusion": "Task recognition is not part of the EWC penalty, and its contribution should not be attributed to EWC."
  },
  task_specific_modulation: {
    hoverCopy: {
      title: "任务专属调制 · Gains / Biases",
      summary: "Atari 系统为不同游戏使用额外的 task-specific gains 与 biases。",
      role: "这是完整 Atari 系统中的另一项机制；它与 EWC 参数约束承担不同职责。",
      confusion: "Atari 表现不能被概括为 EWC 单独作用的结果。",
    },
    "id": "task_specific_modulation",
    "kind": "method",
    "title": "Task-specific gains and biases",
    "summary": "Task-specific gain and bias parameters used by the paper's Atari network.",
    "role": "Adds game-specific modulation to the full system; it is separate from EWC's shared-parameter constraint.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08"
    ],
    "relatedIds": [
      "atari",
      "task_recognition",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "system-responsibilities"
      }
    ],
    "keywords": [
      "task-specific modulation",
      "gains",
      "biases",
      "任务专属调制"
    ],
    "confusion": "Atari performance should not be summarized as the result of EWC alone."
  },
  fisher_perturbation: {
    hoverCopy: {
      title: "Fisher 参数扰动诊断",
      summary: "在 Breakout 网络上施加不同参数噪声，观察游戏分数怎样变化。",
      role: "Inverse-Fisher 扰动比 uniform 扰动更稳健；nullspace 条件的影响仍与 inverse-Fisher 条件相近。",
      confusion: "这是单游戏参数扰动实验，不是 EWC 跨游戏主性能曲线。",
    },
    "id": "fisher_perturbation",
    "kind": "evidence",
    "title": "Fisher perturbation diagnostic",
    "summary": "A Breakout DQN perturbation experiment that probes the diagonal Fisher's local-sensitivity interpretation.",
    "role": "Connects the Page 5 Fisher interpretation to measured network performance after parameter perturbations.",
    "sourceCategory": "PAPER_RESULT",
    "sourceRefs": [
      "R04",
      "A01"
    ],
    "claim": "In the single-game Breakout experiment, inverse-Fisher-shaped perturbations were more robust than uniform perturbations, while Fisher-nullspace perturbations still changed performance.",
    "experiment": "A single-game Breakout DQN evaluated across ten full episodes with a new perturbation sampled at each timestep.",
    "observedEvidence": [
      "Inverse-Fisher 条件更稳健。",
      "Nullspace 条件影响接近 inverse-Fisher，并非没有影响。"
    ],
    "interpretation": "The authors interpret the nullspace outcome as evidence that the method overestimates some parameters' unimportance and underestimates parameter uncertainty.",
    "boundary": "This diagnostic tests one trained Breakout agent; it does not prove a universal ranking of perturbation schemes.",
    "sourceLocator": "PDF p. 6, Figure 3C and adjacent Section 2.2 text",
    "relatedIds": [
      "fisher_information",
      "diagonal_fisher_limit",
      "atari"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "atari-evidence-limits"
      }
    ],
    "keywords": [
      "parameter perturbation",
      "Fisher nullspace",
      "Breakout",
      "参数扰动"
    ],
    "confusion": "This is a single-game parameter-perturbation experiment, not the main cross-game EWC performance curve."
  },
  extended_bayes_laplace_notation: {
    hoverCopy: {
      title: "Bayes → Laplace → EWC · 公式衔接",
      summary: "Sequential Bayes 的乘积取负对数后变为新任务 Loss 加旧 Posterior 的负对数；局部二次型和对角 Fisher 近似得到 EWC。",
      role: "区分完整后验、局部 Gaussian 与实践中的对角精度近似。",
      confusion: "旧解附近的近似不代表完整后验；对角 Fisher 忽略参数耦合。",
    },
    "id": "extended_bayes_laplace_notation",
    "kind": "advanced",
    "title": "Bayes → Laplace → EWC notation",
    "summary": "A compact map from the sequential Bayesian update to the local Gaussian view and the diagonal-Fisher EWC penalty.",
    "role": "Keeps the full posterior, its local approximation, and the paper's diagonal precision approximation distinct.",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C04",
      "C05",
      "C13"
    ],
    "confusion": "The local Gaussian is an approximation around θ_A*; EWC uses diagonal Fisher values as an approximate local precision, not an exact full Hessian or a stored full posterior.",
    "details": [
      {
        "label": "Sequential Bayes",
        "text": "Assuming task data are conditionally independent given θ: p(θ | D_A, D_B) ∝ p(D_B | θ)p(θ | D_A).",
        "sourceRefs": [
          "C03",
          "C13"
        ]
      },
      {
        "label": "Laplace",
        "text": "At a local MAP stationary point, the linear term vanishes: Φ ≈ C + ½ΔθᵀH_AΔθ. Positive curvature, or suitable regularization, gives a local Gaussian approximation.",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "EWC",
        "text": "EWC approximates precision with diag(F_A), drops constants independent of θ, and adds the practical trade-off λ to obtain L_B + (λ/2)ΣᵢF_A,i(θᵢ−θ_A,i*)².",
        "sourceRefs": [
          "C05",
          "C06"
        ]
      }
    ],
    "boundary": "These equations connect the paper's Bayesian motivation to its practical diagonal EWC objective. The tutorial does not claim that the exact full Hessian or full posterior is computed or stored.",
    "relatedIds": [
      "sequential_bayes",
      "task_a_posterior",
      "laplace_approximation",
      "fisher_information",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-04-laplace",
        "anchorId": "laplace-local-view"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Bayes",
      "Laplace",
      "Hessian",
      "diagonal Fisher",
      "EWC notation",
      "进阶公式",
      "局部高斯"
    ]
  },
  task_state_mapping: {
    hoverCopy: {
      title: "Page 10 状态与对象映射",
      summary: "说明动画中的页面、锚点、状态和运行对象如何对应。",
      role: "帮助读者把回放步骤与工作台对象及相关课程连接起来。",
      confusion: "这些 ID 和对象栏属于教程实现；论文没有规定此类软件结构或 checkpoint 格式。",
    },
    id: "task_state_mapping", kind: "implementation", title: "Grand Animation state and ID map",
    summary: "Page 10 uses stable page, anchor, animation-state, and runtime-object IDs to connect the replay controls with the workbench and related lessons.",
    role: "Explains how the tutorial's 18-state replay and selectable workbench objects are mapped in this implementation.",
    sourceCategory: "IMPLEMENTATION_MAPPING", sourceRefs: ["M01", "M03", "T02"],
    confusion: "These IDs and the saved-object rail are tutorial implementation mappings; the EWC paper does not prescribe this software schema or checkpoint format.",
    details: [
      { label: "Page and anchor IDs", text: "The integration lives on page-10-grand-animation and is grouped under the grand-animation and full-execution-replay anchors." },
      { label: "18 animation-state IDs", text: "overview → task-a-data → first-forward → probability-loss → backward → optimizer-update → task-a-compression → task-a-boundary → posterior-view → laplace-view → return-runtime → save-anchor → fisher-estimation → task-a-consolidated → task-b-arrives → ewc-objective → combined-gradient → continual-loop." },
      { label: "Runtime-object IDs", text: "Selectable IDs connect Task A/B data, batches, the shared network, logits, probabilities, losses, gradients, optimizer, current parameters, saved Task-A anchor and Fisher, separate Task-A and Task-B states, persistent memory, replay, task recognition, and task-specific modulation to their visible workbench objects." },
      { label: "Teaching boundary", text: "The replay integrates previously taught probability, parameter anchoring, Fisher weighting, and task switching. It does not add a new paper claim or specify a universal runtime architecture." },
    ],
    relatedIds: ["grand_animation", "ewc", "task_boundary", "fisher_information", "ewc_objective"],
    relatedPages: [{ pageId: "page-10-grand-animation", anchorId: "grand-animation" }, { pageId: "page-10-grand-animation", anchorId: "full-execution-replay" }],
    relatedAnimationStates: [
      "overview", "task-a-data", "first-forward", "probability-loss", "backward", "optimizer-update",
      "task-a-compression", "task-a-boundary", "posterior-view", "laplace-view", "return-runtime", "save-anchor",
      "fisher-estimation", "task-a-consolidated", "task-b-arrives", "ewc-objective", "combined-gradient", "continual-loop",
    ],
    keywords: ["Page 10", "Grand Animation", "runtime IDs", "state machine", "实现映射", "状态映射"],
  },
  diagonal_fisher_limit: {
    hoverCopy: {
      title: "对角 Fisher 的局限 · Diagonal Fisher",
      summary: "对角近似忽略参数间的耦合，加上局部不确定性的点估计，可能误判一些方向为不重要。",
      role: "解释低 Fisher 或 nullspace 方向为何仍可能影响性能。",
      confusion: "低估计值并不保证对应移动安全；Nullspace 扰动结果不能只归因为忽略耦合。",
    },
    "id": "diagonal_fisher_limit",
    "kind": "advanced",
    "title": "Diagonal Fisher limitation",
    "summary": "A diagonal approximation omits parameter coupling and can misclassify some directions as unimportant.",
    "role": "Explains why a Fisher-nullspace perturbation can still affect network performance.",
    "sourceCategory": "LIMITATION",
    "sourceRefs": [
      "C11",
      "R04",
      "A01"
    ],
    "confusion": "Diagonal Fisher values are an approximation to local sensitivity; they do not guarantee that every low-value direction is safe to change.",
    "boundary": "The paper discusses a factorized Gaussian and point estimate of uncertainty as significant limitations; it does not provide an exact full covariance for EWC.",
    "relatedIds": [
      "fisher_information",
      "fisher_perturbation"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      },
      {
        "pageId": "page-09-atari",
        "anchorId": "atari-evidence-limits"
      }
    ],
    "keywords": [
      "diagonal Fisher",
      "off-diagonal",
      "parameter coupling",
      "uncertainty approximation"
    ],
    "details": [
      {
        "label": "Author interpretation",
        "text": "Nullspace perturbations in Breakout still affect performance. The authors suggest that the method may be overconfident about some parameters being unimportant and may underestimate parameter uncertainty; this does not establish a single definitive cause of error.",
        "sourceRefs": [
          "R04",
          "A01",
          "C11"
        ]
      }
    ]
  },
  neural_network: {
    hoverCopy: {
      title: "神经网络 · Neural Network",
      summary: "给定输入 x，用当前权重与偏置 θ 逐层计算 logits；Softmax 再把分类分数变为标签概率。",
      role: "P2 用这一计算输出取得真实标签概率，连接到 Likelihood 与 NLL。",
    },
    "id": "neural_network",
    "kind": "term",
    "title": "Neural network",
    "summary": "Given input x, the network applies its current weights and biases θ layer by layer to produce logits; Softmax converts the class scores into label probabilities.",
    "role": "Page 2 uses this forward computation to obtain the probability assigned to each true label, then forms the Likelihood and negative log-likelihood.",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B01"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "forward-probability"
      }
    ]
  },
};
