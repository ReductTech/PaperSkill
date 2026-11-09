import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Prompt for Continual Learning",
    "titleZh": "学习提示：面向持续学习的动态提示",
    "venue": "CVPR 2022 · Northeastern University / Google Cloud AI",
    "authors": "Zifeng Wang, Zizhao Zhang, Chen-Yu Lee, Han Zhang, et al.",
    "affiliation": "Northeastern University; Google Cloud AI; Google Research",
    "domain": "视觉持续学习 · 参数高效适配",
    "coreProblem": "不回放旧样本、也不知道测试任务编号时，模型怎样保留旧知识并学习新任务？",
    "coreInsight": "冻结预训练主干，让输入通过键值查询只取用当前需要的提示，再把提示拼到 token 序列前。",
    "keywords": [
      "持续学习",
      "提示池",
      "实例级查询",
      "灾难性遗忘",
      "ViT"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "回放 + 微调",
      "desc": "反复改写同一套配方，旧底片逐渐失去原来的颜色。",
      "componentId": "l2p-cover-old"
    },
    "newMethod": {
      "title": "提示池 + 实例查询",
      "desc": "相机保持固定，当前底片从滤镜盒中选择并组合提示。",
      "componentId": "l2p-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 顺序学习为何遗忘",
      "modules": [
        {
          "kind": "module",
          "id": "forgetting",
          "title": "提示记忆与灾难性遗忘",
          "desc": "比较单套滤镜与提示池，观察旧任务照片在学习新任务后如何变化。",
          "componentId": "l2p-forgetting"
        },
        {
          "kind": "module",
          "id": "pretokens",
          "title": "从 token 到提示",
          "desc": "先理解 ViT 的 token 形状、提示插入位置，以及为什么单一共享提示退化成灾难性遗忘。",
          "componentId": "l2p-pretokens"
        }
      ],
      "scenes": [
        {
          "id": "c1-forgetting",
          "title": "顺序更新会覆盖旧记忆",
          "goal": "切换记忆方式与任务进度，观察旧照片是否还能保留。",
          "summary": "同一套参数反复更新会挤压旧知识",
          "interaction": "选择单套滤镜或提示池，再推进任务 1 到 3",
          "next": "补齐 ViT 与提示调优的前置知识",
          "notes": "暗房照片褪色只是灾难性遗忘的直观比喻，不对应论文中的具体准确率曲线。论文定义持续学习处理顺序到达的非平稳任务，并提出不回放旧样本、不需要测试任务编号的提示池方案（第 1 页摘要与第 1 节）。",
          "componentId": "l2p-forgetting",
          "moduleId": "forgetting"
        },
        {
          "id": "c2-pretokens",
          "title": "从 token 到提示：为什么需要一池提示",
          "goal": "看清图像 token、提示形状与单一共享提示的失败方式。",
          "summary": "ViT token 序列与可组合提示的前置链",
          "interaction": "对照 token 序列、参数核算与单一提示消融结果",
          "next": "分清任务、类别、域与任务无关四种协议",
          "notes": "前置知识来自第 3–4 页提示调优与 ViT 定义、第 7 页训练配置与 Table 5。L=197、D=768 是按 ViT-B/16 与 224×224 输入推导，论文未逐项列出。",
          "componentId": "l2p-pretokens",
          "moduleId": "pretokens"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 从任务编号到实例查询",
      "modules": [
        {
          "kind": "module",
          "id": "protocol",
          "title": "持续学习协议",
          "desc": "切换任务增量、类别增量与任务无关设置，观察推理时能否使用任务编号。",
          "componentId": "l2p-protocol"
        },
        {
          "kind": "module",
          "id": "query",
          "title": "实例级提示查询",
          "desc": "拖动查询点，观察最靠近的提示键和选中的提示组合。",
          "componentId": "l2p-query"
        }
      ],
      "scenes": [
        {
          "id": "c3-protocol",
          "title": "四种协议，四种被允许的信息量",
          "goal": "区分任务、类别、域增量和任务无关设置，并理解指标为何随协议变化。",
          "summary": "测试时是否知道任务编号直接改变评测难度",
          "interaction": "点选四种协议，查看测试时可用的信息与对应结果表",
          "next": "让输入自己查询提示键",
          "notes": "论文第 3.1 节定义任务、类别、域增量和任务无关设置。任务无关场景没有清晰任务边界，测试时也不提供任务编号。L2P 的实例级查询不依赖 task id；不要把它说成完全无监督。",
          "componentId": "l2p-protocol",
          "moduleId": "protocol"
        },
        {
          "id": "c4-query",
          "title": "实例级提示查询",
          "goal": "拖动输入查询，使距离最近的三个键被选中。",
          "summary": "查询向量与提示键匹配决定当前输入取哪些提示",
          "interaction": "鼠标或触控拖动蓝点，也可用方向键移动",
          "next": "看清提示池保存了什么",
          "notes": "二维位置只是把高维查询与键投影到平面上便于演示。选中顺序由函数中固定的三维查询向量和键向量按余弦距离实际计算，不是预先写死的三个编号。论文使用冻结模型的 [class] 特征作为查询，并以余弦距离选择前 N 个键（第 5 页式 3）。",
          "componentId": "l2p-query",
          "moduleId": "query"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 提示池与组合提示",
      "modules": [
        {
          "kind": "module",
          "id": "pool",
          "title": "提示池与 token 拼接",
          "desc": "切换底片并调整选择数 N，观察提示如何拼到图像 token 前。",
          "componentId": "l2p-pool"
        },
        {
          "kind": "module",
          "id": "selection",
          "title": "提示选择分布",
          "desc": "切换数据集，对照论文统计图观察共享与专用提示。",
          "componentId": "l2p-selection"
        }
      ],
      "scenes": [
        {
          "id": "c5-pool",
          "title": "提示池与 token 拼接",
          "goal": "改变选择数 N，观察提示如何拼到图像 token 前，并核对序列长度。",
          "summary": "每个输入选择 N 个提示并拼到图像 token 前",
          "interaction": "选择三张底片之一，拖动选择数 N",
          "next": "观察不同任务是否共享提示",
          "notes": "提示池包含 M 个提示，每个提示形状为 Lp × D。输入选取 N 个提示，形成 xp=[P_s1; …; P_sN; xe]（第 4 页式 1、2）。这里用示意键挑选卡片，真实选择由查询与可学习键决定。不要宣称 N=5 在所有数据集上都最优，论文 Figure 4 表明最优设置依数据集变化。",
          "componentId": "l2p-pool",
          "moduleId": "pool"
        },
        {
          "id": "c6-selection",
          "title": "共享提示与任务特定提示",
          "goal": "对照 Split CIFAR-100 与 5-datasets 的提示选择直方图。",
          "summary": "相似任务更多共用提示，差异任务更多使用专用提示",
          "interaction": "切换数据集，观察论文原图焦点与结论",
          "next": "把选择和分类放到同一个损失函数里",
          "notes": "论文 Figure 3 的横轴为提示编号、纵轴为选择频率，颜色区分任务；这里只保留原图并改变解释焦点。CIFAR-100 内部相似度更高，提示重叠更多；5-datasets 更分散，任务特定提示更多。原图只展示前五个 CIFAR-100 任务。",
          "componentId": "l2p-selection",
          "moduleId": "selection"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 联合优化与冻结主干",
      "modules": [
        {
          "kind": "module",
          "id": "loss",
          "title": "分类损失与键对齐",
          "desc": "调整 λ 和样本，观察分类项与查询键距离项如何组成总损失。",
          "componentId": "l2p-loss"
        },
        {
          "kind": "module",
          "id": "training",
          "title": "一个训练 batch",
          "desc": "逐步查看查询、选提示、前向与参数更新。",
          "componentId": "l2p-training"
        }
      ],
      "scenes": [
        {
          "id": "c7-objective",
          "title": "目标函数与提示键对齐",
          "goal": "改变损失权重 λ，理解总损失中的两项各做什么。",
          "summary": "分类交叉熵与查询键代理损失联合优化",
          "interaction": "选择样本，拖动 λ 从 0 到 1",
          "next": "查看一个 batch 更新了哪些参数",
          "notes": "总损失由分类交叉熵和 λ 加权的查询-键代理损失组成（第 5 页式 5）。论文设置 λ=0.5。页面中的 CE 与余弦距离是可变化的教学示例，不是论文实测数据；不要从 λ 滑块推导任何准确率。",
          "componentId": "l2p-loss",
          "moduleId": "loss"
        },
        {
          "id": "c8-training",
          "title": "一个训练 batch 只更新什么",
          "goal": "逐步走过 query、选提示、前向和更新，识别冻结主体。",
          "summary": "更新提示、键和分类器，保持预训练 Transformer 冻结",
          "interaction": "点击查询、选提示、前向、更新四个阶段",
          "next": "检查无回放设置下的结果",
          "notes": "训练循环见论文 Algorithm 1（第 13 页）。输入嵌入层、Transformer 主体保持冻结；提示 P、键 K 和分类器 φ 被更新。图示使用论文 Figure 2 原图作辅助，不要把平均池化误解成冻结主干之外的额外特征模型。",
          "componentId": "l2p-training",
          "moduleId": "training"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 结果与核心消融",
      "modules": [
        {
          "kind": "module",
          "id": "results",
          "title": "无回放主结果",
          "desc": "在同一个数据集内比较无回放方法的平均准确率。",
          "componentId": "l2p-results"
        },
        {
          "kind": "module",
          "id": "ablation",
          "title": "核心部件消融",
          "desc": "逐项移除提示池、键值对与多样化选择，比较 5-datasets 准确率。",
          "componentId": "l2p-ablation"
        },
        {
          "kind": "module",
          "id": "hyperparams",
          "title": "提示容量参数",
          "desc": "选择 Lp 与 N 的组合，查看论文报告的平均准确率。",
          "componentId": "l2p-hyperparams"
        }
      ],
      "scenes": [
        {
          "id": "c9-results",
          "title": "不回放旧样本时的准确率",
          "goal": "比较无回放方法，并分清每个数据集自己的上界与协议。",
          "summary": "L2P 在两个分类增量基准上均明显高于无回放基线",
          "interaction": "切换 Split CIFAR-100 和 5-datasets",
          "next": "检查哪些设计带来增益",
          "notes": "数值来自论文 Table 1 的无回放行：Split CIFAR-100 为 FT-seq 33.61、EWC 47.01、LwF 60.69、L2P 83.83、上界 90.85；5-datasets 为 20.12、50.93、47.91、81.14、93.93。平均准确率越高越好，数值为三次运行均值，不能跨两类基准混算增益。",
          "componentId": "l2p-results",
          "moduleId": "results"
        },
        {
          "id": "c10-ablation",
          "title": "核心部件消融",
          "goal": "点击不同消融项，比较 5-datasets 平均准确率。",
          "summary": "提示池、可学习键与多样化选择都影响最终性能",
          "interaction": "点击四组消融柱",
          "next": "检查提示长度与选择数",
          "notes": "论文 Table 5：完整 L2P 81.14，去掉提示池 51.96，去掉键值对 58.33，去掉多样化选择 62.26。这里只展示平均准确率；对应遗忘率分别为 4.64、26.60、20.45、17.84，越低越好。",
          "componentId": "l2p-ablation",
          "moduleId": "ablation"
        },
        {
          "id": "c11-capacity",
          "title": "提示容量不是越大越好",
          "goal": "选择 Lp 与 N，读取对应平均准确率并比较容量取舍。",
          "summary": "提示长度、选择数与池大小共同决定可用容量",
          "interaction": "切换数据集，点击 4×4 热力表中的单元格",
          "next": "把结论推到适用边界",
          "notes": "表格数值逐项取自论文 Figure 4：CIFAR-100 的 N 为 1/5/10/20，5-datasets 的 N 为 1/2/4/8。论文称过小 Lp 不利于结果，过大提示可能造成知识欠拟合；后者是作者假设。页面不展示未准确转录的池大小曲线。",
          "componentId": "l2p-hyperparams",
          "moduleId": "hyperparams"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 适用条件与局限",
      "modules": [
        {
          "kind": "module",
          "id": "boundary",
          "title": "失败与修复边界",
          "desc": "选择陌生场景并判断应优先补提示容量、真实基准还是预训练骨干。",
          "componentId": "l2p-boundary"
        }
      ],
      "scenes": [
        {
          "id": "c12-boundary",
          "title": "结论与适用边界",
          "goal": "把三条核心结论和各自的成立条件一起带走。",
          "summary": "论文验证过的能力、量化条件与尚未验证的扩展",
          "interaction": "对照三枚结论印章与论文未证明事项",
          "next": "",
          "notes": "三条结论分别依据 p.6 Table 1、p.5 Eq.3、p.8 Figure 4。局限来自 p.12 App. A–B：视觉模型、依赖预训练序列模型、任务无关基准偏合成；同时训练仍依赖标签与交叉熵。",
          "componentId": "l2p-boundary",
          "moduleId": "boundary"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "c1-forgetting": "./thumbnails/c1-forgetting.png",
    "c2-pretokens": "./thumbnails/c2-pretokens.png",
    "c3-protocol": "./thumbnails/c3-protocol.png",
    "c4-query": "./thumbnails/c4-query.png",
    "c5-pool": "./thumbnails/c5-pool.png",
    "c6-selection": "./thumbnails/c6-selection.png",
    "c7-objective": "./thumbnails/c7-objective.png",
    "c8-training": "./thumbnails/c8-training.png",
    "c9-results": "./thumbnails/c9-results.png",
    "c10-ablation": "./thumbnails/c10-ablation.png",
    "c11-capacity": "./thumbnails/c11-capacity.png",
    "c12-boundary": "./thumbnails/c12-boundary.png"
  }
};
