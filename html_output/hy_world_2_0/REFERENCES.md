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

## 论文中的相关比较资料

| 资料 | 链接 | 与本教程的关系 |
| --- | --- | --- |
| Google DeepMind Genie 3 | [官方介绍](https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/) | 用于理解交互式世界模型的产业背景；不能与 HY-World 2.0 的论文指标直接横向比较 |
| World Labs Marble | [官方体验页](https://marble.worldlabs.ai/) | 论文只给出定性比较，因此教程明确避免把 Marble 写成统一协议下的定量基线 |

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
