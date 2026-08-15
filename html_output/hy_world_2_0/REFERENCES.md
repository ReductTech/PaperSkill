# HY-World 2.0 参考资料导航

本文档汇总 HY-World 2.0 教程使用的外部资料，并标明资料层级、适合解决的问题和使用边界。资料于 2026-08-16 联网核验。论文事实、公式和实验数字以论文为准；官方网页用于确认当前产品与开源状态；第三方文章只用于补充讲解视角。

## 一手论文与官方入口

| 资料 | 链接 | 已核验信息 | 使用边界 |
| --- | --- | --- | --- |
| arXiv 论文 | [HY-World 2.0](https://arxiv.org/abs/2604.14268) | 方法、公式、实验协议、消融、效率与局限 | 教程中的定量结论以此为准 |
| 腾讯混元项目主页 | [HY-World 2.0 Project Page](https://3d-models.hunyuan.tencent.com/world/) | 支持文本、图像和视频输入；展示 HY-Pano 2.0、WorldNav、HY-WorldStereo、HY-WorldMirror 2.0 四阶段；可导出 3DGS、Mesh、点云和视频 | 产品案例和宣传表述不能替代论文中的统一评测协议 |
| 官方 GitHub | [Tencent-Hunyuan/HY-World-2.0](https://github.com/Tencent-Hunyuan/HY-World-2.0) | 提供代码、模型表、单卡/多卡命令、Python Pipeline 与 Gradio 入口 | 可用模块、参数和硬件要求会随仓库更新，应在运行前再次检查 |
| 中文 README | [README_zh.md](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/README_zh.md) | 中文项目总览、开放进度、模型列表和快速使用入口 | 总览信息应与更详细的文档、代码和许可证一起阅读 |
| 中文使用文档 | [DOCUMENTATION_zh.md](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/DOCUMENTATION_zh.md) | 环境、推理参数、多 GPU 和 Gradio 使用说明 | 命令可能随提交变化，复现时以当前分支为准 |
| 腾讯官方体验页 | [混元 3D - Scene to 3D](https://3d.hunyuan.tencent.com/sceneTo3D) | 当前未登录访问会进入腾讯混元 3D 登录页 | 需要登录后才能创建；产品参数、排队和权限不等同于论文实验设置 |

## 官方开放进度

以下时间线来自官方 GitHub README 的 News 区域，反映“当前仓库开放了什么”，不代表论文方法在这些日期才提出。

| 日期 | 官方仓库记录的开放内容 |
| --- | --- |
| 2026-04-16 | 发布技术报告、部分代码，以及 WorldMirror 2.0 推理代码与模型 |
| 2026-05-11 | 发布 HY-Pano 2.0 推理代码与模型 |
| 2026-05-18 | 发布 World Generation 推理代码，并开放 WorldStereo 2.0 模型 |
| 2026-07 | README 增加 HY World 2.1 产品更新说明；它是后续产品进展，不应混写为 2.0 论文贡献 |

仓库文档还说明：`WorldMirrorPipeline` 提供类似 Diffusers 的 Python 调用方式；首次运行会从 Hugging Face 下载权重；多 GPU 模式下输入图像数量不得少于 GPU 数量；Gradio 页面可查看 3DGS、点云、深度、法线和相机参数。

## 官方动态素材

以下 GIF 来自官方 GitHub 的 `assets/` 目录。本教程将它们下载到本地并压缩，避免运行时依赖外部图片链接；素材只用于解释“官方当前展示了什么”，不承担论文实验数字的证据角色。

| 教程文件 | 官方原文件 | 教程用途 | 证据边界 |
| --- | --- | --- | --- |
| `official-reconstruction.gif` | [`assets/recon_en.gif`](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/assets/recon_en.gif) | 第 8 章展示多视图/视频到三维资产的重建流程 | 产品/仓库演示，不代表所有输入都能达到相同效果 |
| `official-mesh.gif` | [`assets/mesh_en.gif`](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/assets/mesh_en.gif) | 第 9 章展示可漫游的轻量 Mesh | 说明资产形态与漫游体验，不是网格质量的统一指标 |
| `official-interactive.gif` | [`assets/interactive.gif`](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/assets/interactive.gif) | 第 9 章展示角色移动、碰撞与空间交互 | 说明官方演示能力，不等同于论文中的定量性能结论 |

所有动态素材的公开使用仍受官方仓库当前许可证与 Notice 要求约束。本教程 README 已逐项标注来源，压缩版本未加入新的视觉内容或结论。

## 模型权重平台

| 平台 | 链接 | 适合查看 | 使用前检查 |
| --- | --- | --- | --- |
| Hugging Face | [tencent/HY-World-2.0](https://huggingface.co/tencent/HY-World-2.0) | 官方模型卡、文件与权重下载入口 | 核对具体子模型、文件大小、访问状态和本地存储空间 |
| ModelScope | [Tencent-Hunyuan/HY-World-2.0](https://modelscope.cn/models/Tencent-Hunyuan/HY-World-2.0) | 国内模型镜像与模型信息 | 核对页面版本是否与 GitHub 当前代码匹配 |

模型平台“存在下载入口”不等于本机能够直接运行完整管线。复现前仍需按官方文档检查 GPU、显存、CUDA/PyTorch 版本、权重体积和多 GPU 输入约束。

## 许可证与使用边界

官方仓库使用自定义的 [Tencent HY-WORLD 2.0 Community License Agreement](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt)，发布日期为 2026-04-15。它不是可直接按 MIT、Apache-2.0 等标准宽松许可证理解的通用开源许可。

需要特别检查的条款包括：

- 许可地域排除欧盟、英国和韩国，相关地区不适用该协议授予的权利。
- 若被许可方在 2.0 版本发布日期时，全部产品或服务上一自然月的月活跃用户超过 100 万，需要另行向腾讯申请许可。
- 分发模型或衍生作品时需要附带协议、修改说明和指定 Notice；向第三方提供产品或服务时还有主体披露要求。
- 模型输出本身不被视为 Model Derivatives；协议写明腾讯不主张用户生成输出的权利，但用户仍需对输出及后续使用负责。
- 协议限制使用模型或输出改进其他 AI 模型，并包含可接受使用政策、地域和免责声明等其他约束。

上述内容仅是教程中的阅读提示，不构成法律意见。用于研究发布、商业产品、模型再分发或训练其他模型前，应阅读许可证全文并进行合规审查。

## 世界模型概念与发展史

本教程第 1 章新增的世界模型科普模块采用“任务与表示形式”的教学坐标，不把所有名为 world model 的工作视为同一种系统。以下资料用于解释概念演进，不能替代 HY-World 2.0 论文的事实与实验。

| 资料 | 链接 | 教程中的用途 | 使用边界 |
| --- | --- | --- | --- |
| World Models | [arXiv 1803.10122](https://arxiv.org/abs/1803.10122) | 说明学习压缩视觉状态、环境动力学与控制器的经典世界模型路线 | 2018 年工作不是生成式三维资产系统，不应直接套用 HY-World 的输出定义 |
| Genie 2 | [Google DeepMind 官方介绍](https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/) | 说明动作条件、可交互像素环境如何成为现代生成式世界模型的一条路线 | 官方博客是产品/研究概览，不能与 HY-World 2.0 的三维指标直接比较 |
| HY-World 2.0 “Why 3D World Models?” | [官方 README](https://github.com/Tencent-Hunyuan/HY-World-2.0#why-3d-world-models) | 解释逐帧视频生成与持久显式三维资产的输出范式差别 | README 的概括性比较用于建立直觉，具体性能仍需回到论文协议与表格 |

教程将“生成”理解为补出未观察内容，将“重建”理解为利用观察恢复空间关系，将“模拟”理解为世界状态可随动作或规则继续变化。这个划分是教学框架，不是声称所有文献都采用同一术语定义。

## 论文中的相关比较资料

### 模型能力进化图鉴的比较对象

第 10 章模块 10.2 将下列资料整理为“模型 × 功能”矩阵。矩阵状态只描述当前资料明确覆盖的能力范围：“论文未报告”不等于“不支持”，“仅定性”也不等于已经完成统一协议下的定量验证。

| 模型或资料 | 链接 | 在图鉴中的定位 | 可用于支持的结论 | 不能据此推出 |
| --- | --- | --- | --- | --- |
| HY-World 1.0 | [官方 GitHub](https://github.com/Tencent-Hunyuan/HunyuanWorld-1.0) | 系统级前代 | 从文字或图像生成可探索、交互式显式 3D 世界；论文表 4 还把它作为 I2P 基线 | 不能把 1.0 未出现的 2.0 模块直接写成“1.0 完全不支持” |
| HY-World 1.5 / WorldPlay | [官方 GitHub](https://github.com/Tencent-Hunyuan/HY-WorldPlay) | 在线视频前代 | 以用户动作驱动实时像素视频世界，代表与 2.0 不同的在线视频路线 | 不能用在线响应速度直接证明其三维资产能力优于或弱于 2.0 |
| WorldMirror 1.0 | [论文](https://arxiv.org/abs/2510.10726) · [官方 GitHub](https://github.com/Tencent-Hunyuan/HunyuanWorld-Mirror) | 重建分支前代 | 任意先验提示、前馈多任务三维重建；2.0 论文表 3、表 11、表 14 给出升级点与结果 | 它是重建子系统，不是完整世界生成系统，不能和 HY-World 2.0 做单一总分排名 |
| GenEx | [论文](https://arxiv.org/abs/2412.09624) · [项目页](https://genex.world/) | 单图到全景探索参照 | 单图生成连续 360° 全景视频、智能体探索；HY-World 2.0 表 4 的 I2P 子表提供兼容数字 | 表 4 只能支持全景子任务比较，不能证明 HY-World 2.0 在 GenEx 的所有智能体任务上领先 |
| video2world | [HY-World 2.0 对比章节](https://arxiv.org/abs/2604.14268) | 视频转点云/3DGS 工程参照 | 论文报告 feature-matched ICP 约 5 小时/场景，而相机先验线性对齐少于 2 分钟 | 该加速结论只覆盖论文报告的生成场景对齐流程，不能推广到所有真实视频与硬件 |
| Marble 1.0 | [官方体验页](https://marble.worldlabs.ai/) | 闭源商业参照 | 论文截至 2026-03-30 的同全景/同单图定性案例，可讨论输入忠实度、纹理和几何完整性 | 没有统一协议定量表，不能生成虚构分数、胜率或红叉排名 |
| HY-World 2.0 | [论文](https://arxiv.org/abs/2604.14268) · [官方 GitHub](https://github.com/Tencent-Hunyuan/HY-World-2.0) | 目标模型 | 文本/单图生成、多图/视频重建、3DGS/Mesh/点云输出和 WorldLens 运行时交互 | 完整世界生成仍约 712 秒；5.60 秒只属于 H20 四卡、128 视图重建步骤 |

### 更广的产业背景

| 资料 | 链接 | 与本教程的关系 |
| --- | --- | --- |
| Google DeepMind Genie 3 | [官方介绍](https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/) | 用于理解交互式视频世界模型的产业背景；不能与 HY-World 2.0 的论文指标直接横向比较 |
| HY-World 2.0 官方 README 的“视频模型 vs 3D 模型”说明 | [英文 README](https://github.com/Tencent-Hunyuan/HY-World-2.0#why-3d-world-models) | 用于理解持久三维资产与逐帧视频生成的输出范式差别；宣传性总表仍需回到论文实验核对 |

## 中文解读与讨论

| 文章 | 作者与时间 | 适合查看 | 核验提示 |
| --- | --- | --- | --- |
| [HY-World 2.0：生成辅助重建的完整开源](https://zhuanlan.zhihu.com/p/2028273802144936616) | 微卷的大白；编辑于 2026-04-20 | 视频生成、前馈 3DGS、生成辅助重建和四阶段管线的技术直觉 | 作者明确包含个人体验与判断；涉及 Marble 效果、运行体验和工程评价时不能当作论文结论 |
| [HY-World 2.0：完整的 3D 物理世界生成与模拟系统](https://zhuanlan.zhihu.com/p/2028634721966367663) | Loster；编辑于 2026-04-18 | 面向游戏、设计和具身智能应用的整体介绍 | 文中有较强的概括与宣传性措辞；“完美重建”等表达应回到论文和官方页面核对，不能直接写入教程事实层 |

知乎文章适合补充术语解释、行业背景和阅读路线。本教程不会用第三方文章替代论文的模型结构、训练设置、实验数字或局限，也不会把文章作者的体验判断升级为官方结论。

## 推荐阅读顺序

1. 先阅读本交互教程，建立“生成辅助重建”的整体地图。
2. 回到 arXiv 论文核对公式、表格、实验协议和限制条件。
3. 在项目主页查看官方案例，并把产品展示与论文证据分开记录。
4. 进入 GitHub 的中文 README 与使用文档，确认当前开放模块、权重和运行命令。
5. 阅读许可证全文，再决定是否下载、部署、分发或用于商业项目。
6. 最后使用在线体验或中文文章补充直觉；任何新增结论都回到论文或官方仓库复核。

## 本地来源说明

本次整理同时使用仓库中的 `2604.14268v1.pdf`。论文 PDF 首页明确给出了项目主页、GitHub 和腾讯体验页链接；PDF 元数据给出了 Team HY-World 作者列表、标题和 arXiv 标识。
