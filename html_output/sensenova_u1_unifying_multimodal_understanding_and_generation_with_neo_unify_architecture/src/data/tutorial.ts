import type { TutorialData } from '../types';

const sourceTutorial: TutorialData = {
  "meta": {
    "titleEn": "SenseNova-U1: Unifying Multimodal Understanding and Generation with NEO-unify Architecture",
    "titleZh": "SenseNova-U1：以 NEO-unify 架构统一多模态理解与生成",
    "venue": "arXiv:2605.12500v1 · 2026",
    "authors": "Haiwen Diao、Penghao Wu、Hanming Deng、Jiahao Wang 等",
    "affiliation": "OpenSenseNova / SenseNova 论文作者团队",
    "domain": "原生多模态 · 像素空间生成 · 统一理解与生成 · 推理系统",
    "coreProblem": "现有统一模型通常仍为理解配置视觉编码器（VE）、为生成配置变分自编码器（VAE），因此视觉接口、表示空间和训练流程仍然分离。",
    "coreInsight": "SenseNova-U1 用轻量视觉接口直接连接像素与文本，在 MoT 中共享注意力上下文、按流分配计算，并联合优化文本预测与像素生成。",
    "keywords": [
      "原生像素—词接口",
      "MoT 双流",
      "像素流匹配",
      "双 CFG",
      "证据边界"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "理解侧使用视觉编码器（VE），生成侧使用 VAE 潜空间与深解码头。<b>两类能力共存于一个系统，但视觉表示和训练路径仍然分离</b>。",
      componentId: "hero-contrast"
    },
    "newMethod": {
      "desc": "文本与原生像素经各自的轻量接口进入<b>同一序列</b>。MoT 共享自注意力上下文，同时保留流专属投影、归一化、FFN 和输出头。",
      componentId: "hero-contrast"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "研究背景与现状：理解与生成为何仍未真正统一",
      "badge": "inf",
      "badgeLabel": "推理 / 基础",
      "bridge": "论文 §1–2 将研究演进概括为三次推进：先让理解与生成在一个系统中共存，再用离散 token 或连续表示统一视觉接口。但前者受有损压缩限制，后者仍需在语义抽象与像素细节之间取舍。SenseNova-U1 因此转向原生像素—词的端到端联合学习。",
      "analogy": {
        "title": "同一台相机，完成两种任务",
        "text": "看懂画面与生成画面都从同一份视觉信息出发。共用入口只是起点；接口、表示与训练同时贯通，才构成真正的统一。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "四类统一路线：解决了什么，又留下什么",
          "desc": "沿“系统级共存 → 离散 token → 连续共享表示 → 原生端到端”查看研究演进。每条路线分别说明已有推进、仍未解决的分裂及其直接代价，再用视觉接口、表示空间和训练目标做横向诊断。",
          componentId: "unification-compare"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "选择同时支持理解与生成的接口",
          "desc": "对比视觉编码器（VE）、变分自编码器（VAE）与本文的轻量像素接口。前两者分别偏向理解或生成；本文用两层卷积编码与类 MLP 解码连接原生像素和词，并与主干联合训练。",
          componentId: "interface-choice",
          "figure": "/images/figure-04-neo-unify-architecture.png"
        }
      ],
      "insight": "研究现状并非“旧方法都没有统一”，而是统一逐步从系统层推进到序列形式和表示层，却始终留下特定瓶颈。SenseNova-U1 的回答是去掉预训练 VE、VAE 与深解码头，让任务表示在原生输入的联合训练中形成。",
      "takeaways": [
        {
          "icon": "①",
          "title": "系统共存不等于联合学习",
          "desc": "共享模型外壳或主干后，tokenizer、潜空间和任务路径仍可能分裂。"
        },
        {
          "icon": "②",
          "title": "两条原生路线各有瓶颈",
          "desc": "离散路线受有损编码限制，连续表示路线仍面临语义与像素的取舍。"
        },
        {
          "icon": "③",
          "title": "本文给出端到端回答",
          "desc": "原生像素与词进入同一模型联合优化，但性能结论仍需结合实验协议。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "先看全景：SenseNova-U1 如何贯通理解与生成",
      "badge": "both",
      "badgeLabel": "整体架构",
      "bridge": "上一章回答“为什么需要统一”，本章回答“整篇论文如何组织”。SenseNova-U1 可以先压缩为三根支柱：近无损视觉接口负责把词与像素送入模型，NEO-unify MoT 负责在同一序列中协同建模，联合目标、训练课程与推理系统负责形成完整闭环。2.1 沿六个环节追踪数据，2.2 再把论文 §1–§6 与教程八章逐一对齐。",
      "analogy": {
        "title": "先看整台相机，再拆解每个部件",
        "text": "光线从镜头进入，经过感光、处理与输出，最终形成读数或照片。先看完整路径，才能理解对焦、曝光和显影分别解决什么问题。类比强调全局数据流，不把相机部件与网络层逐一等同。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "追踪载荷如何流过六个环节",
          "desc": "先选择理解、生成或联合训练路径，再按输入、编码、合流、主干、输出和闭环逐步检查。彩色胶囊标出当前载荷；阶段轨道、高亮模块和反馈文字同步说明它从哪里出发、经过什么处理、最终变成什么。",
          componentId: "system-overview",
          "figure": "/images/figure-03-overview.png"
        }
      ],
      "insight": "阅读这篇论文时，不要把接口、MoT、目标、训练和推理当作五个并列技巧：接口决定 token 从哪里来，主干决定它们怎样交互，目标与训练决定能力怎样形成，推理系统决定能力怎样运行。",
      "takeaways": [
        {
          "icon": "①",
          "title": "先看三根支柱",
          "desc": "接口统一、主干协同、训练与运行闭环共同构成架构。"
        },
        {
          "icon": "②",
          "title": "再沿五个方法小节",
          "desc": "论文 §3.1–§3.5 分别回答接口、建模、目标、训练和推理。"
        },
        {
          "icon": "③",
          "title": "最后回到证据",
          "desc": "§4 数据随训练解释，§5–6 用实验与限制统一收束。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "输入接口：文本与像素如何进入同一空间",
      "badge": "inf",
      "badgeLabel": "双输入接口",
      "bridge": "整体架构的输入端包含两条路径：文本沿用底层语言模型原有 tokenizer，图像与噪声使用轻量像素接口。两类 token 分别形成后，再投影到共享嵌入空间并组成统一序列。3.1 只看宏观汇合关系，3.2 再打开图像接口内部。",
      "analogy": {
        "title": "把文字标签与照片装入同一本相册",
        "text": "文字标签按词登记，照片按网格整理；两者先使用各自的入口，再排到同一页中。类比只说明“分别处理后汇合”，不把 tokenizer、卷积或嵌入空间等同于真实相册。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "对照文本与图像的输入路径",
          "desc": "分别选择文本、图像或汇合视图，再按“两类输入 → 各自接口 → 共享空间”三步检查。这里不展开卷积或主干内部，只回答两条路径在哪里汇合。",
          componentId: "input-paths"
        },
        {
          kind: "module",
          "id": "3.2",
          "title": "打开图像接口：像素怎样变成 token，又怎样还原",
          "desc": "按“选取 patch → 两层卷积 → 位置编码 → 视觉 token → 生成侧像素解码”逐步检查。共享主干只作为前后连接点，不重复展开；重建证据单独检验这套图像接口保留了多少像素信息。",
          componentId: "patch-lens",
          "figure": "/images/figure-10-reconstruction-outdomain.png"
        }
      ],
      "insight": "统一输入不等于共用同一种 tokenizer：文本保留原 LLM tokenizer，图像与噪声使用轻量 patch 编码；真正的汇合点是投影后的共享嵌入空间。",
      "formula": {
        "lead": "下面只描述图像与噪声分支；文本分支沿用原 tokenizer，不使用该卷积步幅。两层卷积的总步幅决定每个视觉 token 覆盖的像素范围：",
        "latex": "s_{\\mathrm{total}} = 16 \\times 2 = 32, \\qquad 1\\;\\text{visual token} \\leftrightarrow 32 \\times 32\\;\\text{pixels}",
        "mathml": `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <msub><mi>s</mi><mtext>total</mtext></msub><mo>=</mo><mn>16</mn><mo>×</mo><mn>2</mn><mo>=</mo><mn>32</mn>
            <mspace width="1.5em"></mspace><mo>⇒</mo><mspace width="1.5em"></mspace>
            <mn>1</mn><mspace width="0.25em"></mspace><mtext>visual token</mtext><mo>↔</mo>
            <mrow data-sym="32×32"><mn>32</mn><mo>×</mo><mn>32</mn></mrow><mspace width="0.25em"></mspace><mtext>pixels</mtext>
          </mrow>
        </math>`,
        "symbols": [
          {
            "sym": "32×32",
            "desc": "论文两种模型变体采用的图像 patch 大小"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "文",
          "title": "文本路径",
          "desc": "文本词沿用底层语言模型原有 tokenizer，不作修改。"
        },
        {
          "icon": "图",
          "title": "图像路径",
          "desc": "图像与噪声经两层卷积和位置编码形成 32×32 patch token。"
        },
        {
          "icon": "⇢",
          "title": "汇合位置",
          "desc": "两类 token 分别投影到共享嵌入空间，再进入统一主干。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "统一序列：先分清三类 token，再规定读取关系",
      "badge": "inf",
      "badgeLabel": "架构组件",
      "bridge": "第 3 节只说明 token 如何进入主干。进入统一序列后，不能简单理解成“文本对噪声”：文本与干净图像属于理解流，共同构成干净上下文；噪声图像属于生成流，表示当前待去噪状态。先认清三类 token 的身份与位置，再讨论它们之间的读取规则。",
      "analogy": {
        "title": "先贴身份与坐标，再检查视线",
        "text": "同一页上的文字、成片和待显影底片先贴上不同身份与坐标，再按规则决定谁能参考谁。类比只说明“身份、位置、可见性分三步确定”，不把显影过程等同于模型去噪。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "先分清文本、干净图像与噪声图像",
          "desc": "依次选择三类 token，检查它来自什么输入、进入哪条计算流、使用什么位置坐标，以及在统一序列中承担什么作用。这里先建立身份关系，不讨论注意力连线。",
          componentId: "stream-roles"
        },
        {
          kind: "module",
          "id": "4.2",
          "title": "再选择 Query 与 Key，检查谁能读取谁",
          "desc": "示例序列依次为“前文 → 干净图像 → 图后文本 → 噪声图像”。前文与图后文都可单独选为 Query，以对比位置带来的可见范围差异；选择 Query 行后，直接点击矩阵单元格检查对应 Key 是否可见。",
          componentId: "rope-mask"
        }
      ],
      "insight": "文本与干净图像构成理解侧的干净上下文，噪声图像是生成侧的待去噪状态。Native RoPE 只回答“在哪里”，注意力 mask 才回答“谁能读取谁”；噪声可以读取干净上下文，但反向读取被阻断。",
      "formula": {
        "lead": "统一位置编码使用同一组三轴坐标：",
        "latex": "\\mathbf{p}_{\\mathrm{text}}=(T,0,0), \\qquad \\mathbf{p}_{\\mathrm{image}}=(T,H,W), \\qquad d_T:d_H:d_W=64:32:32",
        "mathml": `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <msub><mi mathvariant="bold">p</mi><mtext>text</mtext></msub><mo>=</mo>
            <mo>(</mo><mi data-sym="T">T</mi><mo>,</mo><mn>0</mn><mo>,</mo><mn>0</mn><mo>)</mo>
            <mspace width="1.4em"></mspace>
            <msub><mi mathvariant="bold">p</mi><mtext>image</mtext></msub><mo>=</mo>
            <mo>(</mo><mi data-sym="T">T</mi><mo>,</mo><mi data-sym="H">H</mi><mo>,</mo><mi data-sym="W">W</mi><mo>)</mo>
            <mspace width="1.4em"></mspace>
            <msub><mi>d</mi><mi data-sym="T">T</mi></msub><mo>:</mo>
            <msub><mi>d</mi><mi data-sym="H">H</mi></msub><mo>:</mo>
            <msub><mi>d</mi><mi data-sym="W">W</mi></msub><mo>=</mo><mn>64</mn><mo>:</mo><mn>32</mn><mo>:</mo><mn>32</mn>
          </mrow>
        </math>`,
        "symbols": [
          {
            "sym": "T",
            "desc": "时序位置轴"
          },
          {
            "sym": "H",
            "desc": "图像 patch 的高度位置轴"
          },
          {
            "sym": "W",
            "desc": "图像 patch 的宽度位置轴"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⊕",
          "title": "先认身份",
          "desc": "文本与干净图像进入理解流，噪声图像进入生成流。"
        },
        {
          "icon": "⌖",
          "title": "再编码位置",
          "desc": "文本使用 (T,0,0)，干净与噪声图像都使用 (T,H,W)。"
        },
        {
          "icon": "⛔",
          "title": "最后限制读取",
          "desc": "噪声读取干净上下文；干净侧不得读取噪声，避免信息回流。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "生成起点：分辨率怎样一步步影响噪声",
      "badge": "both",
      "badgeLabel": "生成机制",
      "bridge": "这一节只按三个问题展开：第一，图像分辨率对应多少视觉 token；第二，token 数如何换算成生成起点的噪声尺度；第三，噪声尺度确定后，时间 t 如何表示从噪声到干净图像的位置。三步依次计算，作用互不混淆。",
      "analogy": {
        "title": "先确定画幅，再设标尺，最后移动进度",
        "text": "先根据画幅大小确定需要处理多少区域，再设置与规模匹配的起始标尺，最后沿进度从噪声走向成片。类比只说明三个步骤的先后关系。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "按三步追踪：分辨率 → token → 噪声尺度 → 图像状态",
          "desc": "先选择分辨率并计算视觉 token 数，再把 token 数代入平方根规则得到噪声尺度，最后拖动时间 t 查看当前状态。每个视图只回答一个问题。",
          componentId: "flow-noise-lab"
        }
      ],
      "insight": "因果顺序是 H,W → N → σ_R → z_t：分辨率先决定 token 数，token 数再决定噪声尺度，时间 t 最后决定当前图像状态。平方根缩放是论文配方，不是质量保证。",
      "formula": {
        "lead": "本节只保留三个核心关系。归一化尺度嵌入与速度损失属于训练实现细节，不在这里继续展开：",
        "latex": "\\begin{aligned} \\text{① token 数}\\quad N(H,W) &= \\frac{HW}{32^2} \\\\ \\text{② 噪声尺度}\\quad \\sigma_R &= \\sigma_0\\sqrt{\\frac{N(H,W)}{N_0}} \\\\ \\text{③ 当前状态}\\quad \\mathbf{z}_t &= t\\mathbf{x} + (1-t)\\sigma_R\\boldsymbol{\\epsilon}, \\quad 0\\le t\\le 1 \\end{aligned}",
        "mathml": `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" class="causal-formula">
          <mtable data-layout="causal-steps" columnalign="left right center left left" rowspacing="0.9em" columnspacing="1.1em 0.5em 0.5em 0.8em">
            <mtr>
              <mtd><mtext>① token 数</mtext></mtd>
              <mtd><mrow data-sym="N(H,W)"><mi>N</mi><mo>(</mo><mi data-sym="H">H</mi><mo>,</mo><mi data-sym="W">W</mi><mo>)</mo></mrow></mtd>
              <mtd><mo>=</mo></mtd>
              <mtd><mfrac><mrow><mi data-sym="H">H</mi><mi data-sym="W">W</mi></mrow><msup><mn>32</mn><mn>2</mn></msup></mfrac></mtd>
              <mtd><mtext>每个 token 覆盖 32×32 像素</mtext></mtd>
            </mtr>
            <mtr>
              <mtd><mtext>② 噪声尺度</mtext></mtd>
              <mtd><msub data-sym="σ_R"><mi>σ</mi><mi>R</mi></msub></mtd>
              <mtd><mo>=</mo></mtd>
              <mtd><msub data-sym="σ₀"><mi>σ</mi><mn>0</mn></msub><msqrt><mfrac><mrow data-sym="N(H,W)"><mi>N</mi><mo>(</mo><mi data-sym="H">H</mi><mo>,</mo><mi data-sym="W">W</mi><mo>)</mo></mrow><msub data-sym="N₀"><mi>N</mi><mn>0</mn></msub></mfrac></msqrt></mtd>
              <mtd><mtext>N₀=64，σ₀=1</mtext></mtd>
            </mtr>
            <mtr>
              <mtd><mtext>③ 当前状态</mtext></mtd>
              <mtd><msub data-sym="z_t"><mi mathvariant="bold">z</mi><mi>t</mi></msub></mtd>
              <mtd><mo>=</mo></mtd>
              <mtd><mi data-sym="t">t</mi><mi data-sym="x" mathvariant="bold">x</mi><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi data-sym="t">t</mi><mo>)</mo><msub data-sym="σ_R"><mi>σ</mi><mi>R</mi></msub><mi data-sym="ε" mathvariant="bold">ε</mi></mtd>
              <mtd><mrow><mn>0</mn><mo>≤</mo><mi data-sym="t">t</mi><mo>≤</mo><mn>1</mn></mrow></mtd>
            </mtr>
          </mtable>
        </math>`,
        "symbols": [
          {
            "sym": "N(H,W)",
            "desc": "高为 H、宽为 W 的图像所对应的生成视觉 token 数。"
          },
          {
            "sym": "H",
            "desc": "图像高度，单位为像素；本实验采用论文报告的方形分辨率。"
          },
          {
            "sym": "W",
            "desc": "图像宽度，单位为像素。"
          },
          {
            "sym": "N₀",
            "desc": "参考 token 数；Table 2 中为 64。"
          },
          {
            "sym": "σ₀",
            "desc": "基础噪声尺度；Table 2 中为 1。"
          },
          {
            "sym": "σ_R",
            "desc": "随分辨率调整的终端噪声尺度。"
          },
          {
            "sym": "t",
            "desc": "流时间；0 是缩放噪声端，1 是干净图像端。"
          },
          {
            "sym": "x",
            "desc": "干净图像，形状为 3×H×W。"
          },
          {
            "sym": "ε",
            "desc": "与 x 同形状的标准高斯噪声，ε∼N(0,I)。"
          },
          {
            "sym": "z_t",
            "desc": "当前图像状态；t 越接近 0 越接近噪声，越接近 1 越接近干净图像。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📐",
          "title": "第一步：数 token",
          "desc": "分辨率通过 N(H,W)=H·W/32² 转换为视觉 token 数。"
        },
        {
          "icon": "🌊",
          "title": "第二步：定尺度",
          "desc": "token 数通过平方根规则换算为生成起点的噪声尺度 σ_R。"
        },
        {
          "icon": "🧭",
          "title": "第三步：看位置",
          "desc": "尺度确定后，时间 t 决定当前状态靠近噪声还是干净图像。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "条件控制：分别调节文本与图像引导",
      "badge": "both",
      "badgeLabel": "生成机制",
      "bridge": "噪声轨迹确定后，还要控制生成方向。论文把无分类器引导拆成两个独立尺度：<span class=\"inline-math\">γ</span> 控制文本条件，<span class=\"inline-math\">γ<sub>img</sub></span> 控制图像上下文；两项差分分别缩放后再叠加无条件基线。",
      "analogy": {
        "title": "分别调节文字与图像引导",
        "text": "构图标记代表文字要求，反光板代表已有图像上下文。二维手柄只表达两类条件可以独立调节，不暗示真实闪光设备具有 CFG 数值。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "拖动双条件 CFG 手柄",
          "desc": "横轴调节文本引导 <span class=\"inline-math\">γ</span>，纵轴调节图像上下文引导 <span class=\"inline-math\">γ<sub>img</sub></span>。绿色点 <b>(4,1)</b> 是论文报告的 X2I 设置；其他位置仅用于理解公式。",
          componentId: "dual-cfg-lab"
        }
      ],
      "insight": "双 CFG 不是一个总分数：文本差分与图像上下文差分分别缩放；<span class=\"inline-math\">γ<sub>img</sub>=1</span> 仍保留图像条件。",
      "formula": {
        "lead": "二维手柄对应式 (6) 中的两项差分；两根轴都是尺度，不是概率，也不能相加成“总引导分数”。",
        "latex": "\\begin{aligned} \\nabla_x \\log p(x\\mid c_{\\mathrm{img}},c_{\\mathrm{txt}}) &= \\gamma\\left[\\nabla_x\\log p(x\\mid c_{\\mathrm{img}},c_{\\mathrm{txt}})-\\nabla_x\\log p(x\\mid c_{\\mathrm{img}})\\right] \\\\ &\\quad + \\gamma_{\\mathrm{img}}\\left[\\nabla_x\\log p(x\\mid c_{\\mathrm{img}})-\\nabla_x\\log p(x)\\right] \\\\ &\\quad + \\nabla_x\\log p(x) \\end{aligned}",
        "mathml": `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mtable columnalign="right left" rowspacing="0.7em">
            <mtr>
              <mtd><msub><mo>∇</mo><mi data-sym="x">x</mi></msub><mi mathvariant="normal">log</mi><mi>p</mi><mo>(</mo><mi data-sym="x">x</mi><mo>|</mo><msub data-sym="c_img"><mi>c</mi><mtext>img</mtext></msub><mo>,</mo><msub data-sym="c_txt"><mi>c</mi><mtext>txt</mtext></msub><mo>)</mo></mtd>
              <mtd><mo>=</mo><mi data-sym="γ">γ</mi><mo>[</mo><msub><mo>∇</mo><mi data-sym="x">x</mi></msub><mi mathvariant="normal">log</mi><mi>p</mi><mo>(</mo><mi data-sym="x">x</mi><mo>|</mo><msub data-sym="c_img"><mi>c</mi><mtext>img</mtext></msub><mo>,</mo><msub data-sym="c_txt"><mi>c</mi><mtext>txt</mtext></msub><mo>)</mo><mo>−</mo><msub><mo>∇</mo><mi data-sym="x">x</mi></msub><mi mathvariant="normal">log</mi><mi>p</mi><mo>(</mo><mi data-sym="x">x</mi><mo>|</mo><msub data-sym="c_img"><mi>c</mi><mtext>img</mtext></msub><mo>)</mo><mo>]</mo></mtd>
            </mtr>
            <mtr>
              <mtd></mtd>
              <mtd><mo>+</mo><msub data-sym="γ_img"><mi>γ</mi><mtext>img</mtext></msub><mo>[</mo><msub><mo>∇</mo><mi data-sym="x">x</mi></msub><mi mathvariant="normal">log</mi><mi>p</mi><mo>(</mo><mi data-sym="x">x</mi><mo>|</mo><msub data-sym="c_img"><mi>c</mi><mtext>img</mtext></msub><mo>)</mo><mo>−</mo><msub><mo>∇</mo><mi data-sym="x">x</mi></msub><mi mathvariant="normal">log</mi><mi>p</mi><mo>(</mo><mi data-sym="x">x</mi><mo>)</mo><mo>]</mo></mtd>
            </mtr>
            <mtr>
              <mtd></mtd>
              <mtd><mo>+</mo><msub><mo>∇</mo><mi data-sym="x">x</mi></msub><mi mathvariant="normal">log</mi><mi>p</mi><mo>(</mo><mi data-sym="x">x</mi><mo>)</mo></mtd>
            </mtr>
          </mtable>
        </math>`,
        "symbols": [
          {
            "sym": "γ_img",
            "desc": "图像上下文 CFG 尺度；论文报告的 X2I 设置为 1。"
          },
          {
            "sym": "γ",
            "desc": "文本 CFG 尺度；论文报告的 X2I 设置为 4。"
          },
          {
            "sym": "c_txt",
            "desc": "文本条件。"
          },
          {
            "sym": "c_img",
            "desc": "图像上下文条件。"
          },
          {
            "sym": "x",
            "desc": "待生成的图像状态。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "↔️",
          "title": "分开调节",
          "desc": "两个尺度分别控制文本差分和图像上下文差分。"
        },
        {
          "icon": "🎯",
          "title": "标出报告点",
          "desc": "论文 X2I 设置采用文本尺度 4、图像尺度 1。"
        },
        {
          "icon": "🗺️",
          "title": "避免过度解释",
          "desc": "除 (4,1) 外的组合不是论文测得的质量结论。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "采样加速：从 100 NFE 压缩到 8 NFE",
      "badge": "inf",
      "badgeLabel": "推理加速",
      "bridge": "生成方向确定后，主要成本来自反复调用模型。论文在生成分支使用 DMD2 蒸馏，把报告设置从 100 次函数评估压缩到 8 次；这里比较的是调用次数，不直接代表图像质量。",
      "analogy": {
        "title": "用八次显影逼近百步轨迹",
        "text": "两条刻度表示同一生成进度：教师使用 100 个细步，蒸馏模型使用 8 个粗步。类比只说明函数评估次数减少，不表示每一步都有对应的质量提升。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "比较 100 NFE 与 8 NFE",
          "desc": "切换教师与蒸馏设置，沿同一条 0–100% 进度轴逐步执行。两条轨道长度相同，只比较函数评估次数。",
          componentId: "sampler-steps"
        }
      ],
      "insight": "论文报告的是 100→8 NFE 的采样设置变化；交互中的清晰度仅表示进度，不是逐步质量曲线。",
      "formula": {
        "lead": "这里的数字比较的是一次图像合成所需的函数评估次数；越少代表该报告设置下执行更省步数。",
        "latex": "\\mathrm{DMD2}:\\quad 100\\;\\mathrm{NFE} \\longrightarrow 8\\;\\mathrm{NFE}",
        "mathml": `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <mi data-sym="DMD2" mathvariant="normal">DMD2</mi><mo>:</mo><mspace width="1em"></mspace>
            <mn>100</mn><mspace width="0.3em"></mspace><mi data-sym="NFE" mathvariant="normal">NFE</mi>
            <mspace width="0.8em"></mspace><mo>⟶</mo><mspace width="0.8em"></mspace>
            <mn>8</mn><mspace width="0.3em"></mspace><mi data-sym="NFE" mathvariant="normal">NFE</mi>
          </mrow>
        </math>`,
        "symbols": [
          {
            "sym": "DMD2",
            "desc": "论文 Stage 6 使用的分布匹配蒸馏方法。"
          },
          {
            "sym": "NFE",
            "desc": "函数评估次数；本章比较 100 与 8，不把它当成质量分数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⏱️",
          "title": "比较调用",
          "desc": "100→8 指函数评估次数，两条轨道必须共用同一进度轴。"
        },
        {
          "icon": "🧪",
          "title": "限定分支",
          "desc": "蒸馏联合使用文本生图、编辑与交错数据，但更新生成侧。"
        },
        {
          "icon": "🛡️",
          "title": "区分效率与质量",
          "desc": "8 NFE 是报告设置，不构成跨任务等质保证。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "训练课程：先分开建立能力，再联合优化",
      "badge": "trn",
      "badgeLabel": "训练策略",
      "bridge": "架构统一不意味着从第一步同时训练两条流。SenseNova-U1 先稳定理解能力，再冻结理解流建立生成能力，随后进入统一中训和监督微调；联合阶段同时优化语言 CE 与像素流匹配 MSE。",
      "analogy": {
        "title": "先分别校准，再共同曝光",
        "text": "先让理解与生成各自稳定，再进入共同调整。类比对应训练阶段和损失启闭，不表示两个目标只是机械相加。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "按阶段检查数据、损失与更新范围",
          "desc": "依次查看理解热身、生成预训、统一中训与统一 SFT。切换阶段后，核对使用的数据、启用的损失和实际更新的参数。",
          componentId: "training-curriculum",
          "figure": "/images/figure-12-und-gen-cotraining.png"
        }
      ],
      "insight": "损失可以联合，训练课程仍需分段；8B-MoT 的前后对照未显示明显冲突，但不能推广为普遍保证。",
      "formula": {
        "lead": "联合阶段同时优化语言预测与像素速度误差：",
        "latex": "\\mathcal{L}_{\\mathrm{total}} = \\lambda_1\\mathcal{L}_{\\mathrm{Und}} + \\lambda_2\\mathcal{L}_{\\mathrm{Gen}}",
        "mathml": `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
          <mrow>
            <msub><mi mathvariant="script">L</mi><mtext>total</mtext></msub><mo>=</mo>
            <msub data-sym="λ₁"><mi>λ</mi><mn>1</mn></msub>
            <msub data-sym="L_Und"><mi mathvariant="script">L</mi><mtext>Und</mtext></msub>
            <mo>+</mo>
            <msub data-sym="λ₂"><mi>λ</mi><mn>2</mn></msub>
            <msub data-sym="L_Gen"><mi mathvariant="script">L</mi><mtext>Gen</mtext></msub>
          </mrow>
        </math>`,
        "symbols": [
          {
            "sym": "L_Und",
            "desc": "理解流的平均下一词负对数似然"
          },
          {
            "sym": "L_Gen",
            "desc": "生成流的像素速度均方误差"
          },
          {
            "sym": "λ₁",
            "desc": "理解损失的非负权重；联合阶段报告为 0.1"
          },
          {
            "sym": "λ₂",
            "desc": "生成损失的非负权重；联合阶段报告为 1.0"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎚️",
          "title": "安排顺序",
          "desc": "先建立理解与生成基础，再进入共同优化。"
        },
        {
          "icon": "🧮",
          "title": "控制权重",
          "desc": "Stage 3/4 报告 CE:MSE 为 0.1:1。"
        },
        {
          "icon": "🔎",
          "title": "限定消融",
          "desc": "四项分数持平或上升只属于该 8B 前后对照。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "推理系统：统一 API 下的两类运行负载",
      "badge": "inf",
      "badgeLabel": "系统实现",
      "bridge": "统一模型不等于单体运行时。理解侧包含 prefill、自回归解码和控制流，生成侧反复执行像素去噪；系统分别用 LightLLM 与 LightX2V 承载两类负载，并通过固定页共享内存交换状态。",
      "analogy": {
        "title": "同一台相机，两种处理节奏",
        "text": "文字解读与像素显影需要不同的处理节奏。运行时可以专门化，但对外仍属于同一个模型服务。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "选择部署方式与注意力内核",
          "desc": "先切换分置或共置部署，再选择纯文本或含图像的 M-block。点击引擎与内核区域，查看状态交换和注意力快路如何变化。",
          componentId: "serving-kernel",
          "figure": "/images/figure-05-disaggregated-inference.png"
        }
      ],
      "insight": "论文报告的 0.415/0.443 秒是特定硬件与并行配置下的单步延迟，不是端到端响应时间。",
      "takeaways": [
        {
          "icon": "🧠",
          "title": "处理理解",
          "desc": "LightLLM 负责理解、文本流和请求调度。"
        },
        {
          "icon": "🖼️",
          "title": "处理生成",
          "desc": "LightX2V 负责迭代图像生成，两侧共享统一 API。"
        },
        {
          "icon": "⚡",
          "title": "保留快路",
          "desc": "纯文本块继续走标准因果注意力。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "实验验证：先对齐协议，再比较结果",
      "badge": "both",
      "badgeLabel": "实验验证",
      "bridge": "最后回到证据。RealUnify、GenEval、联合中训和重建实验使用不同任务、数据与指标，不能合并成一个总榜；每项结论都必须同时说明评测协议、指标方向与适用边界。",
      "analogy": {
        "title": "先统一量尺，再比较结果",
        "text": "只有使用同一任务、数据和指标，结果才可以并列。类比强调可比性，不把理解、生成与重建压成一个总分。",
        componentId: "studio-analogy"
      },
      "modules": [
        {
          kind: "module",
          "id": "10.1",
          "title": "选择实验协议，再比较证据",
          "desc": "先选择 RealUnify、GenEval、联合中训、重建或边界，再选择证据行。模块只允许同协议比较，并单独呈现编辑、网格伪影、VLA 与世界模型的证据等级。",
          componentId: "evidence-race",
          "figure": "/images/figure-13-data-scaling-curves.png"
        }
      ],
      "insight": "数据规模曲线支持“随规模改善”的报告性观察；它不能替代具体协议下的端点数据，也不能推出全面领先。",
      "takeaways": [
        {
          "icon": "📏",
          "title": "对齐协议",
          "desc": "每种基准和消融只在自己的指标与设置内比较。"
        },
        {
          "icon": "🧾",
          "title": "检查指标",
          "desc": "PSNR 相同不代表 SSIM 相同，更不代表字面无损。"
        },
        {
          "icon": "⚠️",
          "title": "保留限制",
          "desc": "编辑、网格伪影、VLA 与世界模型仍需更多验证。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      bvid: "BV1UW5E6zEvL",
      "title": "8B开源模型SenseNova-U1 让信息图自由零成本",
      "reason": "直接展示信息图生成能力，适合作为应用侧观察。",
      "cover": "https://i2.hdslb.com/bfs/archive/9616067b25e5a38ab45ea211af233b9085a6432a.jpg",
      "views": "2.4万播放"
    },
    {
      bvid: "BV1qaRRBHEQG",
      "title": "多角度实测 SenseNova-U1：无 VAE、NEO-unify 与 ComfyUI 节点",
      "reason": "直接面向模型与工作流的实操内容，虽播放量较低但相关性独特。",
      "cover": "https://i1.hdslb.com/bfs/archive/fecc98274a7a00c58971f32341c23d99c2ac5e51.jpg",
      "views": "7950播放"
    },
    {
      bvid: "BV1Ez9aBsEiw",
      "title": "商汤原生统一多模态模型 SenseNova U1 开源概览",
      "reason": "从看图、思考、画图到图文连续创作的直接概览。",
      "cover": "https://i2.hdslb.com/bfs/archive/bf8c09362a2d4f752745bc44ec15fa10c045457f.jpg",
      "views": "7658播放"
    },
    {
      bvid: "BV1hD526REYN",
      "title": "5.13 arXiv：商汤科技提出 SenseNova-U1",
      "reason": "直接对应论文发布，保留作论文入口；低播放量由高度相关性抵消。",
      "cover": "https://i2.hdslb.com/bfs/archive/b7cf877338827728533ef79ada023fe42fec3da4.jpg",
      "views": "846播放"
    }
  ]
};

const sourceChapters = sourceTutorial.chapters;

const motivationChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[0],
  title: '研究背景与现状：理解与生成为何仍未真正统一',
  badgeLabel: '论文 §1–2',
  bridge: '论文 §1–2 将研究演进概括为三次推进：先让理解与生成在一个系统中共存，再用离散 token 或连续表示统一视觉接口。但前者受有损压缩限制，后者仍需在语义抽象与像素细节之间取舍。SenseNova-U1 因此转向原生像素—词的端到端联合学习。',
  analogy: {
    title: '同一台相机，两套光路',
    text: '看图和成像虽在同一台设备上完成，但如果它们使用不同的输入、表示和校准方式，系统仍未真正统一。',
    componentId: 'studio-analogy',
  },
  modules: [
    { ...sourceChapters[0].modules[0], title: '四类统一路线：解决了什么，又留下什么', desc: '沿“系统级共存 → 离散 token → 连续共享表示 → 原生端到端”查看研究演进。每条路线分别说明已有推进、仍未解决的分裂及其直接代价，再用视觉接口、表示空间和训练目标做横向诊断。' },
    { ...sourceChapters[0].modules[1], title: '检查视觉接口能否同时服务理解与生成', desc: '对比 VE、VAE 与本文的轻量视觉接口。重点不是“有无接口”，而是接口能否与统一主干端到端联合学习。' },
  ],
  insight: '研究现状并非“旧方法都没有统一”，而是统一逐步从系统层推进到序列形式和表示层，却始终留下特定瓶颈。SenseNova-U1 的回答是去掉预训练 VE、VAE 与深解码头，让任务表示在原生输入的联合训练中形成。',
  takeaways: [
    { icon: '①', title: '系统共存不等于联合学习', desc: '共享模型外壳或主干后，tokenizer、潜空间和任务路径仍可能分裂。' },
    { icon: '②', title: '两条原生路线各有瓶颈', desc: '离散路线受有损编码限制，连续表示路线仍面临语义与像素的取舍。' },
    { icon: '③', title: '本文给出端到端回答', desc: '原生像素与词进入同一模型联合优化，但性能结论仍需结合实验协议。' },
  ],
};

const overviewChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[1],
  title: '方法总览：整体架构与数据流',
  badgeLabel: '论文 §3 总览',
  bridge: '论文 Figure 4 给出完整方法：文本、图像和噪声经各自接口变为 token，在 MoT 主干中交互，再分别输出词表概率与像素 patch。本章只建立整体关系，后续第 3–7 章再对应 §3.1–§3.5 展开。',
  analogy: {
    title: '先看完整光路，再检查局部部件',
    text: '光线经入口、成像和输出形成一条完整路径。先明确整体流向，再分别讨论接口、主干、目标、训练和推理。',
    componentId: 'studio-analogy',
  },
  modules: [
    { ...sourceChapters[1].modules[0], title: '跟踪三类数据的完整流向', desc: '选择理解、生成或联合训练路径，然后按输入、编码、统一序列、MoT 主干、输出头和任务闭环逐步查看。' },
  ],
  insight: '整体架构回答“各模块如何连接”，§3.1–§3.5 再分别回答“每个模块如何工作”。',
  takeaways: [
    { icon: '①', title: '整体输入', desc: '文本、图像和噪声使用不同的轻量接口。' },
    { icon: '②', title: '统一主干', desc: '各类 token 在 MoT 中共享注意力上下文。' },
    { icon: '③', title: '任务闭环', desc: '专属输出头、联合目标和分置运行时完成两类任务。' },
  ],
};

const interfaceChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[2],
  id: 'chap-3',
  title: '近无损视觉接口',
  badge: 'both',
  badgeLabel: '论文 §3.1',
  formulaModuleId: '3.2',
  bridge: '§3.1 包含两组设计：Patch 编码层与 Patch 解码层负责像素表示的输入和输出；动态噪声尺度与噪声尺度条件化负责生成侧的跨分辨率适配。后者不是简单地“分辨率越高就加更多噪声”，而是为了解决固定单位高斯先验在不同分辨率下造成的信号尺度失配与 SNR 分布不一致。',
  modules: [
    {
      ...sourceChapters[2].modules[0],
      id: '3.1',
      title: '第一组：Patch 编码层与 Patch 解码层',
      desc: '切换接口的输入端与输出端：编码层将图像或噪声像素变为视觉 token；解码层将共享主干输出分别送往词表或像素 patch。',
    },
    {
      ...sourceChapters[4].modules[0],
      id: '3.2',
      title: '第二组：动态噪声尺度与噪声尺度条件化',
      desc: '这组设计用于让同一生成流稳定适配不同图像分辨率。动态噪声尺度 σ_R 随生成 token 数按平方根调整，近似保持低、高分辨率的逐 token 噪声能量，并使相同 flow timestep 下的 SNR 分布更一致；该尺度同时定义训练终端噪声与推理 ODE 起点。NSEmb 再将归一化后的 σ_R 与时间嵌入共同输入去噪器，使模型明确当前图像所处的流时间与噪声尺度。',
    },
  ],
  insight: '动态噪声尺度与尺度条件化解决的是两个连续但不同的问题：σ_R 先让噪声先验匹配当前分辨率的信号尺度，NSEmb 再让去噪器明确知道当前使用了哪个 σ_R。',
  formula: {
    lead: '论文先由 32×32 patch 得到生成 token 数，再用平方根规则设置终端噪声标准差。该尺度既用于训练终端噪声和推理 ODE 起点，也会被归一化并作为显式条件输入模型：',
    latex: '\\begin{aligned}N(H,W)&=\\frac{HW}{32^2},\\\\\\sigma_R(H,W)&=\\sigma_0\\sqrt{\\frac{N(H,W)}{N_0}},\\\\z_0&=\\sigma_R(H,W)\\epsilon,\\quad\\epsilon\\sim\\mathcal N(0,I),\\\\\\bar{\\sigma}(H,W)&=\\frac{\\sigma_R(H,W)}{\\sigma_{\\max}},\\\\s_t&=\\tau_t+\\operatorname{NSEmb}(\\bar{\\sigma}(H,W)).\\end{aligned}',
    mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" class="causal-formula">
      <mtable columnalign="right center left" rowspacing="0.8em">
        <mtr><mtd><mrow data-sym="N(H,W)"><mi>N</mi><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow></mtd><mtd><mo>=</mo></mtd><mtd><mfrac><mrow><mi>H</mi><mi>W</mi></mrow><msup><mn>32</mn><mn>2</mn></msup></mfrac></mtd></mtr>
        <mtr><mtd><mrow data-sym="σ_R(H,W)"><msub><mi>σ</mi><mi>R</mi></msub><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow></mtd><mtd><mo>=</mo></mtd><mtd><msub data-sym="σ₀"><mi>σ</mi><mn>0</mn></msub><msqrt><mfrac><mrow data-sym="N(H,W)"><mi>N</mi><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><msub data-sym="N₀"><mi>N</mi><mn>0</mn></msub></mfrac></msqrt></mtd></mtr>
        <mtr><mtd><msub data-sym="z₀"><mi>z</mi><mn>0</mn></msub></mtd><mtd><mo>=</mo></mtd><mtd><mrow data-sym="σ_R(H,W)"><msub><mi>σ</mi><mi>R</mi></msub><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mi data-sym="ε">ε</mi><mo>,</mo><mspace width="0.5em"></mspace><mi data-sym="ε">ε</mi><mo>∼</mo><mi mathvariant="script">N</mi><mo>(</mo><mn>0</mn><mo>,</mo><mi data-sym="I">I</mi><mo>)</mo></mtd></mtr>
        <mtr><mtd><mrow data-sym="σ̄(H,W)"><mover accent="true"><mi>σ</mi><mo>¯</mo></mover><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow></mtd><mtd><mo>=</mo></mtd><mtd><mfrac><mrow data-sym="σ_R(H,W)"><msub><mi>σ</mi><mi>R</mi></msub><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><msub data-sym="σ_max"><mi>σ</mi><mtext>max</mtext></msub></mfrac></mtd></mtr>
        <mtr><mtd><msub data-sym="s_t"><mi>s</mi><mi>t</mi></msub></mtd><mtd><mo>=</mo></mtd><mtd><msub data-sym="τ_t"><mi>τ</mi><mi>t</mi></msub><mo>+</mo><mi data-sym="NSEmb" mathvariant="normal">NSEmb</mi><mo>(</mo><mrow data-sym="σ̄(H,W)"><mover accent="true"><mi>σ</mi><mo>¯</mo></mover><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mo>)</mo></mtd></mtr>
      </mtable>
    </math>`,
    symbols: [
      { sym: 'N(H,W)', desc: '分辨率 H×W 对应的视觉 token 数；它由 Patch 编码层固定的 32×32 patch 粒度决定。' },
      { sym: 'σ_R(H,W)', desc: '随分辨率调整的终端噪声标准差；训练时缩放终端高斯噪声，推理时初始化 flow ODE。' },
      { sym: 'σ₀', desc: '基础噪声尺度；论文 Table 2 的报告设置为 1。' },
      { sym: 'N₀', desc: '参考 token 数；论文 Table 2 的报告设置为 64。' },
      { sym: 'z₀', desc: '论文 Eq.3 中 t=0 的纯噪声端点；其标准差由当前分辨率对应的 σ_R 决定。' },
      { sym: 'ε', desc: '从单位高斯分布采样的噪声，经 σ_R 缩放后得到终端噪声。' },
      { sym: 'I', desc: '单位协方差矩阵。' },
      { sym: 'σ̄(H,W)', desc: '归一化后的噪声尺度，取值位于 [0,1]。' },
      { sym: 'σ_max', desc: '归一化使用的最大噪声尺度；Table 2 报告的尺度范围为 [1,8]。' },
      { sym: 'τ_t', desc: '流时间 t 的嵌入；它与尺度嵌入共同组成条件。' },
      { sym: 'NSEmb', desc: '专门编码归一化噪声尺度的正弦 MLP 嵌入器。' },
      { sym: 's_t', desc: '同时包含流时间与归一化噪声尺度的联合条件，施加到输入图像 token。' },
    ],
    items: [
      {
        label: '① Patch 粒度 → 视觉 token 数',
        latex: 'N(H,W)=\\frac{HW}{32^2}',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow data-sym="N(H,W)"><mi>N</mi><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mo>=</mo><mfrac><mrow><mi>H</mi><mi>W</mi></mrow><msup><mn>32</mn><mn>2</mn></msup></mfrac></math>`,
      },
      {
        label: '② token 数 → 动态噪声尺度',
        latex: '\\sigma_R(H,W)=\\sigma_0\\sqrt{\\frac{N(H,W)}{N_0}}',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow data-sym="σ_R(H,W)"><msub><mi>σ</mi><mi>R</mi></msub><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mo>=</mo><msub data-sym="σ₀"><mi>σ</mi><mn>0</mn></msub><msqrt><mfrac><mrow data-sym="N(H,W)"><mi>N</mi><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><msub data-sym="N₀"><mi>N</mi><mn>0</mn></msub></mfrac></msqrt></math>`,
      },
      {
        label: '③ 训练纯噪声端点 / 推理 ODE 起点',
        latex: 'z_0=\\sigma_R(H,W)\\epsilon,\\quad\\epsilon\\sim\\mathcal N(0,I)',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub data-sym="z₀"><mi>z</mi><mn>0</mn></msub><mo>=</mo><mrow data-sym="σ_R(H,W)"><msub><mi>σ</mi><mi>R</mi></msub><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mi data-sym="ε">ε</mi><mo>,</mo><mspace width="0.5em"></mspace><mi data-sym="ε">ε</mi><mo>∼</mo><mi mathvariant="script">N</mi><mo>(</mo><mn>0</mn><mo>,</mo><mi data-sym="I">I</mi><mo>)</mo></math>`,
      },
      {
        label: '④ 归一化噪声尺度',
        latex: '\\bar{\\sigma}(H,W)=\\frac{\\sigma_R(H,W)}{\\sigma_{\\max}}',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow data-sym="σ̄(H,W)"><mover accent="true"><mi>σ</mi><mo>¯</mo></mover><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mo>=</mo><mfrac><mrow data-sym="σ_R(H,W)"><msub><mi>σ</mi><mi>R</mi></msub><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><msub data-sym="σ_max"><mi>σ</mi><mtext>max</mtext></msub></mfrac></math>`,
      },
      {
        label: '⑤ 时间嵌入 + 尺度嵌入 → 联合条件',
        latex: 's_t=\\tau_t+\\operatorname{NSEmb}(\\bar{\\sigma}(H,W))',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub data-sym="s_t"><mi>s</mi><mi>t</mi></msub><mo>=</mo><msub data-sym="τ_t"><mi>τ</mi><mi>t</mi></msub><mo>+</mo><mi data-sym="NSEmb" mathvariant="normal">NSEmb</mi><mo>(</mo><mrow data-sym="σ̄(H,W)"><mover accent="true"><mi>σ</mi><mo>¯</mo></mover><mo>(</mo><mi>H</mi><mo>,</mo><mi>W</mi><mo>)</mo></mrow><mo>)</mo></math>`,
      },
    ],
  },
  takeaways: [
    { icon: '①', title: 'Patch 编码层', desc: '图像或噪声经两层卷积与二维位置编码变为视觉 token；固定粒度为 32×32 像素。' },
    { icon: '②', title: 'Patch 解码层', desc: '理解侧用线性头输出词表概率，生成侧用 MLP 头直接输出像素 patch。' },
    { icon: '③', title: '跨分辨率适配', desc: 'σ_R 同时定义训练终端噪声和推理 ODE 起点；NSEmb(σ̄) 再把当前尺度显式告知去噪器。' },
  ],
};

const modelingChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[3],
  id: 'chap-4',
  title: '原生多模态统一建模',
  badgeLabel: '论文 §3.2',
  formulaModuleId: '4.2',
  bridge: '§3.1 定义 token 从哪里来；§3.2 进一步定义它们的位置、可见性和计算路径。Native RoPE 编码时间与空间位置，MoT 共享自注意力上下文，同时按理解流和生成流分配专属参数。',
  analogy: {
    title: '在同一页上标明位置与读取权限',
    text: '文字、干净图像和噪声图像同处一页，但它们的坐标、计算路径和可读取范围并不完全相同。',
    componentId: 'studio-analogy',
  },
  modules: [
    {
      kind: 'module', id: '4.1', title: 'Native MoT：共享上下文，分流计算',
      desc: 'Native MoT 的作用是在单一主干内统一理解与生成，同时避免两类目标直接争用同一组参数。干净图文与噪声条件 token 被组织在同一序列中，通过共享自注意力逐层交换感知与生成上下文；投影、归一化、FFN/MoE 和输出头则按 token 类型分流，保留任务专属计算，并支持模型从稠密 8B 配置扩展到流内 MoE 的 A3B 配置。',
      componentId: 'mot-architecture',
    },
    { ...sourceChapters[3].modules[1], id: '4.2', title: 'Native RoPE 与混合掩码：统一位置，控制可见性', desc: 'Native RoPE 的作用是在同一序列中同时保留文本的时间顺序与图像的二维空间结构，并且不引入额外参数；混合注意力掩码进一步规定信息依赖：文本保持因果读取，图像块内部双向交互，噪声 token 可以读取全部干净上下文，而干净 token 不依赖任何噪声状态。这样，生成侧能够利用理解信息，同时保持干净表示与噪声生成状态之间的单向边界。' },
  ],
  insight: '§3.2 的核心是“共享上下文，分流计算”：各类 token 通过共享自注意力交互，但投影、归一化和 FFN/MoE 依然按流路由。',
  formula: {
    ...sourceChapters[3].formula!,
    lead: '三轴坐标分别说明文本的位置、图像的位置，以及 RoPE 在三根轴上分配的维度。三条关系独立阅读：',
    items: [
      {
        label: '① 文本 token 的三轴位置',
        latex: '\\mathbf{p}_{\\mathrm{text}}=(T,0,0)',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub><mi mathvariant="bold">p</mi><mtext>text</mtext></msub><mo>=</mo><mo>(</mo><mi data-sym="T">T</mi><mo>,</mo><mn>0</mn><mo>,</mo><mn>0</mn><mo>)</mo></math>`,
      },
      {
        label: '② 图像 token 的三轴位置',
        latex: '\\mathbf{p}_{\\mathrm{image}}=(T,H,W)',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub><mi mathvariant="bold">p</mi><mtext>image</mtext></msub><mo>=</mo><mo>(</mo><mi data-sym="T">T</mi><mo>,</mo><mi data-sym="H">H</mi><mo>,</mo><mi data-sym="W">W</mi><mo>)</mo></math>`,
      },
      {
        label: '③ RoPE 在三轴上的维度分配',
        latex: 'd_T:d_H:d_W=64:32:32',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub><mi>d</mi><mi data-sym="T">T</mi></msub><mo>:</mo><msub><mi>d</mi><mi data-sym="H">H</mi></msub><mo>:</mo><msub><mi>d</mi><mi data-sym="W">W</mi></msub><mo>=</mo><mn>64</mn><mo>:</mo><mn>32</mn><mo>:</mo><mn>32</mn></math>`,
      },
    ],
  },
  takeaways: [
    { icon: '①', title: '统一位置', desc: 'Native RoPE 使用 T/H/W 坐标表示文本与图像位置。' },
    { icon: '②', title: '共享上下文', desc: '两条流在同一序列中共享自注意力计算。' },
    { icon: '③', title: '保留分流参数', desc: '投影、归一化、FFN/MoE 和输出头按 token 类型分开。' },
  ],
};

const objectiveChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[5],
  id: 'chap-5',
  title: '联合训练目标',
  badge: 'both',
  badgeLabel: '论文 §3.3',
  bridge: '§3.3 先用 Eq.1 将理解损失与生成损失组合为联合总目标，再分别定义自回归文本损失和像素空间流匹配损失。该节最后给出无分类器引导（CFG），用于生成时分别调节文本条件和图像上下文。',
  analogy: {
    title: '一次训练，两种评估标准',
    text: '文本分支检查下一个 token 的预测，生成分支检查像素速度的误差。两项损失由同一总目标加权组合。',
    componentId: 'studio-analogy',
  },
  modules: [
    { kind: 'module', id: '5.1', title: '联合目标：同时学习语言预测与像素流匹配', desc: '联合总目标的作用是让同一模型同时获得语言理解和像素生成能力，并用损失权重控制两类监督的相对贡献。理解分支通过自回归交叉熵预测下一个文本 token；生成分支在流状态 <math class="inline-mathml" aria-label="z 下标 t"><msub><mi>z</mi><mi>t</mi></msub></math> 上直接回归干净图像 <math class="inline-mathml" aria-label="x 帽子下标 theta"><msub><mover accent="true"><mi>x</mi><mo>^</mo></mover><mi>θ</mi></msub></math>，再换算为预测速度 <math class="inline-mathml" aria-label="v 下标 theta"><msub><mi>v</mi><mi>θ</mi></msub></math>，并与目标速度 <math class="inline-mathml" aria-label="v 星号"><msup><mi>v</mi><mo>*</mo></msup></math> 计算均方误差。两类任务因此共享端到端训练框架，但仍保留各自明确的预测对象。', componentId: 'joint-objective-lab' },
    { ...sourceChapters[5].modules[0], id: '5.2', title: '双 CFG：分离文本引导与图像上下文引导', desc: '双 CFG 的作用是在统一生成公式中独立控制文本对齐与图像上下文依赖。文本尺度 <math class="inline-mathml" aria-label="gamma"><mi>γ</mi></math> 放大完整条件与仅图像条件之间的差分，图像尺度 <math class="inline-mathml" aria-label="gamma 下标 img"><msub><mi>γ</mi><mtext>img</mtext></msub></math> 放大仅图像条件与无条件之间的差分，使文本生图、编辑和交错生成可以共享同一种引导形式。论文在 X2I 任务上报告 (4,1) 表现最佳，说明该设置更依赖文本引导；其他参数组合不代表论文已经测得的质量结论。', formula: { ...sourceChapters[5].formula!, layout: 'cfg' } },
  ],
  insight: '“联合”指的是 Eq.1 中的加权总目标。Eq.2 定义文本分支，Eq.3–5 定义像素生成分支，Eq.6 定义生成时的条件引导。',
  formulaModuleId: '5.1',
  formula: {
    lead: '先用总目标组合两类损失，再分别给出文本分支的交叉熵与生成分支的像素流状态、速度均方误差：',
    latex: '\\begin{aligned}\\mathcal L_{total}&=\\lambda_1\\mathcal L_{Und}+\\lambda_2\\mathcal L_{Gen},\\\\\\mathcal L_{Und}&=-\\frac{1}{N}\\sum_{n=1}^{N}\\log p_\\theta(x_n\\mid x_{<n},c),\\\\z_t&=tx+(1-t)\\sigma_R\\epsilon,\\\\\\mathcal L_{Gen}&=\\mathbb E\\lVert v_\\theta(z_t,t)-v^*\\rVert_2^2.\\end{aligned}',
    mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" class="causal-formula"><mtable columnalign="right center left" rowspacing="0.8em">
      <mtr><mtd><msub data-sym="L_total"><mi mathvariant="script">L</mi><mtext>total</mtext></msub></mtd><mtd><mo>=</mo></mtd><mtd><msub data-sym="λ₁"><mi>λ</mi><mn>1</mn></msub><msub data-sym="L_Und"><mi mathvariant="script">L</mi><mtext>Und</mtext></msub><mo>+</mo><msub data-sym="λ₂"><mi>λ</mi><mn>2</mn></msub><msub data-sym="L_Gen"><mi mathvariant="script">L</mi><mtext>Gen</mtext></msub></mtd></mtr>
      <mtr><mtd><msub data-sym="L_Und"><mi mathvariant="script">L</mi><mtext>Und</mtext></msub></mtd><mtd><mo>=</mo></mtd><mtd><mo>−</mo><mfrac><mn>1</mn><mi data-sym="N">N</mi></mfrac><munderover><mo>∑</mo><mrow><mi>n</mi><mo>=</mo><mn>1</mn></mrow><mi data-sym="N">N</mi></munderover><mi mathvariant="normal">log</mi><msub data-sym="p_θ"><mi>p</mi><mi>θ</mi></msub><mo>(</mo><msub data-sym="x_n"><mi>x</mi><mi>n</mi></msub><mo>|</mo><msub data-sym="x_&lt;n"><mi>x</mi><mrow><mo>&lt;</mo><mi>n</mi></mrow></msub><mo>,</mo><mi data-sym="c">c</mi><mo>)</mo></mtd></mtr>
      <mtr><mtd><msub data-sym="z_t"><mi>z</mi><mi>t</mi></msub></mtd><mtd><mo>=</mo></mtd><mtd><mi>t</mi><mi>x</mi><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>t</mi><mo>)</mo><msub><mi>σ</mi><mi>R</mi></msub><mi>ε</mi></mtd></mtr>
      <mtr><mtd><msub data-sym="L_Gen"><mi mathvariant="script">L</mi><mtext>Gen</mtext></msub></mtd><mtd><mo>=</mo></mtd><mtd><mi mathvariant="double-struck">E</mi><msup><mrow><mo>‖</mo><msub><mi>v</mi><mi>θ</mi></msub><mo>(</mo><msub><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>t</mi><mo>)</mo><mo>−</mo><msup><mi>v</mi><mo>*</mo></msup><mo>‖</mo></mrow><mn>2</mn></msup></mtd></mtr>
    </mtable></math>`,
    symbols: [
      { sym: 'L_total', desc: '联合训练的加权总损失。' }, { sym: 'L_Und', desc: '理解分支的下一 token 负对数似然。' },
      { sym: 'L_Gen', desc: '生成侧像素速度均方误差。' }, { sym: 'λ₁', desc: '理解损失权重；Stage 3/4 报告为 0.1。' },
      { sym: 'λ₂', desc: '生成损失权重；Stage 3/4 报告为 1.0。' }, { sym: 'N', desc: '文本分支中参与平均的 token 位置数。' },
      { sym: 'p_θ', desc: '参数为 θ 的模型给出的下一个 token 概率。' }, { sym: 'x_n', desc: '第 n 个真实文本 token。' },
      { sym: 'x_<n', desc: '第 n 个 token 之前的文本前文。' }, { sym: 'c', desc: '多模态上下文。' },
      { sym: 'z_t', desc: '时间 t 的像素流状态。' },
    ],
    items: [
      {
        label: '① 联合总目标：组合两条损失',
        latex: '\\mathcal L_{\\mathrm{total}}=\\lambda_1\\mathcal L_{\\mathrm{Und}}+\\lambda_2\\mathcal L_{\\mathrm{Gen}}',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub data-sym="L_total"><mi mathvariant="script">L</mi><mtext>total</mtext></msub><mo>=</mo><msub data-sym="λ₁"><mi>λ</mi><mn>1</mn></msub><msub data-sym="L_Und"><mi mathvariant="script">L</mi><mtext>Und</mtext></msub><mo>+</mo><msub data-sym="λ₂"><mi>λ</mi><mn>2</mn></msub><msub data-sym="L_Gen"><mi mathvariant="script">L</mi><mtext>Gen</mtext></msub></math>`,
      },
      {
        label: '② 理解分支：下一个文本 token 的交叉熵',
        latex: '\\mathcal L_{\\mathrm{Und}}=-\\frac{1}{N}\\sum_{n=1}^{N}\\log p_\\theta(x_n\\mid x_{<n},c)',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub data-sym="L_Und"><mi mathvariant="script">L</mi><mtext>Und</mtext></msub><mo>=</mo><mo>−</mo><mfrac><mn>1</mn><mi data-sym="N">N</mi></mfrac><munderover><mo>∑</mo><mrow><mi>n</mi><mo>=</mo><mn>1</mn></mrow><mi data-sym="N">N</mi></munderover><mi mathvariant="normal">log</mi><msub data-sym="p_θ"><mi>p</mi><mi>θ</mi></msub><mo>(</mo><msub data-sym="x_n"><mi>x</mi><mi>n</mi></msub><mo>|</mo><msub data-sym="x_&lt;n"><mi>x</mi><mrow><mo>&lt;</mo><mi>n</mi></mrow></msub><mo>,</mo><mi data-sym="c">c</mi><mo>)</mo></math>`,
      },
      {
        label: '③ 生成分支：当前像素流状态',
        latex: 'z_t=tx+(1-t)\\sigma_R\\epsilon',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub data-sym="z_t"><mi>z</mi><mi>t</mi></msub><mo>=</mo><mi>t</mi><mi>x</mi><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>t</mi><mo>)</mo><msub><mi>σ</mi><mi>R</mi></msub><mi>ε</mi></math>`,
      },
      {
        label: '④ 生成分支：预测速度的均方误差',
        latex: '\\mathcal L_{\\mathrm{Gen}}=\\mathbb E\\lVert v_\\theta(z_t,t)-v^*\\rVert_2^2',
        mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub data-sym="L_Gen"><mi mathvariant="script">L</mi><mtext>Gen</mtext></msub><mo>=</mo><mi mathvariant="double-struck">E</mi><msup><mrow><mo>‖</mo><msub><mi>v</mi><mi>θ</mi></msub><mo>(</mo><msub data-sym="z_t"><mi>z</mi><mi>t</mi></msub><mo>,</mo><mi>t</mi><mo>)</mo><mo>−</mo><msup><mi>v</mi><mo>*</mo></msup><mo>‖</mo></mrow><mn>2</mn></msup></math>`,
      },
    ],
  },
  takeaways: [
    { icon: '①', title: '联合总目标', desc: 'λ₁ 和 λ₂ 分别控制理解损失与生成损失的权重。' },
    { icon: '②', title: '两条损失分支', desc: '理解预测下一 token，生成回归像素流速度。' },
    { icon: '③', title: '生成条件引导', desc: 'γ 调节文本引导，γ_img 调节图像上下文引导。' },
  ],
};

const trainingChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[7],
  id: 'chap-6',
  title: '渐进式训练流程',
  badge: 'trn',
  badgeLabel: '论文 §3.4',
  bridge: '§3.4 的训练课程不是六个同粒度步骤：Stage 1 内含两步理解预热，Stage 2 内含三个生成预训练 Phase；Stage 3–4 才让两条分支共同更新，Stage 5–6 则分别优化生成质量与采样效率。下面先看阶段间的因果衔接，再核对 Table 2 的训练配方。',
  analogy: {
    title: '先分别稳定，再联合对齐，最后专项优化',
    text: '理解分支先恢复能力，生成分支再借助冻结的理解骨干学习像素生成；两条分支稳定后才联合训练。基础模型完成后，质量优化与步数蒸馏各自解决不同问题。',
    componentId: 'studio-analogy',
  },
  modules: [
    {
      kind: 'module', id: '6.1', title: '渐进式课程：先稳定单项能力，再联合优化',
      desc: '渐进式训练的作用是控制能力形成顺序与参数开放范围，避免从初始阶段就让异构目标同时扰动全部参数。Stage 1 通过注意力融合和全模型续训稳定理解骨干；Stage 2 冻结理解侧，以三个 Phase 建立并扩展生成能力；Stage 3–4 再开放两条分支进行统一中训和指令对齐；Stage 5–6 最后分别处理生成质量和采样效率。',
      componentId: 'training-flow-map',
    },
    {
      ...sourceChapters[7].modules[0],
      id: '6.2',
      title: 'Table 2：把阶段目标落实为训练配方',
      desc: 'Table 2 的作用是把“先理解、再生成、后联合”的课程落实为可复现的优化条件。学习率与训练步数控制每阶段的优化强度，CE:MSE 权重决定启用哪条损失，分辨率与序列长度规定输入规模，任务采样比和参数更新范围则决定能力来源与开放边界；这些数值属于论文报告配置，不能脱离对应 Stage 单独解释。',
    },
    {
      kind: 'module', id: '6.3', title: '生成后训练：分别优化质量与采样效率',
      desc: 'Stage 5 与 Stage 6 解决两个不同问题。Stage 5 用动态分辨率热身缓解不同分辨率的奖励方差，再以文字准确性、风格遵循和审美偏好奖励改善生成质量，并通过冻结边界保护理解能力、缓解网格伪影；Stage 6 使用生成器 G、假流模型 F 与教师 T 进行 DMD2 蒸馏，只更新生成侧，以 1:5 的更新频率把论文报告的采样设置从 100 NFE 压缩到 8 NFE。',
      componentId: 'post-training-route',
    },
  ],
  insight: '关键不是“依次训练六次”，而是参数开放范围逐步变化：理解先单独稳定，生成在理解冻结时建立基础，两条分支随后联合更新，最后再冻结理解侧完成质量后训练与生成侧蒸馏。',
  formula: undefined,
  takeaways: [
    { icon: '①', title: '先分开建立能力', desc: 'Stage 1 先稳定理解骨干；Stage 2 冻结理解分支，并用三个 Phase 扩展生成分辨率与任务类型。' },
    { icon: '②', title: '再联合训练', desc: 'Stage 3–4 以 0.33/0.37/0.24/0.06 的任务混合和 0.1:1 的 CE:MSE 权重更新完整模型。' },
    { icon: '③', title: '最后专项优化', desc: 'Stage 5 用多奖励 RL 改善 T2I，Stage 6 只更新生成侧并用 DMD2 将 100 NFE 压缩到 8 NFE。' },
  ],
};

const inferenceChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[8],
  id: 'chap-7',
  title: '推理基础设施：统一接口，分置执行',
  badgeLabel: '论文 §3.5',
  bridge: '§3.5 解决的是“统一模型如何高效运行”。理解路径以多模态 prefill、自回归解码、流式输出和控制流为主；生成路径以迭代像素去噪为主。论文因此在 API 与上下文层保持统一，在执行层拆成 LightLLM 和 LightX2V 两个专用引擎，并进一步为统一多模态 prefill 实现混合注意力内核。',
  analogy: {
    title: '同一项服务，使用两种处理节奏',
    text: '文本理解需要连续响应和控制流程，图像生成需要重复执行像素去噪。两套执行节奏通过共享状态协作，对用户仍表现为同一个多模态服务。',
    componentId: 'studio-analogy',
  },
  modules: [
    {
      kind: 'module', id: '7.1',
      title: '双引擎分置：统一服务，独立优化两类负载',
      desc: '双引擎架构的作用是在保持统一 API 和生成上下文的同时，解除理解与生成在调度、并行策略和资源预算上的耦合。LightLLM 承担多模态 prefill、自回归文本流与控制，LightX2V 承担迭代像素去噪；二者通过固定页共享内存交换 KV cache 和生成状态，从而支持独立扩缩容、故障隔离，以及分置 GPU 或同 GPU 共置两种部署方式。',
      componentId: 'inference-route',
      figure: '/images/figure-05-disaggregated-inference.png',
    },
    {
      kind: 'module', id: '7.2',
      title: '混合注意力内核：保留文本快路，扩展图像范围',
      desc: '混合注意力内核用于高效执行统一多模态 prefill 中并存的两类可见性规则：文本行保持标准因果注意力，图像行读取完整文本前缀与整个图像 span。内核按 M-block 判断是否包含图像 token；纯文本块继续使用原有 causal Key 范围，只有含图像的块才扩展到 image-span end，因此不会让所有请求共同承担多模态掩码的额外计算。',
      componentId: 'serving-kernel',
      figure: '/images/figure-06-hybrid-attention-pattern.png',
    },
  ],
  insight: '“分置”发生在运行时，不发生在模型语义上：两台引擎共享生成上下文并对外提供统一 API；混合注意力内核则让含图像块获得必要的双向范围，同时让纯文本块保留标准因果快路。',
  takeaways: [
    { icon: '①', title: '双引擎分工', desc: 'LightLLM 负责理解、文本流和控制；LightX2V 负责迭代像素生成。' },
    { icon: '②', title: '共享生成状态', desc: '两台引擎通过 pinned shared memory 交换 KV cache 与生成状态，支持独立调度和资源配置。' },
    { icon: '③', title: '按块保留快路', desc: '纯文本 M-block 保持 causal K range；只有含图像 token 的块才扩展到 image-span end。' },
  ],
};

const dataChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[6],
  id: 'chap-8', title: '数据构造', badge: 'trn', badgeLabel: '论文 §4',
  bridge: '论文 Section 4 包含两套组织逻辑：理解数据按预训练、中训和 SFT 阶段组织；生成数据按 T2I、图像编辑和图文交错任务组织。每一类数据都需要同时说明组成比例、构造流程、质量验证和进入训练后的用途，不能只展示一张比例图。',
  analogy: {
    title: '先按用途分组，再按不同标准检查',
    text: '理解语料和生成语料面向不同能力，因此不能使用完全相同的筛选标准。数据比例回答“包含什么”，处理与验证流程回答“为什么可以进入训练”。',
    componentId: 'studio-analogy',
  },
  modules: [{
    kind: 'module', id: '8.1',
    title: '数据组织：为不同能力提供可验证的训练供给',
    desc: '数据组织的作用是为理解与生成提供不同但可协同的能力来源，并在进入训练前控制对齐、覆盖和质量。理解数据按预训练、中训与 SFT 逐步从广覆盖转向高质量指令，生成数据则按文本生图、图像编辑与图文交错分别构造和验证；组成比例回答语料包含什么，处理流程回答样本为何可用，训练采样比才决定各阶段实际看到多少。由论文余量推导的比例继续以“≈”标记，不作为原文直接报告值。',
    componentId: 'data-construction-map',
    figure: '/images/figure-08-data-distribution-sunburst.png',
  }],
  insight: '数据构造、训练采样和损失加权属于三个层次：Section 4 决定样本如何产生与筛选，Table 2 决定各训练阶段如何混合数据，CE:MSE 决定两类目标怎样加权。',
  formula: undefined,
  takeaways: [
    { icon: '①', title: '理解侧按阶段组织', desc: '预训练建立覆盖，中训强化多领域指令，SFT 在中训候选池上继续提高质量并重构难度。' },
    { icon: '②', title: '生成侧按任务组织', desc: 'T2I 重视覆盖和 caption，编辑额外验证 change/preserve 目标，交错数据还要检查整条生成轨迹。' },
    { icon: '③', title: '分清三类比例', desc: '语料组成百分比、Table 2 训练采样比和 CE:MSE 损失权重不能互相替代。' },
  ],
};

const evidenceChapter: TutorialData['chapters'][number] = {
  ...sourceChapters[9],
  id: 'chap-9',
  title: '实验与结论',
  badgeLabel: '论文 §5–6',
  bridge: '§5 分别报告理解、生成、编辑、交错生成的主结果，并检验视觉接口、联合训练和数据扩展。由于不同表格使用不同模型、数据集和评测协议，比较时必须保留各自的条件和指标方向。',
  analogy: { title: '使用同一量尺比较结果', text: '只有在同一数据集、任务定义和指标下，数值才能直接并列。定性案例、作者假设和定量结果应当分开表述。', componentId: 'studio-analogy' },
  modules: sourceChapters[9].modules.map((module, index) => ({ ...module, id: `9.${index + 1}`, title: index === 0 ? '实验协议与证据边界：验证论文主张' : module.title, desc: index === 0 ? '实验模块的作用是把每项论文主张绑定到可比的模型、数据集、指标方向与评测协议。RealUnify 和 GenEval 分别检验统一能力与生成表现，联合中训和重建实验检验训练协同与视觉接口，编辑、交错生成、VLA 和世界模型案例则保留各自的定量或定性证据等级；不同协议的数值不会被合并为一个跨任务总分。' : module.desc })),
  insight: '重建结果来自 NEO-unify 2B，联合中训对照来自 8B-MoT，VLA 与世界模型只是定性案例。实验结论必须与具体模型、数据集和评测协议一一对应。',
  takeaways: [
    { icon: '①', title: '先对齐协议', desc: '只比较使用同一任务、数据和指标的结果。' },
    { icon: '②', title: '再解释指标', desc: 'PSNR 相同不代表 SSIM 相同，也不代表完全无损。' },
    { icon: '③', title: '保留证据边界', desc: '网格伪影成因是作者推测，VLA 与世界模型属于初步定性展示。' },
  ],
};

export const tutorial: TutorialData = {
  ...sourceTutorial,
  chapters: [
    motivationChapter,
    overviewChapter,
    interfaceChapter,
    modelingChapter,
    objectiveChapter,
    trainingChapter,
    inferenceChapter,
    dataChapter,
    evidenceChapter,
  ],
};
