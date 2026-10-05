import type { SymbolCard } from '../types';

// 符号概念卡片 —— 论文 §4–§5 全量记号（形状/大小写/下标与原文一致）
export const symbolData: SymbolCard[] = [
  // ---- 任务符号 ----
  { sym: 'S', name: 'Success indicator', zh: '成功指示（二值）', def: '成功指示变量：agent 在目标 0.2m 内 stop 即为 1，否则为 0。', intuition: '解读：像“送达没有”——只问结果，不看过程。', icon: '✅', rel: ['SPL', 'Succ'], category: '任务', locator: '§4 Evaluation, p.9343' },
  { sym: 'l', name: 'Geodesic shortest path', zh: '最短路径距离 GDSP', def: '起点到目标沿可通行路径的最短距离（geodesic distance）。', intuition: '解读：快递单上的“最优送法”，是绕不开障碍的最短路线。', icon: '📍', rel: ['SPL', 'GDSP'], category: '任务', locator: '§4 Evaluation, p.9343' },
  { sym: 'p', name: 'Actual path length', zh: '实际轨迹长度', def: 'agent 实际遍历的轨迹长度（含碰撞滑移等）。', intuition: '解读：快递员实际走的脚程，可能比最优远得多。', icon: '👣', rel: ['SPL'], category: '任务', locator: '§4 Evaluation, p.9343' },
  { sym: 'SPL', name: 'Success weighted by Path Length', zh: '按路径长度加权的成功率', def: 'SPL = S·l / max(p, l)，同时衡量“送达”与“是否绕路”，∈[0,1]。', intuition: '解读：裁判既看送到没有，也看走得多绕——抄近路才得高分。', icon: '📏', rel: ['S', 'l', 'p', 'Succ'], category: '任务', locator: '§4 Evaluation, p.9343' },
  { sym: 'Succ', name: 'Success rate', zh: '平均成功率', def: '成功 episode 占比（0.2m 内 stop）。', intuition: '解读：只数“送到了几单”，不惩罚绕路。', icon: '🎯', rel: ['SPL', 'S'], category: '任务', locator: '§5 Table 2' },
  { sym: 'GDSP', name: 'Geodesic distance along shortest path', zh: '最短路径测地距离', def: 'episode 难度基准，生成时限制在 1m–30m。', intuition: '解读：目标的“最短路有多长”，决定这一单难不难。', icon: '🧭', rel: ['l'], category: '任务', locator: '§4 Episode dataset preparation' },

  // ---- 传感器符号 ----
  { sym: 'GPS', name: 'Idealized GPS sensor', zh: '理想化定位传感器', def: '提供 agent 坐标；与 compass 组合隐式给出朝向。', intuition: '解读：快递员手里永远有“我在哪”的定位，但仍要自己找路。', icon: '📡', rel: ['compass', 'FOV'], category: '传感器', locator: '§4 Sensor input' },
  { sym: 'FOV', name: 'Field of view', zh: '视场角', def: '视觉传感器视场角 90°，分辨率 256² 像素，高 1.5m。', intuition: '解读：快递员的“眼睛视角”，只有前方 90°，看不到背后。', icon: '👁️', rel: ['RGB', 'Depth'], category: '传感器', locator: '§4 Sensor input' },
  { sym: 'RGB', name: 'Color camera sensor', zh: '彩色相机传感器', def: '仅使用彩色相机的 agent；高维高熵信号。', intuition: '解读：看得到“房子长什么样”，但不同房子差别太大易过拟合。', icon: '🎨', rel: ['Depth', 'RGBD', 'Blind'], category: '传感器', locator: '§4 Sensor input' },
  { sym: 'Depth', name: 'Depth sensor', zh: '深度传感器', def: '仅使用深度（距离）的 agent；直接给出自由空间信息。', intuition: '解读：只看“前面有多远/有没有墙”，PointGoal 只需它。', icon: '📐', rel: ['RGB', 'RGBD'], category: '传感器', locator: '§4 Sensor input' },
  { sym: 'RGBD', name: 'RGB + Depth', zh: '彩色+深度传感器', def: '同时使用彩色与深度传感器的 agent。', intuition: '解读：双眼全开，但信息冗余，未必比只盯距离更聪明。', icon: '🖥️', rel: ['RGB', 'Depth'], category: '传感器', locator: '§4 Sensor input' },
  { sym: 'Blind', name: 'Blind agent', zh: '无视觉 agent', def: '不使用任何视觉传感器、仅靠 GPS/compass 的 agent。', intuition: '解读：不看路的“盲送”，靠贴墙启发式，早期快但很快饱和。', icon: '🕶️', rel: ['RGB', 'Depth'], category: '传感器', locator: '§4 Sensor input' },
  { sym: 'turn_left / turn_right', name: 'Rotate action', zh: '原地转向动作（10°）', def: '动作空间中两个转向动作，每次原地转 10°。', intuition: '解读：快递员原地转身，每次都只转一小步。', icon: '🔁', rel: ['move_forward', 'stop'], category: '任务', locator: '§4 Action space' },
  { sym: 'move_forward', name: 'Forward action', zh: '前进动作（0.25m）', def: '前进 0.25m；碰撞时可能只前进部分甚至被墙滑开。', intuition: '解读：快递员迈一步，撞墙就可能“只挪了半步”。', icon: '🚶', rel: ['stop', 'collision'], category: '任务', locator: '§4 Action space / Collision dynamics' },
  { sym: 'stop', name: 'Stop action', zh: '宣告到达目标', def: 'agent 宣告到达目标并结束 episode 的动作。', intuition: '解读：按“送达确认”，距目标 0.2m 内按才算成功。', icon: '🛑', rel: ['S', 'SPL'], category: '任务', locator: '§4 Action space' },

  // ---- 奖励 / 算法符号 ----
  { sym: 'd_t', name: 'Geodesic distance at step t', zh: '第 t 步到目标的测地距离', def: '第 t 步时到目标的 geodesic 距离。', intuition: '解读：快递员此刻离目标还有多远。', icon: '📉', rel: ['r_t', 's', 'λ'], category: '算法', locator: '§4 Training procedure' },
  { sym: 'r_t', name: 'Reward at step t', zh: '第 t 步奖励', def: 'r_t = s + d_{t-1} − d_t + λ（到达目标），否则 r_t = d_{t-1} − d_t + λ。', intuition: '解读：走得近一步有奖励，绕路耗时有惩罚。', icon: '🍬', rel: ['d_t', 's', 'λ'], category: '算法', locator: '§4 Training procedure' },
  { sym: 's', name: 'Success reward', zh: '成功奖励（=10）', def: '到达目标的一次性成功奖励，实验中设为 10。', intuition: '解读：送对了一单的大额打赏。', icon: '💎', rel: ['r_t'], category: '算法', locator: '§4 Training procedure' },
  { sym: 'λ', name: 'Time penalty', zh: '时间惩罚（=−0.01）', def: '每步时间惩罚，鼓励走捷径，实验中设为 −0.01。', intuition: '解读：每多走一步都扣一点点，逼快递员抄近路。', icon: '⏱️', rel: ['r_t', 'd_t'], category: '算法', locator: '§4 Training procedure' },
  { sym: 'PPO', name: 'Proximal Policy Optimization', zh: '近端策略优化（RL 算法）', def: '本文 RL(PPO) 训练算法（[23]）。', intuition: '解读：训练师，用海量试错让快递员学会抄近路。', icon: '🧠', rel: ['GRU', 'CNN'], category: '算法', locator: '§4 Baselines / RL(PPO)' },
  { sym: 'GRU', name: 'Gated Recurrent Unit', zh: '门控循环单元', def: 'RL(PPO) actor 的循环单元，记忆时序状态。', intuition: '解读：快递员的“短期记忆”，记得自己走过哪。', icon: '🔗', rel: ['PPO', 'CNN'], category: '算法', locator: '§4 Baselines / RL(PPO)' },
  { sym: 'CNN', name: 'Convolutional neural network', zh: '卷积视觉编码器', def: '视觉输入编码器：Conv8×8, Conv4×4, Conv3×3, Linear, ReLU。', intuition: '解读：快递员的眼睛后端，把画面压成紧凑特征。', icon: '🔍', rel: ['PPO', 'GRU'], category: '算法', locator: '§4 Baselines / RL(PPO)' },
  { sym: 'SLAM', name: 'Simultaneous Localization And Mapping', zh: '同步定位与建图（经典导航）', def: '经典机器人导航流水线（本文用 Mishkin 的 ORB-SLAM2 方案）。', intuition: '解读：老牌导航员：边走边建图，再规划路线。', icon: '🗺️', rel: ['ORB-SLAM2'], category: '算法', locator: '§4 Baselines / SLAM' },
  { sym: 'fps', name: 'Frames per second', zh: '帧每秒', def: 'Habitat-Sim 的仿真渲染性能指标。', intuition: '解读：仿真器一秒钟能“拍”多少帧画面，决定训练多快。', icon: '⚡', rel: ['Habitat-Sim'], category: '传感器', locator: '§3 Performance / Table 1' },
];

export const symbolCategories = ['任务', '传感器', '算法'];
