import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Don’t Forget Why You Started: Tackling Dual Forgetting in Vision-Language Continual Learning",
    "titleZh": "视觉语言持续学习中的双重遗忘",
    "venue": "ICML 2026",
    "authors": "Borui Kang、Jinrui Gu 等",
    "affiliation": "南京大学 · 清华大学 · 卧龙岗大学",
    "domain": "视觉语言持续学习",
    "coreProblem": "学会新类别的同时，历史类别与预训练通用能力都可能退化。",
    "coreInsight": "分开优化对齐与适应，再用语义校准检验两种遗忘。",
    "keywords": [
      "持续学习",
      "双重遗忘",
      "相似度校准",
      "异质专家"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "同质专家",
      "desc": "同一目标兼顾题材学习与底色保持",
      "componentId": "dfa-cover"
    },
    "newMethod": {
      "title": "DFA-MoE",
      "desc": "对齐与可塑性分工，路由联合输出",
      "componentId": "dfa-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 双重遗忘",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "两种遗忘，需要两份成绩",
          "desc": "增量知识遗忘比较历史类别学完时与当前的表现；预训练知识遗忘比较原始模型与当前的零样本表现。",
          "componentId": "dfa-dual"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "同一训练过程，两条评估线",
          "desc": "25个数据集组成评估池，22个可作训练源；每一轮选一个源学习，其他24个领域固定用于零样本评估。",
          "componentId": "dfa-protocol"
        }
      ],
      "scenes": [
        {
          "id": "dual",
          "title": "两种遗忘，需要两份成绩",
          "goal": "给摄影作品换一张检验单：旧题材和陌生题材，暴露的问题有什么不同？",
          "summary": "增量知识遗忘比较历史类别学完时与当前的表现；预训练知识遗忘比较原始模型与当前的零样本表现。",
          "interaction": "点击两本相册选择检验对象，拖动“已完成任务”，观察参考点、准确率和差值。",
          "next": "用同一套实验同时记录两种遗忘。",
          "notes": "论文第1–3页，§1–2。IKF（Incremental Knowledge Forgetting，增量知识遗忘）指历史增量类别能力下降；PKF（Pre-trained Knowledge Forgetting，预训练知识遗忘）指预训练通用能力退化。这里用合成教学记录区分参照点：历史类在任务1学完时准确率80%，任务2与3分别72%、65%；陌生领域原始模型为70%，任务1、2、3后分别69%、61%、55%。第三任务两项都是下降15个百分点，但衡量的能力和参照模型不同。相册代表评估数据，动画呈现记录变化。",
          "componentId": "dfa-dual",
          "moduleId": "1.1",
          "thumbnail": "./thumbnails/dual.jpg"
        },
        {
          "id": "protocol",
          "title": "同一训练过程，两条评估线",
          "goal": "选择一个摄影练习题材，查看它对应的增量任务和外部评估池。",
          "summary": "25个数据集组成评估池，22个可作训练源；每一轮选一个源学习，其他24个领域固定用于零样本评估。",
          "interaction": "点击三个题材选卡，沿任务刻度前进，核对已见类别数及固定评估集。",
          "next": "在原始模型的共同参照下计算领域之间的距离。",
          "notes": "论文第3–4页§3.1、第6页§5.1及附录A第13–14页。DFA-CIL（Dual-Forgetting-Aware Class-Incremental Learning，双重遗忘感知类别增量学习）在每完成一个增量任务后，同步评估已见类别与零样本任务。EuroSAT有10类，分5任务，每任务2类；OxfordFlower有102类，分17任务，每任务6类；FER2013有7类，分4任务，类别数依次2、2、2、1。25个数据集中PCam、HatefulMemes、SST2为二分类，仅作评估域；其余22个可作为训练源。针对所选源，余下24个零样本域按相似度分低、中、高三组，每组8个。推理在所有已见类别中分类，无外部任务标识。相机与题材画片为数据集的自绘概念图。",
          "componentId": "dfa-protocol",
          "moduleId": "1.2",
          "thumbnail": "./thumbnails/protocol.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 语义校准",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "语义距离：从训练类寻找最近邻",
          "desc": "在固定原始CLIP特征空间中拼接图像与文本原型，从每个训练类别寻找最近评估类别。",
          "componentId": "dfa-prototype"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "相似度校准保持率",
          "desc": "语义相似度S=exp(−βd)，权重W=1−S；各领域相对原始模型的准确率变化先加权，再对训练阶段平均。",
          "componentId": "dfa-scr"
        }
      ],
      "scenes": [
        {
          "id": "prototype",
          "title": "语义距离：从训练类寻找最近邻",
          "goal": "拖动照片的特征刻度，比较“训练到评估”和反方向的差别。",
          "summary": "在固定原始CLIP特征空间中拼接图像与文本原型，从每个训练类别寻找最近评估类别。",
          "interaction": "拖动训练原型角度0–90°，切换距离方向，检查最近邻与平均距离的差别。",
          "next": "把语义距离转换成校准保持率的评价权重。",
          "notes": "论文第4页§3.2式(1)，附录E第17页。CLIP（Contrastive Language–Image Pre-training，对比语言图像预训练）的原始冻结模型用于所有方法的语义测量。类别原型r=[v;t]将分别L2单位化的p维图像均值v和q维文本特征t拼接为p+q维向量。训练到评估的距离d=(1/(2m))Σ_i min_j ||r_i−r′_j||²，m是训练类别数，j遍历评估类。系数1/2平均两个模态的平方差。教学例令图像与文本都为二维单位向量(cosθ,sinθ)，两个评估类固定0°与90°。训练到评估距离为min(2−2cosθ,2−2sinθ)；反方向为这两个距离的平均。θ=0°时前向0、反向1；θ=45°时均为2−√2≈0.585786。固定原型空间与方向选择使不同方法共享评价参照。角度仅是低维教学参数。",
          "componentId": "dfa-prototype",
          "moduleId": "2.1",
          "thumbnail": "./thumbnails/prototype.jpg"
        },
        {
          "id": "scr",
          "title": "相似度校准保持率",
          "goal": "改变评估样片的语义距离，观察它在总分中占多大权重。",
          "summary": "语义相似度S=exp(−βd)，权重W=1−S；各领域相对原始模型的准确率变化先加权，再对训练阶段平均。",
          "interaction": "拖动第一领域的距离0–2，观察归一化权重、加权贡献与校准总分同步变化。",
          "next": "分工训练专家，让保持能力与学习新类各有目标。",
          "notes": "论文第4页式(2)–(5)。SCR（Similarity-Calibrated Retention，相似度校准保持率）用W=1−exp(−βd)降低相近评估域的正迁移干扰，实验β=1。每个任务t的ΔA_k=A_k^t−A_k^0，表示第k个评估域当前准确率相对原始模型的变化；SCR_t=Σ_k W_kΔA_k/Σ_k W_k，最后对T个任务的SCR_t算术平均。数值越高，表示按该权重保持得越好。本页为三域教学例：ΔA=[6,−2,−8]个百分点，距离初始[0.1,0.5,1.5]；普通平均−1.333333，归一化权重约[0.075198,0.310920,0.613883]，校准分数−5.081717。权重不改变各域真实准确率。秤盘承载比例对应归一化权重。当前两个固定领域距离为正，权重和恒正；全权重为零的公式边界在最后的敏感性页面讨论。",
          "componentId": "dfa-scr",
          "moduleId": "2.2",
          "thumbnail": "./thumbnails/scr.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 对齐与历史",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "对比目标保护图文对齐",
          "desc": "提高正配对相似度会提高正确配对概率，历史负样本增加区分压力。",
          "componentId": "dfa-contrast"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "固定容量的历史特征队列",
          "desc": "容量128的历史队列按先入先出规则更新。",
          "componentId": "dfa-queue"
        }
      ],
      "scenes": [
        {
          "id": "contrast",
          "title": "对比目标保护图文对齐",
          "goal": "移动题注卡与照片的匹配强度，让正确配对从负样本中突出。",
          "summary": "提高正配对相似度会提高正确配对概率，历史负样本增加区分压力。",
          "interaction": "调节正配对相似度，并加入或移除历史负题注。",
          "next": "历史负样本怎样在有限空间中保存？",
          "notes": "论文第5页式(7)–(8)。本页实现单对、图像到文本一个方向的教学计算：温度τ=0.15，正相似度0.1至1，批内负相似度0.2和0.3，历史负相似度0.5。采用稳定的指数归一化计算正对概率，损失为负对数概率。论文采用批内图像到文本与文本到图像的对称平均。照片和题注位置表现匹配强度，合成数值只用于展示目标函数。",
          "componentId": "dfa-contrast",
          "moduleId": "3.1",
          "thumbnail": "./thumbnails/contrast.jpg"
        },
        {
          "id": "queue",
          "title": "固定容量的历史特征队列",
          "goal": "往底片夹加入下一期记录，看最老的一组怎样被替换。",
          "summary": "容量128的历史队列按先入先出规则更新。",
          "interaction": "点击加入下一任务，观察四组历史特征的替换；到第10任务可回到初始示例。",
          "next": "这些历史参照在两个训练阶段中分别怎样使用？",
          "notes": "论文第5页§4.2和第15页附录B。默认历史队列容量128，任务结束抽取32条特征并移除最早32条。教学视图从已填满的四组记录开始，每组32对图像文本特征。新任务加入后四槽顺序前移，容量不变。公开实现的首任务初始化单独处理，未在此图中模拟。队列保存特征表示；两条训练路径都可以利用历史负样本。",
          "componentId": "dfa-queue",
          "moduleId": "3.2",
          "thumbnail": "./thumbnails/queue.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 训练与路由",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "两阶段训练，分开优化目标",
          "desc": "对齐阶段仅训练对齐专家；类别学习阶段冻结对齐专家，训练可塑性专家和路由。",
          "componentId": "dfa-training"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "两层路由共同决定残差",
          "desc": "内层路由组合可塑性专家；外层路由融合对齐与可塑性分支，得到残差。",
          "componentId": "dfa-router"
        }
      ],
      "scenes": [
        {
          "id": "training",
          "title": "两阶段训练，分开优化目标",
          "goal": "在校色和题材练习之间切换，检查哪些参数真正更新。",
          "summary": "对齐阶段仅训练对齐专家；类别学习阶段冻结对齐专家，训练可塑性专家和路由。",
          "interaction": "选择阶段A或B，并调节交叉熵的教学梯度分量。",
          "next": "训练完成后，两条路径的输出怎样合到一起？",
          "notes": "论文第5至6页§4.2、式(8)至(11)，第15页附录B。CLIP主干全程冻结。阶段A只训练对齐专家，目标为对称对比损失；阶段B冻结对齐专家，训练可塑性专家以及两层路由，目标为交叉熵加0.001倍对比损失。交互使用标量梯度示例：对比梯度0.4，交叉熵梯度g可调；阶段A对齐梯度0.4，可塑性梯度0；阶段B对齐梯度0，可塑性梯度g+0.0004。真实参数为张量，示例揭示目标分配与冻结规则。",
          "componentId": "dfa-training",
          "moduleId": "4.1",
          "thumbnail": "./thumbnails/training.jpg"
        },
        {
          "id": "router",
          "title": "两层路由共同决定残差",
          "goal": "拨动两道镜头调节环，逐步算出专家混合与最终输出。",
          "summary": "内层路由组合可塑性专家；外层路由融合对齐与可塑性分支，得到残差。",
          "interaction": "调节内层和外层得分差，观察权重与二维输出同步变化。",
          "next": "将专家分工、对比目标和队列逐步加入后，实验结果怎样变化？",
          "notes": "论文第5至6页式(9)–(10)，第15页附录B–C。教学二维输出Es1=[2,0]、Es2=[0,2]、Ea=[1,1]、冻结主干x=[1,0]。内层权重α=sigmoid(a)，外层对齐权重ρ=sigmoid(b)，ρ对应论文β_gen；os=αEs1+(1−α)Es2，o=ρEa+(1−ρ)os，y=x+o。a=b=0时y=[2,1]。真实模型由输入自动产生权重，推理不需要外部任务编号。论文默认内层有两个专家且k=2；两层归一化分别进行。",
          "componentId": "dfa-router",
          "moduleId": "4.2",
          "thumbnail": "./thumbnails/router.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "实验、消融与计算成本",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "异质分工的消融证据",
          "desc": "点选论文报告的配置，联动查看增量准确率与整体保持分数。",
          "componentId": "dfa-ablation"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "三个增量来源的结果",
          "desc": "切换数据集和指标，比较同协议下的三种方法。",
          "componentId": "dfa-results"
        }
      ],
      "scenes": [
        {
          "id": "ablation",
          "title": "消融：分工、对比与队列的作用",
          "goal": "在摄影作品的检验单上选择一项配置，核对两项论文结果。",
          "summary": "在 EuroSAT 上，异质分工带来最大幅度改善，对比目标和历史队列进一步改善两项指标。",
          "interaction": "点选任一图中的柱条，以相同配置同时突出两项结果；支持键盘聚焦并按回车选择。",
          "next": "比较完整方法在不同增量来源上的表现。",
          "notes": "原文 p8 Table 3。EuroSAT 10类、5个任务，CLIP ViT-B/16。四个配置依次为同质专家、异质专家、异质+对比、异质+对比+队列；增量Last准确率(%)为62.52、69.58、71.74、72.25；整体SCR为−4.16、−1.11、−0.85、−0.79，单位为百分点且越高越好。相对上一配置的准确率增幅为7.06、2.16、0.51个百分点，SCR增幅为3.05、0.26、0.06。两图分别采用0..80与−5..0轴范围，条形均起于零；表格未提供这些结果的误差条。相机检验单承接摄影主题，只用于表达核验角色；选中配置不预测未报告的组合，也不模拟训练。",
          "componentId": "dfa-ablation",
          "moduleId": "5.1",
          "thumbnail": "./thumbnails/ablation.jpg"
        },
        {
          "id": "results",
          "title": "三种增量来源上的效果",
          "goal": "翻到不同题材的成绩单，看学习新类和保持通用能力能否兼顾。",
          "summary": "完整方法在所选三种来源上有较高的增量准确率和整体保持分数，部分后向迁移结果由基线领先。",
          "interaction": "选择EuroSAT、OxfordFlower或FER2013；再选择增量准确率、后向迁移或整体保持分数。",
          "next": "进一步检查参数规模和训练耗时。",
          "notes": "原文 p6 Table 1。固定CLIP ViT-B/16。EuroSAT 10类/5任务，OxfordFlower 102类/17任务，FER2013 7类/4任务；每源的其余24数据集进行零样本评估。每行依次为CIL Last(%)/BWT(百分点)/ZS Overall SCR(百分点)。EuroSAT：MoE4Adapter 62.52/−15.56/−4.16，GIFT 69.52/−2.57/−1.04，DFA-MoE 72.25/−2.96/−0.79。OxfordFlower：MoE4Adapter 67.72/−5.39/−0.75，GIFT 70.21/−10.28/−0.86，DFA-MoE 70.40/−6.37/−0.66。FER2013：MoE4Adapter 60.59/−14.88/−2.00，GIFT 44.98/−16.21/−1.83，DFA-MoE 62.37/−13.21/−1.74。三指标均越高越好，三套固定轴域分别为[0,80]、[−20,0]、[−5,0]，显式保留零轴。EuroSAT的GIFT及OxfordFlower的MoE4Adapter在BWT上更好。教学摄影图标对应不同题材；页面只切换论文报告结果，不生成新实验值。",
          "componentId": "dfa-results",
          "moduleId": "5.2",
          "thumbnail": "./thumbnails/results.jpg"
        },
        {
          "id": "cost",
          "title": "参数更少，时间成本仍需衡量",
          "goal": "在器材清单上对照可训练参数量与实际训练耗时。",
          "summary": "DFA-MoE使用1.05百万可训练参数，每迭代0.25秒；相对MoE4Adapter减少参数规模，但单迭代耗时增加。",
          "interaction": "对照左侧精确参数表与右侧零起点耗时条形图。",
          "next": "回到评价公式，检验语义权重怎样影响两组记录的排序。",
          "notes": "原文 p8 Table 2。MoE4Adapter、DMNSP、GIFT、DFA-MoE的可训练参数(百万)依次为4.03、1.98、149.62、1.05；每迭代时间(秒)依次为0.16、0.28、0.88、0.25；22个可训练增量来源上的平均SCR依次为−1.57、−2.23、−1.69、−0.72。参数降低比例=(4.03−1.05)/4.03=73.9454%，耗时增加比例=(0.25−0.16)/0.16=56.25%。参数以精确表格保留不同量级，耗时以[0,1]秒零起点条形图表示。表格未报告相应误差条。本文另在p16 Table 5报告EuroSAT每任务耗时；此页专用Table 2每迭代结果。相机及底片器材架只作为规模与耗时清单的主题线索，静态展示真实证据。",
          "componentId": "dfa-cost",
          "thumbnail": "./thumbnails/cost.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "评价敏感性与研究问题",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "相似度权重的敏感性",
          "desc": "保持模型成绩不变，改变相似度衰减系数，重新计算加权分数。",
          "componentId": "dfa-challenge"
        }
      ],
      "scenes": [
        {
          "id": "challenge",
          "title": "把评价方法用回新的比较",
          "goal": "选择两组摄影练习记录，改变校准强度，检验“平均更好”的结论。",
          "summary": "近域迁移增益会改变普通平均的判断；固定成绩再改变语义权重，可检验保持分数对评价设置的敏感性。",
          "interaction": "点击模型甲或乙的成绩胶片，再拖动相似度衰减系数β；设为0检查分母边界，点击按钮恢复论文取值1。",
          "next": "",
          "notes": "原文 p4 式(2)–(5)提供S=exp(−βd)、W=1−S、SCR_t=ΣWΔA/ΣW及最终任务平均；本页使用合成的三域教学计算。距离固定为[0.1,0.5,1.5]，模型甲变化[8,−2,−8]、乙[1,−1,−3]个百分点，普通平均依次−0.666667、−1。β=1时归一化权重为[0.0751975104,0.3109196305,0.6138828590]，甲SCR=−4.931322、乙SCR=−2.077371。β=0时全部权重为0，论文加权公式未定义；公开calculate_SCR.py实现会回退均匀权重，此页遵循论文公式显示未定义。拖动不改变模型表现，只改变评价权重；动画条由同一权重计算驱动。两条成绩胶片分别对应两组模型结果，摄影主题只承载选择与比较，不表示真实拍摄或训练实验。后续可固定训练结果，改变β或评估域划分检查排序敏感性。",
          "componentId": "dfa-challenge",
          "moduleId": "6.1",
          "thumbnail": "./thumbnails/challenge.jpg"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};
