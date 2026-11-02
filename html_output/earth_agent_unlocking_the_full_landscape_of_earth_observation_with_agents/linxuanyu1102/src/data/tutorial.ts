import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Earth-Agent: Unlocking the Full Landscape of Earth Observation with Agents",
    "titleZh": "Earth-Agent：以智能体拓展地球观测的完整任务版图",
    "venue": "ICLR 2026 · arXiv v3",
    "authors": "Peilin Feng、Zhutao Lv 等",
    "affiliation": "上海人工智能实验室 · 中山大学 · 清华大学深圳国际研究生院",
    "domain": "地球观测与工具智能体",
    "coreProblem": "现有 EO 模型偏重 RGB 感知，难将光谱、产品数据与专业工具串成多步分析。",
    "coreInsight": "让LLM根据任务目标和交互历史，反复调用跨模态专业工具；用Earth-Bench同时检查最终答案与工具轨迹。",
    "keywords": [
      "Earth-Bench",
      "ReAct",
      "MCP",
      "定量遥感"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "预训练 MLLM 的图像理解",
      "desc": "擅长 RGB 感知，但难以单靠图像完成专业数值分析。",
      "componentId": "earth-cover-old"
    },
    "newMethod": {
      "title": "Earth-Agent 的工具交互",
      "desc": "LLM 规划步骤，领域工具处理多模态数据并返回观测。",
      "componentId": "earth-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从 RGB 感知走向多模态定量分析",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "Earth-Bench 覆盖三类 EO 数据",
          "desc": "切换 RGB、原始光谱与地球产品；侧栏同时展示 248 题的模态分布与任务复杂度。",
          "componentId": "earth-scene-01"
        }
      ],
      "scenes": [
        {
          "id": "earth-01",
          "title": "Earth-Bench 覆盖三类 EO 数据",
          "goal": "为什么单一 RGB 图像输入不足以覆盖地球观测分析？",
          "summary": "论文指出 MLLM 的局限包括模态、图像规模、多步推理与专业工具；Earth-Bench 有 248 题、14 类任务、平均 5.42 步，Spectrum/Products/RGB 分别 100/88/60 题。",
          "interaction": "切换 RGB、Spectrum 与 Products，比较三类数据各自能提供的观测；右侧呈现论文基准规模。",
          "next": "数据类型不同，所需的专业操作也不同。",
          "notes": "来源：arXiv v3 §1、§4.1、Appendix A.1 Table 4 与 Table 5。任务数 Spectrum 100、Products 88、RGB 60；14 类任务，平均 5.42 步。摘要报告图像数 13,729，附录 Table 4 与 Table 5 合计 13,737，网页标注原文差异，不合并成单一精确值。河岸、读数与示例图为原创教学模拟，不是论文样本或实验结果。",
          "componentId": "earth-scene-01",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "MCP 专业工具生态",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "104 个工具分为五类功能包",
          "desc": "切换 Index、Inversion、Perception、Analysis、Statistics；为任务选工具并核对输入、返回值。",
          "componentId": "earth-scene-02"
        }
      ],
      "scenes": [
        {
          "id": "earth-02",
          "title": "104 个工具分为五类功能包",
          "goal": "哪些专业操作需要匹配哪些工具包？",
          "summary": "Index计算指数；Inversion反演地球物理参数；Perception执行分类、检测、分割；Analysis处理时空推理；Statistics提供统计与预处理。MCP用于工具互操作。",
          "interaction": "选择工具包并切换目标，比较所需输入与工具能返回的结果。",
          "next": "由 LLM 选择工具后，Earth-Agent 如何把观测带入下一步？",
          "notes": "来源：arXiv v3 §3.2、Appendix G；104 个专业工具、五类工具包。MCP 是工具互操作机制，不是控制器或智能体本身。页面图标和任务配对是教学呈现，不代表论文公布的各类工具数量。",
          "componentId": "earth-scene-02",
          "moduleId": "2.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "ReAct 闭环与 POMDP 表述",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "从用户目标到工具轨迹：ReAct 闭环",
          "desc": "按顺序触发工具，查看调用、返回观测、记忆更新、下一步决策与最终答复；失败观测也会进入历史。",
          "componentId": "earth-scene-03"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "POMDP：依赖工具观测推断环境",
          "desc": "调整输入文件与波段参数，观察隐藏状态、工具动作、返回观测和状态转移各自对应什么。",
          "componentId": "earth-scene-04"
        }
      ],
      "scenes": [
        {
          "id": "earth-03",
          "title": "从用户目标到工具轨迹：ReAct 闭环",
          "goal": "工具返回之后，下一步决策如何利用完整交互历史？",
          "summary": "论文定义 mₜ=(o₀,a₀,o₁,…,oₜ)，并令 aₜ∼π(aₜ|g,mₜ)。工具调用产生新观测，记忆更新后再思考、行动，直到停止并输出答案与轨迹。",
          "interaction": "依次触发查询、指数、统计和答复，观察工具返回值写入历史，并驱动下一个可用动作。",
          "next": "这类决策为何可看作部分可观测问题？",
          "notes": "来源：arXiv v3 §3.1、Figure 3。页面显示论文给出的记忆定义 mₜ=(o₀,a₀,o₁,…,oₜ)、策略关系 aₜ∼π(aₜ|g,mₜ) 与 ReAct 环：tool calling、memory update、think、action。页面的河岸三点读数及按钮状态机均为合成教学；不运行 Earth-Agent 或在线 LLM。",
          "componentId": "earth-scene-03",
          "moduleId": "3.1"
        },
        {
          "id": "earth-04",
          "title": "POMDP：依赖工具观测推断环境",
          "goal": "为什么调用者不能把返回结果直接当成真实世界的完整状态？",
          "summary": "论文以〈g,S,A,O,T〉形式化：状态可能不可见，动作是工具调用，观测来自工具返回，转移描述动作如何改变环境。无效文件或错配参数会导致观测失败或误导。",
          "interaction": "在合成测量单中切换有效文件和Red/NIR配对，分辨执行失败与科学语义错误。",
          "next": "接下来用可调波段读数检查一个标准定量操作。",
          "notes": "来源：arXiv v3 §3.1 的 POMDP tuple 〈g,S,A,O,T〉；Appendix D 讨论工具幻觉、文件幻觉、无效参数、未识别终止条件与系统错误。波段与读数是为教学构造的合成数据，不是论文观测或Earth-Bench结果。",
          "componentId": "earth-scene-04",
          "moduleId": "3.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "检查工具输入：从调用到可复核数值",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "演示一个指数工具如何计算 NDVI",
          "desc": "调节合成 Red / NIR 数值，看公式计算如何随输入改变；明确这只是方法示意，不是论文实验。",
          "componentId": "earth-scene-05"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "云掩膜会改变后续统计的输入",
          "desc": "切换是否剔除一条合成云污染观测，比较 OLS 斜率；这是自建教学样例，不代表论文结果。",
          "componentId": "earth-scene-06"
        }
      ],
      "scenes": [
        {
          "id": "scene-05",
          "title": "演示一个指数工具如何计算 NDVI",
          "goal": "已知红光与近红外读数后，指数怎样由工具得到？",
          "summary": "NDVI=(NIR−Red)/(NIR+Red)。滑动合成反射率，结果实时变化；该公式是遥感标准指数示例，论文贡献不在提出NDVI。",
          "interaction": "调整合成 Red/NIR 反射率，比较公式输出和符号变化。",
          "next": "输入数据质量也会影响后续分析。",
          "notes": "NDVI公式为常见遥感指数定义，非论文新公式；Appendix E 列有批量NDVI工具。全部反射率与结果均为合成教学数据，不是Earth-Bench数据、模型输出或论文实验值。",
          "componentId": "earth-scene-05",
          "moduleId": "4.1"
        },
        {
          "id": "scene-06",
          "title": "云掩膜会改变后续统计的输入",
          "goal": "输入中有污染观测时，清理数据会怎样影响趋势估计？",
          "summary": "保留/剔除合成的第三期低值后，用最小二乘拟合温度序列；数值只用于演示输入影响。",
          "interaction": "切换剔除云污染样本，观察合成数据点、趋势线和斜率同步变化。",
          "next": "Earth-Bench 还区分自主规划与步骤指导两种查询设定。",
          "notes": "论文 Appendix E 的 Statistics 工具列出 cloud masking，Analysis 工具包括趋势与季节分析。此处温度序列、云标记及OLS斜率为原创教学模拟；不是论文中报告的某条遥感趋势或基准结果。",
          "componentId": "earth-scene-06",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "Earth-Bench 查询设定：AP 与 IF",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "Auto-Planning 与 Instruction-Following",
          "desc": "切换同一任务的 step-implicit / step-explicit 查询；观察输入指导改变规划要求，但不替代真实工具执行。",
          "componentId": "earth-scene-07"
        }
      ],
      "scenes": [
        {
          "id": "scene-07",
          "title": "Auto-Planning 与 Instruction-Following",
          "goal": "查询是否直接给出步骤，会怎样改变任务对智能体的要求？",
          "summary": "Auto-Planning 是 step-implicit，要求智能体自主规划；Instruction-Following 在查询中给出步骤，考察把人类指导转成可执行动作的能力。",
          "interaction": "切换同一合成任务的两种查询形式，再分别触发工具，检查指导与实际执行之间的区别。",
          "next": "只看最终答案不够，还要检查模型走过的工具轨迹。",
          "notes": "来源：arXiv v3 §4.2、Appendix A.4。AP = Auto-Planning / step-implicit；IF = Instruction-Following / step-explicit。演示状态机和小样本结果为合成教学，不代表论文 AP/IF 实验成绩。",
          "componentId": "earth-scene-07",
          "moduleId": "5.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "双层评测：答案与轨迹分别核对",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "双层评测：任务结果 × 推理轨迹",
          "desc": "重排合成工具轨迹并切换答案/参数正确性；同时展示 End-to-End 与 Step-by-Step 指标。",
          "componentId": "earth-scene-08"
        }
      ],
      "scenes": [
        {
          "id": "scene-08",
          "title": "双层评测：任务结果 × 推理轨迹",
          "goal": "最终答案正确时，工具轨迹还可能有哪些问题？",
          "summary": "End-to-End 检查最终 Accuracy 和预测调用数/专家调用数的 Efficiency；Step-by-Step 检查 TAO、TIO、TEM、Parameter Accuracy。它们回答不同问题。",
          "interaction": "重排一条合成工具轨迹、修改参数和最终答案正确性，实时观察双层指标各自变化。",
          "next": "看真实基准表：IF 对不同模型和指标的影响并不一致。",
          "notes": "来源：arXiv v3 §3.3、Appendix B.2 Eqs. (1)–(6)。Accuracy 对答案作判定；Efficiency=预测调用次数/专家调用次数，不是用时；TAO 看必要工具覆盖；TIO 衡量专家工具序列的最长前缀能否作为子序列按序出现在预测序列中（中间可夹有额外调用）；TEM 看严格工具前缀；Parameter Accuracy 同时要求工具标识和参数结构一致的严格前缀。本页序列和0/100%单题答案均为教学例子，不是论文实验数据。",
          "componentId": "earth-scene-08",
          "moduleId": "6.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "真实实验：设置、骨干与任务要分开读",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "Table 1：指导对模型的影响因指标而异",
          "desc": "对照三种代表骨干的 AP / IF Accuracy 或 TAO；同一任务集和固定 0–100 轴。",
          "componentId": "earth-scene-09"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "Table 2：通用智能体比较使用 Lite 子集",
          "desc": "固定 0–100 比例尺，读取 Earth-Bench-Lite 六种系统的平均准确率。",
          "componentId": "earth-scene-10"
        },
        {
          "kind": "module",
          "id": "7.3",
          "title": "Table 3：跨分类、检测与视觉定位任务",
          "desc": "逐行比较五个 RGB 遥感基准；分数只在同一基准内对照。",
          "componentId": "earth-scene-11"
        }
      ],
      "scenes": [
        {
          "id": "scene-09",
          "title": "Table 1：指导对模型的影响因指标而异",
          "goal": "在完整 Earth-Bench 上，IF 步骤指导会怎样改变结果？",
          "summary": "Table 1 报告完整 248 题上的 AP/IF 双层指标。GPT-5 的 IF TAO 上升 2.67 个百分点，而 Accuracy 下降 3.64 个百分点；其他骨干的变化也不完全相同。",
          "interaction": "切换最终 Accuracy 与工具覆盖 TAO，对照 GPT-5、DeepSeek-V3.1、Kimi-K2 的 AP / IF 结果。",
          "next": "再看为什么通用智能体比较使用了 60 题 Lite 子集。",
          "notes": "来源：arXiv v3 Table 1（完整 Earth-Bench，AP/IF）。GPT-5 Accuracy 65.99/62.35，TAO 68.74/71.41；DeepSeek-V3.1 Accuracy 51.42/52.23，TAO 78.31/78.66；Kimik2 Accuracy 50.61/56.68，TAO 71.03/78.86。单位为百分比，Accuracy/TAO 越高越好。图表只展示三种代表骨干；IF 的影响因模型和指标而异。",
          "componentId": "earth-scene-09",
          "moduleId": "7.1"
        },
        {
          "id": "scene-10",
          "title": "Table 2：通用智能体比较使用 Lite 子集",
          "goal": "在统一且规模更小的评测条件下，领域工具带来什么表现？",
          "summary": "Earth-Bench-Lite 含 60 题，Spectrum、Products、RGB 各 20 题。GPT-Agent 平均 40.42，Manus 26.14；Earth-Agent GPT-5 55.83、DeepSeek-V3.1 47.84。",
          "interaction": "读取 Table 2 全部六种系统的平均准确率，固定 0–100 比例尺。",
          "next": "Earth-Agent 也在不同的 RGB 遥感基准上与 MLLM 比较。",
          "notes": "来源：arXiv v3 §5.3 Table 2。Earth-Bench-Lite 是因通用智能体图像输入限制构造的 60 题子集，在 Spectrum/Products/RGB 三类模态均匀分布。六行数值为对应系统平均准确率；不得与完整248题Table 1混作一个排名。",
          "componentId": "earth-scene-10",
          "moduleId": "7.2"
        },
        {
          "id": "scene-11",
          "title": "Table 3：跨分类、检测与视觉定位任务",
          "goal": "专业工具能否把智能体能力扩展到多种 RGB 任务？",
          "summary": "Table 3 在 AID、WHU-RS19 分类，DOTA、HRSC2016 检测，DIOR-RSVG Grounding 上分别比较。Earth-Agent 的表列分数依次为 93.42、96.12、60.88、65.60、60.46。",
          "interaction": "逐行对照 Earth-Agent 与该基准上较强既有 MLLM；不同数据集和任务分数不跨行比较。",
          "next": "把这些结果与论文报告的失败边界一起看。",
          "notes": "来源：arXiv v3 §5.4 Table 3。AID/WHU-RS19 为分类，DOTA/HRSC2016 为检测，DIOR-RSVG 为 Grounding。比较值分别是 VHM 91.70/95.80、LHRS-Bot 17.1/24.4、MiniGPT-v2 29.892；Earth-Agent 93.42/96.12/60.88/65.60/60.46。表的跨任务指标不应直接横向排序。Grounding译为视觉定位，不能误称分割。",
          "componentId": "earth-scene-11",
          "moduleId": "7.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "失效诊断：收益、难点与适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "停止时机与真实任务难点",
          "desc": "交互演示调用长度如何变化，并结合论文中的 Spectrum 难点、参数错误和专家模型局限总结适用边界。",
          "componentId": "earth-scene-12"
        }
      ],
      "scenes": [
        {
          "id": "scene-12",
          "title": "停止时机与真实任务难点",
          "goal": "答案已经有依据后，什么时候该停止？哪些失败仍可能发生？",
          "summary": "Spectrum 原始数据与多图任务较难，Products 任务表现相对较强；Perception 专家模型的泛化仍有限。论文将工具幻觉、文件幻觉、无效参数、未识别终止条件和系统错误列为五类错误。",
          "interaction": "在合成巡查任务中追加调用、修复输入或停止；对照论文总结的真实限制。",
          "next": "用一句话概括：Earth-Agent 以工具循环把多模态数据、定量分析与双层评测连接起来。",
          "notes": "来源：arXiv v3 Appendix C（模态结果）、Appendix D（错误分析）、§6 Conclusion。Spectrum 子集表现低于平均水平，论文认为与模型对原始 EO 数据不熟悉、且该类任务往往要处理更多图像有关；Products 任务相对较强。RGB 感知任务会用到专家模型，但其泛化有限，即使工具选择正确，输出也可能偏离真值。Appendix D 分为五类错误：未识别终止条件（反复调用至步数上限）、工具幻觉、文件幻觉、无效参数、系统错误。本页的文件错误与调用长度例子为合成教学，不是模型实测案例。",
          "componentId": "earth-scene-12",
          "moduleId": "8.1"
        }
      ]
    }
  ]
};
