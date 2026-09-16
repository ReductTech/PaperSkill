import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "MiniMax Sparse Attention",
    "titleZh": "在百万上下文中，找到值得细读的部分",
    "venue": "arXiv · 2026 · v2",
    "authors": "Xunhao Lai、Weiqi Xu、Yufeng Yang 等",
    "affiliation": "MiniMax、北京大学、NVIDIA 等",
    "domain": "长上下文 · 稀疏注意力",
    "coreProblem": "上下文越来越长，每次都细读全部历史的注意力成本难以承受。",
    "coreInsight": "轻量检索器按组挑块，主注意力只细读选中部分。 <a href=\"https://arxiv.org/abs/2606.13392v2\" target=\"_blank\" rel=\"noreferrer\">阅读原论文 ↗</a>",
    "keywords": [
      "GQA",
      "块级 Top-k",
      "KL 对齐",
      "GPU 内核"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "每次提问，都要细读所有可见的历史。上下文越长，配对成本越高。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "先用轻量索引找相关块，再在选中的块内计算精确注意力。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "长上下文，贵在哪里？",
      "badge": "inf",
      "badgeLabel": "原理与实践",
      "bridge": "智能体要回看行动记录，代码助手要联系仓库中的不同文件，长期记忆要把远处证据带回当前问题。上下文因此越来越长。MSA 的出发点是：能否先找出值得细读的位置，再完成注意力计算？（p.2 §1；p.3 Eq.1）",
      "analogy": {
        "title": "扫读资料，找到证据",
        "text": "放大镜扫过资料册，目标为一条带书签的句子。资料增加后，需要比对的内容迅速变多。这个比喻帮助建立直觉，实际机制以本章公式和交互为准。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "长度倍增实验",
          "desc": "资料册厚度与因果配对数随上下文长度一起增长。这里把一个位置对自己及此前位置的读取计作配对，因此第 i 个位置有 i+1 个可见位置。图中是教学模拟，非论文实测；配对数帮助理解增长，不代表硬件延迟或 FLOPs。（p.3 Eq.1）",
          "componentId": "msa-1"
        }
      ],
      "insight": "长度翻倍时，全部位置累计的因果配对数接近四倍。GQA 共享 K/V 头，仍需处理远处 token；MSA 进一步改变每次主注意力读取的支持集。",
      "formula": {
        "lead": "把每个位置能读取的历史加起来，就得到因果注意力的教学配对数。",
        "unicode": "Σ<sub>i=0</sub><sup>N−1</sup> (i+1) = N(N+1)/2，且 j ≤ i",
        "symbols": [
          {
            "sym": "N",
            "desc": "序列长度；交互采用 32 到 1024 的教学尺度。配对数量级随 N² 增长，不等同于整机运行时间。"
          },
          {
            "sym": "i",
            "desc": "当前 query 的位置，从 0 开始计数。它可以读取自己与此前位置。"
          },
          {
            "sym": "j",
            "desc": "候选 key 的位置。因果约束要求 j≤i，未来位置不得读取。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📚",
          "title": "长上下文有用",
          "desc": "智能体、仓库级代码和长期记忆需要跨远距离使用证据，这构成长上下文研究的实际动机。（p.2 §1）"
        },
        {
          "icon": "🔗",
          "title": "GQA 并未删除远处 token",
          "desc": "共享 KV 头减少重复存储和相关开销，但并没有把所有历史位置从注意力中排除。（p.3 §2.1–2.3）"
        },
        {
          "icon": "🔍",
          "title": "先找到主要瓶颈",
          "desc": "全序列 prefill 的注意力有二次项；单步 decode 的读取随当前长度增长，两者的计时与加速应分别讨论。（p.3 Eq.1；p.12 §5.4）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "同组共享，也要遵守时间",
      "badge": "inf",
      "badgeLabel": "原理与实践",
      "bridge": "上一章说明了为什么要减少主注意力读取量。接下来要先确定共享单位：GQA 用一个 KV 头定义一组，组内多个 query 头保留各自查询，却共享 K/V。MSA 进一步让同组共享选块集合，但任何共享都不能越过时间边界。（p.3 Eqs.3–4；p.4 §3.1）",
      "analogy": {
        "title": "移动资料，找到证据",
        "text": "一枚书签沿资料册页边移动，只看到书签之前的文字。若一页只读到一半，余下文字也不可提前引用。这个比喻帮助建立直觉，实际机制以本章公式和交互为准。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "把查询移到过去",
          "desc": "书签代表当前 query 的位置。32 个 token 每 4 个组成一块；橙色框标记当前块，斜线表示未来。下方 4Q→1KV 只演示一组的共享关系，论文效率配置为 64Q/4KV，每组 16Q。教学模拟，非论文实测。（p.3 Eqs.3–4；p.5 §3.2）",
          "componentId": "msa-2"
        }
      ],
      "insight": "组内共享 KV 与组选块集合，不等于 query 相同。当前块始终保留，但块内仍逐 token 应用 j≤i 的因果遮罩。",
      "formula": {
        "lead": "组大小来自头数之比；时间边界则独立限制每个 query 能读取的 key。",
        "unicode": "G = Hq / Hkv，j ≤ i，当前块 = ⌊i / Bk⌋",
        "symbols": [
          {
            "sym": "Hq",
            "desc": "主注意力 query 头数；论文效率配置为 64。"
          },
          {
            "sym": "Hkv",
            "desc": "主注意力 KV 头数；每个 KV 头定义一组，论文效率配置为 4。"
          },
          {
            "sym": "G",
            "desc": "每组 query 头数，Hq/Hkv 必须是整数；64/4=16。图中仅简化展示 4 个 query 头共享 1 个 KV 头。"
          },
          {
            "sym": "Bk",
            "desc": "每个连续 token 块的大小；此处教学示例为 4，论文效率配置为 128。"
          },
          {
            "sym": "i",
            "desc": "当前 query 的位置；以 0 为起点，拖动书签就改变它。"
          },
          {
            "sym": "j",
            "desc": "候选 key 的位置；即使属于当前块，j>i 也必须遮蔽。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧩",
          "title": "每个 KV 头定义一组",
          "desc": "组选块为同一 KV 组中的 query 头共享，索引分支按组提供选择。（p.3 Eqs.3–4；p.4 §3.1）"
        },
        {
          "icon": "🔗",
          "title": "组内 Q 不同但 KV 共享",
          "desc": "query 头仍拥有各自查询投影，共享并不意味着把不同头的查询全部合并。（p.3 §2.1–2.3）"
        },
        {
          "icon": "⏳",
          "title": "当前块也要因果遮罩",
          "desc": "强制保留当前块保护近处信息，但不会开放其中尚未出现的 token。（p.5 §3.2；p.29 §C.2）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先打分，再整块选择",
      "badge": "inf",
      "badgeLabel": "原理与实践",
      "bridge": "有了 KV 分组和因果边界，MSA 就可以为每组安排检索：每组一个索引 query 头，所有组共享一个索引 key 头。先计算 token 相关分数，再对每块的可见 token 取最大值，最后选择块。这与先把一块的 key 压缩成一个向量不同。（p.4 §3.1 Eqs.5–7）",
      "analogy": {
        "title": "圈选资料，找到证据",
        "text": "一支笔在资料册上圈住一句高相关内容，整页因此进入细读名单。这里用一句提示一页；实际机制是对块内可见 token 的索引分数取最大值。比喻不代表真实模型激活。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "跟踪一次 Top-k 检索",
          "desc": "选块过程依次经历 token 分数、块内 max、组选块集合和主分支支持集。本例 i=29、Bk=4、k=3；块 7 只含两个可见 token。当前块占一个名额，因此另选两块。分数为固定教学模拟，非论文实测。（p.4 Eqs.6–7；p.5 §3.2）",
          "componentId": "msa-3"
        }
      ],
      "insight": "块 3 的尖峰 3.2 和块 1 的尖峰 2.8 帮它们进入名单；当前块 7 的分数虽低也必须保留。三个块共提供 10 个可见 token，而非强行补齐为 12 个。",
      "formula": {
        "lead": "先计算 token 点积得分，再在每块可见位置中取最大值；本地块已包含在 k 的总预算中。",
        "unicode": "s(i,j,r) = Qidx(i,r)·Kidx(j)/√didx<br/>块分数 = max<sub>块内且 j≤i</sub> s(i,j,r)<br/>I = {当前块} ∪ Top-(k−1)(非当前可见块)",
        "symbols": [
          {
            "sym": "Qidx",
            "desc": "索引 query：每个 KV 组一个索引 Q 头，区别于主注意力的多个 query 头。"
          },
          {
            "sym": "Kidx",
            "desc": "索引 key：所有组共享单个索引 K 头；此处先逐 token 打分，没有先压缩块内 key。"
          },
          {
            "sym": "didx",
            "desc": "索引头维度；√didx 用于缩放点积。此处表中直接给出教学分数，不反推真实 Q/K。"
          },
          {
            "sym": "I",
            "desc": "当前 query 在组 r 的选块集合；本例为 {1,3,7}。若历史可用块不足预算，只使用可用块。"
          },
          {
            "sym": "k",
            "desc": "选中块总预算，包含当前块；本例为 3，绝非额外再加当前块得到 4。"
          },
          {
            "sym": "r",
            "desc": "KV 组的编号；同组 query 头共享这组选块集合。"
          },
          {
            "sym": "i",
            "desc": "query 的位置，本例固定为 29。"
          },
          {
            "sym": "j",
            "desc": "key 的位置；只有 j≤29 参与本例打分与 max pooling，未来 30、31 不参与。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📍",
          "title": "块级 max 不会平均掉尖峰",
          "desc": "先取得 token 分数，再取块内可见最大值，可让单个高相关位置影响整块选择。（p.4 Eq.6）"
        },
        {
          "icon": "🔖",
          "title": "Top-k 总数含当前块",
          "desc": "当前块固定占用一个名额，不再额外强制首块或一个大的局部窗口。（p.5 §3.2；p.29 §C.2）"
        },
        {
          "icon": "🧪",
          "title": "教学数值不是模型激活",
          "desc": "例子用于检验因果 max 与预算规则；被选中的可见 token 随后还需在主分支计算注意力。（p.4 Eqs.6–8）"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "少读多少，真的快多少？",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "上一章把 token 变成了可选择的块。现在固定每块 128 个 token，亲自计算：少读一些块能省下多少主分支计算，又有哪些成本仍然存在？",
      "analogy": {
        "title": "量取资料，找到证据",
        "text": "一把尺子量资料册中被标记的页宽。这个比喻帮助理解阅读预算；真实的索引分支仍会扫描因果可见上下文，计算模型以本章公式为准。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "注意力预算计算器",
          "desc": "上下文长度与块预算共同决定计算成本。k 含当前块；每个 query、每个 KV 组最多读取 k × Bk 个主分支 token。教学模拟，非论文实测：按 p.6 §3.3 Eq.12 计算，Hq=64、Hkv=4、dh=128、Bk=128；didx=128 是明确选定的演示参数。",
          "componentId": "msa-4"
        }
      ],
      "insight": "2048 是默认设置下每个 query、每个组的主分支 token 预算；它既不是整段上下文长度，也不是 KV cache 的总存储量。",
      "formula": {
        "lead": "按论文的理论 FLOPs 近似，MSA 的成本由全上下文索引项和所选 token 的主注意力项相加得到（p.6 Eq.12）。",
        "unicode": "F<sub>GQA</sub> = 2Hq·dh·N²；F<sub>MSA</sub> = Hkv·didx·N² + 4Hq·dh·N·k·Bk",
        "symbols": [
          {
            "sym": "N",
            "desc": "序列长度；计算器提供 32K、128K、512K、1M 四档，按 1024 的倍数计算。"
          },
          {
            "sym": "Hq",
            "desc": "主分支 query 头数，演示固定为 64。"
          },
          {
            "sym": "Hkv",
            "desc": "主分支 KV 头数，也是检索组数，演示固定为 4。"
          },
          {
            "sym": "dh",
            "desc": "主分支每头维度，演示固定为 128。"
          },
          {
            "sym": "didx",
            "desc": "索引维度；本计算器选取 128 作为演示参数，不把这一取值另称为已披露的实验配置。"
          },
          {
            "sym": "k",
            "desc": "每个 query、每个组的选块总预算，含必选的当前块。"
          },
          {
            "sym": "Bk",
            "desc": "每个 KV 块的 token 数，固定为 128；当前块内的未来 token 仍被遮罩。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📏",
          "title": "2048 是每 query 每组预算",
          "desc": "默认 k=16、Bk=128 时上限为 2048 个 token，当前块已经计入 k；因果边界处实际可见数量可能更少（p.5 §3.2）。"
        },
        {
          "icon": "🔎",
          "title": "索引仍有 N² 项",
          "desc": "固定 k 后主分支项随 N 线性增长，但完整 MSA 的索引项仍随 N² 增长，不能把整个算法称为严格线性（p.6 Eq.12）。"
        },
        {
          "icon": "⏱",
          "title": "28.4× 不等于整模型提速",
          "desc": "论文在 H800、1M 设置下报告注意力 FLOPs 缩减 28.4×、prefill 加速 14.2×、decode 加速 7.6×；三者口径不同，均不直接等于完整应用速度（p.12 §5.4 Fig.4）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "不同的问题，翻不同的页",
      "badge": "both",
      "badgeLabel": "原理与实践",
      "bridge": "预算决定能选几块，但还没有回答由谁决定选哪几块。GQA 的各组使用不同查询，MSA 因而允许各组拥有自己的选块集合。",
      "analogy": {
        "title": "翻页资料，找到证据",
        "text": "一页带书签的资料页围绕书脊翻动。同一份资料可以按不同问题翻到不同页；这个比喻不表示模型会把组固定分工为某种语义或任务。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "按组选择远处证据",
          "desc": "强制两组共用选块结果，可能遗漏其中一组的高分证据。教学模拟，非论文实测：8 个块、k=3，当前块 B7 占 1 个名额。固定块分数只构造机制反例，不代表真实注意力激活（pp.4–5 Eqs.5–7；Appendix A Fig.5）。",
          "componentId": "msa-5"
        }
      ],
      "insight": "共享的是同组的 KV 与选块集合；跨组可以有不同集合。索引分支的 K 头仍然全组共享，分组选择来自每组不同的索引 Q。",
      "formula": {
        "lead": "每组独立使用自己的索引查询给块打分；在本教学例中，k=3 等于两个远处块加上当前块（p.4 Eqs.5–7；p.5 Local Block）。",
        "unicode": "G = Hq/Hkv；|Iᵢʳ| ≤ k；B<sub>current</sub> ∈ Iᵢʳ",
        "symbols": [
          {
            "sym": "G",
            "desc": "每个 KV 组内的 query 头数；真实示例配置为 64/4=16，同组各头仍有自己的 query 投影。"
          },
          {
            "sym": "Hq",
            "desc": "主分支 query 头总数。"
          },
          {
            "sym": "Hkv",
            "desc": "KV 头总数，即独立检索组数。"
          },
          {
            "sym": "Iᵢʳ",
            "desc": "query 位置 i、组 r 的选中块集合；同组 query 头共享它，不同组可不同。"
          },
          {
            "sym": "k",
            "desc": "选块总预算，包含当前块；可见块不足时不会凭空补足。"
          },
          {
            "sym": "Bcurrent",
            "desc": "query 所在的当前块；必须保留，其中的未来 token 仍因因果约束不可访问。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "👥",
          "title": "组内共享检索结果",
          "desc": "每个 KV 头定义一组，同组的 query 头共享 KV 和选块集合，但各头的查询投影与注意力概率仍可以不同（p.3 Eqs.3–4；p.4 Eq.8）。"
        },
        {
          "icon": "📚",
          "title": "组间允许不同选择",
          "desc": "索引分支为每组配置一个 Q 头、为所有组共享一个 K 头，从而用不同查询产生各组的块分数与选择（p.4 Eqs.5–7）。"
        },
        {
          "icon": "🧭",
          "title": "分组检索不是语义标签规则",
          "desc": "教学反例展示共用选择可能漏掉另一组的高分块；不能据此声称某个组固定处理代码、时间或人物等语义类别（Appendix A Fig.5；本章教学推演）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "块选少了，softmax 仍然精确",
      "badge": "inf",
      "badgeLabel": "原理与实践",
      "bridge": "选块结果现在送入主分支。这里保留 Q、K、V 与 softmax 运算，但归一化只覆盖所选 token。亲自对照完整输出与稀疏输出，就能区分“集合内精确计算”和“相对全注意力的近似”。",
      "analogy": {
        "title": "聚焦资料，找到证据",
        "text": "放大镜聚焦资料册上的一条细节，周围文字保持静止。选中页可以仔细读，未翻到的页却不会自动参与结论；真正的概率与输出由下方主分支计算决定。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "完整与稀疏输出对照",
          "desc": "保留或遗漏高分块，会改变 softmax 的归一化集合。教学模拟，非论文实测：8 个可见 token 分成 4 块，k=2 含当前块 B3；两种方法同步展示实际 softmax 概率，动画时长不表示运算速度（p.4 Eq.8）。",
          "componentId": "msa-6"
        }
      ],
      "insight": "所选集合内，softmax 仍按标准公式精确归一化；相对完整稠密注意力，近似来自支持集的缩小。输出接近与否取决于保留的信息。",
      "formula": {
        "lead": "主分支只在所选块内的因果可见 token 上计算标准注意力；更换支持集也更换了 softmax 的分母（p.4 Eq.8）。",
        "unicode": "O = softmax(QK<sub>I</sub>ᵀ / √dh) V<sub>I</sub>",
        "symbols": [
          {
            "sym": "O",
            "desc": "当前 query 头的注意力输出；本章把每个 value 简化为一个标量以便核算。"
          },
          {
            "sym": "Q",
            "desc": "主分支的查询向量；仍然属于原来的注意力计算。"
          },
          {
            "sym": "KI",
            "desc": "从所选块集合 I 中取出的因果可见 key，不包含未选块和未来 token。"
          },
          {
            "sym": "VI",
            "desc": "与这些 key 对应的主分支 value；索引分支不产生另一份 value 输出。"
          },
          {
            "sym": "dh",
            "desc": "主分支 head 维度；本章给定的 logits 视为已经缩放后的 QKᵀ/√dh。"
          },
          {
            "sym": "softmax",
            "desc": "先减去当前支持集内的最大 logit，再取指数并除以指数和；此稳定实现与标准 softmax 数学等价。"
          },
          {
            "sym": "I",
            "desc": "选中的块集合；本章保留高分块时为 B2、B3，漏掉高分块时为 B0、B3，k=2 始终包含当前块 B3。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "∑",
          "title": "保留 softmax 运算",
          "desc": "在每个 query、每个头的所选 token 支持集内，概率按标准 softmax 重新归一化、和为 1，随后加权 value（p.4 Eq.8）。"
        },
        {
          "icon": "🔍",
          "title": "集合外信息不会自动回来",
          "desc": "未选 token 不参与这次主分支输出；教学例中漏掉高 logit 块会改变概率与输出，真实影响还依赖任务和模型（p.4 Eq.8；本章教学推演）。"
        },
        {
          "icon": "≈",
          "title": "近似的是支持集",
          "desc": "集合内精确计算并不保证等于完整稠密注意力；本章同时给出两种输出及绝对差，不据教学数值推断真实模型的精度损失（p.4 Eq.8）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "索引器怎样学会找证据？",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "我们已经知道怎样按块读取，但最关键的选择器从哪里获得学习信号？本章把不可微的选择问题与可微的分布对齐拆开来看。",
      "analogy": {
        "title": "照着参考线描摹",
        "text": "参考线不为迁就笔尖而改变；笔尖逐渐靠近它。KL 对齐也需要固定老师的梯度边界，但真实模型训练比这个比喻更复杂。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "让索引分布靠近老师",
          "desc": "四个 token 的教学模拟：老师概率固定，索引 logits 逐步更新。观察概率柱与 KL 同时变化；非论文训练复现（p.5，Eqs.9–11）。",
          "componentId": "msa-7"
        }
      ],
      "insight": "Top-k 给出离散路由，KL 给索引分支提供可学习的对齐信号。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "离散选择",
          "desc": "普通 Top-k 块编号无法直接传递语言建模目标的路由梯度。"
        },
        {
          "icon": "🔎",
          "title": "KL 的方向",
          "desc": "优化教师 ∥ 索引，两个概率分布定义在同一个支持集上。"
        },
        {
          "icon": "✓",
          "title": "双重梯度隔离",
          "desc": "停止教师与索引输入的梯度，让辅助损失只更新索引 Q/K。"
        }
      ],
      "formula": {
        "lead": "同一组选中 token 上，索引分布向主分支老师靠近。",
        "unicode": "L<sub>KL</sub> = 平均 D<sub>KL</sub>(stopgrad(P) ∥ Pidx)<br/>Qidx = stopgrad(X) Widx_q；Kidx = stopgrad(X) Widx_k",
        "symbols": [
          {
            "sym": "Pidx",
            "desc": "索引分支在选中支持集上的 softmax 概率。"
          },
          {
            "sym": "P",
            "desc": "先对每个主分支 query 头分别 softmax，再在 GQA 组内平均概率；不是平均 logits。"
          },
          {
            "sym": "X",
            "desc": "输入隐藏状态；这里停止梯度，使辅助 KL 不通过索引器输入影响主干。"
          },
          {
            "sym": "stopgrad",
            "desc": "前向值保留，反向梯度阻断。老师和索引输入都需要处理。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一层 MSA，谁负责什么？",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "有了选择和学习规则，现在可以把两条分支连回一层完整结构。重点是分清“提供块编号”与“产生注意力输出”。",
      "analogy": {
        "title": "在页边标明分工",
        "text": "笔在资料册旁标记出需要关注的位置，真正的内容仍在原页上。索引器的职责也是提供位置，主分支才负责内容计算。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "双分支结构探查",
          "desc": "两条分支共享输入，却承担不同职责；当前节点的连接与张量形状在下方对应显示。索引维度 128 是本图明示的演示配置（pp.4–6，Eqs.5、8、11、Algorithm 1）。",
          "componentId": "msa-8"
        }
      ],
      "insight": "最终索引器是纯选择器，没有 value 头，也没有额外的注意力加法输出。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "组间独立索引 Q",
          "desc": "每组一个索引 query 头，所有组共享一个索引 key 头。"
        },
        {
          "icon": "🔎",
          "title": "精读由主分支负责",
          "desc": "主分支保留 Q/K/V，对选中块的因果可见 token 运算。"
        },
        {
          "icon": "✓",
          "title": "简化后的最终设计",
          "desc": "有 warmup 后去掉索引 value 路径；不是把附录早期方案原样保留。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "把稀疏变成稳定和速度",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "结构简单不意味着训练和 GPU 执行会自动高效。先把稀疏路由训练稳定，再让选择结果适合硬件执行。",
      "analogy": {
        "title": "夹住当前阅读页",
        "text": "一枚书夹稳定当前页，让阅读不会因翻动而丢失眼前线索。这个类比对应保留当前块，不代表模型要强制保留所有最近页面。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "训练路线与内核选择",
          "desc": "对比两条训练路线，再探查梯度隔离、选块保序与 KV 外循环。训练预算来自 §5.1，内核原理来自 §4；示意图不测量硬件延迟。",
          "componentId": "msa-9"
        }
      ],
      "insight": "先学会检索，再启用稀疏；计算省下来的量，还要靠执行方式转化为时间。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两条路线都要 warmup",
          "desc": "原生 PT 与转换 CPT 都有 40B token 索引器预热，总预算各为 3T。"
        },
        {
          "icon": "🔎",
          "title": "省去的是选块 exp",
          "desc": "softmax 保序允许直接排序原分数，主注意力的 softmax 仍然保留。"
        },
        {
          "icon": "✓",
          "title": "聚合共享 KV 的查询",
          "desc": "KV 外循环提高矩阵乘利用率，热门块拆分并用 LSE 合并局部结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "看结果，也看结论的边界",
      "badge": "both",
      "badgeLabel": "实验与判断",
      "bridge": "最后回到证据：稀疏带来多少效率，哪些能力保持接近，又在哪些任务上仍有差距？把实验条件放在结论旁边，才能作出可靠判断。",
      "analogy": {
        "title": "核对实验记录",
        "text": "核对资料中的一行结果时，既看数值，也看它属于哪次实验。论文里的主评测、长上下文扩展和效率测试同样需要分别阅读。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "同一指标，公平比较",
          "desc": "同一指标的条形图使用共同尺度，完整表值同时保留。质量数据来自 p.11 Table 2 与 p.12 Table 3，PPL 越低越好，其余分数越高越好。",
          "componentId": "msa-10"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "证据边界检查",
          "desc": "哪句话能被论文证据支持？选择断言，比较它与计算量、效率测试、质量评测的边界（Eq.12、Fig.4、Tables 2–3）。",
          "componentId": "msa-boundary"
        }
      ],
      "insight": "总体接近、特定配置下更高效，都不等于每个任务、每种硬件下完全无损。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "关注匹配条件",
          "desc": "3T 主评测与额外约 140B 训练后的 128K 评测不能混为一组。"
        },
        {
          "icon": "🔎",
          "title": "区分三种倍数",
          "desc": "H800、1M 条件下：注意力 FLOPs 缩减 28.4×，prefill 14.2×，decode 7.6×。"
        },
        {
          "icon": "✓",
          "title": "保留局限",
          "desc": "索引仍有二次项，可能漏块；质量任务有升有降，应用速度需另测。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1ax5F6xEWQ",
      "title": "国产MiniMax M3模型实测：100万上下文与多模态能力全面体验",
      "reason": "应用背景补充：包含 MSA 与百万上下文演示。非论文实验依据，教程数值以原论文为准。",
      "cover": "https://i0.hdslb.com/bfs/archive/bdf3bc91d5f0b45f706117b0b9c7ef23649d3b8f.jpg",
      "views": "3.7万播放"
    }
  ]
};
