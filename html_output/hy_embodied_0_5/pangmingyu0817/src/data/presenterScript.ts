export type PresenterScriptBlock = {
  time: string;
  title: string;
  visual: string;
  action: string;
  speech: Array<{ kind: 'paragraph' | 'quote'; text: string }>;
};

export const presenterScript: Record<string, PresenterScriptBlock> = {
  hero: {
    time: '0:00–0:18',
    title: '开场：机器人“看懂”为什么还不够？',
    visual: '停留在首页，指向左右两幅厨房图。',
    action: '讲完本段后，点击“4 分钟精讲”。',
    speech: [
      { kind: 'paragraph', text: '同一个红杯任务，既要锁定目标，也要理解杯柄、深度、障碍和安全路径。通用 VLM 的场景描述，并不能直接支撑机器人行动。' },
      { kind: 'quote', text: '从“看图说话”到“在物理世界中行动”' },
      { kind: 'paragraph', text: '全文主线：看得准 → 想得明白 → 跑得起来。' },
    ],
  },
  'chap-1': {
    time: '0:18–0:48',
    title: '第一站：从语义识别到可行动感知',
    visual: '进入“从‘这是红杯’到‘从杯柄抓’”。',
    action: '依次点击“通用 VLM—目标定位—精确边界—相对深度—可抓取点”。',
    speech: [
      { kind: 'paragraph', text: '类别只回答“是什么”；定位、边界、深度与抓取点，才逐步回答“哪一个、在哪里、离我多远、从哪里接触”。' },
      { kind: 'quote', text: 'Semantic Recognition ≠ Actionable Perception' },
      { kind: 'paragraph', text: '论文在预训练中引入 2D/3D Grounding、深度估计和图像分割等数据，为物理接触提供更细粒度的空间证据。' },
    ],
  },
  'chap-3': {
    time: '0:48–1:30',
    title: '第二站：为什么图像块不能完全照搬语言的注意力？',
    visual: '进入 Attention Mask Playground。',
    action: '先选择“标准因果注意力”，点击“图1·2”；再切换到“HY-Embodied MoT”。',
    speech: [
      { kind: 'paragraph', text: '语言具有生成顺序，适合因果注意力；图像需要同时理解局部之间的空间关系，不应被强制从左到右读取。' },
      { kind: 'paragraph', text: 'MoT 为视觉与文本使用模态专属的 QKV 和 FFN：同一视觉元素内部双向互看，文本与输出继续沿全局因果路径生成。' },
      { kind: 'quote', text: '视觉负责同时看清，语言负责逐步生成。' },
    ],
  },
  'chap-5': {
    time: '1:30–2:12',
    title: '第三站：终点正确，路径就一定正确吗？',
    visual: '进入 Trajectory Sandbox。',
    action: '先保留“直线路径”，指向碰撞提示；再点击“上方绕行”。',
    speech: [
      { kind: 'paragraph', text: '终点接近目标，并不代表轨迹可执行；路径中途穿过障碍，在物理世界中就是失败。' },
      { kind: 'paragraph', text: '论文使用 DTW、Fréchet Distance 和可选的终点一致性，对路径形状、顺序与终点提供连续反馈。页面中的碰撞项为教学示意。' },
      { kind: 'quote', text: '评价轨迹，必须看整条路，而不只看终点。' },
    ],
  },
  'chap-7': {
    time: '2:12–3:10',
    title: '第四站：老师为什么要跟到学生犯错的地方？',
    visual: '进入 On-Policy Distillation。',
    action: '先点击 t=2，再点击 t=3、t=4，展示教师轨迹和学生轨迹逐渐分叉。',
    speech: [
      { kind: 'paragraph', text: '离线蒸馏只覆盖教师的标准轨迹；学生部署时一旦走偏，就可能进入训练中未被监督的状态。' },
      { kind: 'paragraph', text: 'OPD 先让学生 rollout，再让教师在相同的学生前缀上给出下一 token 分布，并以 KL 散度对齐学生。' },
      { kind: 'quote', text: '教师跟到学生真正走到的状态上纠偏。' },
      { kind: 'paragraph', text: '作用：缩小训练与推理的状态错配，把大模型的推理过程迁移到 MoT-2B。' },
    ],
  },
  'chap-8': {
    time: '3:10–4:00',
    title: '第五站：从 VLM 的“脑”到机器人的“手”',
    visual: '进入最终 VLA 闭环，最后停留在 SUCCESS 状态。',
    action: '连续点击“执行下一步”，依次点亮“看准目标—理解行动—端侧推理—连续控制”。',
    speech: [
      { kind: 'paragraph', text: '完整链路：细粒度感知 → 可供性与轨迹推理 → MoT-2B 部署侧推理 → Action Expert 连续控制。' },
      { kind: 'paragraph', text: 'HY-Embodied-0.5 首先是具身 VLM；接入 Action Expert 后，才构成输出机器人动作的 VLA。' },
      { kind: 'paragraph', text: '真实机器人结果：精密插接收纳 85%、餐具堆叠 80%、挂杯 75%；每模型每任务 20 次。堆叠任务低于 π0.5，不能表述为所有任务均领先。' },
      { kind: 'quote', text: '看清物理细节 → 理解行动结构 → 在学生状态上蒸馏 → 转化为连续动作' },
      { kind: 'paragraph', text: '从“我知道这是什么”，走向“我知道怎样安全地对它采取行动”。' },
    ],
  },
};
