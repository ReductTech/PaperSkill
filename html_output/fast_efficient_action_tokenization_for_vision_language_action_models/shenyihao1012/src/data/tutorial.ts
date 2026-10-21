import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "FAST: Efficient Action Tokenization for Vision-Language-Action Models",
    "titleZh": "FAST：面向视觉-语言-动作模型的高效动作 token 化",
    "venue": "arXiv 2501.09747 · 2025",
    "authors": "Karl Pertsch*, Kyle Stachowicz*, Brian Ichter, Danny Driess, Suraj Nair, Quan Vuong, Oier Mees, Chelsea Finn, Sergey Levine",
    "affiliation": "Physical Intelligence · UC Berkeley · Stanford",
    "domain": "具身智能 · 动作 token 化 · 压缩",
    "coreProblem": "自回归 VLA 需要把连续动作变成离散 token；逐维逐拍分箱（RT-2/OpenVLA）在高频灵巧数据上彻底失败——相邻 token 高度冗余，边际信息趋零。",
    "coreInsight": "高频动作满箱冗余，<b>先压缩再装箱</b>：DCT 压缩袋抽走空气、BPE 收纳袋合并小件——<b>一臂恒约 30 件高信息行李</b>；π0-FAST 以此追平扩散 π0，<b>训练算力省 5×</b>。",
    "keywords": [
      "动作 token 化",
      "DCT",
      "BPE",
      "压缩",
      "自回归 VLA"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "<b>naive 分箱（RT-2 / OpenVLA）</b>：每拍每维一件行李直接硬塞，高频下相邻趋同、边际信息归零——箱子爆开，20/50Hz 任务零进展。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "<b>FAST / π0-FAST</b>：DCT 压缩袋 + BPE 收纳袋，一臂恒约 30 件高信息行李——π0-FAST 追平扩散 π0，训练算力只需 1/5。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "硬塞行李箱的失败",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "为什么一到高频灵巧任务，最强的 VLA 也会失灵？先从最朴素的记录方式——逐维逐拍分箱说起：它崩得最早，也崩得最彻底。",
      "analogy": {
        "title": "塞爆的行李箱",
        "text": "出行七天带了一堆几乎一样的衣服——<b>不折不压直接塞</b>，箱子当场爆开，衣服还皱皱巴巴。",
        "componentId": "ch1-analogy"
      },
      "insight": "高频数据下逐维逐拍分箱彻底失效：采样率越高、相邻 token 越像，模型最终照搬第一件行李。",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "采样率试验台",
          "desc": "拖动<b>采样率</b>滑条（25→800，对应控制频率 5→50Hz 量级）：上方目标曲线（四点样条）不变，但<b>逐件行李清单</b>越来越密（token 数=采样率×维度）；下方「学徒装箱」输出——低频时大致跟上，高频时输出摊平成<b>照搬第一件</b>的水平线（红），预测误差数字同步飙升。",
          "componentId": "ch1-rate"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "数据没变难",
          "desc": "是记录方式拖了后腿"
        },
        {
          "icon": "🔧",
          "title": "相邻趋同",
          "desc": "采样率越高 token 越像"
        },
        {
          "icon": "✨",
          "title": "照搬第一件",
          "desc": "逐件硬塞的终局"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "冗余的病根",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "上一节的崩溃不是意外。逐件硬塞把冗余也一并写下，而自回归真正吃的，是每个 token 的边际信息——本节把病根摊开看。",
      "analogy": {
        "title": "同款 T 恤堆",
        "text": "再塞一件同款 T 恤，箱子里<b>没有增加任何新信息</b>——冗余把行李的价值稀释殆尽。",
        "componentId": "ch2-analogy"
      },
      "insight": "自回归的学习信号=每个 token 的边际信息；高频平滑信号边际信息→0。",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "边际信息三视图",
          "desc": "切换三档查看<b>边际信息</b>如何随采样率塌缩：<b>差值直方图</b>（相邻 token 差的分布：低频宽、高频挤向 0）、<b>作弊解</b>（『照搬上一件』的损失曲线 vs 真学的损失曲线，高频时两者重合）、<b>现实病例</b>（OpenVLA 适配低频 BridgeV2/RT-1，却难以拟合高频 DROID）。",
          "componentId": "ch2-marginal"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "边际信息",
          "desc": "学习信号的天花板"
        },
        {
          "icon": "🔧",
          "title": "高频→0",
          "desc": "平滑信号相邻趋同"
        },
        {
          "icon": "✨",
          "title": "OpenVLA 病例",
          "desc": "高频 DROID 拟不动"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先压缩，再记录",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "病根看清了，药方也就浮出水面：像文本用 BPE 那样先压缩、再记录——把冗余挤掉，让每个 token 都携带新信息。",
      "analogy": {
        "title": "塞 vs 压缩打包",
        "text": "文本世界早有答案：<b>词组合并</b>。一箱衣服——需要属于它的<b>压缩打包术</b>。",
        "componentId": "ch3-analogy"
      },
      "insight": "洞察：动作信号必须先压缩，把冗余挤掉、让每个 token 都携带新信息；文本用 BPE，连续信号要用连续压缩。",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "同钟对比",
          "desc": "按下共同开始：同一段 1 秒动作（波形展示），上<b>硬塞路线</b>：波形逐拍打格子→满箱衣物（计数飙升到 700，红）；下<b>压缩路线</b>：波形折叠成一列频域条→少数衣物卷（计数停在 ~53，绿）。两端计数徽章实时对比。",
          "componentId": "ch3-compare"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "冗余是敌人",
          "desc": "高频=高度相关"
        },
        {
          "icon": "🔧",
          "title": "压缩=信息密化",
          "desc": "每 token 都带新信息"
        },
        {
          "icon": "✨",
          "title": "文本的启发",
          "desc": "BPE 之于文字，DCT 之于动作"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "真空压缩袋的轮廓",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "压缩从哪下手？DCT 把时域动作拆成频率：少数低频系数扛住整体形状，高频只管细节——这就是 FAST 的第一记。",
      "analogy": {
        "title": "真空压缩袋",
        "text": "抽气——<b>大件先压扁</b>（低频），小件最后塞（高频）。一袋衣服变成一片紧实。",
        "componentId": "ch4-analogy"
      },
      "insight": "DCT 把时域动作变频率：低频=整体形状、高频=细节抖动；量化 γ 控精度-压缩权衡。",
      "formula": {
        "lead": "DCT 把动作表示成余弦和——",
        "unicode": "Cⱼ = DCT(a₁:H)，低频 = 整体形状，高频 = 细节",
        "symbols": [
          {
            "sym": "Cⱼ",
            "desc": "第 j 个频率分量"
          },
          {
            "sym": "a₁:H",
            "desc": "H 步动作块"
          }
        ]
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "频段与量化 γ",
          "desc": "切换<b>频段</b>{仅低频|低+中|全频}看重建曲线贴合度（低频已抓主旨、加中频更准、全频近乎重合）；再拖<b>量化 γ</b>（1..20，默认 10）看频域条从连续变阶梯、重建误差微变——论文实测两超参均不敏感。",
          "componentId": "ch4-dct"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "低频=主旨",
          "desc": "几个系数扛住整条曲线"
        },
        {
          "icon": "🔧",
          "title": "量化 γ=10",
          "desc": "精度-压缩的旋钮"
        },
        {
          "icon": "✨",
          "title": "两超参不敏感",
          "desc": "一套默认走天下"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "打包五步法",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "上一节的压缩袋压好了整体轮廓，本节把五道工序串成完整流水线——从连续动作块到一串稠密 token，一步不缺、全程可逆。",
      "insight": "FAST 完整算法：分位归一→DCT→量化→低频优先展开→BPE；全程可逆。",
      "analogy": {
        "title": "打包五步法",
        "text": "<b>分堆、压缩、抽气、大件打底、收纳袋</b>——五步全可逆，到店开箱原样还原。",
        "componentId": "ch5-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "流水线五站",
          "desc": "步进 FAST 五站：<b>①分位归一</b>（1%-99% 分位 → [-1,1]，抗离群、跨本体等音量）→ <b>②DCT</b>（每维独立变换）→ <b>③量化</b>（γ·C 再取整，稀疏矩阵大量为 0）→ <b>④低频优先展开</b>（列优先：所有维的低频排前——自回归先猜主旨，rollout 更稳）→ <b>⑤BPE</b>（词表 1024，无损压成稠密 token）。每站画布高亮当前工序（输入→输出小图流转）。",
          "componentId": "ch5-pipeline",
          "figure": "./images/figure-4.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "五步流水线",
          "desc": "归一→DCT→量化→展开→BPE"
        },
        {
          "icon": "🔧",
          "title": "低频优先",
          "desc": "先主旨后细节，rollout 更稳"
        },
        {
          "icon": "✨",
          "title": "全程可逆",
          "desc": "解码原路返回"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "收纳袋合并",
      "badge": "inf",
      "badgeLabel": "人人必读",
      "bridge": "流水线最后一站为什么偏偏是 BPE？本节把镜头拉近：看高频数字对如何被逐轮合并成一个符号，以及少了它会在哪里输掉。",
      "insight": "BPE 把稀疏整数串（大量 0）无损压成稠密 token；没有它，零 token 稀释信号、拖慢推理。",
      "analogy": {
        "title": "袜子卷起来",
        "text": "散袜子一只只<b>卷成一卷</b>塞进收纳袋——重复小物合并成一件行李。",
        "componentId": "ch6-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "BPE 合并步进",
          "desc": "步进 BPE 合并：稀疏整数串（长，多 0）→ 高频相邻对逐轮合并（圈出+替换）→ 稠密短串；旁注对照「去 BPE 消融：仍胜硬塞但 rollout 更差、推理更慢」。",
          "componentId": "ch6-bpe"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "无损压缩",
          "desc": "高频对合并成符号"
        },
        {
          "icon": "🔧",
          "title": "唯一学习件",
          "desc": "词表训练只要几分钟"
        },
        {
          "icon": "✨",
          "title": "消融背书",
          "desc": "去 BPE 明显掉队"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "万能收纳术",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "上一节练成了收纳袋合并的功夫；这一节直接发书——在 1M 段真实动作上练好的 FAST+ 万能 tokenizer，三行代码，任何行程开工。",
      "insight": "FAST+ 在 100 万段真实 1 秒动作块（单臂/双臂/移动、关节/EEF、多种频率）上训练；黑盒即用、三行代码；跨未见数据一律 ≥2× 压缩。",
      "analogy": {
        "title": "万能收纳术",
        "text": "在<b>一百万次</b>打包经验中练成的收纳手册——<b>任何行程</b>翻开就用，不必重学。",
        "componentId": "ch7-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "FAST+ 万能 tokenizer 开箱",
          "desc": "点击收纳手册的三个部位：<b>训练食谱</b>（1M 段 1 秒块；单臂/双臂/移动；关节与 EEF 控制；多种频率）、<b>三行代码</b>（HuggingFace AutoProcessor：physical-intelligence/fast，trust_remote_code；tokenizer(action_chunk)；fit() 几分钟重训新数据）、<b>通用战绩</b>（未见数据一律 ≥2× 压缩：SERL/T-DROID/UMI/NYU Hand/Humanplus 人形/Waymo 导航…）。固定 .hotspot-info 详情区硬塞展示三段内容。",
          "componentId": "ch7-fastplus",
          "figure": "./images/figure-8.png"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "1M 段真数据",
          "desc": "跨本体跨频率"
        },
        {
          "icon": "🔧",
          "title": "三行代码",
          "desc": "AutoProcessor 黑盒即用"
        },
        {
          "icon": "✨",
          "title": "未见也 ≥2×",
          "desc": "从臂到人形到导航"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "压缩战绩榜",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "万能本到底省多少纸？Table I 四个行程实测排成战绩榜——频率越高压得越狠，而每臂恒约 30 token；再看 γ 旋钮为何默认 10 就够。",
      "insight": "Table I：频率越高压得越狠（1.75×→13.2×）；每臂恒约 30 token 与频率无关；γ 权衡曲线。",
      "analogy": {
        "title": "省箱榜",
        "text": "行程越长（频率越高），压缩袋省得越多——<b>超长行程省下 92% 的箱子</b>。",
        "componentId": "ch8-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "Table I 四行程对比",
          "desc": "切换 chips：<b>BridgeV2 5Hz · DROID 15Hz · Bussing 20Hz · ShirtFold 50Hz · 全部</b>——每组双柱对比 naive 与 FAST 的 token 数，配压缩比徽章（1.75 / 3.6 / 5.0 / 13.2×）与「每臂 ~30 token 恒定」注记线；表格数字即证据。",
          "componentId": "ch8-table"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "γ 权衡试验台",
          "desc": "拖动 <b>量化 γ</b>（1..20，默认 10）：压缩率与重建误差联动——论文实测两端均平缓（不敏感），默认 10 落在甜点。",
          "componentId": "ch8-gamma"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "频率越高压越狠",
          "desc": "5Hz 1.75× → 50Hz 13.2×"
        },
        {
          "icon": "🔧",
          "title": "~30 token/臂",
          "desc": "与频率无关，只随复杂度"
        },
        {
          "icon": "✨",
          "title": "γ 不敏感",
          "desc": "默认 10 一套走天下"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "实战检验",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "纸面压缩比不算数——本节把 FAST 拉上三场真机赛场：20/50Hz 高频任务、换骨干重赛的 OpenVLA、完全陌生的 DROID 三校园，检验『先压缩再记录』到底扛不扛打。",
      "analogy": {
        "title": "三张旅行战报",
        "text": "超长路线全胜、换背包重赛、<b>陌生城市零攻略出发</b>——三场全胜。",
        "componentId": "ch9-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "三场实战竞技场",
          "desc": "切换芯片检阅三份战报（上方即论文图 6 的原始策略对比，柱高为示意）：<b>高频对决</b>——Bussing 20Hz / ShirtFold 50Hz 上 naive 无法取得进展，FAST 高分且 ≥ FSQ，FAST+ 通用版追平专用版；<b>换骨干</b>——OpenVLA 换上 FAST+ 后在 50Hz 叠衣上大幅提升；<b>DROID 零样本</b>——Berkeley / Stanford / U. Washington 三校园开箱即用。",
          "componentId": "ch9-arena",
          "figure": "./images/figure-6.png"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "DROID 零样本三校园",
          "desc": "步进 DROID 零样本三校园巡礼：<b>Berkeley → Stanford → U. Washington</b>——每个校园布局、桌高、任务各不相同；进入后机械臂自动依次执行该站任务（站点亮绿、右侧清单打勾）。完全未见的环境，纯语言提示。",
          "componentId": "ch9-droid"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "高频全胜",
          "desc": "naive 零进展，FAST 高分"
        },
        {
          "icon": "🔧",
          "title": "骨干无关",
          "desc": "OpenVLA 换本也回血"
        },
        {
          "icon": "✨",
          "title": "DROID 首秀",
          "desc": "三校园零样本开箱即用"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "对决与注意事项",
      "badge": "both",
      "badgeLabel": "进阶·含训练",
      "bridge": "收官之战：π0-FAST 与扩散 π0 同场对决——小数据、大数据收敛、语言跟随、算力四本账逐一清算；再把注意事项钉上墙：推理 750ms、仅固定工位——FAST 究竟快在哪、慢在哪，这里说清。",
      "analogy": {
        "title": "行前检查台",
        "text": "压缩打包与逐件手塞同场竞技——<b>质量打平，收拾快 5 倍</b>；注意事项照贴。",
        "componentId": "ch10-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "对决扩散 π0：四本账",
          "desc": "同一 π0 家族，只换动作解码（自回归 token vs 流匹配扩散）。切芯片逐项对账（上方为论文图 9，柱高为示意）：<b>小数据</b>——LIBERO / 叠衣（&lt;50h）打平；<b>大数据收敛</b>——Bussing 上 FAST 以 3× 更少步数达到高性能；<b>语言跟随</b>——DROID 上自回归版更听指令；<b>算力账</b>——GPU 时只要 1/5。",
          "componentId": "ch10-duel",
          "figure": "./images/figure-9.png"
        },
        {
          "kind": "module",
          "id": "10.2",
          "title": "叠衣画廊与三张注意事项",
          "desc": "按「下一步」走完 π0-FAST 叠衣 rollout 的<b>十个标注点</b>（图 10），分四个阶段：<b>取衣出篮 → 展平 → 折叠 → 叠放成堆</b>——每步配一句讲解；下方三张红边告示卡与官方链接。",
          "componentId": "ch10-gallery"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "质量打平",
          "desc": "含叠衣零样本追平扩散 π0"
        },
        {
          "icon": "🔧",
          "title": "训练省 5×",
          "desc": "大数据 3× 快收敛、更听话"
        },
        {
          "icon": "✨",
          "title": "两张注意事项",
          "desc": "推理 750ms；仅固定工位"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1Zeo5B1Ehi",
      "title": "【π系列EP02】动作也能\"MP3 压缩\"？FAST 用 DCT+BPE 让机器人训练快 5 倍",
      "reason": "与本论文逐节对应的中文讲解（π 系列 EP02）",
      "cover": "https://i2.hdslb.com/bfs/archive/e5ae962ee287caf84e53000d083313c827246ec9.jpg",
      "views": "3711播放"
    },
    {
      "bvid": "BV1Tga666EhF",
      "title": "用VLA策略控制机器人：Pi0.5详解（FAST、System 1/2、KI、RTC）（VLA系列第3集）",
      "reason": "FAST 在 π0.5 系统中的位置与作用",
      "cover": "https://i1.hdslb.com/bfs/archive/613e7adc3087b1e436cb0ae4855a91aa82b9661a.jpg",
      "views": "1410播放"
    },
    {
      "bvid": "BV1SEdWBXEqj",
      "title": "【π系列 EP01】π0：让一个模型控制所有机器人？Flow Matching + VLM 架构详解",
      "reason": "前作 π0 的流匹配架构背景（FAST 的对照面）",
      "cover": "https://i2.hdslb.com/bfs/archive/368f9fd8ffcca2e9548a20e72bac32e7951711ed.jpg",
      "views": "1.3万播放"
    },
    {
      "bvid": "BV1ip3b6gEip",
      "title": "π0→π0.7 全拆解：机器人大模型进化史",
      "reason": "π 家族全景（FAST 所处脉络）",
      "cover": "https://i0.hdslb.com/bfs/archive/6798a7c4ee886a96bc025958d3e421c7ba2c694d.jpg",
      "views": "7968播放"
    }
  ]
};
