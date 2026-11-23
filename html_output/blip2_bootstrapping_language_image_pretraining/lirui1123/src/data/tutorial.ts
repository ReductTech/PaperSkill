import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models",
    "titleZh": "BLIP-2：冻结模型的视觉语言预训练",
    "venue": "ICML 2023",
    "authors": "Junnan Li · Dongxu Li · Silvio Savarese · Steven Hoi",
    "affiliation": "Salesforce Research",
    "domain": "视觉语言预训练",
    "coreProblem": "视觉特征与语言嵌入含义不同。BLIP-2怎样学习连接方式，同时冻结图像编码器和语言模型？",
    "coreInsight": "先训练 Q-Former 提取语言相关视觉信息，再把它对齐到冻结 LLM 的输入空间。",
    "keywords": [
      "BLIP-2",
      "Q-Former",
      "冻结模型",
      "两阶段预训练"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "未经图文对齐的视觉表示",
      "desc": "视觉坐标尚未学会与语言对应。尺寸相同，含义未必相通。",
      "componentId": "blip-cover"
    },
    "newMethod": {
      "title": "两阶段训练的 Q-Former",
      "desc": "同一个Q-Former：先学提取，再学适配冻结LLM。",
      "componentId": "blip-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "冻结与查询",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "冻结参数不等于切断梯度",
          "desc": "对比冻结与人为截断梯度",
          "componentId": "blip-01"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "32 个查询构成固定长度信息瓶颈",
          "desc": "改变图像块数与语言相关读出",
          "componentId": "blip-02"
        },
        {
          "kind": "module",
          "id": "1.3",
          "title": "交叉注意力怎样从图像中读出信息",
          "desc": "切换查询并遮去关键区域",
          "componentId": "blip-03"
        }
      ],
      "scenes": [
        {
          "id": "frozen",
          "title": "冻结参数不等于切断梯度",
          "goal": "冻结权重仍可反传。切断梯度后，观察桥接参数还会不会学习。",
          "summary": "仅更新w；a=3、x=2固定。ŷ=6w，L=(ŷ−2)²/2，梯度=(ŷ−2)×6，步长0.01。保留梯度第一步w=.248；截断则w=.2不变。",
          "interaction": "对比冻结与人为截断梯度",
          "next": "32 个查询构成固定长度信息瓶颈",
          "notes": "PDF page 1–2; §3.3。\n教学说明：冻结是“不更新权重”，仍可求输入梯度。对比反传路径，查看语言模型误差能否穿过冻结计算、更新桥接参数。\n操作：对比冻结与人为截断梯度。\n计算与界限：仅更新w；a=3、x=2固定。ŷ=6w，L=(ŷ−2)²/2，梯度=(ŷ−2)×6，步长0.01。保留梯度第一步w=.248；截断则w=.2不变。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-01",
          "thumbnail": "./thumbnails/frozen-cdfcaad43810.jpg",
          "moduleId": "1.1"
        },
        {
          "id": "bottleneck",
          "title": "32 个查询构成固定长度信息瓶颈",
          "goal": "输入图像块变多，输出仍是32个查询；训练还要决定保留什么。",
          "summary": "16/64个输入块，32个输出查询位置始终不变。偏向语言相关内容时红围巾进入概念读出。块数与文字读出为结构示意，不是真实32槽解码。",
          "interaction": "改变图像块数与语言相关读出",
          "next": "交叉注意力怎样从图像中读出信息",
          "notes": "PDF page 3 §3.1。\n教学说明：32个查询是可学习向量，不是32个词。改变图像块数量与读出重点，区分“固定输出长度”与“保留语言相关信息”。\n操作：改变图像块数与语言相关读出。\n计算与界限：16/64个输入块，32个输出查询位置始终不变。偏向语言相关内容时红围巾进入概念读出。块数与文字读出为结构示意，不是真实32槽解码。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-02",
          "thumbnail": "./thumbnails/bottleneck-cdfcaad43810.jpg",
          "moduleId": "1.2"
        },
        {
          "id": "attention",
          "title": "交叉注意力怎样从图像中读出信息",
          "goal": "换查询、遮区域：对比相关性、注意力权重与读出内容。",
          "summary": "三维手工键值；相关区域分数2，其余0；softmax权重约.787/.107/.107。遮去相关区域后该权重0，另两项各.5。",
          "interaction": "切换查询并遮去关键区域",
          "next": "ITC：独立编码，再取最大相似度",
          "notes": "PDF page 3 §3.1；通用注意力解析示例。\n教学说明：查询决定“读什么”，图像键决定相关性，图像值提供内容。切换查询或遮去关键区域，观察权重与加权读出为何改变。\n操作：切换查询并遮去关键区域。\n计算与界限：三维手工键值；相关区域分数2，其余0；softmax权重约.787/.107/.107。遮去相关区域后该权重0，另两项各.5。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-03",
          "thumbnail": "./thumbnails/attention-cdfcaad43810.jpg",
          "moduleId": "1.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "三种表征学习目标",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "ITC：独立编码，再取最大相似度",
          "desc": "更换描述并移除属性查询",
          "componentId": "blip-04"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "三种目标为什么使用三种注意力掩码",
          "desc": "修改访问路径检查目标是否被破坏",
          "componentId": "blip-05"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "ITG：下一词只能利用图像与已写文本",
          "desc": "移除图像线索或开放目标词，计算损失",
          "componentId": "blip-06"
        },
        {
          "kind": "module",
          "id": "2.4",
          "title": "ITM：融合图文后，平均查询 logits",
          "desc": "核对红蓝围巾困难负样本与双向融合",
          "componentId": "blip-07"
        }
      ],
      "scenes": [
        {
          "id": "itc",
          "title": "ITC：独立编码，再取最大相似度",
          "goal": "图文先独立编码，再由最相关查询打分。移除属性查询试试。",
          "summary": "手工相似度z1=[.95,.2,−.3]，z2=[.25,.9,−.2]；取最大值。移除z2使围巾描述由.9降至.2；温度.3的图到文对比权重仅演示一个方向。",
          "interaction": "更换描述并移除属性查询",
          "next": "三种目标为什么使用三种注意力掩码",
          "notes": "PDF page 3 §3.2。\n教学说明：ITC先独立编码图像和文本，再由最相关查询为图文对打分。替换描述、移除关键查询，查看不同语义如何影响对比。\n操作：更换描述并移除属性查询。\n计算与界限：手工相似度z1=[.95,.2,−.3]，z2=[.25,.9,−.2]；取最大值。移除z2使围巾描述由.9降至.2；温度.3的图到文对比权重仅演示一个方向。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-04",
          "thumbnail": "./thumbnails/itc-cdfcaad43810.jpg",
          "moduleId": "2.1"
        },
        {
          "id": "masks",
          "title": "三种目标为什么使用三种注意力掩码",
          "goal": "允许依靠哪些信息，决定模型是在对比、生成，还是融合核对。",
          "summary": "ITC反例：Q读T；ITG反例：T1读未来T3；ITM反例：移除跨模态路径。三种反例不是有效BLIP-2设置，不据此模拟性能。",
          "interaction": "修改访问路径检查目标是否被破坏",
          "next": "ITG：下一词只能利用图像与已写文本",
          "notes": "PDF page 3 Figure 2。\n教学说明：ITC需独立比较，ITG需避免偷看答案，ITM需融合核对。改变一条访问规则，查看模型是否还能按目标要求完成任务。\n操作：修改访问路径检查目标是否被破坏。\n计算与界限：ITC反例：Q读T；ITG反例：T1读未来T3；ITM反例：移除跨模态路径。三种反例不是有效BLIP-2设置，不据此模拟性能。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-05",
          "thumbnail": "./thumbnails/masks-cdfcaad43810.jpg",
          "moduleId": "2.2"
        },
        {
          "id": "itg",
          "title": "ITG：下一词只能利用图像与已写文本",
          "goal": "隐藏答案才需要利用图像。对比“没图”与“偷看答案”的损失。",
          "summary": "固定预测颜色；视觉线索p=.8、无视觉p=.34、泄露目标p=.98；L=−ln p。手工概率仅展示依赖关系，不是真实模型分布；本页不再用已写词数滑块。",
          "interaction": "移除图像线索或开放目标词，计算损失",
          "next": "ITM：融合图文后，平均查询 logits",
          "notes": "PDF page 3 §3.2。\n教学说明：预测当前词必须隐藏当前与未来文本。移除视觉信息或开放答案，比较模型是否仍有必要从图像中学习。\n操作：移除图像线索或开放目标词，计算损失。\n计算与界限：固定预测颜色；视觉线索p=.8、无视觉p=.34、泄露目标p=.98；L=−ln p。手工概率仅展示依赖关系，不是真实模型分布；本页不再用已写词数滑块。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-06",
          "thumbnail": "./thumbnails/itg-cdfcaad43810.jpg",
          "moduleId": "2.3"
        },
        {
          "id": "itm",
          "title": "ITM：融合图文后，平均查询 logits",
          "goal": "主体相同也可能不匹配：检查属性冲突如何拉低平均分类分数。",
          "summary": "手工查询分类logit差：主体1.5、属性红2/蓝−4、其他0；平均后sigmoid得到76.3%/30.3%。无融合属性证据设0为教学反例，非真实模型消融测量。",
          "interaction": "核对红蓝围巾困难负样本与双向融合",
          "next": "FC 投影把查询变为连续视觉提示",
          "notes": "PDF page 3 §3.2。\n教学说明：“都提到猫”不代表匹配。查询先融合图文、核对主体与属性，再平均分类logits；修改颜色观察冲突怎样影响判断。\n操作：核对红蓝围巾困难负样本与双向融合。\n计算与界限：手工查询分类logit差：主体1.5、属性红2/蓝−4、其他0；平均后sigmoid得到76.3%/30.3%。无融合属性证据设0为教学反例，非真实模型消融测量。\n所有向量、分数、梯度及概率均为显式手工教学模型，不是真实BLIP-2训练或推理。",
          "componentId": "blip-07",
          "thumbnail": "./thumbnails/itm-cdfcaad43810.jpg",
          "moduleId": "2.4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "从视觉表示到语言生成",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "FC 投影把查询变为连续视觉提示",
          "desc": "装入FC并按目标校准共享矩阵",
          "componentId": "blip-08"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "OPT 与 FlanT5 的生成条件不同",
          "desc": "切换LLM并选取预测位置",
          "componentId": "blip-09"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "两阶段训练分别解决什么问题",
          "desc": "独立开启两阶段，比较提取与接口",
          "componentId": "blip-10"
        }
      ],
      "scenes": [
        {
          "id": "projection",
          "title": "FC 投影把查询变为连续视觉提示",
          "goal": "用同一矩阵改写所有查询的坐标；长度适配和语义适配是两回事。",
          "summary": "2条2维查询Z=[[1,.5],[.2,1]]；目标W=[[1,0,1],[0,1,-1]]；目标P=ZW。W从全零开始，用0.2步长对半平方误差做梯度下降。每行映射使用同一W；2行保持，列数2变3。仅算例；真实是32×768经768×d_LLM投影为32×d_LLM，实际用生成损失而非手工目标。",
          "interaction": "装入FC并按目标校准共享矩阵",
          "next": "OPT 与 FlanT5 的生成条件不同",
          "notes": "PDF page4 §3.3 Figure3。\n本页操作：装入FC并按目标校准共享矩阵。\n科学关系与算例边界：2条2维查询Z=[[1,.5],[.2,1]]；目标W=[[1,0,1],[0,1,-1]]；目标P=ZW。W从全零开始，用0.2步长对半平方误差做梯度下降。每行映射使用同一W；2行保持，列数2变3。仅算例；真实是32×768经768×d_LLM投影为32×d_LLM，实际用生成损失而非手工目标。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-08",
          "thumbnail": "./thumbnails/projection-cdfcaad43810.jpg",
          "moduleId": "3.1"
        },
        {
          "id": "prefix",
          "title": "OPT 与 FlanT5 的生成条件不同",
          "goal": "点选要预测的词：检查OPT与FlanT5在此刻各能看到什么。",
          "summary": "OPT整段因果LM；FlanT5前缀1–4词进encoder、后缀计入loss。点击目标i时仅解码此前的后缀；encoder前缀可经cross-attention访问，非decoder的已生成词。分割与按词显示为教学示意。",
          "interaction": "切换LLM并选取预测位置",
          "next": "两阶段训练分别解决什么问题",
          "notes": "PDF page4 §3.3 Figure3。\n本页操作：切换LLM并选取预测位置。\n科学关系与算例边界：OPT整段因果LM；FlanT5前缀1–4词进encoder、后缀计入loss。点击目标i时仅解码此前的后缀；encoder前缀可经cross-attention访问，非decoder的已生成词。分割与按词显示为教学示意。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-09",
          "thumbnail": "./thumbnails/prefix-cdfcaad43810.jpg",
          "moduleId": "3.2"
        },
        {
          "id": "stages",
          "title": "两阶段训练分别解决什么问题",
          "goal": "先选对视觉信息，再改写成LLM能用的坐标。两步各缺一个试试。",
          "summary": "两维结构算例：阶段一将线索强度从[围巾.2,画框.8]改为[.9,.1]；阶段二将查询坐标换序到LLM输入约定。只有接口适配不能纠正已遗漏信息；只有相关信息也不表示冻结LLM已可读。此独立开关为结构反事实，不是实际独立训练与性能模拟。Figure5定性支持阶段一；未读图估算曲线点。",
          "interaction": "独立开启两阶段，比较提取与接口",
          "next": "零样本 VQA 的提升有明确比较条件",
          "notes": "PDF pages3–4 §§3.2–3.3; page7 Figure5。\n本页操作：独立开启两阶段，比较提取与接口。\n科学关系与算例边界：两维结构算例：阶段一将线索强度从[围巾.2,画框.8]改为[.9,.1]；查询坐标约定[画框,围巾]，LLM需要[围巾,画框]；阶段二将两维换序以适配。未适配时不解读为有效LLM输出。只有接口适配不能纠正已遗漏信息；只有相关信息也不表示冻结LLM已可读。此独立开关为结构反事实，不是实际独立训练与性能模拟。Figure5定性支持阶段一；未读图估算曲线点。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-10",
          "thumbnail": "./thumbnails/stages-cdfcaad43810.jpg",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "实验结果与迁移",
      "modules": [],
      "scenes": [
        {
          "id": "results",
          "title": "零样本 VQA 的提升有明确比较条件",
          "goal": "数值是与人工答案的一致性得分。比较同一任务内的差值。",
          "summary": "Table2零样本：VQAv2 test-dev Flamingo80B56.3，BLIP-2 ViT-g FlanT5XXL65.0，差8.7分；OK-VQA test50.6与45.9差−4.7。VQA得分与多位人工答案一致性相关，单题可部分记分，不能将65.0机械解释为完全答对65%问题。完整系统比较不做Q-Former单变量因果归因。",
          "interaction": "选择同任务比较，读取分数含义与差值",
          "next": "生成、检索与 ITG 消融使用不同协议",
          "notes": "PDF page6 §4.1 Table2。\n本页操作：选择同任务比较，读取分数含义与差值。\n科学关系与算例边界：Table2零样本：VQAv2 test-dev Flamingo80B56.3，BLIP-2 ViT-g FlanT5XXL65.0，差8.7分；OK-VQA test50.6与45.9差−4.7。VQA得分与多位人工答案一致性相关，单题可部分记分，不能将65.0机械解释为完全答对65%问题。完整系统比较不做Q-Former单变量因果归因。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-11",
          "thumbnail": "./thumbnails/results-cdfcaad43810.jpg"
        },
        {
          "id": "transfer",
          "title": "生成、检索与 ITG 消融使用不同协议",
          "goal": "三组结果分别说明：描述迁移、检索迁移，以及ITG带来的增益。",
          "summary": "Table3 NoCaps validation overall CIDEr BLIP113.2、BLIP-2 ViT-g FlanT5XL121.6，差8.4。CIDEr是参考描述相似度指标而非正确率。Table5 Flickr30K1K text→image R@1 BLIP86.7、BLIP-2 ViT-g89.7差3.0个百分点。两者先在COCO微调后迁移；Table6 COCO5K text→image R@1 ITC+ITM67.2，+ITG68.3差1.1个百分点。R@1为正确项首位比例。不同指标/协议不相加。",
          "interaction": "按描述迁移、检索迁移和ITG消融逐组解读",
          "next": "监督 VQA 微调可让问题引导视觉提取",
          "notes": "PDF pages7–8 Tables3,5,6 §§4.2,4.4。\n本页操作：按描述迁移、检索迁移和ITG消融逐组解读。\n科学关系与算例边界：Table3 NoCaps validation overall CIDEr BLIP113.2、BLIP-2 ViT-g FlanT5XL121.6，差8.4。CIDEr是参考描述相似度指标而非正确率。Table5 Flickr30K1K text→image R@1 BLIP86.7、BLIP-2 ViT-g89.7差3.0个百分点。两者先在COCO微调后迁移；Table6 COCO5K text→image R@1 ITC+ITM67.2，+ITG68.3差1.1个百分点。R@1为正确项首位比例。不同指标/协议不相加。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-12",
          "thumbnail": "./thumbnails/transfer-cdfcaad43810.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "应用条件与局限",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "监督 VQA 微调可让问题引导视觉提取",
          "desc": "更换问题并切断问题到查询的路径",
          "componentId": "blip-13"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "视觉提示不能保证生成事实正确",
          "desc": "逐句标记支持、矛盾与未知并修订",
          "componentId": "blip-14"
        }
      ],
      "scenes": [
        {
          "id": "vqa",
          "title": "监督 VQA 微调可让问题引导视觉提取",
          "goal": "问题先改变查询，再改变读图权重；标注答案约束这一提取过程。",
          "summary": "监督VQA微调中问题tokens通过shared self-attention与queries交互，改变cross-attention取图信息；Q-Former、图像编码器可更新，LLM冻结，答案生成损失反传。手工二维q0=[0,0]，问题修正[1,0]/[0,1]；softmax(3q·k)；断开时q=[0,0]两权重均.5。算例用目标区域权重当正确答案概率计算−ln p，非真实VQA预测分布，不推广到所有zero-shot设置。",
          "interaction": "更换问题并切断问题到查询的路径",
          "next": "视觉提示不能保证生成事实正确",
          "notes": "PDF page7 §4.3; page13 Figure7。\n本页操作：更换问题并切断问题到查询的路径。\n科学关系与算例边界：监督VQA微调中问题tokens通过shared self-attention与queries交互，改变cross-attention取图信息；Q-Former、图像编码器可更新，LLM冻结，答案生成损失反传。手工二维q0=[0,0]，问题修正[1,0]/[0,1]；softmax(3q·k)；断开时q=[0,0]两权重均.5。算例用目标区域权重当正确答案概率计算−ln p，非真实VQA预测分布，不推广到所有zero-shot设置。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-13",
          "thumbnail": "./thumbnails/vqa-cdfcaad43810.jpg",
          "moduleId": "5.1"
        },
        {
          "id": "limits",
          "title": "视觉提示不能保证生成事实正确",
          "goal": "同一张图，回答仍可能看错或编造。点选断言，按图像证据改写。",
          "summary": "始终给同一幅猫/红围巾/蓝杯子画。手写示例回答为有一只猫、猫戴蓝围巾、作者是莫奈。图像分别支持、矛盾、无法判断；修订成有一只猫、猫戴红围巾、作者无法仅凭图像确定。均为教学反例，不冒充原论文Figure6真实输出。论文指出LLM错误知识、推理错误、信息过时与继承风险。",
          "interaction": "逐句标记支持、矛盾与未知并修订",
          "next": "返回目录，重做一个机制实验。",
          "notes": "PDF page8 §5; page12 Figure6。\n本页操作：逐句标记支持、矛盾与未知并修订。\n科学关系与算例边界：始终给同一幅猫/红围巾/蓝杯子画。手写示例回答为有一只猫、猫戴蓝围巾、作者是莫奈。图像分别支持、矛盾、无法判断；修订成有一只猫、猫戴红围巾、作者无法仅凭图像确定。均为教学反例，不冒充原论文Figure6真实输出。论文指出LLM错误知识、推理错误、信息过时与继承风险。\n图中实验值来自论文固定表格，所有手工训练/查询算例均与实测区分。",
          "componentId": "blip-14",
          "thumbnail": "./thumbnails/limits-cdfcaad43810.jpg",
          "moduleId": "5.2"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover-cdfcaad43810.jpg"
  }
};
