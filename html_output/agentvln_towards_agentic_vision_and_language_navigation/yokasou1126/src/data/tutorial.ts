import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "AgentVLN: Towards Agentic Vision-and-Language Navigation",
    "titleZh": "AgentVLN：我认可什么，又想改什么？",
    "venue": "arXiv 预印本 · 2026 · v1",
    "authors": "Zihao Xin、Wentong Li 等",
    "affiliation": "南京航空航天大学 · 山东大学 · 浙江大学",
    "domain": "具身智能 / 视觉语言导航",
    "coreProblem": "让机器人听懂指令还不够：什么时候切换、航点怎么选、缺的信息怎么主动查？",
    "coreInsight": "先把论文的做法画清楚，再把我的肯定、批判和改进设想画进同一个场景。",
    "keywords": [
      "VLM-as-Brain",
      "跨空间映射",
      "QD-PCoT",
      "技能调度"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "我认可的：大脑与技能分工",
      "desc": "小模型负责决策，工具负责几何与执行。",
      "componentId": "museum-cover"
    },
    "newMethod": {
      "title": "我想改的：切换与主动感知",
      "desc": "目标已经看见，但路真能走通吗？",
      "componentId": "museum-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "论文做对了什么",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "机器人怎么从听指令走到目标？",
          "desc": "大脑理解指令和选技能；感知准备几何，规划执行一段，再把新观察交回来。",
          "componentId": "system-overview"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "为什么不用每走一步都问大模型？",
          "desc": "高层控制器决定技能，技能内部完成一段执行，再触发下一轮决策。",
          "componentId": "museum-skills"
        },
        {
          "kind": "module",
          "id": "1.3",
          "title": "我看好的：大脑不换，技能可以换",
          "desc": "读者设想：先定义技能接口、前提和失败反馈，再测试即插即用与泛化。",
          "componentId": "modular-skills-proposal"
        }
      ],
      "scenes": [
        {
          "id": "system-overview",
          "title": "机器人怎么从听指令走到目标？",
          "goal": "机器人从一条指令开始，究竟要经过哪些判断与执行？",
          "summary": "大脑理解指令和选技能；感知准备几何，规划执行一段，再把新观察交回来。",
          "interaction": "点击四步：图中的视锥、候选点、选点和机器人位置依次变化。",
          "next": "接下来：为什么不用每走一步都问大模型？",
          "notes": "论文第5–7页§3.1–3.3，式(1)–(5)。本页把一轮导航组织为“拿到RGB-D及上下文→技能准备几何并生成视觉提示→VLM按指令选择→规划技能执行并反馈”的教学顺序。主文说明VLM是高层控制器，感知和规划均由模块化技能完成，不能把所有几何计算归给VLM。显示的两个编号、画作、直线路径与移动位置为教学构造，并不是论文给出的候选采样算法或机器人控制实测。此页的阶段按钮不只是揭示文字：感知阶段加入可行点，语义阶段选中蓝画方向，执行阶段移动角色，位置、路线及解释由同一stage状态驱动。真实系统可多次交替调用技能，并非每轮严格调用一次。论文Fig3中的视觉提示和红圈可能含候选选择及新目标预测，不能从本页的编号推断其具体输出格式。此处采用直观过程而暂不展开POSMDP，后续技能页说明τ含义。 本轮将长段概述改为全幅重画：相同机器人、视锥、地图点、语义选择和执行反馈共享stage状态；图中合成几何不代表实测。",
          "componentId": "system-overview",
          "thumbnail": "./thumbnails/system-overview.jpg",
          "moduleId": "1.1"
        },
        {
          "id": "skill-time",
          "title": "为什么不用每走一步都问大模型？",
          "goal": "为什么不必每走一步都重新问大模型？",
          "summary": "高层控制器决定技能，技能内部完成一段执行，再触发下一轮决策。",
          "interaction": "比较调用感知与调用规划：前者更新信息但不移动，后者让角色跨步前进。",
          "next": "接下来：我看好的：大脑不换，技能可以换",
          "notes": "论文第6页§3.2式(1)(2)。POSMDP是对技能级决策的建模：策略根据历史上下文、当前观察和指令发出技能调用；规划技能内部产生多个底层动作，并在终止条件满足后返回高层决策。本页保留perception τ=0、planning τ>0的关键区别，但明确τ是推进物理状态的时间步跨度，不是网络推理或函数运行耗时。感知计算当然也花墙钟时间，因此不能把τ=0解读为零延迟。选择感知时，反馈显示距离观测已进入上下文，人物位置维持起点；选择规划时，同一状态令人物沿三步示意路径前进，之后交回新观察。示意的3步并非论文规定的技能长度，真实τ随技能与场景变化。此页不实现机器人底层控制器，也不把按钮当作实际模型选择策略。解释用“先判断调用什么、执行一段再回来”的完整因果链，避免只抛出POSMDP术语。后续坐标教学与这一职责分离兼容：透视、反投影等几何运算属于技能，不要求VLM在语言输出里逐项算矩阵。",
          "componentId": "museum-skills",
          "thumbnail": "./thumbnails/skill-time.jpg",
          "moduleId": "1.2"
        },
        {
          "id": "modular-skills-proposal",
          "title": "我看好的：大脑不换，技能可以换",
          "goal": "“机器人版本的 skill”好在哪里？把大脑、感知工具和执行技能画在一起看。",
          "summary": "读者设想：先定义技能接口、前提和失败反馈，再测试即插即用与泛化。",
          "interaction": "更换工具或任务，看技能接口和机器人场景改变；跨楼层能力仍待验证。",
          "next": "接下来：找下一段路和停准终点，差别在哪？",
          "notes": "原文§3.2、§4.6与Fig.4；Word肯定模型和技能分离，并称其为机器人版本的skill。本页直接摘录用户原句，画出固定3B大脑和可更换感知/地图/规划工具接口。3B是脑模型规模，不表示整机全部计算成本；模型与技能解耦是论文做法，跨层工具插拔和机器人爬楼动画是用户研究方向的教学构造，不是论文已展示的跨层能力。接上接口不意味着已有可靠技能，仍须验证楼层定位、通行、执行及泛化；论文已有室内外实机展示。",
          "componentId": "modular-skills-proposal",
          "thumbnail": "./thumbnails/modular-skills-proposal.jpg",
          "moduleId": "1.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "共用的几何计算先看懂",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "找下一段路和停准终点，差别在哪？",
          "desc": "全局侧重下一段可行路线，局部侧重眼前目标的精确三维定位。",
          "componentId": "global-local"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "图像、相机和地图的位置有什么不同？",
          "desc": "像素以px计，相机坐标以自身为原点，世界坐标以地图为参考。",
          "componentId": "coordinate-spaces"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "为什么光知道图里的位置还不够？",
          "desc": "像素给方向，轴向深度确定视线上的位置；内参负责把像素偏移归一化。",
          "componentId": "backprojection"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "相机里的位置，怎么变成地图里的位置？",
          "desc": "反投影先得到相机点，再用旋转R和平移t转换到世界坐标。",
          "componentId": "pixel-grounding"
        },
        {
          "kind": "module",
          "id": "2.5",
          "title": "地图里能走的点，怎么出现在画面上？",
          "desc": "把几何可行性变成像素对齐的视觉提示，VLM才方便按指令作语义选择。",
          "componentId": "projection"
        }
      ],
      "scenes": [
        {
          "id": "global-local",
          "title": "找下一段路和停准终点，差别在哪？",
          "goal": "两者都用几何和技能，那究竟区别在哪里？",
          "summary": "全局侧重下一段可行路线，局部侧重眼前目标的精确三维定位。",
          "interaction": "改变指令目标，观察全局候选路点与局部目标像素同时变化。",
          "next": "接下来：图像、相机和地图的位置有什么不同？",
          "notes": "依据论文第6–9页§3.2–3.5。用户文档提出全局与局部共享底层几何，应合并讲解；本页吸收这一组织建议，但将“技术完全一样”校准为“共用几何和技能底座，决策任务不同”。全局阶段以地图产生的可行路点为选择对象；局部阶段目标已在观察中出现，VLM需决定目标像素，并可用QD-PCoT取得缺失信息，再反投影为三维目标。教学中选择红画或蓝画同时改变两幅场景：全局给出下一段候选路点，局部突出目标像素及对应深度。示例全局世界点为(-1,4,0)或(1,4,0)，世界第三坐标为地面高度；相机的z轴深度不等于这一世界竖直轴。编号、坐标与画作均为合成示例，并非论文规划器的实现细节。本页不是切换算法演示，也没有把可见性设成真实系统唯一硬阈值。关于远处目标是否导致过早切换，交给后面的读者批判展开，而不在这里预先认定成功或失败。",
          "componentId": "global-local",
          "thumbnail": "./thumbnails/global-local.jpg",
          "moduleId": "2.1"
        },
        {
          "id": "coordinate-spaces",
          "title": "图像、相机和地图的位置有什么不同？",
          "goal": "同一个展品，为什么会有三种不同的位置？",
          "summary": "像素以px计，相机坐标以自身为原点，世界坐标以地图为参考。",
          "interaction": "左右平移相机，让像素与相机点改变，世界地面点保持不变。",
          "next": "接下来：为什么光知道图里的位置还不够？",
          "notes": "来源为论文第7–8页式(3)(4)(6)(7)，加上针对原理讲解的教学组织。固定世界地面目标(Xw,Yw,Zw)=(3,4,0)米，相机只沿世界X方向平移tx∈[0,2]米。在本页固定轴约定中，相机右向Xc对应世界Xw，前向Zc对应世界Yw，相机下向Yc对应世界负Zw。对应相机到世界旋转R=[[1,0,0],[0,0,1],[0,-1,0]]，平移为(tx,0,0)。所以Xc=3-tx，Zc=4，水平像素u=400Xc/4+320；tx=0时Xc=3,u620，tx=2时Xc=1,u420，世界点始终不动。世界坐标系的z是竖直轴，绝不能与相机z轴的深度混同。图中为帮助理解而忽略相机高度，并非论文真实传感器装配。关键判断是：像素变化既可能来自目标变化，也可能来自相机自身位姿变化。只有已知内参与位姿，才能在这些表示之间可靠转换。所有图形和数值为教学例子，不表示运行了SLAM或真实VLM。",
          "componentId": "coordinate-spaces",
          "thumbnail": "./thumbnails/coordinate-spaces.jpg",
          "moduleId": "2.2"
        },
        {
          "id": "backprojection",
          "title": "为什么光知道图里的位置还不够？",
          "goal": "从一个像素到三维位置，中间到底补了什么信息？",
          "summary": "像素给方向，轴向深度确定视线上的位置；内参负责把像素偏移归一化。",
          "interaction": "保持像素u=420不动，改变轴向深度d，观察相机系X与Z一起变化。",
          "next": "接下来：相机里的位置，怎么变成地图里的位置？",
          "notes": "论文第7页式(3)与第8页式(6)共享反投影关系Pc=dK^-1p。对于针孔相机，Xc=(u-cx)d/fx、Yc=(v-cy)d/fy、Zc=d。本页固定u420,cx320,fx400,v=cy，因此Yc=0，Xc=.25d。d2时点为(.5,0,2)米，d4时为(1,0,4)米：同一像素仅约束视线方向，距离不同会落在视线不同位置。d指相机z方向的轴向深度，不是任意欧氏射线距离。图中的斜线只是物理示意，不应将其纸面长度当真实尺度。网页没有新增深度估计网络，深度来自已给定的RGB-D数据流/感知技能。解释顺序先从单目方向歧义入手，再说明减主点、除焦距、乘深度分别做了什么。使用的相机焦距、主点和数值都是教学设定，不是论文设备标定记录。此页故意不重复世界变换公式，把位姿留到紧接的一页，从而回应用户关于几何原理应集中、分步讲透的建议。",
          "componentId": "backprojection",
          "thumbnail": "./thumbnails/backprojection.jpg",
          "moduleId": "2.3"
        },
        {
          "id": "pixel-grounding",
          "title": "相机里的位置，怎么变成地图里的位置？",
          "goal": "相机算出的三维点，怎样变成机器人能执行的地图目标？",
          "summary": "反投影先得到相机点，再用旋转R和平移t转换到世界坐标。",
          "interaction": "改变像素、深度和相机水平平移，比较相机横向位置与世界地面落点。",
          "next": "接下来：地图里能走的点，怎么出现在画面上？",
          "notes": "论文第8页式(7)与第7页式(3)中的刚体变换，Pw=RPc+t。为了避免把相机深度与世界竖直z混同，本页采用固定相机到地面坐标轴对齐：相机Xc向右对应世界Xw，Zc向前对应世界Yw，Yc向下对应世界-Zw。R=[[1,0,0],[0,0,1],[0,-1,0]]，t=(tx,0,0)；v=cy固定，所以世界Zw=0。Pc=((u-320)d/400,0,d)，Pw=(Xc+tx,d,0)。因此u420,d2,tx1得到相机Xc=.5米、世界地面(Xw,Yw)=(1.5,2)米；u520时相机Xc=1米、世界Xw=2米。图中只绘制地面两轴，纵向标签Yw不是相机Zc。实际相机高度、完整姿态与地图参考系应使用真实标定，不能照搬网页数值。完整R/t公式保留符号提示，但不再重复上一页的详细反投影推导；控制项仍允许复核像素与深度变化对世界位置的影响。所有运动均为教学示意，不是实机控制。 本例相机世界高度设为0以单独展示水平坐标变换，不是实际相机安装；实际hc>0时v=cy代表相机同高方向，不能直接称地面目标，必须代入真实位姿与像素。",
          "componentId": "pixel-grounding",
          "thumbnail": "./thumbnails/pixel-grounding.jpg",
          "moduleId": "2.4"
        },
        {
          "id": "projection",
          "title": "地图里能走的点，怎么出现在画面上？",
          "goal": "既然技能已有三维路点，为什么还要把它画回相机图像？",
          "summary": "把几何可行性变成像素对齐的视觉提示，VLM才方便按指令作语义选择。",
          "interaction": "拖动路点或调节X/Z，观察图像提示A的横向像素随透视比例变化。",
          "next": "接下来：看到了目标，为什么还不知道怎么走？",
          "notes": "来源为论文第7页式(4)，s pimg=K R^-1(Pw-t)。一般情况先减相机平移并使用逆旋转，把世界点放回相机系，然后做透视除法。本页直接操纵已经在相机水平坐标中的Xc/Zc，固定内参fx400,cx320，因此u=400Xc/Zc+320，v固定240。X1,Z4时u420；Z减为2时u520；显示距离越近时相同横向位移造成更大的像素变化。若投影超出0至640范围，就不再把它显示成可见提示，反馈明确当前点不在视野内。Z始终为正，未模拟相机后方点。图像中的A与三维点保持唯一绑定，VLM按语义选提示以后，执行端应取回对应的三维点，而不是把像素当成米。占据图更新、候选可行性与采样细节不由本页实现，A编号和路点分布为教学构造，不冒充原文算法。此页是统一几何章节的最后一环，用世界到相机再到像素的方向，补足前两页逆向过程。",
          "componentId": "projection",
          "thumbnail": "./thumbnails/projection.jpg",
          "moduleId": "2.5"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "我的批判：切换时机",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "看到了目标，为什么还不知道怎么走？",
          "desc": "看见或理解目标，不代表三维路线已经确定；缺观测时先调整视角。",
          "componentId": "museum-problem"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "同一个模型，怎么学会找路和定位？",
          "desc": "阶段化指令微调提供不同监督目标；数据路由不等于推理切换细节已完整交代。",
          "componentId": "visibility-routing"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "我的质疑：看见目标，就能开始精确靠近吗？",
          "desc": "读者设想：把阶段切换做成模型可调用技能，而不是把目标可见直接等同于切换充分条件。",
          "componentId": "stage-switch-critique"
        }
      ],
      "scenes": [
        {
          "id": "rgb-ambiguity",
          "title": "看到了目标，为什么还不知道怎么走？",
          "goal": "先看一个很简单的例子：隔板挡住线索以后，机器人凭什么决定下一步？",
          "summary": "看见或理解目标，不代表三维路线已经确定；缺观测时先调整视角。",
          "interaction": "移动展厅隔板，观察目标被遮挡后可用提示消失。",
          "next": "接下来：同一个模型，怎么学会找路和定位？",
          "notes": "来源：pages 5-6, sections 3.1-3.2；page 7, section 3.3, equation 5。所有合成位置/阈值/动作结果清楚标为教学示例，不冒充实测；每页讲者备注保留来源与假设；公式项用SymbolHint。。70:遮挡，无合适提示；20:蓝画可见，规划可用。",
          "componentId": "museum-problem",
          "thumbnail": "./thumbnails/rgb-ambiguity.jpg",
          "moduleId": "3.1"
        },
        {
          "id": "visibility-routing",
          "title": "同一个模型，怎么学会找路和定位？",
          "goal": "作者靠什么把全局找路和局部定位的侧重点教给同一个大脑？",
          "summary": "阶段化指令微调提供不同监督目标；数据路由不等于推理切换细节已完整交代。",
          "interaction": "拉开布帘，生成对应阶段的训练样本及技能调用。",
          "next": "接下来：我的质疑：看见目标，就能开始精确靠近吗？",
          "notes": "第8-10页 §3.5、§4.1、§4.2。目标可见性驱动全局寻路和局部定位训练；布帘40%的切换阈值只是网页示意，论文没有此数值。训练还混入LLaVA-Video-178K保留通用能力；没有从此推导AgentVLN-Instruct样本量。Qwen2.5-VL-3B，冻结视觉编码器和多模态投影层，AdamW，batch128，峰值学习率2e-5，warmup0.03，8帧历史，640×480图像、110°视场，32 NVIDIA A100训练。Jetson仅属于部署，不是训练平台。",
          "componentId": "visibility-routing",
          "thumbnail": "./thumbnails/visibility-routing.jpg",
          "moduleId": "3.2"
        },
        {
          "id": "stage-switch-critique",
          "title": "我的质疑：看见目标，就能开始精确靠近吗？",
          "goal": "远处画作已经看见，中间却隔着玻璃：切换前究竟还要确认什么？",
          "summary": "读者设想：把阶段切换做成模型可调用技能，而不是把目标可见直接等同于切换充分条件。",
          "interaction": "改变距离与障碍，对比只看可见性与检查定位、通路的两幅图。",
          "next": "接下来：三个点都能走，为什么只有一个符合指令？",
          "notes": "原文第6页§3.2、第8页§3.4描述目标匹配/可见后进入局部定位，但主文未给出可复现的完整切换阈值、迟滞或决策协议。本页引用Word关于模型自主决策的意见，以同一目标可见、围挡和距离的双场景展示“可见”与定位可靠、实际可达并不等价。距离8–24m、玻璃和路线均为教学构造，不是论文的失败实测；左图虚线不是论文控制轨迹。补观测本身不移动机器人，画出的绕行是方案中的规划路径。切换技能是用户研究提案；此页按钮让读者手动模拟决策，不表示已经训练好自主决策模型。",
          "componentId": "stage-switch-critique",
          "thumbnail": "./thumbnails/stage-switch-critique.jpg",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "我的批判：候选航点",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "三个点都能走，为什么只有一个符合指令？",
          "desc": "VLM按语义选目标，规划技能接着计算路线与低层动作，职责不同。",
          "componentId": "waypoint-choice"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "我的质疑：候选怎么来，选偏了怎么办？",
          "desc": "主文的建图和投影说明，不等于候选采样细节充分；全局选候选与局部新目标预测也不能用同一种偏差标准。",
          "componentId": "waypoint-critique"
        },
        {
          "kind": "module",
          "id": "4.3",
          "title": "目标被挡住了，下一步怎么办？",
          "desc": "先用细粒度动作补观测，提示恢复以后再继续调用规划技能。",
          "componentId": "active-recovery"
        }
      ],
      "scenes": [
        {
          "id": "waypoint-choice",
          "title": "三个点都能走，为什么只有一个符合指令？",
          "goal": "三个候选都被判为可行，但指令要的是蓝画。谁来选，谁来执行？",
          "summary": "VLM按语义选目标，规划技能接着计算路线与低层动作，职责不同。",
          "interaction": "按“经过长椅，走向蓝色画作”点击展厅中的三个候选提示。",
          "next": "接下来：我的质疑：候选怎么来，选偏了怎么办？",
          "notes": "主文第7页§3.3，式(4)。本页仅教已给候选后的语义选择，不模拟论文候选采样算法。世界X横向、Y地面前向、Z竖直，示例点(-1,3,0)/(1,4,0)/(2,5,0)均为合成数据。提示绑定原三维点，与局部任意新目标像素预测不是同一件事。",
          "componentId": "waypoint-choice",
          "thumbnail": "./thumbnails/waypoint-choice.jpg",
          "moduleId": "4.1"
        },
        {
          "id": "waypoint-critique",
          "title": "我的质疑：候选怎么来，选偏了怎么办？",
          "goal": "先看候选点有没有把路铺好，再看模型有没有选偏；这是两个不同的问题。",
          "summary": "主文的建图和投影说明，不等于候选采样细节充分；全局选候选与局部新目标预测也不能用同一种偏差标准。",
          "interaction": "切换候选生成与选点偏差；拖动预测点、试用候选回吸，并对照论文图3。",
          "next": "接下来：目标被挡住了，下一步怎么办？",
          "notes": "论文第7页§3.3式(3)(4)和第12页Fig.3。两张相机图是用户提供英文PDF的Fig.3原图裁剪，完整图保存在images/paper-navigation-full.png。Fig.3图注说明红圈含selected or predicted，因此全局候选选择与局部新目标像素预测不能混判。引用Word的候选来源疑问、输出偏离问题，默认给出原图加合成拖点示意；像素最近邻回吸只是一种待验证设想，不保证语义和可达性，也不应无条件用于局部新目标。候选生成模式以L形拐角、围挡内C及A/B同步投影说明覆盖和可达校验，候选位置/筛选方法均是教学构造。主文描述占据地图、路点和投影，但不完整披露可复现采样规则；本次未审计AgentVLN源码，不声称代码缺失。X/Z为相机横向/深度轴，u=cx+fx X/Z，cx320px，焦距250–600px；不把相机深度当世界竖直轴。",
          "componentId": "waypoint-critique",
          "thumbnail": "./thumbnails/waypoint-critique.jpg",
          "moduleId": "4.2"
        },
        {
          "id": "active-recovery",
          "title": "目标被挡住了，下一步怎么办？",
          "goal": "但是，如果连合适候选都看不到，下一步到底该干什么？",
          "summary": "先用细粒度动作补观测，提示恢复以后再继续调用规划技能。",
          "interaction": "在屏风拐角选择左转、右转或前进，尝试重获可行提示。",
          "next": "接下来：两把椅子差不多，怎么知道哪把更近？",
          "notes": "page 7, section 3.3, equation 5：context-conditioned local correction, not guaranteed recovery。所有合成位置/阈值/动作结果清楚标为教学示例，不冒充实测；每页讲者备注保留来源与假设；公式项用SymbolHint。 预期对比：forward:仍无指令匹配提示；left:出现提示，恢复长程技能。左转不普遍最优。",
          "componentId": "active-recovery",
          "thumbnail": "./thumbnails/active-recovery.jpg",
          "moduleId": "4.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "我的批判：主动查询",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "两把椅子差不多，怎么知道哪把更近？",
          "desc": "查询答复增加几何信息，模型随后输出目标像素，不是靠外观硬猜。",
          "componentId": "depth-query"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "我的质疑：主动查询为何增益这么小？",
          "desc": "整体增益不大值得追问，但不能仅据总表断言查询无效。",
          "componentId": "qd-marginal-critique"
        },
        {
          "kind": "module",
          "id": "5.3",
          "title": "我的设想：找路时缺什么，就主动查什么",
          "desc": "全局已有感知技能；读者提案是把语义驱动的信息缺口查询进一步前移。",
          "componentId": "global-query-proposal"
        }
      ],
      "scenes": [
        {
          "id": "query-depth",
          "title": "两把椅子差不多，怎么知道哪把更近？",
          "goal": "两把椅子看着差不多，怎么知道哪把更近？先查询，再定位。",
          "summary": "查询答复增加几何信息，模型随后输出目标像素，不是靠外观硬猜。",
          "interaction": "点击两把看起来相近的椅子，通过距离查询选择较近目标。",
          "next": "接下来：我的质疑：主动查询为何增益这么小？",
          "notes": "第8页 §3.4。此页只概述显式查询、返回信息和目标选择，不展示模型隐藏推理。两把椅子的2m/4m为教学数据，并非论文实验记录；外观相近不保证距离相等。查询为感知技能，不代表人物真的向椅子移动。",
          "componentId": "depth-query",
          "thumbnail": "./thumbnails/query-depth.jpg",
          "moduleId": "5.1"
        },
        {
          "id": "qd-marginal-critique",
          "title": "我的质疑：主动查询为何增益这么小？",
          "goal": "把查询放回整段导航：它究竟在哪一段帮上忙，还有哪些失败没覆盖？",
          "summary": "整体增益不大值得追问，但不能仅据总表断言查询无效。",
          "interaction": "改变假设触发范围，只改变覆盖示意；论文实测柱保持不变。",
          "next": "接下来：我的设想：找路时缺什么，就主动查什么",
          "notes": "原文第10页§4.5表3是累积消融，QD-PCoT这一行SR65.6→67.2、SPL63.4→64.7，分别+1.6和+1.3个百分点，图中实测柱固定不随控件改变。Word认为增益偏小并提出查询质量、作用范围等疑问。本页把导航全程与局部定位附近查询画在同一图中，合成任务、拐角问题、查询位置只是作用范围教学示意，不证明实际失败分布。假设触发率p和20个任务是教学设定，论文未给p；1.6/p的条件算例另假定未触发任务不受影响，不能倒推出真实子集效果。全程按需查询是用户提案，未测到新成绩。",
          "componentId": "qd-marginal-critique",
          "thumbnail": "./thumbnails/qd-marginal-critique.jpg",
          "moduleId": "5.2"
        },
        {
          "id": "global-query-proposal",
          "title": "我的设想：找路时缺什么，就主动查什么",
          "goal": "拐角后有没有路？目标到底多远？把信息缺口变成具体的查询。",
          "summary": "全局已有感知技能；读者提案是把语义驱动的信息缺口查询进一步前移。",
          "interaction": "分别查深度、补看拐角、核验连通性，观察视锥、地图与路线如何改变。",
          "next": "接下来：成功率提高了，比较条件也一样吗？",
          "notes": "来源原文§3.2感知技能、§3.4 QD-PCoT及用户Word最后两点。原系统全局阶段已有感知技能，用户提议是把语义信息缺口驱动的主动查询扩展到找路过程，而不是说原系统全局没有感知。三种查询分别揭示合成深度6m、拐角观测与连通性；图中地图、路径和调用计数随共享状态改变。场景、距离和技能API均为教学设想，不是新增实验。补观测在本页抽象为技能返回的信息；若实际需要转身或移步，必须计入物理动作、时间与传感器成本，不能当作原论文τ=0感知调用免费穿透遮挡。候选通路待同时获得观察与连通核验后才显示。",
          "componentId": "global-query-proposal",
          "thumbnail": "./thumbnails/global-query-proposal.jpg",
          "moduleId": "5.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "实验支持了什么",
      "modules": [
        {
          "kind": "module",
          "id": "6.3",
          "title": "记得越多就越好吗？看这四组实验",
          "desc": "8帧在此R2R配置最好，但不构成所有任务都用8帧的普遍结论。",
          "componentId": "temporal-context"
        }
      ],
      "scenes": [
        {
          "id": "benchmarks",
          "title": "成功率提高了，比较条件也一样吗？",
          "goal": "先看成功率和路径效率，再看传感器条件，别把不同输入预算藏起来。",
          "summary": "R2R/RxR未见场景SR为67.2/69.5%，但不是所有指标都最优。",
          "interaction": "读取两组固定SR/SPL横条图，不以控件更改论文数值。",
          "next": "接下来：逐个加上模块，究竟各多了多少？",
          "notes": "表1在PDF第9页、表2在第11页。均为Val-Unseen，指标SR/SPL百分数越大越好；所选EfficientVLN、DualVLN行是单目RGB，AgentVLN行使用RGB与Depth，传感器预算不同，不宣称严格输入预算公平比较。R2R SR/SPL分别64.2/55.9、64.3/58.5、67.2/64.7；RxR分别67.0/54.3、61.4/51.8、69.5/61.3。横条从0起，同指标统一0至100。论文没有提供这些值的置信区间，本图不造误差棒。AgentVLN在RxR的NE为3.92米，EfficientVLN为3.88米，越低越好，所以不能称全部指标最优。静态图用于读取精确实测对比；后续历史窗口与几何误差页重新提供机制操作。",
          "componentId": "benchmarks",
          "thumbnail": "./thumbnails/benchmarks.jpg"
        },
        {
          "id": "incremental-ablation",
          "title": "逐个加上模块，究竟各多了多少？",
          "goal": "先看每一步加了什么，再追问这张消融表能支持多强的结论。",
          "summary": "表3是累计配置；QD-PCoT的相邻总SR增加1.6个百分点，原因还需进一步诊断。",
          "interaction": "读取四个累加配置的SR与SPL分组横条图。",
          "next": "接下来：记得越多就越好吗？看这四组实验",
          "notes": "PDF第13至14页4.5节与表3，R2R验证集的累加配置。基线NE6.53/OS48.50/SR38.60/SPL35.10；VLM-as-Brain为4.67/65.10/59.70/55.60；再加CDFG为3.90/72.10/65.60/63.40；完整再加QD-PCoT为3.88/73.50/67.20/64.70。图选择SR和SPL共同0至100百分数尺度。CDFG是上下文驱动的细粒度策略。配置逐步累加，不是全因子实验，不能将相邻差值视为相互独立且可直接相加的因果效果。未给置信区间，图上不添加。导览册逐页叠加仅帮助理解累加配置，不是模型实际训练顺序。",
          "componentId": "ablation",
          "thumbnail": "./thumbnails/incremental-ablation.jpg"
        },
        {
          "id": "temporal-context",
          "title": "记得越多就越好吗？看这四组实验",
          "goal": "历史是不是越长越好？直接看这四个已经报告的实验点。",
          "summary": "8帧在此R2R配置最好，但不构成所有任务都用8帧的普遍结论。",
          "interaction": "沿导览手册时间轴选择2、4、8、10帧，观察保留照片和固定实测点。",
          "next": "接下来：我的设想：同一场景里，比比改进有没有用",
          "notes": "PDF第14页图5，R2R验证集上下文长度消融。K为2/4/8/10帧时，SR为56.7/59.2/67.2/67.1%，SPL为53.9/57.6/64.7/64.5%，NE为4.53/4.39/3.88/3.91米。点图只包含报告的四个离散窗口，不通过插值制造中间实验。手册里的小图片是上下文窗口的合成解释图，不是论文数据或模型实测输入。点击窗口让保留照片与已报告结果同步更新，属于支持性证据交互，不冒充运行真实VLM。8帧只在该实验配置中最好；8与10的差值很小且未给方差，不能声称统计显著下降。",
          "componentId": "temporal-context",
          "thumbnail": "./thumbnails/temporal-context.jpg",
          "moduleId": "6.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "我的设想与实机证据",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "我的设想：同一场景里，比比改进有没有用",
          "desc": "读者研究计划：同任务、同输入与大脑，逐项改机制，报告阶段收益、失败与成本。",
          "componentId": "research-protocol"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "论文已经让真机器人走了，我还想补哪些验证？",
          "desc": "论文已有室内和室外实机展示；大区域、跨楼层可靠性以及延迟，还要专门测。",
          "componentId": "deployment-boundary"
        }
      ],
      "scenes": [
        {
          "id": "research-protocol",
          "title": "我的设想：同一场景里，比比改进有没有用",
          "goal": "一边保留原流程，一边加入我的方案；先固定传感器与任务，再谈效果。",
          "summary": "读者研究计划：同任务、同输入与大脑，逐项改机制，报告阶段收益、失败与成本。",
          "interaction": "切换改进模块与传感器条件，观察成对图中的路线、查询与硬件变化。",
          "next": "接下来：论文已经让真机器人走了，我还想补哪些验证？",
          "notes": "本页把用户三类意见组织成待实施研究设计，不报告新增实验。左右使用同一合成任务、机器人和RGB-D，分别记录原设置与加入切换条件、候选覆盖/校验或全局信息查询后的差异。图中的路线、障碍、候选点不代表论文真实失败轨迹；正式对照先需复现论文实际流程。额外传感器开关直接改变提案硬件，并提示输入/硬件预算变化会引入混杂因素。成功率、SPL、切换错误、覆盖可达率、查询触发率和耗时均待测。",
          "componentId": "research-protocol",
          "thumbnail": "./thumbnails/research-protocol.jpg",
          "moduleId": "7.1"
        },
        {
          "id": "deployment-boundary",
          "title": "论文已经让真机器人走了，我还想补哪些验证？",
          "goal": "先看室内、室外的实机照片，再把跨楼层与大区域的问题单独画出来。",
          "summary": "论文已有室内和室外实机展示；大区域、跨楼层可靠性以及延迟，还要专门测。",
          "interaction": "切换室内、室外照片，再看跨楼层设想；事实与待验证问题在图中分开。",
          "next": "把这些设想带回真实场景做成对实验。",
          "notes": "论文第13页Fig.4给出Go2真实平台室内与室外导航示例。照片从用户提供的2603.17670v1.pdf原图提取并裁剪，完整原图保存在images/paper-realworld-full.png。照片不做生成或修改；右侧设备连线是教学重画，不表示真实物理安装位置。实机部分使用Go2、Intel RealSense D455、RTAB-Map和Jetson；3B指VLM大脑模型规模，不等于整机资源。跨楼层模式以新示意图表达用户研究问题，主文没有提供系统跨楼层或大区域泛化评测；也未报告FPS或端到端延迟统计，不能据此宣称机器人只能室内运行。",
          "componentId": "deployment-boundary",
          "thumbnail": "./thumbnails/deployment-boundary.jpg",
          "moduleId": "7.2"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};
