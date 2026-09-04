import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "BabelDOC: Better Layout-Preserving PDF Translation via Intermediate Representation",
    titleZh: "BabelDOC：基于中间表示的高保真 PDF 布局保持翻译",
    venue: "arXiv:2605.10845v1 · 2026",
    authors: "Qi Yang, Xiangyao Ma, Xiao Wang, Hao Wang, Rui Wang",
    affiliation: "上海大学；Funstory.ai Limited；上海交通大学",
    domain: "布局保持型 PDF 翻译 · 中间表示 · 文档级语义处理 · PDF 重建",
    coreProblem: "把原始 PDF 变成译文 PDF，同时尽量保留原页面的空间结构、公式与绘制关系。",
    coreInsight: "<b>BabelDOC 的主角不是一个新翻译模型，而是一份能把译文带回原页面的 IR。</b><br/>一条因果链串起五问：<b>怎么表示 → 什么不能翻 → 怎么翻好 → 怎么塞回 → 怎么画回</b>。",
    keywords: [
      "中间表示",
      "占位符",
      "上下文与术语表",
      "自适应排版",
      "PDF 重建"
    ]
  },
  hero: {
    oldMethod: {
      desc: "只抽文字：译文可能正确，但原来的框、层级与绘制状态已经丢了。",
      componentId: "museum-hero"
    },
    newMethod: {
      desc: "BabelDOC：LLM 只改文字，IR 把页面依据一路带到排版与重建。",
      componentId: "museum-hero"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "怎么表示：译对一句，为什么还会毁掉一页？",
      badge: "inf",
      badgeLabel: "核心",
      bridge: "目标不是一句英文变中文，而是让译文回到原 PDF。先分清“译对”与“放回”两个判据，再看中间表示（IR）为什么是整条系统的主角。",
      analogy: {
        title: "IR 多保存的，正是“放回哪里”",
        text: "<b>只抽文字</b>只能得到译文，却失去它在页面中的位置、层级和绘制顺序。<b>IR 把文字与这些页面依据放进同一条记录</b>：LLM 只改文字，重建模块据此把译文放回原位。",
        componentId: "museum-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "同一句译文，为什么一个越界、一个能放回？",
          desc: "切换“只抽文字（教学示意）”与 BabelDOC：译文完全相同，只比较边界框、层级与绘制顺序等页面依据是否仍可用。",
          componentId: "scope-compare"
        },
        {
          kind: "module",
          id: "1.2",
          title: "点一项，看 IR 到底记了什么",
          desc: "选择简化 IR 的一组字段，核对它记录的文字、位置与绘制状态；默认展示“段落文本”，其余字段可按需展开。",
          componentId: "ir-inspector"
        }
      ],
      insight: "IR 是各模块共同操作的结构化接口：语言模块修改文字，排版与重建继续使用同一份页面依据。“双向”指解析、编辑、重建的工作流，不是无损逆变换。",
      takeaways: [
        {
          icon: "🎯",
          title: "两个判据",
          desc: "译对文字不等于已经把译文放回页面。"
        },
        {
          icon: "🗂️",
          title: "一份共同接口",
          desc: "IR 同时携带可编辑文字与页面重建依据。"
        },
        {
          icon: "⚖️",
          title: "别把贡献说大",
          desc: "它是系统架构，不是新 LLM；Listing 1 也只是简化片段。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "什么不能翻：让公式绕过 LLM",
      badge: "both",
      badgeLabel: "机制",
      bridge: "IR 已保留页面依据，但公式内部还有上标、下标、分式和根号等几何关系。若把公式当普通文本交给 LLM，结构可能被改写；系统先把它整体替换为占位符，翻译后再按 IR 中保存的信息恢复。",
      analogy: {
        title: "先把整条公式收进保护匣",
        text: "策展人更换说明文字前，会先收好不能改动的公式展牌。BabelDOC 也把识别到的公式整体登记为占位符：LLM 只看见周围文字与 <b>{v1}</b>，原公式仍由 IR 保留，翻译完成后再按保存的字符与几何信息放回；占位符不是公式译文。",
        componentId: "museum-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "经典 Attention 公式，怎样绕过 LLM 再回来？",
          desc: "用经典 scaled dot-product attention 作为教学例子（不是论文原式）：整体占位，只翻周围文字，再按保存的几何信息恢复。点击 Kᵀ、√dₖ、softmax、V 与 {v1} 查看各自为何需要保护。",
          componentId: "formula-shield"
        }
      ],
      insight: "占位符不是公式的新写法，而是“这段结构暂时不要改”的稳定身份。LLM 只处理周围语言，公式的字符与几何关系留给 IR 和重建模块。",
      formula: {
        lead: "<b>教学示例（不是 BabelDOC 论文原式）</b>：经典 scaled dot-product attention 集中包含转置上标、维度下标、分式与根号，适合观察为什么整条公式不能当成普通文本翻译。",
        unicode: "Attention(Q, K, V) = softmax(<span style=\"display:inline-flex;flex-direction:column;vertical-align:middle;line-height:1.05;margin:0 .18em\"><span style=\"border-bottom:1.5px solid currentColor;padding:0 .22em .08em\">QKᵀ</span><span style=\"padding:.08em .22em 0\">√dₖ</span></span>)V<br><span style=\"font-family:system-ui,sans-serif;font-size:.68em;font-weight:700;color:var(--slate-2)\">翻译阶段整体替换为</span> {v1}",
        symbols: [
          {
            sym: "{v1}",
            desc: "翻译阶段暂时代表<b>整条受保护公式</b>的占位符身份；它不是公式译文。"
          },
          {
            sym: "QKᵀ",
            desc: "Q 与 K 的点积形成相似度分数；其中 <b>ᵀ 只附着在 K 上</b>，PDF 中依赖字符相对基线的位置表达。"
          },
          {
            sym: "√dₖ",
            desc: "按 key 的维度平方根缩放分数；<b>k 是 d 的下标</b>，根号与分式线也属于要保留的视觉结构。"
          },
          {
            sym: "softmax",
            desc: "把缩放后的分数归一化为注意力权重。它位于公式区域，不作为普通英文单词交给翻译模型。"
          },
          {
            sym: "V",
            desc: "权重最终作用于 value 矩阵 V；V 仍是公式变量，因此与整条公式一起被保护。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🛡️",
          title: "先保护",
          desc: "识别到的公式、引用等不可翻结构先整体替换成占位符。"
        },
        {
          icon: "🧭",
          title: "只翻周围文字",
          desc: "LLM 看见周围句子和 {v1}，不直接接触 Attention 公式。"
        },
        {
          icon: "🧩",
          title: "再按记录恢复",
          desc: "这是一种结构保护与重建机制，不是公式翻译模型。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "怎么翻好：边界邻居共享上下文，术语表统一译名",
      badge: "both",
      badgeLabel: "语义",
      bridge: "公式安全只解决“别被改坏”。普通文字仍会被栏与页切开。关键不是把半句话拿去全文搜索，而是先借 IR 限定边界候选，再让相关段落在同一次 LLM 请求中共享上下文；术语表另行约束全文译名。",
      analogy: {
        title: "展签不挪位，只让译员同时看见",
        text: "两张展签仍留在各自展框，只把它们放进译员的同一阅读视野。BabelDOC 的开源实现也保留段落 ID 与页面位置：先按边界规则组成候选，再把多个段落装进同一次 LLM 请求，最后按原 ID 分别回写；这叫共享上下文，<b>不是把页面块物理合并</b>。",
        componentId: "museum-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "它不是全文找下半句：边界候选怎样进入同一次请求？",
          desc: "切换同页跨栏与相邻跨页，查看开源实现怎样筛正文、限定边界邻居、保留不同 ID 同批送入 LLM，再按 ID 分别回写。论文正文只说明 IR 支持逻辑接续，没有公开这些配对规则。",
          componentId: "context-stitch"
        },
        {
          kind: "module",
          id: "3.2",
          title: "再让当前变换矩阵（CTM）全文只叫一个名字",
          desc: "切换自由生成与术语表提示，观察非连续页面上的译名是否统一；联合消融与提示失效边界供备查。",
          componentId: "glossary-lab"
        }
      ],
      insight: "这里的 stitching 更接近“构造共同上下文”，不是把两个页面段落永久并成一个字符串：候选段落保留各自 ID，在同一次请求里互相可见，译文再分别回到原段落。",
      takeaways: [
        {
          icon: "🧵",
          title: "先限定边界候选",
          desc: "开源实现从跨栏或跨页边界的正文邻居组成候选，不做全文语义搜索。"
        },
        {
          icon: "📘",
          title: "同批，但不合并",
          desc: "多个段落保留不同 ID 进入同一次请求，让 LLM 共享上下文后分别返回。"
        },
        {
          icon: "🔎",
          title: "术语表另管一致性",
          desc: "术语表进入提示词；论文无独立拼接准确率，Table 4 也只联合移除术语表与上下文控制。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "怎么塞回：译文变长，就搜索 γ",
      badge: "both",
      badgeLabel: "排版",
      bridge: "上下文完整、术语受控之后，译文仍可能比原文更长。现在把它放回 IR 保存的原段落框。",
      analogy: {
        title: "把变长的展签收进原框",
        text: "中文展签变长，但展框与旁边展品不能随意挪动。BabelDOC 从原尺度开始，溢出就逐档缩小并重新排版，第一次完整放入就停；若达到预设下限（具体值未报告）仍不合适，也不能无限缩。",
        componentId: "museum-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "γ 搜索器：从溢出到第一次适配",
          desc: "运行一次自动搜索，让真实排版从 γ=1.00 逐档递减到首个适配状态。备查：80 页代表性子集、1—5 越高越好；移除自适应排版后 LF/VA 下降，但这不证明全局最优。",
          componentId: "typeset-search"
        }
      ],
      insight: "这里的 adaptive 是每段文字在运行时做局部迭代搜索，不是训练出来的排版模型；它找到一个可行点，不保证整页全局最优。",
      formula: {
        lead: "教学重述：从 1.0 开始，溢出就按固定步长缩小；第一次适配或到下限即停止。",
        unicode: "γ₀ = 1.0；γₖ₊₁ = γₖ − Δ（典型 Δ 为 0.05 或 0.10）",
        symbols: [
          {
            sym: "γ",
            desc: "当前段落的局部缩放因子，从 1.0 开始搜索。"
          },
          {
            sym: "Δ",
            desc: "论文给出的典型递减步长，通常为 0.05 或 0.10；不是穷举集合。"
          },
          {
            sym: "k",
            desc: "搜索步编号；第一次适配原框或达到预设下限时停止。"
          }
        ]
      },
      takeaways: [
        {
          icon: "📐",
          title: "从 1.0 开始",
          desc: "译文溢出时逐档减小 γ 并重新排版。"
        },
        {
          icon: "🛑",
          title: "第一次适配就停",
          desc: "停止条件是首次合框或预设下限，不是视觉最优。"
        },
        {
          icon: "⚠️",
          title: "0.85 只是案例",
          desc: "它来自 Figure 2 的定性页面，不是默认值或论文公布的下限。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "怎么画回：CTM 把局部坐标送回页面",
      badge: "trn",
      badgeLabel: "重建",
      bridge: "文字塞进原框仍不等于 PDF 已经生成。嵌套 XObject（可嵌套、可复用的 PDF 图形对象）、裁剪路径与多层坐标状态还必须按原绘制关系恢复。",
      analogy: {
        title: "把内层展框挂回正确位置",
        text: "一件展品可能先装在小框里，小框又挂在大框里；每一层都有自己的局部位置。BabelDOC 维护成对的图形状态栈，并用当前变换矩阵（CTM）把局部坐标逐层映射回页面，最后按绘制顺序重建。",
        componentId: "museum-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "前一步解决后，为什么还不够？",
          desc: "沿着“故障出现 → 加入模块 → 暴露下一处故障”走完五步，理解 BabelDOC 的整体架构；五个模块是被问题逐个逼出来的职责分工，不是五个新模型。",
          componentId: "pipeline-map"
        },
        {
          kind: "module",
          id: "5.2",
          title: "同一个点，怎样从局部坐标换算到页面坐标？",
          desc: "先让同一个点依次换用子对象、父对象和页面三个参考系，观察坐标怎样逐层累加；再单独比较退出嵌套对象时“正确 pop”与“漏掉 pop”的结果。",
          componentId: "ctm-nesting"
        }
      ],
      insight: "IR 不是五个模块之一，而是它们共同操作的数据接口：前一步解决一个问题，又暴露下一个问题，最后才得到可渲染的译文 PDF。",
      formula: {
        lead: "图形学教学记法，用来解释论文的多层 CTM；CTM 还可包含缩放与旋转，交互只用整数平移看清组合顺序。它不是论文编号公式，也不证明变换可逆。",
        unicode: "p_page = M₁M₂…Mₙp_local",
        symbols: [
          {
            sym: "p_local",
            desc: "嵌套对象中的局部坐标点。"
          },
          {
            sym: "Mᵢ",
            desc: "概念上的第 i 层坐标变换，不是模型参数。"
          },
          {
            sym: "n",
            desc: "从局部对象到页面所经过的嵌套层数。"
          },
          {
            sym: "p_page",
            desc: "逐层组合之后得到的页面坐标。"
          }
        ]
      },
      takeaways: [
        {
          icon: "🧭",
          title: "五问就是全链",
          desc: "怎么表示、保护、翻译、合框、重建，前一步会逼出下一步。"
        },
        {
          icon: "🧩",
          title: "状态要成对恢复",
          desc: "XObject、字体、颜色、裁剪和坐标状态不能向外泄漏。"
        },
        {
          icon: "📐",
          title: "CTM 属于图形重建",
          desc: "它解决最终画在哪里、按什么层次画，不是 NLP 模型。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "证据与边界：它强在哪里，又没证明什么",
      badge: "both",
      badgeLabel: "证据",
      bridge: "方法讲完，最后看两类证据：Table 3 比较完整系统，Table 4 观察移除组件后的变化。每组数字都要和评测者、指标、单位与方向一起读。",
      analogy: {
        title: "三种评测，回答三类问题",
        text: "自动 BIoU 看布局框是否重合；多模态模型评分看页面级质量；人工评审同时检查质量与漏译。<b>它们不是一套总分，不能混在一起平均。</b>",
        componentId: "museum-analogy"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "三种评测协议，各自回答什么问题？",
          desc: "点击协议卡，只在同一评测者、同一指标和同一方向下比较三个系统：自动 BIoU 看几何布局重合，Gemini 的 TP 看模型裁判下的翻译精度，人工 UTB 看未翻译覆盖。",
          componentId: "benchmark-race"
        },
        {
          kind: "module",
          id: "6.2",
          title: "去掉组件后，哪些指标发生变化？",
          desc: "Table 4 将三种配置放进同一张矩阵：80 个代表页、1—5 主观评分、三项均越高越好。它只检验自适应排版，以及术语表/上下文控制的联合消融；Figure 2 只提供定性案例。",
          componentId: "ablation-lab",
          figure: "./images/babeldoc-figure-2.png"
        }
      ],
      insight: "最准确的结论不是“全面领先”，而是 BabelDOC 提供了一条以 IR 为中心、布局感知且可控的文档翻译管线；论文并没有做干净的 IR-only 消融。",
      takeaways: [
        {
          icon: "📊",
          title: "布局几何略优",
          desc: "在该 200 页基准，BabelDOC 的 BIoU 为 50.0%，PDFMathTranslate 为 48.7%；它们只相差 1.3 个百分点。"
        },
        {
          icon: "⚖️",
          title: "不是全面领先",
          desc: "多模态 TP 与 DeepL 同为 4.19；人工 UTB 越低越好，DeepL 的 2.33 优于 BabelDOC 的 2.85。"
        },
        {
          icon: "🧭",
          title: "消融结论有边界",
          desc: "Table 4 只检验自适应排版及联合术语表/上下文控制；它没有单独隔离 IR，上游解析、复杂图形状态与额外开销仍是边界。"
        }
      ]
    }
  ],
  bilibili: [
    {
      bvid: "BV1nWRGY7EGQ",
      title: "BabelDoc重磅上线！PDF翻译革命性升级，精准排版+公式原样保留，阅读效率飙升！",
      reason: "直接展示 BabelDOC 产品及其布局与公式处理效果，适合在论文机制讲解后形成直观印象；它不是论文评测证据。",
      cover: "https://i1.hdslb.com/bfs/archive/46c821f6fd30b35a82b1f7a93cbbbf3f5dd4dae6.jpg",
      views: "1.4万播放"
    },
    {
      bvid: "BV1MHk9Y2Ef7",
      title: "开源PDF翻译神器，科研论文必备！本地部署+原理介绍 ，PDF翻译成中文",
      reason: "介绍并部署论文对照的前身 PDFMathTranslate，帮助理解从单体前身到显式 IR 架构的背景；它不是论文评测证据。",
      cover: "https://i0.hdslb.com/bfs/archive/0f80316d7de109fdbf146fc0641840b76e58e3d1.jpg",
      views: "7.5万播放"
    },
    {
      bvid: "BV1k7BzYEEuk",
      title: "AI 翻译 PDF ，保留格式、免费开源：PDFMathTranslate ｜pdf2zh",
      reason: "从应用层快速理解保留格式的 PDF 翻译问题，作为补充观看材料；它不是论文评测证据。",
      cover: "https://i2.hdslb.com/bfs/archive/d662f2fc6bb041e66a17d8ed20113f5e9bfda940.jpg",
      views: "2.8万播放"
    }
  ]
};
