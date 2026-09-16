import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "TrackCraft3R: Repurposing Video Diffusion Transformers for Dense 3D Tracking",
    "titleZh": "TrackCraft3R：把视频扩散 Transformer 改造成稠密 3D 跟踪器",
    "venue": "arXiv 2605.12587 · 2026",
    "authors": "Jisu Nam, Jahyeok Koo, Soowon Son, Jaewoo Jung, Honggyu An, Junhwa Hur, Seungryong Kim",
    "affiliation": "KAIST AI · Google DeepMind",
    "domain": "3D 视觉 · 视频扩散模型 · 稠密跟踪",
    "coreProblem": "每帧的 3D 几何已经唾手可得，但『第一帧的每个点后来去了哪』仍缺一个参考锚定的对应关系——帧锚定的视频 DiT 天生不会回答这个问题。",
    "coreInsight": "把已经学会『真实视频如何随时间变化』的视频扩散 Transformer 重新组织成一个前向稠密 3D 跟踪器：<b>双潜变量</b>告诉它「追谁」，<b>时间 RoPE</b> 告诉它「追到什么时候」。",
    "keywords": [
      "稠密 3D 跟踪",
      "视频 DiT",
      "点图",
      "时间 RoPE",
      "LoRA"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>迭代/链式跟踪</b>：6 步迭代细化 + 4D 相关特征，从零训练、误差逐步累积；12 帧推理 5.00 s、峰值显存 35.46 GB（DELTAv2，A6000·448²）。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>TrackCraft3R</b>：第一帧锚定双潜变量 + 时间 RoPE，把逐帧生成范式改造成参考锚定跟踪；单步前向输出稠密 3D 轨迹与可见性，12 帧 3.91 s、7.63 GB。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "画面在动，狗没动",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "问题起点：先看清『画面在动，狗没动』——为什么必须进入 3D 世界坐标系，跟踪才成立。",
      "analogy": {
        "title": "晃动的镜头",
        "text": "手持相机左右平移，取景框里安静坐着的小狗一路\"滑\"过画面——<b>它在画面里的位置变了，它在房间里的位置没变</b>。",
        "componentId": "ch1-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "镜头 vs 狗：谁在动？",
          "desc": "拖动相机，或让小狗自己走动，分别观察<b>画面坐标 (u,v)</b> 与<b>世界坐标 (X,Z)</b> 的读数：只有后者才代表真实运动。",
          "componentId": "ch1-ego"
        }
      ],
      "insight": "要追踪真实运动，必须进入相机运动被消去的<b>世界坐标系</b>——这正是稠密 3D 跟踪的出发点。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "画面运动 = 相机自运动 + 物体运动",
          "desc": "单看画面，分不清是镜头在晃还是小狗在走。"
        },
        {
          "icon": "🔧",
          "title": "世界坐标系里相机运动被消去",
          "desc": "只剩物体真实运动。"
        },
        {
          "icon": "✨",
          "title": "TrackCraft3R 全程在世界坐标系中跟踪",
          "desc": "跟踪的对象永远是第一帧的每个点。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "一个像素的 3D 地址",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "输入从哪来：一个像素 + 深度 + 相机位姿，如何抬升成世界坐标系里的 3D 点，拼成论文的输入——帧锚定重建点图。",
      "analogy": {
        "title": "对焦测距",
        "text": "半按快门对焦，相机测出小狗离你 3.2 米——<b>一个像素加上深度，才落成空间里的一点</b>。",
        "componentId": "ch2-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "像素 → 射线 → 3D 点",
          "desc": "点击画面任选一个像素，再拖动<b>深度</b>滑条：3D 点沿射线滑动；切换<b>相机位姿</b>观察同一点在相机系与世界系中的两种地址。",
          "componentId": "ch2-pixelray"
        }
      ],
      "formula": {
        "lead": "把每一帧的每个像素都这样\"抬升\"，就得到论文的输入——帧锚定重建点图：",
        "unicode": "Pⱼ(tⱼ) ∈ ℝᴴˣᵂˣ³",
        "symbols": [
          {
            "sym": "Pⱼ(tⱼ)",
            "desc": "第 j 帧内容在其自身时刻 tⱼ 的逐像素 3D 位置（世界坐标系）"
          },
          {
            "sym": "ℝᴴˣᵂˣ³",
            "desc": "H×W×3：图像高×宽，逐像素存 3 个坐标分量"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "深度 + 内参把像素变成一条射线",
          "desc": "像素只锁定方向，深度决定这一点落在多远。"
        },
        {
          "icon": "🔧",
          "title": "相机位姿把相机系坐标变换进共享世界系",
          "desc": "同一个 3D 点从此有了统一的地址。"
        },
        {
          "icon": "✨",
          "title": "重建点图可直接来自 ViPE / DA3 等基础模型或真值",
          "desc": "逐帧几何是现成的输入，论文直接消费它。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "知道每帧 3D，还不会跟踪",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "全文的关键顿悟点：知道每帧的 3D 位置还不等于会跟踪——缺的是『谁对应谁』的对应关系。",
      "analogy": {
        "title": "盖记号章",
        "text": "开拍前给小狗鼻尖盖一枚绿色记号章——之后每一帧，我们都只认<b>这枚章所在的那只鼻子</b>。",
        "componentId": "ch3-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "谁是谁？亲手连一次",
          "desc": "第一帧的绿点在小狗鼻子上。拖动它到<b>下一帧</b>你认为的同一物理点：狗挪了位置，沙发后还躲进来一只猫。",
          "componentId": "ch3-match"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "两种点图",
          "desc": "步进时间轴 t₀→t₃，对比<b>重建点图 Pⱼ(tⱼ)</b> 与<b>跟踪点图 P₀(tⱼ)</b>：前者不断纳入新进画面的内容，后者永远只描述第一帧那批点。",
          "componentId": "ch3-pointmaps"
        }
      ],
      "insight": "每帧 3D 只回答『在哪里』，不回答<b>『谁对应谁』</b>——对应关系（correspondence）才是跟踪的核心难题。",
      "formula": {
        "lead": "论文要预测的目标由此定义为参考锚定的跟踪点图：",
        "unicode": "P₀(tⱼ) ∈ ℝᴴˣᵂˣ³　　oⱼ ∈ [0,1]ᴴˣᵂ",
        "symbols": [
          {
            "sym": "P₀(tⱼ)",
            "desc": "第一帧内容在时刻 tⱼ 的逐像素 3D 位置（参考下标恒为 0）"
          },
          {
            "sym": "oⱼ",
            "desc": "每个被跟踪点在 tⱼ 是否可见"
          },
          {
            "sym": "[0,1]ᴴˣᵂ",
            "desc": "可见性图覆盖 H×W 个第一帧点，取值 0–1"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "重建点图 ≠ 跟踪点图",
          "desc": "一个回答『现在看见什么』，一个回答『第一帧的点在哪』。"
        },
        {
          "icon": "🔧",
          "title": "参考锚定让第一帧每个点保持身份",
          "desc": "P₀(tⱼ) 的参考下标恒为 0。"
        },
        {
          "icon": "✨",
          "title": "被遮挡时身份仍在",
          "desc": "只是可见性 o=0。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "残差与可见性",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "进入模型之前，先把输出数学定下来：模型学的是相对第一帧的残差位移 Δⱼ 与可见性 oⱼ，而不是绝对位置。",
      "analogy": {
        "title": "只记位移",
        "text": "在记事本上，你不重抄整张地图，只记『记号向左 0.3 米、向前 0.2 米』——<b>没动的点一行零</b>。",
        "componentId": "ch4-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "残差记录器",
          "desc": "切换三种情形——<b>静态点 / 运动点 / 被沙发挡住</b>——观察 Δⱼ、P̂₀(tⱼ) = P₀(t₀) + Δ̂ⱼ 与可见性 oⱼ 如何联动。",
          "componentId": "ch4-residual"
        }
      ],
      "formula": {
        "lead": "论文的两条核心输出公式（原文 Eq.5 与 Eq.7）：",
        "unicode": "Δⱼ = P₀(tⱼ) − P₀(t₀)　　P̂₀(tⱼ) = P₀(t₀) + Δ̂ⱼ",
        "symbols": [
          {
            "sym": "Δⱼ",
            "desc": "相对第一帧的位移残差（归一化点图空间）"
          },
          {
            "sym": "P₀(t₀)",
            "desc": "第一帧的锚定位置，残差的基准"
          },
          {
            "sym": "Δ̂ⱼ",
            "desc": "模型预测的残差"
          },
          {
            "sym": "P̂₀(tⱼ)",
            "desc": "恢复出的跟踪点图"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "残差让静态区域的目标恒为 0",
          "desc": "没动的点一行零，训练目标更简单。"
        },
        {
          "icon": "🔧",
          "title": "消融：去残差 AJ 0.5609→0.5007",
          "desc": "APD₃D 0.6790→0.6172，去残差主要伤轨迹精度。"
        },
        {
          "icon": "✨",
          "title": "可见性与残差从输出通道的两半分别解码",
          "desc": "前一半给残差轨迹，后一半给可见性。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "帧锚定生成器 vs 参考锚定跟踪",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "上一节把输出写成了『残差 + 可见性』，本节直面真正的范式矛盾：视频 DiT 天生<b>帧锚定</b>，每帧重画『现在看见什么』；而跟踪要的是<b>参考锚定</b>，只认第一帧的点。论文的第一个关键设计——<b>时间 RoPE</b>——就是跨越这道鸿沟的桥。",
      "analogy": {
        "title": "喊时间",
        "text": "摄影师每喊一次『第 3 秒！』，跟拍助手就知道该翻到哪一帧去找记号——<b>查询要带时间标签</b>。",
        "componentId": "ch5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "两种锚定，同屏对比",
          "desc": "按下共同的播放键：上面板按<b>帧锚定</b>逐帧重画『现在看见的房间』（蓝点=当前内容点：狗鼻、沙发靠背，t₂ 起还有猫），下面板按<b>参考锚定</b>只追『第一帧的绿点』——狗中途会<b>跳跃一次</b>，绿点身份不变。",
          "componentId": "ch5-anchordiff"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "时间地址标签（RoPE）",
          "desc": "切换 <b>RoPE 对齐 开/关</b>：开——每个 rⱼ 带 tⱼ 标签，注意力条正确压在 gⱼ 上；关——全部贴 t₀，注意力散落一排 g 上。",
          "componentId": "ch5-ropeswitch"
        }
      ],
      "insight": "生成范式天生回答『第 j 帧该是什么』；跟踪要回答『第一帧这个点在 tⱼ 去了哪』——论文用<b>时间 RoPE</b> 给每个查询盖上目标时刻。",
      "formula": {
        "lead": "RoPE 的相对位置性质（原文 Eq.1）——注意力得分只依赖两个 token 的位置差：",
        "unicode": "q̃ᵢᵀk̃ⱼ = qᵢᵀ R(θ(pⱼ−pᵢ)) kⱼ",
        "symbols": [
          {
            "sym": "q̃ᵢᵀk̃ⱼ",
            "desc": "旋转后的查询/键向量的内积，即注意力得分"
          },
          {
            "sym": "R(θ(pⱼ−pᵢ))",
            "desc": "按位置差构造的分块旋转矩阵"
          },
          {
            "sym": "pᵢ",
            "desc": "token 的 3D 位置 pᵢ=(xᵢ,yᵢ,tᵢ)（含时间轴）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "生成范式 = 帧锚定，跟踪 = 参考锚定",
          "desc": "两种表示拥有不同的内容集合：前者每帧重画『现在看见什么』，后者永远只认第一帧那批点——新进画面的猫只属于前者。"
        },
        {
          "icon": "🔧",
          "title": "RoPE 相对性：相同时间标签互相强注意",
          "desc": "注意力得分只依赖两个 token 的位置差（Eq.1）——rⱼ 与 gⱼ 同贴 tⱼ，便会互相强注意。"
        },
        {
          "icon": "✨",
          "title": "消融：去时间 RoPE，AJ 0.5609→0.4450（四个组件中最大降幅）",
          "desc": "时间对齐一旦丢失，查询不知道该看哪一帧；论文测得约 29% 注意力集中在时间对齐帧（PStudio）。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "双潜变量：告诉模型「追谁」",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "时间 RoPE 回答了『追到什么时候』，本节补上另一半：<b>模型读什么、问什么</b>。几何潜变量 gⱼ 把每帧的外观与几何逐位置拼在一起，跟踪潜变量 rⱼ 把第一帧复印到所有时刻当稠密查询——<b>双潜变量</b>由此组装完成。",
      "analogy": {
        "title": "记号卡复印",
        "text": "一张绿色记号卡沿胶片条一路盖下去，每一格都得到<b>同一枚记号</b>——内容不变，位置随格递进。",
        "componentId": "ch6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "拼接与复印",
          "desc": "步进四步：①RGB 潜变量 ②并入点图潜变量（通道拼接 c→2c，token 数不变）③g₀ 复印成 r₀…rF ④全部送入 DiT 的全 3D 注意力。",
          "componentId": "ch6-duallatent"
        }
      ],
      "insight": "RGB 潜变量负责『认出是谁』，匹配到的点图潜变量直接给出『它在哪里』的 3D 位置。",
      "formula": {
        "lead": "原文 Eq.3，两条定义一并给出：",
        "unicode": "gⱼ = [zʳᵍᵇⱼ ; zᵖᵐⱼ] ∈ ℝʰˣʷˣ²ᶜ　　rⱼ = g₀",
        "symbols": [
          {
            "sym": "gⱼ",
            "desc": "第 j 帧的几何潜变量：RGB 与点图潜变量按通道拼接"
          },
          {
            "sym": "zʳᵍᵇⱼ",
            "desc": "第 j 帧 RGB 潜变量（h×w×c）——『认出是谁』的线索"
          },
          {
            "sym": "zᵖᵐⱼ",
            "desc": "第 j 帧点图潜变量（h×w×c）——『它在哪里』的几何"
          },
          {
            "sym": "ℝʰˣʷˣ²ᶜ",
            "desc": "拼接后的潜变量形状：通道 c→2c 翻倍，token 数不变"
          },
          {
            "sym": "rⱼ",
            "desc": "第一帧锚定的跟踪潜变量（稠密查询）：rⱼ = g₀ 复印到所有时刻"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "通道拼接让外观与几何逐位置绑定，token 数不变",
          "desc": "拼接发生在通道维（c→2c）：潜变量 tile 变宽，而不是变多，每帧空间分辨率完整保留。"
        },
        {
          "icon": "🔧",
          "title": "rⱼ = g₀：第一帧内容复印到所有时刻当稠密查询",
          "desc": "跟踪潜变量不随时间更新内容，只携带『追谁』的参考身份。"
        },
        {
          "icon": "✨",
          "title": "匹配一旦发生，对应位置的点图潜变量即读出 3D 坐标",
          "desc": "RGB 潜变量负责『认出是谁』，匹配到的点图潜变量直接给出『它在哪里』。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "一步到位的微调",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "双潜变量已经告诉模型『追谁』，这一节解决『怎么教会它』：<b>扩散步固定为 0、文本提示置空</b>，视频 DiT 变成一步回归器；再用 <b>LoRA 微调</b>与两阶段训练，低成本完成改造。",
      "analogy": {
        "title": "反复陪练",
        "text": "小狗沿同一条路线反复练习，越跑越稳——<b>微调不换狗，只练路线</b>。",
        "componentId": "ch7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "训练台",
          "desc": "切换 <b>LoRA 秩 64/256/1024</b> 与 <b>VAE 微调 开/关</b>，观察 AJ 柱与损失构成（残差 MSE + 0.1·可见性 BCE）联动。骨干：Wan 2.1-T2V（仓库 README：1.3B），两阶段先冻结 VAE 再解冻。",
          "componentId": "ch7-lora"
        }
      ],
      "formula": {
        "lead": "训练目标（原文 §5.1）：",
        "unicode": "L = ‖Δ̂ⱼ − Δⱼ‖² + 0.1 · BCE(ôⱼ, oⱼ)",
        "symbols": [
          {
            "sym": "Δ̂ⱼ",
            "desc": "模型预测的残差（归一化点图空间）"
          },
          {
            "sym": "Δⱼ",
            "desc": "真值残差（归一化点图空间）"
          },
          {
            "sym": "ôⱼ",
            "desc": "预测可见性"
          },
          {
            "sym": "oⱼ",
            "desc": "真值可见性"
          },
          {
            "sym": "0.1",
            "desc": "可见性损失权重"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "固定扩散步为 0 + 空文本提示",
          "desc": "生成器变一步回归器"
        },
        {
          "icon": "🔧",
          "title": "预训练先验关键",
          "desc": "随机初始化 AJ 0.4698 vs 预训练 0.5639"
        },
        {
          "icon": "✨",
          "title": "两阶段训练",
          "desc": "先冻结 VAE 练 DiT，再解冻 VAE 端到端"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一次前向的完整旅程",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "零件备齐，连成整机：两个 VAE 编码器 → 通道拼接 → token 拼接 → 30 块 DiT 全 3D 注意力（含<b>时间 RoPE</b>）→ 输出对半 → 双解码器。点击任一部件，走一遍<b>一次前向的完整旅程</b>，再看深层注意力如何锁定同一个物理点。",
      "analogy": {
        "title": "出包检查",
        "text": "开拍前用放大镜逐件检查跟拍装备——<b>每查一件亮一件</b>，全部点亮才敢出门。",
        "componentId": "ch8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "交互架构图",
          "desc": "点击通路上的任一部件：高亮该部件与激活路径，详情区给出张量形状与设计理由。可切换 <b>输入：RGB+点图</b> 到 <b>输出：残差+可见性</b> 的完整数据流。",
          "componentId": "ch8-arch",
          "figure": "/images/figure-1.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "逐层注意力",
          "desc": "步进 Layer 14 → 15 → 16：热斑从第一帧旧位置逐步移到运动后的同一物理点（小狗鼻子），对应论文图 3(b)。右下角证据：时间对齐的 g₅ 分得约 29% 注意力。",
          "componentId": "ch8-layers",
          "figure": "/images/figure-3.png"
        }
      ],
      "formula": {
        "lead": "整机一次前向（原文 Eq.4）：",
        "unicode": "{r̂ⱼ} = f([gⱼ], [rⱼ])",
        "symbols": [
          {
            "sym": "r̂ⱼ",
            "desc": "跟踪潜变量对应的输出"
          },
          {
            "sym": "f",
            "desc": "视频 DiT（一步前向，扩散步固定 0；输入沿 token 序列维拼接）"
          },
          {
            "sym": "gⱼ",
            "desc": "几何潜变量（RGB 与点图潜变量按通道拼接）"
          },
          {
            "sym": "rⱼ",
            "desc": "第一帧锚定的跟踪潜变量（稠密查询）"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "30 块 DiT 全 3D 注意力",
          "desc": "跨帧跨位置自由匹配"
        },
        {
          "icon": "🔧",
          "title": "输出通道对半分",
          "desc": "残差轨迹与可见性各走一个解码器"
        },
        {
          "icon": "✨",
          "title": "深层注意力可解释地锁定同一物理点",
          "desc": "Fig.3 / 附录 29%"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "更长的视频，更大的动作",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "训练只用 12 帧短片，真实素材却长得多、动作也更大——本章给出两个实用机制：<b>锚定滑窗</b>把长视频拆成多段前向、输出天然一致，<b>跨步采样训练</b>换来对大帧间运动的稳健性。",
      "analogy": {
        "title": "分段回放",
        "text": "长素材在时间线上分段回放，但每一段的角上都<b>钉着同一张第一帧缩略图</b>当锚。",
        "componentId": "ch9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "步长采样与复杂度",
          "desc": "给定 100 帧素材：<b>TrackCraft3R</b> 锚定第 1 帧、按<b>步长 s</b> 采样取块（绿色块，切换 s 看块数变化；橙色锚点帧在每次前向中都携带）；<b>DELTAv2</b> 则逐个滑窗依序处理、每窗 6 步迭代（红色窗口）。下方为计算配方对比。",
          "componentId": "ch9-stride",
          "figure": "/images/figure-5.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "接力 vs 锚定",
          "desc": "选择片段长度 L=24/60/120，按下共同起点：上<b>链式</b>一棒传一棒、误差越滚越大（红，漂移幅度为示意），下<b>锚定直查</b>每段都从第一帧出发（绿）。狗中途会<b>向上跳一下</b>——链式起跳时丢准、之后继续漂移，锚定紧跟又落回。段数 s=(L−1)/11。",
          "componentId": "ch9-longvideo"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "切步长采样",
          "desc": "一次前向 12 帧（锚点恒在），步长 1→12 都稳健（图 5）"
        },
        {
          "icon": "🔧",
          "title": "单步前向",
          "desc": "1 次前向 + 1/16 潜空间注意力 vs 6 步迭代 + 4D 相关"
        },
        {
          "icon": "✨",
          "title": "滑窗分段",
          "desc": "s=(L−1)/F 段、每段锚定第一帧，长视频输出天然一致"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "证据与边界",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "设计链讲完了，看证据：五基准平均上<b>全面领先</b>，单步前向又快又省，上限则受输入几何制约——最后用官方真实示例看它跑起来的样子。",
      "analogy": {
        "title": "评片",
        "text": "灯箱上两卷素材同时回放：左卷（红标）是<b>旧方法</b>的跟踪结果，轨迹越放越歪；右卷（绿标）是<b>本文方法</b>，轨迹始终贴着虚线真实路径——<b>评的是证据，不是感觉</b>。",
        "componentId": "ch10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "基准对比",
          "desc": "切换指标，<b>柱状图</b>与下方表格即时更新；方向（越高/越低越好）与测量条件随图标注，所有数字均来自论文 Table 1 与 Table 6。",
          "componentId": "ch10-race",
          "figure": "/images/figure-4.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "真实演示",
          "desc": "三个<b>官方示例</b>（素材取自项目页）：<b>大位移 / 遮挡 / 相机运动</b>——切换观看稠密 3D 轨迹与可见性在真实视频上的表现。",
          "componentId": "ch10-demos"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "全面领先",
          "desc": "平均 AJ 0.564（+ViPE）/ 0.679（+DA3），全面领先最强基线"
        },
        {
          "icon": "🔧",
          "title": "又快又省",
          "desc": "12 帧推理 3.91 s、7.63 GB：快 1.3×、省 4.6× 显存"
        },
        {
          "icon": "✨",
          "title": "输入几何上限",
          "desc": "上限受输入几何制约：GT 几何 AJ 0.6005→0.7649（合成集平均）；更强 3D 基础模型可直接带来提升"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1qu4y1M7J4",
      "title": "跟踪一切！密集光流跟踪(DOT)：同时跟踪所有像素！又快又好！",
      "reason": "DOT「跟踪一切像素」——与本文稠密跟踪任务最接近的姊妹工作，中文讲解",
      "cover": "https://i1.hdslb.com/bfs/archive/2fc2ce52a9c5c23bcf299de9bfda976a262ed5a8.jpg",
      "views": "4.7万播放"
    },
    {
      "bvid": "BV1VvwuzMEmP",
      "title": "不用算相似度，照样追得准！CoWTracker：统一密集跟踪与光流，斩获零样本光流SOTA！",
      "reason": "CoWTracker：统一密集跟踪与光流——密集对应关系的另一视角",
      "cover": "https://i2.hdslb.com/bfs/archive/9c375dacbd09671adc2b75ad73c533c8c1c7281b.jpg",
      "views": "2.9万播放"
    },
    {
      "bvid": "BV1CH4y1979H",
      "title": "NeurIPS 2023 扩散模型对光流和单目深度估计的惊人有效性！",
      "reason": "扩散模型用于光流/深度估计——「扩散先验服务感知」与本文动机同源",
      "cover": "https://i1.hdslb.com/bfs/archive/ea584368adeaea373d145fa101d17069bc5e891b.jpg",
      "views": "3.2万播放"
    },
    {
      "bvid": "BV1m7KJzPE9W",
      "title": "【计算机视觉实战】基于OpenCV+Python实现光流估计项目解析",
      "reason": "OpenCV 光流实战入门——第 1 章「画面运动」概念的最基础背景",
      "cover": "https://i1.hdslb.com/bfs/archive/2e1f42836e03cdc289596a03913f7b87571af241.jpg",
      "views": "66万播放"
    }
  ]
};
