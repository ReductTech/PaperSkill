import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "PhysForge: Generating Physics-Grounded 3D Assets for Interactive Virtual World",
    "titleZh": "PhysForge：为可交互虚拟世界生成符合物理规律的 3D 资产",
    "venue": "arXiv 2026 · 教程作者 Lipeilin",
    "authors": "Yunhan Yang, Chunshi Wang, Junliang Ye 等（共同一作）",
    "affiliation": "HKU · 腾讯混元 · ZJU · THU · SJTU · BUAA",
    "domain": "3D 生成 · 具身智能",
    "coreProblem": "现有 3D 生成方法只产出静态几何与纹理，缺少材质、功能与关节等物理信息，生成的“空心壳”资产无法被抓取、推动或操作，难以直接部署到具身智能仿真器与游戏环境。",
    "coreInsight": "PhysForge 把“想清楚”和“做精确”拆开：先由 VLM 规划一份<b>层级物理蓝图</b>（零件结构 + 物理属性 + 关节类型），再由扩散模型通过<b>运动体素注入（KVI）</b>把蓝图实现为几何、纹理与精确的 8 维关节参数——让单张照片一步变成可交互、可仿真的 3D 资产。",
    "keywords": [
      "物理3D资产",
      "关节运动学",
      "VLM规划",
      "流匹配",
      "具身智能"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>传统方法</b>：单图直接生成静态网格——柜门被“钉死”，没有铰链、材质与质量，仿真器无法使用。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>PhysForge</b>：先规划层级物理蓝图，再经 KVI 联合生成几何与关节——柜门绕轴开合、抽屉沿滑轨平移，开箱即可仿真。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "为什么生成的柜子打不开门",
      "badge": "inf",
      "badgeLabel": "入门 · 问题",
      "bridge": "这一节看清论文要解决的问题：现有 3D 生成方法做出的资产为什么只能看、不能用。",
      "analogy": {
        "title": "好看的柜子，打不开的门",
        "text": "现有 3D 生成方法做出的资产像<b>钉死的柜门</b>：外形逼真，却没有铰链、没有材质和质量，机器人抓不了、游戏引擎用不了。",
        "componentId": "ch1ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "把“交互需求”调高，看静态资产在哪里崩溃",
          "desc": "拖动滑块提高交互需求强度（从摆着看到机器人操作），观察只有几何的“空心壳”资产何时失效；再点击按钮，看看补上物理属性后会发生什么。",
          "componentId": "ch1mod1",
          "figure": "/images/fig1-teaser.png"
        }
      ],
      "insight": "要交互，就得把功能与物理规律放进生成过程，而不是事后再补。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "问题",
          "desc": "现有 3D 资产是“空心壳”：只有几何与纹理，没有物理属性。"
        },
        {
          "icon": "🔧",
          "title": "根源",
          "desc": "生成过程从未考虑材质、功能与关节运动。"
        },
        {
          "icon": "✨",
          "title": "目标",
          "desc": "从单张图像直接生成可抓取、可开合、可仿真的物理资产。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一张照片如何变成零件清单",
      "badge": "inf",
      "badgeLabel": "入门 · 表示",
      "bridge": "既然要生成可交互资产，模型先看什么？这一节回答输入如何被编码成部件级表示。",
      "analogy": {
        "title": "先看清：一块板要裁成哪几件",
        "text": "PhysForge 的输入是一张照片、一组<b>体素特征</b>和一张可选的 2D 掩码；模型要像木匠一样，先看出“这件家具由哪几块零件组成”。",
        "componentId": "ch2ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点击零件，看看它的“6 个 token 身份证”",
          "desc": "点击柜子的柜门、抽屉或柜体，查看论文如何用 66 个新 token 中的 6 个就写出一个零件的包围盒与层级属性。",
          "componentId": "ch2mod1"
        }
      ],
      "insight": "结构表示可以又紧凑又带层级：6 个 token 就是一个零件的位置与身份。",
      "formula": {
        "lead": "论文把每个轴对齐包围盒量化成极短的 token 序列：",
        "unicode": "boxᵢ = ⟨boxs⟩ q₁ q₂ q₃ q₄ q₅ q₆ ⟨boxe⟩，q ∈ {⟨box0⟩ … ⟨box63⟩}",
        "symbols": [
          {
            "sym": "boxᵢ",
            "desc": "第 i 个零件的三维轴对齐包围盒"
          },
          {
            "sym": "q",
            "desc": "64 档量化坐标 token，6 个合起来表示两个对角点"
          },
          {
            "sym": "⟨boxs⟩/⟨boxe⟩",
            "desc": "包围盒序列的起止标记"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "输入三件套",
          "desc": "图像 I、TRELLIS 一阶段体素 V、可选掩码 M。"
        },
        {
          "icon": "🔧",
          "title": "高效表示",
          "desc": "66 个新 token，让一个 3D 包围盒只占 6 个 token。"
        },
        {
          "icon": "✨",
          "title": "部件地基",
          "desc": "PartField 编码器 + 位置感知 3D 卷积给出 512 维体素嵌入。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先画图纸，再动锯子",
      "badge": "inf",
      "badgeLabel": "入门 · 洞察",
      "bridge": "零件清单有了，接下来按什么顺序做？这一节给出全文最关键的设计选择：规划与实现解耦。",
      "analogy": {
        "title": "图纸先行",
        "text": "VLM 有世界知识却算不准连续数值，扩散模型擅长精确合成却不懂功能——PhysForge 让两者<b>各干各的强项</b>：先规划层级物理蓝图，再照图施工。",
        "componentId": "ch3ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同步对比：不看图纸直接做 vs 先看图纸再动工",
          "desc": "点一次按钮，让“无蓝图凭感觉”和“有物理蓝图引导”两条路线在同一时间轴上推进，观察零件拼装的差别与规划质量数值。",
          "componentId": "ch3mod1"
        }
      ],
      "insight": "把“想清楚”和“做精确”拆给两个专家，是 PhysForge 的全部起点。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "VLM 管规划",
          "desc": "输出零件层级、物理属性与关节类型的层级物理蓝图。"
        },
        {
          "icon": "🔧",
          "title": "扩散管实现",
          "desc": "按蓝图精确合成几何、纹理与连续运动参数。"
        },
        {
          "icon": "✨",
          "title": "消融证据",
          "desc": "在 PartObjaverse-Tiny 上，去掉物理属性监督后 Voxel recall 从 73.63 掉到 67.89（越高越好）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "把铰链写成 8 个数字",
      "badge": "both",
      "badgeLabel": "综合 · 数学",
      "bridge": "蓝图里的“旋转关节”怎么变成可计算的数值？这一节把关节形式化为原点、轴向与运动范围。",
      "analogy": {
        "title": "铰链三要素：点、轴、范围",
        "text": "一个关节只需要三件事：<b>转轴原点 O</b>、<b>轴向 A</b>、<b>运动范围 L</b>。PhysForge 把这 3+3+2=8 个数字编码成“运动体素”，与几何一起生成。",
        "componentId": "ch4ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "拖动铰链，看 8 维向量实时变化",
          "desc": "门会自动开合：绿色虚线是自由边的开合轨迹，残影是沿途姿态。拖动橙色铰链原点、拖动蓝色轴箭头，轨迹和右侧 O / A / L 读数都会跟着变——这就是模型要为每个零件回归的 8 个数。",
          "componentId": "ch4mod1"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "拧一拧“运动范围”，看门能开多大",
          "desc": "拖动滑块改变关节的运动范围上限，柜门的开合幅度随之变化，体会 Lᵢ 对物理合法性的约束。",
          "componentId": "ch4mod2"
        }
      ],
      "insight": "连续关节参数不是黑盒，而是 8 个可以被学习与回归的显式数字。",
      "formula": {
        "lead": "KVI 把一个零件的关节参数压缩进一个运动体素，与几何体素在同一潜空间联合去噪：",
        "unicode": "Pᵢ = (Oᵢ, Aᵢ, Lᵢ)；zₖ,ᵢ = E_kine( concat( S_O·Oᵢ, S_A·Aᵢ, S_L·Lᵢ ) )",
        "symbols": [
          {
            "sym": "Oᵢ",
            "desc": "关节原点，∈ R³，门绕着转的那个点"
          },
          {
            "sym": "Aᵢ",
            "desc": "关节轴向，∈ R³，转动所绕的直线方向"
          },
          {
            "sym": "Lᵢ",
            "desc": "运动范围（下限, 上限），∈ R²，例如 0°–90°"
          },
          {
            "sym": "E_kine",
            "desc": "运动学编码器，2 层 MLP"
          },
          {
            "sym": "S_O / S_A / S_L",
            "desc": "三组缩放系数，把量纲归一"
          },
          {
            "sym": "zₖ,ᵢ",
            "desc": "运动体素潜变量，注入扩散 Transformer"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "8 个数",
          "desc": "3 个原点 + 3 个轴向 + 2 个范围，定义一个关节。"
        },
        {
          "icon": "🔧",
          "title": "KineVoxel",
          "desc": "关节参数与几何体素同空间联合去噪。"
        },
        {
          "icon": "✨",
          "title": "类型词表",
          "desc": "关节只有四种：revolute / continuous / prismatic / fixed。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "可选模板如何控制零件粒度",
      "badge": "both",
      "badgeLabel": "综合 · 条件",
      "bridge": "关节参数有了形式，但谁来决定零件划多细、生成按什么条件走？这一节讲条件引导。",
      "analogy": {
        "title": "模板决定你锯多细",
        "text": "不提供掩码时，模型靠<b>物理常识</b>自己决定零件粒度；贴上 2D 掩码这张镂花模板，就能精确指定“这一片算一个零件”。",
        "componentId": "ch5ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "三档粒度：无模板 / 粗模板 / 细模板",
          "desc": "切换三种掩码条件，看同一只柜子被划分成 3、5、8 个零件，并对照 PartObjaverse-Tiny 上的规划指标（越高越好）。",
          "componentId": "ch5mod1"
        }
      ],
      "insight": "掩码是控制粒度的旋钮；物理先验保证没有掩码时划分依然合理。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "可选项",
          "desc": "2D 掩码用来控制粒度，不提供也能工作。"
        },
        {
          "icon": "🔧",
          "title": "双重条件",
          "desc": "蓝图同时充当扩散阶段的条件 c。"
        },
        {
          "icon": "✨",
          "title": "无掩码也够强",
          "desc": "Voxel recall 73.63，仍高于 OmniPart 配 SAM 掩码的 68.33（越高越好）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "从噪声毛坯到成型柜子",
      "badge": "inf",
      "badgeLabel": "入门 · 推理",
      "bridge": "条件就位后，第二阶段究竟怎样一步步把资产生成出来？这一节走一遍联合去噪。",
      "analogy": {
        "title": "打磨即去噪",
        "text": "扩散生成像<b>打磨木料</b>：从一团噪声毛坯开始，每一步都让几何与关节参数同时变得更清晰，直到成型。",
        "componentId": "ch6ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "四步走一遍联合去噪",
          "desc": "用“上一步 / 下一步”走完 t=1.0→0 的四个关键时刻，观察几何柜形与关节读数如何同步从噪声收敛。",
          "componentId": "ch6mod1"
        }
      ],
      "insight": "推理是一条轨迹：几何与运动学在同一潜空间里一起收敛。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "联合去噪",
          "desc": "几何体素与运动体素从噪声一起走到 Z₀。"
        },
        {
          "icon": "🔧",
          "title": "注入位置",
          "desc": "运动体素在下采样之后注入，中部 Transformer 学习两类潜变量的关联。"
        },
        {
          "icon": "✨",
          "title": "一次到位",
          "desc": "一次生成同时得到几何、纹理与 8 维关节参数。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "给关节精度十倍的较真",
      "badge": "trn",
      "badgeLabel": "进阶 · 训练",
      "bridge": "联合去噪按什么标准学习？这一节拆开训练目标：一个加权复合损失，把关节精度放在几何之前。",
      "analogy": {
        "title": "孔位差一丝，门就歪一分",
        "text": "训练时 PhysForge 对<b>关节参数的误差</b>格外较真：运动学损失的权重是几何损失的 10 倍（λ_kine = 10）——孔打歪一点，整扇门就合不上。",
        "componentId": "ch7ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "调一调 λ，看两条误差曲线的取舍",
          "desc": "拖动 λ_kine 滑块，观察关节误差与几何质量的联动演示曲线；橙色竖线标出论文的取值 10。",
          "componentId": "ch7mod1"
        }
      ],
      "insight": "损失权重就是“什么更重要”的显式声明：λ_kine = 10 把关节精度放在第一位。",
      "formula": {
        "lead": "训练目标把几何与运动学两支速度损失按 1 : λ_kine 加权求和：",
        "unicode": "L = E_t,Z₀,c [ L_geo + λ_kine · L_kine ]，L_geo = ‖v_g,t − v̂_g,t‖²，L_kine = ‖v_k,t − v̂_k,t‖²",
        "symbols": [
          {
            "sym": "c",
            "desc": "来自层级物理蓝图的条件"
          },
          {
            "sym": "v / v̂",
            "desc": "流匹配的目标速度 / 模型预测速度"
          },
          {
            "sym": "L_geo / L_kine",
            "desc": "几何 / 运动学两支的 L2 速度损失"
          },
          {
            "sym": "λ_kine",
            "desc": "运动学权重，论文全程取 10"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "CFM",
          "desc": "条件流匹配：学习从噪声到数据的速度场。"
        },
        {
          "icon": "🔧",
          "title": "1 : 10",
          "desc": "关节误差被放大 10 倍监督，换取精确的铰链参数。"
        },
        {
          "icon": "✨",
          "title": "条件入损",
          "desc": "蓝图 c 直接进入训练目标，规划与实现闭环。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "两阶段工坊与 KVI 注入点",
      "badge": "trn",
      "badgeLabel": "进阶 · 架构",
      "bridge": "前面各章的零件如何装成一台完整机器？这一节点亮整条流水线，并走一遍数据流。",
      "analogy": {
        "title": "把规格卡插进卡槽",
        "text": "KVI 的精髓是<b>注入位置</b>：运动体素不从头参与卷积，而是在下采样之后、中部 Transformer 之前插队进入，与几何潜变量并肩去噪。",
        "componentId": "ch8ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击流水线：五个组件各管什么",
          "desc": "点击架构图上的组件（或下方按钮），查看每个阶段的输入与输出；紫色节点是全图最关键的 KVI 注入点。对照原图（方法总览）一起看。",
          "componentId": "ch8mod1",
          "figure": "/images/fig2-pipeline.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "步进一遍数据流：从照片到可动资产",
          "desc": "用“上一步 / 下一步”沿流水线推进四步：输入编码 → 蓝图生成 → KVI 注入 → 联合去噪输出，观察每一步的产物。",
          "componentId": "ch8mod2"
        }
      ],
      "insight": "架构就是“两个专家 + 一个精确接口”：VLM 规划、扩散实现、KVI 接缝。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两阶段",
          "desc": "VLM 规划层级物理蓝图，扩散模型照图实现。"
        },
        {
          "icon": "🔧",
          "title": "注入点",
          "desc": "运动体素在下采样之后、中部 Transformer 之前拼接进几何序列。"
        },
        {
          "icon": "✨",
          "title": "功能先验",
          "desc": "关节类型嵌入 E_type 把 VLM 的定性判断传给定量生成。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "五金分类与两个不能省的零件",
      "badge": "trn",
      "badgeLabel": "进阶 · 机制",
      "bridge": "架构里哪些组件真的必要？这一节用关节类型词表与两组消融实验回答。",
      "analogy": {
        "title": "五金件各有归属",
        "text": "关节只有四种：<b>旋转、连续、棱柱、固定</b>。VLM 先给出类型，类型嵌入再把这条“功能先验”传递给扩散阶段。",
        "componentId": "ch9ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "四种关节与两次消融",
          "desc": "切换四种关节类型看柜门/抽屉的不同运动方式；右侧常驻消融数据：去掉类型嵌入或运动学编解码器，精度明显退化（误差越低越好）。",
          "componentId": "ch9mod1"
        }
      ],
      "insight": "关节类型嵌入是两阶段之间不可省略的桥梁：去掉它，全类别轴误差从 0.164 升到 0.292。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "四类词表",
          "desc": "revolute / continuous / prismatic / fixed，先验清晰。"
        },
        {
          "icon": "🔧",
          "title": "E_type 接口",
          "desc": "把 VLM 的定性关节判断传给定量的扩散生成。"
        },
        {
          "icon": "✨",
          "title": "消融结论",
          "desc": "去类型嵌入或独立运动学编解码器，关节精度都显著退化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "验收报告与能力边界",
      "badge": "both",
      "badgeLabel": "综合 · 结果",
      "bridge": "最后一节开箱验收：三组基准的真实数值、与基线的差距，以及这套方法的能力边界。",
      "analogy": {
        "title": "验收：开合测试",
        "text": "判断一件家具好不好，最终要<b>开一开、拉一拉</b>。PhysForge 的验收单是三组基准：零件规划、物理属性、关节参数。",
        "componentId": "ch10ana"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "结果竞速：四把尺量同一批柜子",
          "desc": "点击“开始对比”，四种方法在 Chamfer Distance（%，越低越好）上同轴竞速；可切换到全类别关节轴误差视角（越低越好）。下方表格保留论文原始数值与协议。",
          "componentId": "ch10mod1"
        }
      ],
      "insight": "结论只在协议内成立：每个数字都要带上它的数据集与指标方向。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "三项领先",
          "desc": "零件规划、物理属性、关节参数三组基准全面优于基线。"
        },
        {
          "icon": "🔧",
          "title": "能力边界",
          "desc": "依赖 TRELLIS 体素输入与 PartNet-Mobility 系关节真值；PhysDB 不标注 15 万级的精确轴向。"
        },
        {
          "icon": "✨",
          "title": "落地应用",
          "desc": "RoboTwin 机器人操作、Unity/UE 导入、自然语言查询蓝图（均为定性展示）。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1yAkUYWECi",
      "title": "单图/多视角图片生成3D模型工具整合包TRELLIS",
      "reason": "上手 TRELLIS——PhysForge 的几何骨干与体素来源；播放量低于 1 万但主题独一无二，按例外收录。",
      "cover": "https://i0.hdslb.com/bfs/archive/e397c55d756f99766af85a8b1b3c4ec688faff79.jpg",
      "views": "6550播放"
    },
    {
      "bvid": "BV1zT7D6HEsG",
      "title": "[ICRA2026] 分完部件了，马上动起来？机器人的玩具工厂来了",
      "reason": "关节化资产生成的近年代表工作，帮助理解“分件之后如何动起来”；低播放但高度相关，按例外收录。",
      "cover": "https://i0.hdslb.com/bfs/archive/43ed2d6c7c229df59cf123875177422904c52bee.jpg",
      "views": "2502播放"
    },
    {
      "bvid": "BV1nZgPzxEQE",
      "title": "南洋理工大学！PhysX：高逼真的3D物理属性具身智能数据集生成",
      "reason": "PhysX 物理属性数据集方向，与本文 PhysDB 互为参照；低播放但主题直接相关，按例外收录。",
      "cover": "https://i0.hdslb.com/bfs/archive/775b2f72ae7b8ce9977fbcb600e91498464c2fa2.jpg",
      "views": "1190播放"
    },
    {
      "bvid": "BV1FrfcBnEWX",
      "title": "单图生成仿真级3D资产，PhysX-Anything攻克具身智能物理交互的最后里程碑",
      "reason": "PhysX-Anything 是本文引用的同方向工作（单图→可仿真资产）；低播放但独一无二，按例外收录。",
      "cover": "https://i2.hdslb.com/bfs/archive/5bc904ae279e19c75c264aa1df3563994038dee3.jpg",
      "views": "344播放"
    }
  ]
};
