import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Don't Retrain—Align: Adapting Autoregressive LMs to Diffusion LMs via Representation Alignment",
    "titleZh": "别重训，做对齐：通过表示对齐将自回归语言模型适配为扩散语言模型",
    "venue": "arXiv:2605.06885v1 · 2026",
    "authors": "Fred Zhangzhi Peng · Alexis Fox · Anru R. Zhang · Alexander Tong",
    "affiliation": "Duke University · AITHYRA",
    "domain": "扩散语言模型 · 表示对齐 · AR→DLM 转换",
    "coreProblem": "已有转换方法能继承 AR 权重，却没有显式保住预训练形成的内部表示几何。",
    "coreInsight": "<b>Different decoding paths. Same representation map.</b><br/>在本文验证的同架构 Qwen3 设置中，语言表示可以跨生成顺序复用；DLM 主要学习新的解码路径。",
    "keywords": [
      "REPR-ALIGN",
      "Masked DLM",
      "最高 4×",
      "同一张地图"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "AR 的<b>因果下三角</b>只开放左侧上下文，词元从左到右生成；颜色条表示预训练形成的内部坐标。",
      "componentId": "hero-ar"
    },
    "newMethod": {
      "desc": "DLM 解锁<b>双向全联通</b>注意力并迭代消雾；表示对齐让隐藏状态重新汇入教师色谱。",
      "componentId": "hero-dlm"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么还要重训？",
      "badge": "inf",
      "badgeLabel": "问题与直觉",
      "bridge": "AR 检查点已经会语言，转换为 DLM 时真正缺少的是什么？先把“继承权重”和“保留表示”分开。",
      "analogy": {
        "title": "熟悉地图上的陌生走法",
        "text": "地图没有变，改变的是走路规则。若不保住地图坐标，旅行者会一边学新路线，一边重画整张地图。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "两种转换路线",
          "desc": "切换方案，观察相同 AR 起点下，模型内部表示和训练进度如何变化。论文中的最高 4× 指<b>训练步数效率</b>，不是通用墙钟速度保证。",
          "componentId": "conversion-timeline"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "本章小测 · 约 30 秒",
          "desc": "用两道轻量题检查核心概念与证据边界；可随时收起，不影响阅读。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "REPR-ALIGN 的关键并非再造模型，而是让新解码机制留在预训练已经形成的语义坐标系里。",
      "formula": {
        "lead": "AR 用固定次序分解联合概率；DLM 则允许在遮蔽序列上反复更新位置。",
        "unicode": "p<sub>AR</sub>(x)=∏<sub>i</sub>p(x<sub>i</sub>|x<sub>&lt;i</sub>)",
        "symbols": [
          {
            "sym": "x<sub>&lt;i</sub>",
            "desc": "位置 i 左侧已经可见的词元；这体现 AR 的因果顺序。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗺️",
          "title": "地图已存在",
          "desc": "AR 预训练已经形成可用的语义与句法表示。"
        },
        {
          "icon": "🛣️",
          "title": "路线需要改",
          "desc": "DLM 要学的是双向遮蔽去噪和任意顺序解码机制。"
        },
        {
          "icon": "📏",
          "title": "读对 4×",
          "desc": "它属于论文设定中的训练步数效率结论。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "REPR-ALIGN 如何工作",
      "badge": "both",
      "badgeLabel": "技术核心",
      "bridge": "先看真正改变信息流的 attention mask，再定义“学生仍在同一表示空间里”的可计算条件。",
      "analogy": {
        "title": "校准同一个方向",
        "text": "固定地图给出参考方位，旅行者只调整自己的罗盘。教师不移动，梯度只更新 DLM。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "Causal Mask vs. Bidirectional Mask",
          "desc": "点击 query token，比较它在因果下三角和双向全联通矩阵中能读取哪些位置；再切换 token masking，区分<b>注意力可见性</b>与<b>去噪目标</b>。",
          "componentId": "attention-mask-lab"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "逐层表示锚定",
          "desc": "调节 λ 并选择教学示意层，查看冻结 AR 教师与可训练 DLM 学生之间的连接；实际实现默认对齐 embedding hidden state、全部 block 输出和最终归一化 hidden state。",
          "componentId": "alignment-tower"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "亲手对齐隐藏方向",
          "desc": "拖动 DLM 向量，使它靠近 AR 参考方向。系统实时计算余弦相似度；长度并非这里的主要目标。",
          "componentId": "manual-align"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "本章小测 · 约 30 秒",
          "desc": "从四道技术题中抽取两道，一道检查机制，一道检查实现边界。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "论文实现把教师的干净因果表示作为稳定锚点，并在<b>遮蔽且移位有效</b>的位置对齐学生。",
      "formula": {
        "lead": "完整训练目标包含去噪、基线与对齐模型共享的 PAPL 路径规划损失，以及表示锚定。",
        "unicode": "L = L<sub>mdm</sub> + L<sub>path</sub> + λ<sub>repr</sub>L<sub>align</sub>,　L<sub>align</sub>=1−mean cos(h<sub>D</sub>, stopgrad(h<sub>AR</sub>))",
        "symbols": [
          {
            "sym": "L<sub>mdm</sub>",
            "desc": "仅在被遮蔽且移位有效位置计算的去噪交叉熵。"
          },
          {
            "sym": "L<sub>path</sub>",
            "desc": "PAPL 路径规划辅助损失；基线和 REPR-ALIGN 实验均包含此项。"
          },
          {
            "sym": "λ<sub>repr</sub>",
            "desc": "表示对齐权重；论文默认 10，消融测试 1、5、10、20。"
          },
          {
            "sym": "stopgrad",
            "desc": "教师特征停止梯度，AR 教师保持冻结。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔒",
          "title": "教师冻结",
          "desc": "干净序列经因果注意力产生稳定参考。"
        },
        {
          "icon": "↔️",
          "title": "学生双向",
          "desc": "遮蔽序列经双向注意力学习去噪。"
        },
        {
          "icon": "🧭",
          "title": "对齐方向",
          "desc": "余弦距离保存隐藏状态的方向几何。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "为什么表示可以迁移？",
      "badge": "both",
      "badgeLabel": "证据与反事实",
      "bridge": "对齐公式说明了怎么做，但“为什么值得做”仍要由可验证的比较来回答。",
      "analogy": {
        "title": "让罗盘回到地图北方",
        "text": "改变走法并不要求改变北方。表示对齐持续纠正学生的方位，使新路线仍可读同一张地图。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "表示空间投影与反事实",
          "desc": "拖动训练进度并关闭对齐，比较两条学习路径。散点是<b>概念投影</b>，论文没有报告真实 t-SNE/PCA 坐标。",
          "componentId": "representation-space"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "本章小测 · 约 30 秒",
          "desc": "辨别核心解释与论文证据，避免把教学动画误当成原始实验数据。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "散点与损失曲线都是机制示意；真正证据来自下游代码生成指标、λ/距离度量/层选择消融与低数据实验。",
      "formula": {
        "lead": "余弦相似度关注两个隐藏向量的夹角，因此对跨层尺度变化更稳健。",
        "unicode": "cos(a,b)=(a·b)/(‖a‖₂‖b‖₂)",
        "symbols": [
          {
            "sym": "a·b",
            "desc": "两个隐藏向量的点积。"
          },
          {
            "sym": "‖·‖₂",
            "desc": "L2 范数，只用于归一化方向。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧪",
          "title": "反事实可看",
          "desc": "关闭对齐后，教学投影不再向教师结构收敛。"
        },
        {
          "icon": "📚",
          "title": "证据在消融",
          "desc": "中层与上层锚定提高 pass@10；全层对齐取得最高 pass@1。"
        },
        {
          "icon": "⚠️",
          "title": "不是定理",
          "desc": "表示普适性是由本文范围内实验支持的解释。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "4× 加速如何实现",
      "badge": "both",
      "badgeLabel": "实验结果",
      "bridge": "现在把“更快”拆成训练步数、模型规模、数据量和可训练参数四个可核对维度。",
      "analogy": {
        "title": "同一成绩线，更少训练里程",
        "text": "两条路线穿过同一成绩线：对齐路线更早到达。里程碑表达训练步数效率，不代表所有硬件上的墙钟速度。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "协议感知的结果浏览器",
          "desc": "切换模型规模、低数据、冻结参数和 4B 公开对比。精确值直接标出，论文没有列表值的低数据曲线只展示比较方向。",
          "componentId": "result-explorer"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "消融实验室：为什么是 cosine 与 λ=10？",
          "desc": "切换距离函数、λ 权重、对齐层范围和评价指标，读取论文 Table 2 的全部精确数值。",
          "componentId": "ablation-lab"
        },
        {
          "kind": "module",
          "id": "4.3",
          "title": "本章小测 · 约 30 秒",
          "desc": "读懂最高 4× 的适用范围，并用 Table 2 判断 cosine 与 λ 的选择。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "0.6B 与 1.7B 在 200k 步的 HumanEval pass@10 分别提升 6.1 与 9.4 个绝对百分点，较大模型增益更明显。",
      "takeaways": [
        {
          "icon": "🚀",
          "title": "最高 4×",
          "desc": "Figure 1 报告论文设置中的训练加速上限。"
        },
        {
          "icon": "🌱",
          "title": "低数据有效",
          "desc": "在 REPR-ALIGN + FreezeEmb 的固定步数协议下，0.8B-token 子集优于 50B-token 流。"
        },
        {
          "icon": "🧊",
          "title": "冻结也能学",
          "desc": "1.7B 冻结嵌入、LM head 与 MLP 后吞吐最高约 2×。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "两种解码路径的赛跑",
      "badge": "inf",
      "badgeLabel": "生成过程",
      "bridge": "训练完成后，两种模型如何使用同一语言地图？把生成过程放到同一时间轴上观察。",
      "analogy": {
        "title": "单向轨道与全局消雾网格",
        "text": "上方轨道固定向右推进；下方网格让多个位置同时变清晰，并允许低置信位置重新遮蔽。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "AR 与 DLM 同步解码",
          "desc": "逐轮推进同一目标序列，点击任意位置比较其可见上下文。橙色虚线表示一次教学性的重新遮蔽；置信度不是论文报告的逐词概率。",
          "componentId": "decoding-race"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "本章小测 · 约 30 秒",
          "desc": "比较两条生成路径，并区分训练适配效率与端到端推理速度。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "论文评估采用 128 步 P2-self 采样、最多 128 个新词元、温度 0.8、top-p 0.95；附录 Table 6 还列出 top-k 200 与 algorithm temperature 0.5。DLM 使用全序列非因果前向且不使用 KV cache。",
      "takeaways": [
        {
          "icon": "➡️",
          "title": "AR 固定次序",
          "desc": "每一步依赖左侧已生成上下文。"
        },
        {
          "icon": "🌫️",
          "title": "DLM 迭代消雾",
          "desc": "多个位置在双向上下文中逐渐稳定。"
        },
        {
          "icon": "⚖️",
          "title": "不虚构延迟胜负",
          "desc": "训练加速不等于端到端推理一定更快。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "总结、边界与延伸",
      "badge": "both",
      "badgeLabel": "知识图谱",
      "bridge": "最后把方法放回生成模型谱系：哪些关系已有证据，哪些仍是开放问题？",
      "analogy": {
        "title": "路线展开为研究版图",
        "text": "道路在终点处分叉成图谱：实线连接本文直接证据，虚线连接相关工作与尚待验证的边界。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "可拖拽知识图谱",
          "desc": "拖动或点击节点，查看 REPR-ALIGN 与 AR 预训练、DLM、REPA、XLNet、P2/PAPL、代码生成及局限的关系。",
          "componentId": "knowledge-graph"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "本章小测 · 约 30 秒",
          "desc": "确认本文已经验证的范围，并识别仍需实验回答的延伸问题。",
          "componentId": "chapter-quiz"
        }
      ],
      "insight": "本文最可靠的结论属于同架构 Qwen3 到掩码 DLM 的代码生成转换；方法仍依赖强预训练 AR 教师和大量训练算力，跨架构、跨模态与非代码任务仍需实验。",
      "takeaways": [
        {
          "icon": "🧩",
          "title": "方法位置清楚",
          "desc": "它保存同一 AR 教师的坐标系，不是从外部编码器导入特征。"
        },
        {
          "icon": "🔬",
          "title": "证据边界清楚",
          "desc": "主结果是点估计，未报告误差条或多随机种子显著性。"
        },
        {
          "icon": "🌌",
          "title": "延伸问题开放",
          "desc": "其他架构、任务与模态能否跨生成顺序对齐仍待验证。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1zt4y1P7HN",
      "title": "DiffusionLM：基于扩散模型的语言模型原理精讲",
      "reason": "系统理解文本扩散模型的连续扩散基础。"
    },
    {
      "bvid": "BV1B39EYdE6P",
      "title": "一种有意思的语言模型：LLaDA",
      "reason": "快速认识论文对比语境中的掩码扩散大语言模型。"
    },
    {
      "bvid": "BV1eEiQBZEDJ",
      "title": "Fast-dLLM v2：高效训练推理框架",
      "reason": "从工程视角补充扩散语言模型的效率问题。"
    }
  ]
};
