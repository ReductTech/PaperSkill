import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Robust-U1: Can MLLMs Self-Recover Corrupted Visual Content for Robust Understanding?",
    "titleZh": "Robust-U1：多模态模型如何「自愈」损坏图像",
    "venue": "ICML 2026 (PMLR 306) · arXiv:2606.08063",
    "authors": "Jiaqi Tang, Jianmin Chen, Youyang Zhai, Wei Wei, Runtao Liu, Mengjie Zhao, Xiangyu Wu, Qingfa Xiao, Qifeng Chen",
    "affiliation": "香港科技大学 · 西北工业大学 · 东北大学 · 南京理工大学 · 香港科技大学（广州）",
    "domain": "多模态大语言模型 · 视觉鲁棒性 · 图像恢复 · 强化学习",
    "coreProblem": "真实世界视觉损坏使多模态大模型性能显著下降，而黑盒对齐与文本推理都无法恢复丢失的像素级信息",
    "coreInsight": "让模型先显式重建恢复图像（损坏的近似逆映射 D⁻¹），再联合损坏与恢复两幅图像做多模态推理",
    "keywords": [
      "视觉自恢复",
      "损坏鲁棒性",
      "整流流",
      "双奖励 RL",
      "SSIM",
      "CLIP",
      "多模态推理"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "黑盒对齐与文本推理都绕不开一个事实：<b>像素级信息已经丢失</b>，模型只能靠猜。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "Robust-U1 让模型先<b>自恢复</b>图像，再联合损坏与恢复两幅图像推理——信息回来了，答案才可靠。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "当图像损坏时，多模态模型为什么「看不清」",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "第一课提出整篇论文要回答的问题，并让学习者亲手体验损坏如何摧毁 MLLM，从而理解为什么需要「恢复图像」这个新输入。",
      "analogy": {
        "title": "擦掉灰尘，擦不掉丢失的信息",
        "text": "灰尘被抹开，人像依然模糊——表面清理救不回已经丢失的<b>像素细节</b>。",
        "componentId": "ch1-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "模块 1.1 拖动损坏强度，看模型什么时候开始「猜」",
          "desc": "真实世界里图像的损坏程度会变化。拖动滑块观察：损坏越重，照片里的线索丢得越多，模型的正确率跌得越快。",
          "componentId": "ch1-mod1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "模块 1.2 打开「自恢复」，精度曲线不再坠落",
          "desc": "同样的损坏强度，加入 Robust-U1 的<b>自恢复</b>：先把损坏图像重建为恢复图像，再联合两幅图像推理。对比开关前后的正确率。",
          "componentId": "ch1-mod2"
        }
      ],
      "insight": "文字描述再详细，也补不回已经丢失的像素——真正的出路是把<b>图像本身</b>修回来。",
      "formula": {
        "lead": "标准管线只吃干净图像；鲁棒管线先求损坏的近似逆，再让模型同时看两幅图像。",
        "unicode": "A₀ = F_MLLM(I₀, Q)   →   A = F_MLLM(D⁻¹(Ic), Ic, Q)",
        "symbols": [
          {
            "sym": "Ic",
            "desc": "损坏图像（corrupted image）"
          },
          {
            "sym": "D⁻¹",
            "desc": "损坏过程的近似逆映射，即自恢复模块"
          },
          {
            "sym": "Ir = D⁻¹(Ic)",
            "desc": "恢复图像（recovered image）"
          },
          {
            "sym": "Q / A",
            "desc": "文本问题与最终答案"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "真实损坏让 MLLM 性能显著下降",
          "desc": "损坏越重跌得越狠。"
        },
        {
          "icon": "🔧",
          "title": "黑盒对齐不建模损坏，文本推理不恢复像素",
          "desc": "两条旧路都堵死了。"
        },
        {
          "icon": "✨",
          "title": "Robust-U1 的核心循环",
          "desc": "先自恢复出 Ir，再联合 Ic 与 Ir 推理。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "损坏如何改写一幅图像",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章看到性能下降，这一章进入图像内部，看清楚「丢的到底是什么」，为第三章的逆映射做铺垫。",
      "analogy": {
        "title": "放大镜下，损伤无所遁形",
        "text": "表面只是「有点糊」，凑近一看：<b>纹理</b>被抹平、<b>边缘</b>断裂、<b>颜色</b>漂移。",
        "componentId": "ch2-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "模块 2.1 点击照片区域，看清像素级的损伤",
          "desc": "点击照片上的三个区域（纹理 / 边缘 / 颜色），细节窗会显示该区域的像素块发生了什么，以及模型看到的特征如何被破坏。",
          "componentId": "ch2-mod1"
        }
      ],
      "formula": {
        "lead": "用一句话定义损坏：干净图像经过损坏函数变成损坏图像。",
        "unicode": "Ic = D(Io)",
        "symbols": [
          {
            "sym": "Io",
            "desc": "干净图像（clean image，H×W×3）"
          },
          {
            "sym": "D",
            "desc": "损坏函数（噪声、压缩、天气等）"
          },
          {
            "sym": "Ic",
            "desc": "损坏图像，模型实际收到的输入"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "损坏是像素级的",
          "desc": "它抹平纹理、切断边缘、偏移颜色。"
        },
        {
          "icon": "🔧",
          "title": "不同类型的损坏破坏不同的图像线索",
          "desc": "且常常混合出现。"
        },
        {
          "icon": "✨",
          "title": "知道了「丢的是什么」，才知道「要修什么」",
          "desc": "这是自恢复的出发点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "把损坏「倒着做一遍」：自恢复的核心洞见",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "教程的第一个转折点——从「描述损坏」切换到「重建图像」，用同一道题对比文本推理与自恢复的差距。",
      "analogy": {
        "title": "描回褪色的轮廓",
        "text": "不是用文字描述这张脸长什么样，而是<b>一笔一笔</b>把轮廓重新画出来。",
        "componentId": "ch3-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "模块 3.1 按「开始对比」，看同一条路谁走通了",
          "desc": "同一道题（「前方车辆朝哪个方向行驶？」），左边是 Robust-R1 式的<b>文本推理</b>，右边是 Robust-U1 的<b>自恢复 + 多模态推理</b>。两边同时开始、同一时间轴推进。",
          "componentId": "ch3-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "自恢复 = 学习损坏的近似逆映射 D⁻¹",
          "desc": "把 Ic 重建为 Ir。"
        },
        {
          "icon": "🔧",
          "title": "文本推理只输出文字，不产生视觉表征",
          "desc": "自恢复重建真实图像。"
        },
        {
          "icon": "✨",
          "title": "恢复后的图像成为推理的新输入",
          "desc": "与损坏原图互补。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "整流流：让「从噪声到干净」走直线",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "第一章到第三章都在讲「为什么」，这一章给出「怎么做」的第一块数学地基：SFT 阶段的整流流目标。",
      "analogy": {
        "title": "直线扫过，颜色回来",
        "text": "不绕弯子：整流流让恢复路径保持<b>直线</b>，一步对应一段进度。",
        "componentId": "ch4-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "模块 4.1 沿直线拖动 t：从噪声回到干净",
          "desc": "潜空间里有一条从噪声到干净的直线。拖动 t 点：上方照片的噪声随 t 同步变化，下方直线上的点移动，模型在每个位置预测并减去噪声 ε。",
          "componentId": "ch4-mod1"
        }
      ],
      "formula": {
        "lead": "训练时随机选一个时刻 t，让模型预测混入潜表示里的那部分噪声。",
        "unicode": "L_SFT = 𝔼[‖ε − εΘ(Zc, Zo(t), t, Prec)‖²]，其中 Zo(t) = (1−t)·Zo + t·ε",
        "symbols": [
          {
            "sym": "Zo",
            "desc": "干净图像的潜表示（latent）"
          },
          {
            "sym": "Zc",
            "desc": "损坏图像的潜表示（latent）"
          },
          {
            "sym": "t",
            "desc": "时间步，0（干净）到 1（纯噪声）"
          },
          {
            "sym": "ε",
            "desc": "标准高斯噪声"
          },
          {
            "sym": "εΘ",
            "desc": "噪声预测网络"
          },
          {
            "sym": "Prec",
            "desc": "恢复指令（如「Recover the clean version…」）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "整流流把恢复写成「沿直线去噪」",
          "desc": "Zo(t) 是两端点的线性混合。"
        },
        {
          "icon": "🔧",
          "title": "模型学的是预测噪声 ε",
          "desc": "而不是直接画图。"
        },
        {
          "icon": "✨",
          "title": "潜空间操作让 SFT 阶段就拿下大幅质量提升",
          "desc": "（PSNR 14.37→20.88）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "双奖励：像不像，还要「对不对」",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "回答「恢复得好不好由谁说了算」——两把尺子缺一不可，且单一像素指标与下游推理是解耦的。",
      "analogy": {
        "title": "对着原片，一项一项核对",
        "text": "纹理对不对、内容对不对——修复不是「看起来干净」就算数。",
        "componentId": "ch5-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "模块 5.1 切换奖励组合，看指标与推理的取舍",
          "desc": "切换四种训练配置：无 RL、仅像素奖励、仅语义奖励、双奖励。三组恢复指标条与 R-Bench 总分条会同步变化。",
          "componentId": "ch5-mod1"
        }
      ],
      "formula": {
        "lead": "像素奖励把局部块拆成亮度、对比度、结构三项比较；语义奖励先求余弦相似度。",
        "unicode": "Rpix = (1/N)·Σ l(pᵢ) · c(pᵢ) · s(pᵢ)；Sim = M_CLIP(Ir)·M_CLIP(Io) / (‖M_CLIP(Ir)‖·‖M_CLIP(Io)‖)",
        "symbols": [
          {
            "sym": "l, c, s",
            "desc": "局部块的亮度、对比度、结构比较项（各含稳定常数 C₁/C₂/C₃）"
          },
          {
            "sym": "N",
            "desc": "局部块数量"
          },
          {
            "sym": "pᵢ",
            "desc": "第 i 个局部块"
          },
          {
            "sym": "M_CLIP",
            "desc": "冻结的 TinyCLIP 编码器"
          },
          {
            "sym": "Sim",
            "desc": "恢复图与干净图的 CLIP 余弦相似度"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两把不同的尺子",
          "desc": "像素结构（SSIM）与语义一致（CLIP）是两把不同的尺子。"
        },
        {
          "icon": "🔧",
          "title": "SSIM 拆成三项",
          "desc": "SSIM 把图像拆成亮度、对比度、结构三项局部比较。"
        },
        {
          "icon": "✨",
          "title": "双奖励同时拿下两项",
          "desc": "双奖励结合才同时拿下恢复质量与推理收益；像素指标好看不等于推理变好。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从噪声走到清晰：恢复的推理过程",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "把 §4 的数学变成可走的过程：亲手步进 50 步，感受早期「只有轮廓」到末期「细节齐全」的变化，并理解为什么它慢。",
      "analogy": {
        "title": "显影盘里的慢慢浮现",
        "text": "恢复不是瞬间完成——就像显影，<b>一步</b>一步清晰起来。",
        "componentId": "ch6-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "模块 6.1 一步一步，看恢复如何「显影」",
          "desc": "用上一步/下一步走完 50 步去噪：照片噪声逐级下降，右侧曲线标出当前步的噪声水平；第 50 步后按钮自动停用。",
          "componentId": "ch6-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "50 步逐步去噪",
          "desc": "恢复是 50 步逐步去噪，从「只有噪声」到「细节齐全」。"
        },
        {
          "icon": "🔧",
          "title": "步数是质量与速度的旋钮",
          "desc": "步数是质量与速度的旋钮：步数主导了推理开销。"
        },
        {
          "icon": "✨",
          "title": "55 秒的账",
          "desc": "完整管线的 55 秒延迟主要花在恢复上——这是部署要算的账。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "用奖励做群体竞赛：Flow-GRPO",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "深入训练细节：回答「RL 到底怎么训」——群体采样、组内比较、α 的敏感性证据。",
      "analogy": {
        "title": "修一笔，对一眼原片",
        "text": "每一笔之后都对照原片检查——<b>反复修正</b>，直到看不出差异。",
        "componentId": "ch7-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "模块 7.1 拖动 α，看奖励怎么筛选候选恢复",
          "desc": "语义奖励 Rsem = exp(−α·(1−Sim)) 的形状由 α 控制。拖动 α：曲线从平缓变陡峭；下方四张候选恢复照片中，语义偏差大的会从「可接受」变成「被惩罚」。",
          "componentId": "ch7-mod1"
        }
      ],
      "formula": {
        "lead": "把 CLIP 余弦相似度换算成奖励：越接近 1 奖励越接近 1，偏差越大惩罚越狠，α 控制狠的程度。",
        "unicode": "Rsem = exp(−α · (1 − Sim))",
        "symbols": [
          {
            "sym": "Rsem",
            "desc": "语义一致性奖励（最大值 1）"
          },
          {
            "sym": "Sim",
            "desc": "恢复图与干净图的 CLIP 余弦相似度"
          },
          {
            "sym": "α",
            "desc": "缩放因子（默认 5，控制指数衰减的陡峭度）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "群体竞赛",
          "desc": "Flow-GRPO 把去噪当决策过程：采一组轨迹，组内比较定优劣。"
        },
        {
          "icon": "🔧",
          "title": "稳定训练",
          "desc": "KL 惩罚防止奖励投机；ODE 转 SDE 让采样有多样性。"
        },
        {
          "icon": "✨",
          "title": "α 敏感性",
          "desc": "α 在 2–8 之间不敏感，默认取 5；过大则牺牲像素细节。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "统一模型如何同时「看懂」与「修好」",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "把前面散落的部件装进一张图：点击每个组件看它做什么、在哪一阶段被训练；这是论文唯一需要「结构图」的地方，必须交互。",
      "analogy": {
        "title": "工具各归其位",
        "text": "统一模型内部也有一张「工作台」：<b>理解</b>与<b>生成</b>两个专家各管一摊。",
        "componentId": "ch8-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "模块 8.1 点击组件，看清统一模型的分工",
          "desc": "点击架构图里的组件（或切换训练阶段），活动路径会高亮，细节窗说明该组件的作用、在哪一阶段训练、以及恢复图像流向哪里。",
          "componentId": "ch8-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "双专家分工",
          "desc": "一个统一模型内部分出理解与生成两个专家。"
        },
        {
          "icon": "🔧",
          "title": "分阶段点亮",
          "desc": "阶段 I/II 只训练生成侧；阶段 III 才联合训练理解侧。"
        },
        {
          "icon": "✨",
          "title": "联合推理",
          "desc": "恢复图像与损坏图像一起送入联合推理，输出最终答案。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "部署与防幻觉：让恢复可靠落地",
      "badge": "trn",
      "badgeLabel": "训练",
      "bridge": "从「怎么训」转向「怎么用」：亲手切换部署模式，体会鲁棒性-开销权衡，并确认恢复不会画蛇添足。",
      "analogy": {
        "title": "交付前的最后检查",
        "text": "修好的地方要经得起放大镜：<b>不能</b>把不存在的细节画进去。",
        "componentId": "ch9-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "模块 9.1 切换部署模式，权衡速度与鲁棒",
          "desc": "三种部署模式：不恢复的标准模型、检测到损坏才恢复、以及 Robust-U1 的常开恢复。切换模式看延迟、显存、R-Bench 总分与幻觉有害率的变化。",
          "componentId": "ch9-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "恢复分支很少产生误导性幻觉",
          "desc": "有害率仅 4.1%，远低于 BAGEL 的 15.6%。"
        },
        {
          "icon": "🔧",
          "title": "三种部署模式",
          "desc": "在延迟、显存与鲁棒性之间权衡。"
        },
        {
          "icon": "✨",
          "title": "常开恢复在干净输入上也无害",
          "desc": "是安全的默认部署。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "修复的照片，赢在数据上",
      "badge": "both",
      "badgeLabel": "进阶",
      "bridge": "收尾：用一场「数据赛跑」验证谁更强，用精确数据表兜底，最后诚实交代边界。",
      "analogy": {
        "title": "并排显影，高下立判",
        "text": "同一时间开始显影，一张停在模糊，一张走到清晰——<b>数据</b>也是如此。",
        "componentId": "ch10-ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "模块 10.1 按下开始，看 R-Bench 上的差距",
          "desc": "按「开始对比」后，三个方法的进度条从同一基线出发，跑向各自在 R-Bench 上的真实总分；用任务 chips 可切换查看 MCQ/VQA/CAP 各强度的精确数据。",
          "componentId": "ch10-mod1"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "Robust-U1 在 R-Bench 与对抗损坏基准上全面 SOTA",
          "desc": "优势随损坏加剧而扩大。"
        },
        {
          "icon": "🔧",
          "title": "消融与成分隔离证明",
          "desc": "恢复、双奖励、联合推理三者缺一不可。"
        },
        {
          "icon": "✨",
          "title": "边界要诚实",
          "desc": "严重损坏仍难、依赖成对数据、推理开销大（55 s）。"
        }
      ]
    }
  ]
};
