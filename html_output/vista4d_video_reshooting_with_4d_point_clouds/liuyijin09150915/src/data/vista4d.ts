export type SectionId =
  | "hero"
  | "section-1"
  | "section-2"
  | "section-3"
  | "section-4"
  | "section-5"
  | "section-6"
  | "section-7"
  | "section-8"
  | "section-9"
  | "final";

export const learningSections: Array<{ id: SectionId; label: string; short: string }> = [
  { id: "hero", label: "论文首页", short: "Vista4D 概览" },
  { id: "section-1", label: "§1 重拍之前", short: "为什么需要视频重拍" },
  { id: "section-2", label: "§2 搭建虚拟片场", short: "4D 点云构建" },
  { id: "section-3", label: "§3 保持静态场景", short: "时间持久性" },
  { id: "section-4", label: "§4 移动摄影机", short: "几何伪影" },
  { id: "section-5", label: "§5 面向不完美训练", short: "多视角训练对" },
  { id: "section-6", label: "§6 联合原视频", short: "联合条件输入" },
  { id: "section-7", label: "§7 完整流程", short: "数据如何流动" },
  { id: "section-8", label: "§8 实验结果与消融", short: "逐项阅读指标" },
  { id: "section-9", label: "§9 扩展应用", short: "应用与局限" },
  { id: "final", label: "最终回顾", short: "重建论文论证" },
];

export type PipelineStep = {
  id: string;
  title: string;
  input: string;
  operation: string;
  output: string;
  tone: "source" | "method" | "camera" | "prior";
  lane: "source" | "geometry" | "control" | "generation";
  payload: "frame" | "mask" | "point" | "camera" | "latent" | "video";
};

export const pipelineSteps: PipelineStep[] = [
  { id: "source", title: "原始视频", input: "单目源视频 Xsrc", operation: "提供已经拍摄的动态，以及内容与外观参考。", output: "随时间变化的 RGB 帧", tone: "source", lane: "source", payload: "frame" },
  { id: "segment", title: "动态分割", input: "源视频 RGB 帧", operation: "分割动态像素，再取反得到静态区域。", output: "静态像素掩码 Mstc", tone: "source", lane: "source", payload: "mask" },
  { id: "reconstruct", title: "4D 重建", input: "源视频", operation: "估计源深度 Dsrc、内参 Ksrc 与外参 Tsrc。", output: "逐帧深度与源摄影机", tone: "method", lane: "geometry", payload: "point" },
  { id: "world", title: "世界坐标点", input: "Xsrc、Dsrc、Ksrc、Tsrc", operation: "逆投影像素，并把每帧变换到统一世界坐标（公式 1）。", output: "逐帧 3D 点云 P", tone: "method", lane: "geometry", payload: "point" },
  { id: "persistent", title: "静态点跨帧持续", input: "P + 静态掩码 Mstc", operation: "仅让静态像素对应的点跨帧保留；动态像素仍属于各自时间帧。", output: "时间持久性点云 P̄", tone: "method", lane: "geometry", payload: "point" },
  { id: "camera", title: "目标摄影机", input: "用户指定的轨迹", operation: "为每个输出帧指定目标内参与外参 Ctgt。", output: "精确的摄影机控制信号", tone: "camera", lane: "control", payload: "camera" },
  { id: "render", title: "目标视角渲染", input: "P̄ + Ctgt", operation: "从目标摄影机渲染点云，并记录覆盖区域。", output: "Xsrc→tgt + α 覆盖掩码 Msrc→tgt", tone: "camera", lane: "control", payload: "frame" },
  { id: "tokens", title: "联合上下文令牌", input: "Xsrc、Xsrc→tgt、Msrc→tgt、带噪目标", operation: "VAE 编码、patchify，并沿帧维拼接令牌。", output: "外观 + 几何 + 目标潜变量上下文", tone: "source", lane: "generation", payload: "latent" },
  { id: "diffusion", title: "微调 Video DiT", input: "联合令牌 + Plücker 目标摄影机嵌入", operation: "利用视频先验提升对不完美几何的鲁棒性。", output: "目标视频潜变量的预测流", tone: "prior", lane: "generation", payload: "latent" },
  { id: "output", title: "重拍视频", input: "生成的目标潜变量", operation: "解码目标序列。", output: "用户指定新机位下、保持原动态的视频", tone: "method", lane: "generation", payload: "video" },
];

export const equationOneSymbols = {
  Xsrc: { label: "Xsrc", detail: "源 RGB 视频；为每个像素提供颜色与内容。", stage: "rgb" },
  Dsrc: { label: "Dsrc", detail: "源视频逐帧深度；决定像素沿相机射线被推到多远。", stage: "depth" },
  Ksrc: { label: "Ksrc", detail: "源相机内参；把像素坐标与相机射线联系起来。", stage: "camera" },
  Tsrc: { label: "Tsrc", detail: "源相机外参；描述相机相对世界坐标的位置与朝向。", stage: "camera" },
  inverse: { label: "Φ⁻¹", detail: "逆透视投影；联合 RGB、深度与内参，把 2D 像素提升为相机空间 3D 点。", stage: "backproject" },
  omega: { label: "Ω", detail: "世界坐标变换；用外参将每帧相机空间点云注册到统一世界。", stage: "world" },
  P: { label: "P", detail: "公式 (1) 得到的世界坐标逐帧 3D 点云；它还不是经过静态像素跨帧持久化后的 P̄。", stage: "pointcloud" },
} as const;

export const equationTwoSymbols = {
  Xtgt: { label: "Xtgt_t", detail: "扩散时间 t 上的带噪目标视频表示，是网络当前要去噪的对象。", stage: "target" },
  render: { label: "Xsrc→tgt", detail: "源 4D 点云按目标相机渲染出的粗糙视频，提供显式几何。", stage: "pointcloud" },
  mask: { label: "Msrc→tgt", detail: "点云渲染的 α 覆盖掩码，告诉模型哪里有几何证据。", stage: "mask" },
  source: { label: "Xsrc", detail: "原始源视频，作为内容与外观参考，并帮助传播几何与外观信息。", stage: "source" },
  camera: { label: "Ctgt", detail: "用户指定的目标相机 Ctgt=(Ktgt,Ttgt)，通过 Plücker 嵌入注入模型。", stage: "camera" },
  time: { label: "t", detail: "Flow Matching 的扩散时间步，用于确定当前噪声状态。", stage: "time" },
  model: { label: "εθ", detail: "参数为 θ 的微调视频扩散 Transformer；在这里预测 Flow Matching 速度。", stage: "model" },
  velocity: { label: "V", detail: "Flow Matching 的目标速度，论文定义为 V = Xtgt − ε。", stage: "target" },
  noise: { label: "ε", detail: "用于构造带噪目标视频 Xtgt_t 的采样高斯噪声。", stage: "target" },
} as const;

export const cameraRows = [
  ["ReCamMaster", "1.574", "12.79", "11.16", "23.66"],
  ["CamCloneMaster", "2.132", "23.77", "6.422", "23.38"],
  ["TrajectoryCrafter", "1.434", "6.838", "6.671", "120.5"],
  ["EX-4D", "1.325", "5.941", "5.182", "13.11"],
  ["GEN3C", "1.309", "4.751", "5.085", "12.99"],
  ["Vista4D", "1.251", "4.647", "4.927", "7.504"],
] as const;

export const nvsRows = [
  ["ReCamMaster", "10.84", "0.444", "0.692", "10.96", "0.262", "0.755", "4.681"],
  ["CamCloneMaster", "11.14", "0.444", "0.651", "11.17", "0.260", "0.713", "4.318"],
  ["TrajectoryCrafter", "13.82", "0.492", "0.569", "13.06", "0.320", "0.656", "2.375"],
  ["EX-4D", "12.85", "0.479", "0.596", "12.64", "0.305", "0.669", "4.269"],
  ["GEN3C", "12.19", "0.447", "0.608", "12.06", "0.260", "0.679", "3.019"],
  ["Vista4D", "14.09", "0.480", "0.461", "14.14", "0.310", "0.514", "1.142"],
] as const;

export const fidelityRows = [
  ["ReCamMaster", "94.15", "1.203", "0.319", "0.552", "0.701", "0.913", "0.934", "0.243", "0.759"],
  ["CamCloneMaster", "101.4", "1.406", "0.321", "0.560", "0.709", "0.886", "0.915", "0.247", "0.711"],
  ["TrajectoryCrafter", "125.6", "1.640", "0.305", "0.509", "0.650", "0.854", "0.906", "0.241", "0.790"],
  ["EX-4D", "124.6", "1.481", "0.296", "0.480", "0.660", "0.849", "0.894", "0.226", "0.687"],
  ["GEN3C", "113.5", "1.441", "0.318", "0.519", "0.660", "0.857", "0.913", "0.245", "0.775"],
  ["Vista4D", "105.4", "1.418", "0.326", "0.567", "0.716", "0.883", "0.916", "0.253", "0.857"],
] as const;

export const userStudy = [
  ["源内容保持", "67.06%"],
  ["摄影机准确性", "68.17%"],
  ["整体保真度", "77.38%"],
] as const;

export const trainingDetails = [
  ["基础模型", "Wan2.1-T2V-14B"],
  ["阶段 1", "672 × 384，训练 30,000 步"],
  ["阶段 2", "1280 × 720，训练 300 步"],
  ["片段 / 优化器", "49 帧，全局批大小 8，AdamW，学习率 1 × 10⁻⁵"],
  ["数据混合", "重建多视角与单目训练对按 1:1 混合"],
  ["参与训练", "Xsrc 与 Xsrc→tgt 的 patchify 层、自注意力、摄影机编码器与投影器"],
  ["保持冻结", "其余预训练视频模型参数"],
] as const;

export const officialMedia = {
  source: "https://raw.githubusercontent.com/Eyeline-Labs/Vista4D/main/media/single/couple-newspaper.mp4",
  reshoot: "/official/vista4d-reshooting-demo.mp4",
  expansion: "https://eyeline-labs.github.io/Vista4D/media/dse_lounge-man-4_arc-right-left_s65991.mp4",
  recomposition: "https://eyeline-labs.github.io/Vista4D/media/edit_hike.mp4",
  longVideo: "https://eyeline-labs.github.io/Vista4D/media/long_money-count.mp4",
} as const;
