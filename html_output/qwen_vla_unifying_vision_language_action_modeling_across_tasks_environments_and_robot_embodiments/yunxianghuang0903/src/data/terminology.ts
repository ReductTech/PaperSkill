/** 全文术语字典 — 以 qwen_vla.pdf 为唯一事实依据 */

export const T = {
  tasks: {
    manipulation: '机器人操纵',
    manipulationShort: '操纵',
    vln: '视觉-语言导航（VLN）',
    vlnShort: '视觉导航',
    trajectory: '轨迹预测',
    egocentricAction: '第一视角人体动作建模',
    egocentricActionShort: '人体动作',
    egocentricDemo: '第一视角人体示范',
  },
  embodiment: {
    robotEmbodiment: '机器人本体',
    config: '本体配置',
    description: '本体描述',
    prompt: '本体感知提示',
    promptFirst: '本体感知提示（embodiment-aware prompt）',
    promptShort: '本体感知提示',
    conditioning: '本体感知提示条件化',
  },
  control: {
    convention: '控制约定',
    nativeConvention: '原生控制约定',
    semantics: '控制语义',
    horizon: '预测时域 H',
  },
  model: {
    vlmBackbone: '视觉-语言骨干网络',
    qwenVlm: 'Qwen3.5 视觉-语言模型（VLM）',
    actionExpert: 'DiT 动作专家',
    flowDecoder: '基于 DiT 的流匹配动作解码器',
    generalist: '通用模型',
    generalistPolicy: '通用策略',
    specialist: '专用模型',
    specialistPolicy: '专用策略',
    qwenVla: 'Qwen-VLA',
  },
  action: {
    chunk: '动作块',
    noisyChunk: '噪声动作块',
    clean: '目标动作',
    cleanChunk: '目标动作块',
    vlmHidden: 'VLM 隐状态',
    jointSequence: '联合序列',
    jointSelfAttn: '联合自注意力',
    adaln: 'AdaLN 时间步条件',
    flowMatching: '流匹配（Flow Matching）',
    velocityField: '条件速度场',
    euler: '欧拉积分',
  },
  unified: {
    framework: '统一动作与轨迹预测框架',
    tensorInterface: '统一张量接口',
    zeroPad: '零填充',
    validityMask: '有效性掩码',
    physicalSemantics: '物理动作语义',
  },
  training: {
    t2a: '文本到动作 DiT 预训练',
    cpt: '持续预训练',
    sft: '监督微调',
    rl: '强化学习',
    actionPrior: '动作先验',
    visualGrounding: '视觉落地',
    visualGroundingFull: '视觉落地（visual grounding）',
    taskSpec: '任务专精',
    closedLoop: '闭环任务成功率',
    multiTaskSft: 'Multi-task SFT',
    realRobotSft: 'Real-robot SFT',
  },
  ood: {
    title: '真实世界 OOD 泛化',
    badge: '压力测试',
    color: '颜色泛化',
    instance: '实例泛化',
    position: '位置泛化',
    background: '背景泛化',
    instruction: '指令泛化',
  },
  platforms: {
    widowx: 'WidowX',
    aloha: 'Mobile ALOHA',
    vln: 'VLN',
  },
  nav: {
    os: 'OS',
    osTooltip: 'Oracle Success',
    slidingWindow: '滑动窗口航点预测',
  },
  domino: {
    title: '跨任务泛化：视觉导航与动态操纵',
    currentFrame: '当前帧观测',
    zeroShot: '零样本动态操纵',
  },
} as const;

/** Hero 左侧任务族标签 */
export const HERO_TASK_LABELS = [
  T.tasks.manipulationShort,
  T.tasks.vlnShort,
  T.tasks.egocentricActionShort,
] as const;

/** Hero 右侧本体/控制配置 */
export const HERO_EMB_LABELS = [T.platforms.widowx, T.platforms.aloha, T.platforms.vln] as const;
