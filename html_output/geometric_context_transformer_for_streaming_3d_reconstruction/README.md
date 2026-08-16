# GCT PaperSkill

基于论文 *Geometric Context Transformer for Streaming 3D Reconstruction* 制作。

页面包含六章，内容依次解释流式重建的核心矛盾、GCA 三类几何上下文、缓存复杂度、GCT 系统架构、长序列实验，以及运行方式与方法边界，当前共 9 个页面交互模块。

## 本地运行

```bash
npm install
npm run dev       # 开发预览：http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 教程主线

1. 从真实校园步行拍摄场景进入任务，用一个序列长度滑杆同步比较 Full Causal、Sliding Window 与 GCA 的 Mask 可见范围、状态规模和长程参照。
2. 按“一帧组成 → 时间覆盖 → 几何职责”的顺序理解 Anchor、Window 与 Trajectory Memory，严格区分 token 类型与三类 context。
3. 把保留规则代入统一线性尺度，比较 Full Causal 与 GCA 的当前总量、边际增长和非 O(1) 边界。
4. 跟随一帧穿过五阶段 GCT 架构，再通过相机轨迹、时间 token 与分页写入三个交互理解训练、Video RoPE 和 Paged KV。
5. 分开阅读 Oxford 长序列结果与 Table 7 消融，每组数据同时给出“支持什么 / 不能推出什么”，并保留 RPE-rot 反例。
6. 先比较 Direct 与 VO 的运行轨迹，再独立检查显式回环、细节保真与测试时精修三项局限性。

## 页面交互模块（9 个）

1. `1.1 streaming-tradeoff`：单一长度滑杆同步驱动三种 Mask 可见范围与状态组织方式。
2. `2.1 gca-timeline`：三类上下文的一帧组成、时间覆盖、职责和生命周期。
3. `3.1 memory-complexity-exact`：两种缓存状态规模的精确比较。
4. `4.1 gct-pipeline`：GCT 主干、双输出头与缓存更新路径。
5. `4.2 training-support`：沿训练轨迹拖动当前相机，观察 24→320 views、移动窗口与局部相对位姿监督。
6. `4.3 video-rope-demo`：沿时间轴拖动同一个 token，对比未编码状态与 Video RoPE 时间相位。
7. `4.4 paged-kv-demo`：逐页写入动态 KV，并核对 FlashInfer 性能条件。
8. `5.1 long-sequence-evidence`：Oxford 长序列与 Window 消融的证据边界。
9. `6.1 applicability-boundary`：Direct / VO 轨迹与三项常驻局限性。

以上模块均在章节正文中直接显示，当前页面不再生成“技术补充”折叠区。模块头部的标签会区分机制示意、论文机制、公式推导、论文实现、论文数据与运行边界；保留的论文结果图也和交互拆解分区展示。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `src/data/tutorial.ts` | 六章教程文案、公式、论文图与模块配置 |
| `src/modules/*.tsx` | 论文专属 Canvas 交互组件 |
| `src/modules/registry.tsx` | `componentId` 与组件的注册表 |
| `public/images/*` | 本地论文图像资源 |
| `src/components/*` | Hero、章节导航、公式、模块容器等展示组件 |
| `src/styles/*` | 设计令牌、通用组件和论文主题样式 |

## 配色语义

- `--blue`：引导或当前状态
- `--green`：成功状态或本文方法
- `--red`：失败状态或传统方法
- `--orange`：用户强调
- `--purple`：辅助机制

这些颜色承担固定语义，不应在单个模块中重新定义成相反含义。
