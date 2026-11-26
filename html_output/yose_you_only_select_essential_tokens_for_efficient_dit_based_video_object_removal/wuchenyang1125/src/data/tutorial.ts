import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "YOSE: You Only Select Essential Tokens for Efficient DiT-based Video Object Removal",
    "titleZh": "YOSE：只选择必要词元的高效 DiT 视频物体去除",
    "venue": "arXiv:2604.27322，2026",
    "authors": "Chenyang Wu, Lina Lei, Fan Li, Chunle Guo, Dehong Kong, Xinran Qin, Zhixin Wang, Mingming Cheng, Chongyi Li",
    "affiliation": "VCIP, CS, Nankai University; NKIARI, Shenzhen Futian; Huawei Noah’s Ark Lab",
    "domain": "视频生成与视频物体去除",
    "coreProblem": "整段词元都被计算，遮罩很小时仍然很慢。",
    "coreInsight": "只计算遮罩内的必要词元，并用 DiffSim 模拟周围对注意力的影响。",
    "keywords": [
      "YOSE",
      "DiT",
      "视频物体去除",
      "BVI",
      "DiffSim"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "整张都涂",
      "desc": "全词元 DiT 对每一格都做去噪。",
      "componentId": "cover-full"
    },
    "newMethod": {
      "title": "只补贴纸",
      "desc": "只处理贴纸盖住的格子。",
      "componentId": "cover-select"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "问题",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "贴纸与全量扫描",
          "desc": "拖动贴纸面积，观察全量扫描不变。",
          "componentId": "photo-sticker"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "计算不随遮罩缩小",
          "desc": "比较常见小遮罩和少见大遮罩。",
          "componentId": "cost-fixed"
        }
      ],
      "scenes": [
        {
          "id": "s-sticker",
          "title": "只该擦掉贴纸",
          "goal": "为什么去掉一个物体，却要重算整段视频？",
          "summary": "视频物体去除只应修改被遮住的区域，但全词元 DiT 仍扫描整张画面。",
          "interaction": "拖动示意贴纸面积，红框保持满幅，被盖住的格数随之变化。",
          "next": "下一页把小遮罩和大遮罩并排，看计算柱是否变化。",
          "notes": "类比：书桌上的生活照被贴纸挡住。贴纸面积是教学示意，不是数据集直方图。论文统计见引言与 4.1 节：YouTube-VOS 和 DAVIS 上约 70% 的例子遮罩比例低于 20%。全量计算的对象是 MiniMax Remover 一类的 DiT 视频物体去除模型。",
          "componentId": "photo-sticker",
          "moduleId": "1.1"
        },
        {
          "id": "s-fixed",
          "title": "遮罩变小，计算不变",
          "goal": "全词元 DiT 的计算量和贴纸大小有关吗？",
          "summary": "无论遮罩看起来小还是大，全量方法的计算柱都一样高。",
          "interaction": "在常见小遮罩和少见大遮罩之间切换。",
          "next": "接下来用三页前置知识说明视频生成、词元和 DiT。",
          "notes": "这一页只建立问题，不展示 YOSE 的加速数字。20% 与 80% 是为了对照后面的实测点而设的示意档位。论文在 4.2 节说明全词元耗时不随遮罩变化；80% 时 YOSE 自己也会因为 VAE 分块回到全量，那是后面的边界，不是这一页的结论。",
          "componentId": "cost-fixed",
          "moduleId": "1.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "预备知识",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "从噪声到画面",
          "desc": "分四步看显影，并区分论文中的 6 步采样。",
          "componentId": "film-develop"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "分块遮罩",
          "desc": "点选一块，判断整个词元是否被遮住。",
          "componentId": "photo-tiles"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "全词元目光",
          "desc": "更换起点，观察目光仍指向所有格子。",
          "componentId": "tile-attention"
        }
      ],
      "scenes": [
        {
          "id": "s-flow",
          "title": "噪声怎样变成画面",
          "goal": "看视频生成之前，先看噪声如何变成照片。",
          "summary": "扩散或流匹配把噪声逐步变成视频。页面上的四步只是示意。",
          "interaction": "点 1 到 4，噪点逐渐褪去。",
          "next": "下一页把这段视频切成 VAE 词元。",
          "notes": "前置知识，不是 YOSE 的实验结果。四步滑块不要说成 MiniMax 的采样日程。论文第 2 节写明 MiniMax Remover 使用 flow matching，最少 6 步，并且不依赖 classifier-free guidance。相关工作还提到 Wan 2.1 等 DiT 视频模型可以在文本、参考帧和遮罩条件下生成视频。",
          "componentId": "film-develop",
          "moduleId": "2.1"
        },
        {
          "id": "s-vae",
          "title": "视频先被切成小块",
          "goal": "一个像素被挡住时，整个词元怎么算？",
          "summary": "3D-VAE 按块编码。块内只要有一个遮罩像素，这个潜空间词元就标成遮罩。",
          "interaction": "在人在的那一块和天空那一块之间切换。",
          "next": "下一页看 DiT 为什么每一格都要互看。",
          "notes": "规则来自补充材料第 7 节、式 (15) 和算法 2：1 减全体 (1-m_i) 的乘积。数值步长 (F_v,H_v,W_v) 在抽取的正文里没有给出，所以 4×3 网格必须标成示意。不能把 RGB 遮罩简单缩放到潜空间，这是论文明确指出的问题。",
          "componentId": "photo-tiles",
          "moduleId": "2.2"
        },
        {
          "id": "s-dit",
          "title": "每一格都要互看",
          "goal": "全词元自注意力的计算会随遮罩变小吗？",
          "summary": "无论从哪一格看，DiT 的目光都铺向所有词元。",
          "interaction": "切换“从人身上看”和“从天空看”。",
          "next": "下一页开始只把贴纸下的格子拎出来。",
          "notes": "蓝线是目光的生活类比，对应自注意力要看全部词元，不是论文里的网络结构图。图 2 的说明写明 MiniMax Remover 采用无交叉注意力的 DiT。类比的边界：线的数量不是 FLOPs，只说明计算范围不随遮罩缩小。",
          "componentId": "tile-attention",
          "moduleId": "2.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "必要词元",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "变长索引",
          "desc": "改变两张照片的遮罩长度，观察托盘补齐，并在抽出和放回之间切换。",
          "componentId": "bvi-tray"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "扩散过程模拟",
          "desc": "拖动混合系数，看色样如何同时使用原图和残差。",
          "componentId": "swatch-sim"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "边界融合",
          "desc": "开关融合，对照 DAVIS 上的 PSNR 和 SSIM。",
          "componentId": "seam-blend"
        }
      ],
      "scenes": [
        {
          "id": "s-bvi",
          "title": "只把贴纸下的格子拎出来",
          "goal": "不同长度的遮罩怎样放进同一批？",
          "summary": "BVI 用正向索引抽出遮罩词元，用反向索引放回，并把短样本补到本批最长。",
          "interaction": "拖动左右照片的格数，再在抽出和放回之间切换。",
          "next": "下一页用色样模拟没有被拎出来的区域。",
          "notes": "对应 3.1 节、式 (1)–(4) 和算法 1。空白格是 padding，不是真实词元。硬索引 Tensor[mask] 会挡住梯度；BVI 用 grid sample。托盘上的格数是教学例子，最大只到 6，不是 81 帧 480p 的 89040 个词元。",
          "componentId": "bvi-tray",
          "moduleId": "3.1"
        },
        {
          "id": "s-sim",
          "title": "用色样模拟周围",
          "goal": "不计算未遮罩词元时，注意力还看得到周围吗？",
          "summary": "DiffSim 把噪声残差和遮罩视频潜变量混成 KV，再交给遮罩内的词元。",
          "interaction": "拖动 G。两端对应只用一项，中间表示两项都用。",
          "next": "下一页处理交界处的接缝。",
          "notes": "式 (5)–(7)：Res = Lat_Nis - Lat_mask，KV = G·Lat_mask + (1-G)·Res，然后再做 (1+S)·KV + Bias。页面只操作 G，颜色是示意，不是论文像素。表 2 在融合打开时，只用 Lat_Nis 的 PSNR 是 27.6164，只用 Lat_mask 是 27.6686，两项都用是 29.5855。不要把滑块读数说成这些 PSNR。",
          "componentId": "swatch-sim",
          "moduleId": "3.2"
        },
        {
          "id": "s-seam",
          "title": "接缝要对齐颜色和纹理",
          "goal": "只重画遮罩时，边界为什么会露出来？",
          "summary": "重叠带上对齐均值和方差，再用原遮罩和膨胀遮罩的平均来混合。",
          "interaction": "关闭或打开融合，数字在表 2 的两行之间切换。",
          "next": "下一页看训练时究竟学习哪些参数。",
          "notes": "3.3 节式 (9)–(12)。重叠区是膨胀遮罩减原遮罩。表 2 的 DAVIS、MiniMax 版本：完整设置为 PSNR 29.5855、SSIM 0.8703；关掉融合为 28.4222 和 0.8606。画面是示意图，不是图 5 的原图。论文图 5 展示去掉融合后的边界痕迹。",
          "componentId": "seam-blend",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "训练与耗时",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "遮罩内损失",
          "desc": "比较只在遮罩内归一化的损失和错误地把背景算进去。",
          "componentId": "train-knobs"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "三个实测速度点",
          "desc": "在 5%、20%、80% 三个论文测点之间切换。",
          "componentId": "mask-speed"
        }
      ],
      "scenes": [
        {
          "id": "s-train",
          "title": "大模型锁住，只学三个旋钮",
          "goal": "YOSE 训练时更新了哪些参数？",
          "summary": "G、S、Bias 可学习，损失只在遮罩内计算。页面上的损失是手算例子。",
          "interaction": "切换“只看遮罩”和“错误地把背景也算上”。",
          "next": "下一页只看论文报告过的三个速度测点。",
          "notes": "式 (13) 是遮罩内 flow-matching 损失，分母是遮罩的 L1。训练细节在第 4 节：只训练 G、S、Bias；8 卡总 batch 32；17 帧；480×832；AdamW 学习率 5e-5；2K 步；约 7 万条 VPData；约 4 小时、一个 epoch。4.5 节另有一组 batch size 4 的 BVI 训练效率对比，约 4 小时对不能处理变长时的约 11 小时。两组设定不要混成同一次实验。手算的 0.4、1.2 等误差不是论文数字。",
          "componentId": "train-knobs",
          "moduleId": "4.1"
        },
        {
          "id": "s-speed",
          "title": "只报告了三个速度测点",
          "goal": "遮罩比例和耗时是怎样一起变化的？",
          "summary": "5% 约 3.3 倍，20% 约 2.5 倍，80% 回到全量。绿柱只表示这些加速比的倒数。",
          "interaction": "点选 5%、20% 或 80%。",
          "next": "下一页看背景有没有被改坏。",
          "notes": "4.2 节和图 2。设置是 81 帧 480p，b=1，n=89040，c=1536，f=8960，h=12，η=30。图 2 说明 20% 遮罩大约 25 FPS。式 (14) 只采用论文印出的与 γ 成正比的主项，后面的省略号不要补全。80% 回到全量是因为 VAE 分块编码。不要把三个点连成一条声称测过的连续曲线。",
          "componentId": "mask-speed",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "实验结果",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "背景指标",
          "desc": "切换数据集和基座，读取 PSNR、SSIM、LPIPS。",
          "componentId": "result-bars"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "VACE 上的背景",
          "desc": "对比原 VACE 和 YOSE（VACE）的成功率与 FPS。",
          "componentId": "vace-keep"
        },
        {
          "kind": "module",
          "id": "5.3",
          "title": "消融",
          "desc": "在表 2 报告过的四行之间切换。",
          "componentId": "ablation-desk"
        }
      ],
      "scenes": [
        {
          "id": "s-score",
          "title": "背景有没有被改坏",
          "goal": "YOSE 相对自己的基座，背景指标怎么变？",
          "summary": "只和同一个基座比。PSNR 升高，但 SSIM 和 LPIPS 不是每一格都更好。",
          "interaction": "切换 YouTube-VOS 或 DAVIS，以及 MiniMax 或 VACE。",
          "next": "下一页专门看 VACE 为什么容易改到背景。",
          "notes": "表 1，测试分辨率 480×832，帧数为 4N+1。YouTube-VOS 选用 90 段较长片段。PSNR 越高越好，SSIM 越高越好，LPIPS 越低越好。需要明确说出的退步：YouTube-VOS 上 YOSE（MiniMax）的 LPIPS 从 0.0615 到 0.0642；DAVIS 上 SSIM 从 0.8723 到 0.8703。VBench 的多列在 HTML 抽取里无法可靠对齐，页面不重排那些小数；正文说 MiniMax 版本的运动平滑和美学质量与基座相当。柱只表示 PSNR 变化，轴最大 6 dB。",
          "componentId": "result-bars",
          "moduleId": "5.1"
        },
        {
          "id": "s-vace",
          "title": "换到 VACE 以后",
          "goal": "YOSE 能不能少改那些不该动的背景？",
          "summary": "原 VACE 会在背景里产生遮罩形状的多余内容。YOSE 把计算限制在遮罩内。",
          "interaction": "在原 VACE 和 YOSE（VACE）之间切换。",
          "next": "下一页拆开 DiffSim 和融合各自的贡献。",
          "notes": "补充材料 9.2、表 3 和图 6。去除成功率 62.2% 到 97.8%。FPS：VACE 0.308，YOSE（VACE）0.417。控制分支不能被 YOSE 加速。YouTube-VOS 背景 PSNR 23.7225 到 29.1917，正文概括为提高 5.47 dB；SSIM 0.8322 到 0.8994。画面中的橙色色块是示意图，不是原图。",
          "componentId": "vace-keep",
          "moduleId": "5.2"
        },
        {
          "id": "s-ablate",
          "title": "拿掉哪一项会掉下去",
          "goal": "残差、原图潜变量和融合各自有什么用？",
          "summary": "只用一项时 PSNR 掉到大约 27.6；关掉融合则掉到 28.4222。",
          "interaction": "在表 2 的四行之间切换。",
          "next": "最后看遮罩大了以后加速为什么消失。",
          "notes": "表 2 与 4.5 节，DAVIS，MiniMax Remover。完整：动态程度 0.5778，美学质量 0.4432，PSNR 29.5855，SSIM 0.8703。只用 Lat_Nis：0.5444，0.4316，27.6164，0.8559。只用 Lat_mask：0.5778，0.4382，27.6686，0.8559。关掉融合：0.5667，0.4320，28.4222，0.8606。未报告的组合不显示。PSNR 柱从 0 起，所以柱高差很小，以数字为准。动态程度和美学质量越高越好。",
          "componentId": "ablation-desk",
          "moduleId": "5.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "失效与修复",
          "desc": "把遮罩调到 80%，再缩回 20% 并打开融合。",
          "componentId": "limit-repair"
        }
      ],
      "scenes": [
        {
          "id": "s-limit",
          "title": "遮罩大了，加速就消失",
          "goal": "什么时候不该期待 YOSE 更快？",
          "summary": "遮罩约 80% 时耗时回到全量。常见的小遮罩仍可加速，融合负责接缝。",
          "interaction": "选择 20%、40%、80%，或一键缩回 20% 并打开融合。",
          "next": "可以回到封面，对比整张都涂和只补贴纸。",
          "notes": "4.2 节：80% 时由于 VAE 分块，计算覆盖全部词元，运行时间回到全量，不会比基座更慢。第 2 节：ROSE 没有固定遮罩，因此没有直接套用 YOSE。补充材料 9.3 与图 7：180 个例子中 76.1% 的遮罩比例在 0–25%，约 75% 的相对质量波动在 ±5% 以内；遮罩变大后波动幅度可到大约 ±25%。40% 这一档没有单独的速度测量，页面只把它当作介于两个实测点之间的遮罩大小，不报告新的加速比。",
          "componentId": "limit-repair",
          "moduleId": "6.1"
        }
      ]
    }
  ]
};
