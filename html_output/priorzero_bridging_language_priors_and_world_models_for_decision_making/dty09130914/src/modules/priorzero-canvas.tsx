import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const BG = '#f5f8f0';
const PAPER = '#ffffff';
const LINE = '#d7deea';
const INK = '#21324a';
const MUTED = '#68778f';
const SOFT_BLUE = '#eef3fb';

type Point = [number, number];

type State = {
  step: number;
  playing: boolean;
  speed: number;
  alpha: number;
  searches: number;
  valueWeight: number;
  selected: number;
  quiz: number | null;
  hover: string;
};

type Quiz = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
  mapping: string;
};

type Spec = {
  title: string;
  steps: string[];
  done: string;
  quiz: Quiz;
};

const baseState: State = {
  step: 0,
  playing: false,
  speed: 1,
  alpha: 50,
  searches: 48,
  valueWeight: 55,
  selected: 0,
  quiz: null,
  hover: '',
};

const specs: Record<string, Spec> = {
  '1.1': {
    title: '研究背景：三节点决策闭环',
    steps: ['语言模型给出语义建议', '世界模型预测后果', '环境反馈返回奖励', '传统方法在接口处冲突'],
    done: '结论：PriorZero 的起点是把语言先验、世界模型和环境反馈分清职责，而不是让其中一个模块吞掉全部决策。',
    quiz: {
      q: '研究背景图中红色冲突点说明什么？',
      options: ['语义可行性不等于环境长期收益', 'MCTS 不能使用先验', '世界模型必须生成文本'],
      answer: 0,
      explain: '传统方法常把语言分数直接当动作价值，容易和真实环境反馈错位。',
      mapping: '对应论文动机：语言先验与动力学、奖励信号需要桥接。',
    },
  },
  '1.2': {
    title: '传统方法与 PriorZero 对比',
    steps: ['旧方法：语言分数直连动作', '冲突：反馈无法解释长程后果', 'PriorZero：语言只进根节点', '世界模型和 MCTS 负责检验'],
    done: '结论：PriorZero 不是把 LLM 换成更大的策略，而是把它放入规划闭环的根节点。',
    quiz: {
      q: 'PriorZero 相比传统单步语言策略多出的关键环节是什么？',
      options: ['世界模型前瞻与 MCTS 访问计数', '跳过候选动作集合', '每个想象节点都询问 LLM'],
      answer: 0,
      explain: '它只在根节点使用语言先验，之后依靠世界模型和 MCTS。',
      mapping: '对应 Root-Prior Injection 与 latent MCTS。',
    },
  },
  '2.1': {
    title: 'Language Prior：候选动作概率',
    steps: ['构造文本 C_t', 'LLM 给候选动作打分', 'softmax 得到先验分布', '点击动作查看语义解释'],
    done: '结论：语言模型先验是一组候选动作概率，不是直接执行的自由文本命令。',
    quiz: {
      q: '为什么 PriorZero 对候选动作打分，而不是自由生成动作？',
      options: ['要让先验落在 admissible actions 上', '为了绕开 MCTS', '为了让世界模型输出文本'],
      answer: 0,
      explain: '候选动作集合约束了 LLM 的输出空间，便于注入根节点。',
      mapping: '对应 π_LLM(a|C_t) 的定义。',
    },
  },
  '3.1': {
    title: 'Root-Prior Injection：根节点注入',
    steps: ['根节点已有世界模型先验', '语言先验流入根节点', 'α 改变分支初始权重', '非根分支仍由世界模型负责'],
    done: '结论：语言先验只改变 MCTS 根节点的初始分支权重，不污染深层想象节点。',
    quiz: {
      q: 'α 增大时，根节点分支权重更接近谁？',
      options: ['LLM 语义先验', '环境最终奖励', '非根节点价值'],
      answer: 0,
      explain: 'P_root=(1?α)π_WM+απ_LLM。',
      mapping: '对应 Root-Prior Injection 公式。',
    },
  },
  '4.1': {
    title: 'Root-Prior 权重：α 调节',
    steps: ['α 低：偏世界模型', 'α 中：两类先验平衡', 'α 高：语言偏置变强', '检查根分支变化'],
    done: '结论：α 是根节点融合旋钮；论文报告的 0.5 是实验配置，不是普遍最优值。',
    quiz: {
      q: 'α 控制的是什么？',
      options: ['根节点语言先验融合强度', 'MCTS 搜索深度上限', '环境奖励函数'],
      answer: 0,
      explain: 'α 只控制根节点的 prior 混合比例。',
      mapping: '对应 P_root 的凸组合。',
    },
  },
  '5.1': {
    title: '表示边界：文本与 latent 分流',
    steps: ['历史 H_t 进入编码器', '文本 C_t 给 LLM 读取', 'latent z_t 给世界模型推演', '根节点处二者对齐'],
    done: '结论：文本和 latent 是两条不同通道，可靠对齐点是 MCTS 根节点。',
    quiz: {
      q: '非根节点为什么通常不再问 LLM？',
      options: ['非根是 imagined latent state，未必有文本对应', 'LLM 只能输出数字', 'MCTS 不支持 prior'],
      answer: 0,
      explain: '非根状态来自世界模型想象，不一定能被文本准确描述。',
      mapping: '对应语言先验只注入根节点的边界。',
    },
  },
  '6.1': {
    title: 'MCTS 四阶段',
    steps: ['Selection：沿 UCB 最高分支向下选择', 'Expansion：生成新的子节点', 'Simulation：从叶节点展开虚拟轨迹', 'Backpropagation：价值回传并更新颜色', '访问计数形成执行策略'],
    done: '结论：MCTS 把根先验变成被多步价值检验过的访问计数分布。',
    quiz: {
      q: 'Backpropagation 更新什么？',
      options: ['沿路径回传价值并更新节点统计', '重新生成文本提示', '删除世界模型'],
      answer: 0,
      explain: '回传阶段把模拟价值加到经过的节点上，改变颜色和访问计数。',
      mapping: '对应 MCTS 的 Q/N 更新。',
    },
  },
  '7.1': {
    title: 'World Model：网格想象轨迹',
    steps: ['当前状态在网格中定位', '点击动作生成不同未来', '动作箭头预测下一个状态', '奖励与价值沿轨迹标注'],
    done: '结论：世界模型把当前 latent state 推演成候选未来，让 MCTS 不只看单步语言建议。',
    quiz: {
      q: 'World Model 在图中承担什么？',
      options: ['预测动作后的未来状态、奖励和价值', '替代候选动作集合', '直接修改论文实验数值'],
      answer: 0,
      explain: '它负责想象未来和提供 value/reward 信号。',
      mapping: '对应 imagined rollout。',
    },
  },
  '7.2': {
    title: 'Value Guidance：价值热力图',
    steps: ['读取每个状态的价值', '价值权重改变热力图强度', '路径自动转向高价值状态', '显示优势信号'],
    done: '结论：价值指导让训练反馈偏向高价值路径，降低稀疏奖励带来的信用分配方差。',
    quiz: {
      q: '价值权重升高时，路径会怎样变化？',
      options: ['更明显地靠近高价值热区', '完全随机游走', '忽略世界模型价值'],
      answer: 0,
      explain: '权重越高，热力图对路径选择的影响越强。',
      mapping: '对应 v_θ 与 advantage 对 LLM 更新的指导。',
    },
  },
  '8.1': {
    title: 'Alternating RLFT：双环反馈',
    steps: ['世界模型训练', '产生价值信号', 'LLM 微调', '重新生成动作', '动作再进入世界模型'],
    done: '结论：交替训练让世界模型先稳定，再把价值优势传回 LLM。',
    quiz: {
      q: '为什么要交替而不是端到端硬冲？',
      options: ['减少早期噪声直接污染语言先验', '让 MCTS 消失', '让奖励函数变成文本'],
      answer: 0,
      explain: '世界模型价值更稳定后，再指导 LLM 微调。',
      mapping: '对应 Alternating RLFT。',
    },
  },
  '8.2': {
    title: '推理流程：数据沿流程线传递',
    steps: ['输入状态', '语言先验', 'MCTS 搜索', '价值评估', '输出最终动作'],
    done: '结论：推理阶段每一步都重新编码、注入根先验、搜索、评估并输出动作。',
    quiz: {
      q: '推理阶段 LLM 主要出现在哪里？',
      options: ['根节点语言先验', '每个想象子节点', '环境奖励函数内部'],
      answer: 0,
      explain: 'LLM 负责根节点候选动作先验，深层由世界模型和 MCTS 处理。',
      mapping: '对应完整 inference pipeline。',
    },
  },
  '8.3': {
    title: '训练流程：阶段时间轴',
    steps: ['数据准备', '先验提取', '世界模型训练', '价值优化', '策略更新'],
    done: '结论：训练流程把轨迹数据、语言先验、世界模型价值和 PPO 更新串成可重复循环。',
    quiz: {
      q: '训练时间轴中哪个阶段把价值信号变成 LLM 更新目标？',
      options: ['策略更新', '数据准备', '输入状态编码'],
      answer: 0,
      explain: '策略更新阶段使用 advantage 和 PPO 微调语言模型。',
      mapping: '对应 RLFT 的 credit 信号使用方式。',
    },
  },
  '9.1': {
    title: '实验消融：动态柱状图',
    steps: ['完整 PriorZero', '冻结先验', '非交替训练', '无 CoT', '无 MCTS'],
    done: '结论：消融图只用于机制阅读；具体数值必须回到论文协议和表格。',
    quiz: {
      q: '阅读消融图时最重要的原则是什么？',
      options: ['只在相同协议和指标方向下比较', '把所有任务数值相加排名', '忽略置信与波动'],
      answer: 0,
      explain: '不同任务和指标不能混用。',
      mapping: '对应实验结果的 protocol-aware 解读。',
    },
  },
  '10.1': {
    title: '实验结果：动态图表',
    steps: ['BabyAI 汇总', 'SynthLoc', 'FindObjS7', '未报告场景边界'],
    done: '结论：PriorZero 在报告的离散动作任务上有证据，但真实机器人等场景仍未被论文验证。',
    quiz: {
      q: '未报告场景为什么必须标为示意值？',
      options: ['论文没有给出该场景的实验结果', '因为图表不能画柱状图', '因为 MCTS 不支持它'],
      answer: 0,
      explain: '不能把教学演示数值冒充论文事实。',
      mapping: '对应论文事实边界。',
    },
  },
  '10.2': {
    title: '术语表：机制总览',
    steps: ['π_LLM', 'P_root', '?', 'v_θ', 'A'],
    done: '结论：语言给根节点方向，世界模型负责想象和价值，MCTS 把方向检验成动作。',
    quiz: {
      q: '哪个配对最符合 PriorZero 的分工？',
      options: ['LLM 给根先验，世界模型做深层推演', 'LLM 预测所有 latent transition', 'MCTS 只负责格式奖励'],
      answer: 0,
      explain: '这是 PriorZero 的最短机制总结。',
      mapping: '对应总结与术语表。',
    },
  },
};

const fallback = specs['1.1'];

const actions = [
  { label: '观察房间', wm: 0.32, llm: 0.52, value: 0.74, reason: '语义上安全，适合先获取状态信息。' },
  { label: '打开北门', wm: 0.41, llm: 0.24, value: 0.58, reason: '世界模型认为可推进，但语言先验较谨慎。' },
  { label: '拿起钥匙', wm: 0.18, llm: 0.19, value: 0.86, reason: '短期概率不高，但长期价值高。' },
  { label: '等待', wm: 0.09, llm: 0.05, value: 0.18, reason: '语义和环境价值都较低。' },
];

const gridValues = [
  [0.18, 0.24, 0.34, 0.46, 0.55],
  [0.22, 0.32, 0.48, 0.66, 0.78],
  [0.16, 0.28, 0.54, 0.76, 0.92],
  [0.10, 0.20, 0.38, 0.62, 0.84],
];

const resultRows = [
  { label: 'BabyAI-18', pz: 0.82, base: 0.79, note: '论文报告值' },
  { label: 'SynthLoc', pz: 0.96, base: 0.0, note: '论文报告值' },
  { label: 'FindObjS7', pz: 0.96, base: 0.995, note: '边界例' },
  { label: '真实机器人', pz: 0.5, base: 0.5, note: '示意值：论文未报告' },
];

const trainingStages = [
  '数据准备：收集历史、动作、奖励和 MCTS 目标。',
  '先验提取：LLM 对 admissible actions 生成 π_LLM。',
  '世界模型训练：学习 transition、reward、policy 与 value。',
  '价值优化：用 n-step TD 形成 advantage。',
  '策略更新：PPO 用优势信号微调 LLM。',
];

const analogyScenes = [
  { title: '背景：三路信号闭环', focus: '闭环', labels: ['LLM', 'WM', 'Env'], colors: [ORANGE, BLUE, GREEN] },
  { title: '语言先验：先分析再打分', focus: '打分', labels: ['C_t', 'CoT', 'π'], colors: [BLUE, ORANGE, GREEN] },
  { title: '根节点注入：只听一次', focus: 'Root', labels: ['Root', 'LLM', 'WM'], colors: [GREEN, ORANGE, BLUE] },
  { title: '权重平衡：可调融合', focus: 'α', labels: ['α', 'π_WM', 'π_LLM'], colors: [PURPLE, BLUE, ORANGE] },
  { title: '表示边界：文本与 latent', focus: '边界', labels: ['H_t', 'C_t', 'z_t'], colors: [BLUE, ORANGE, GREEN] },
  { title: 'MCTS：选择扩展回传', focus: '搜索', labels: ['Sel', 'Exp', 'Back'], colors: [GREEN, BLUE, RED] },
  { title: '世界模型：想象与价值', focus: '价值', labels: ['z', 'r', 'v'], colors: [BLUE, ORANGE, GREEN] },
  { title: '训练推理：双环闭环', focus: 'RLFT', labels: ['WM', 'A', 'LLM'], colors: [BLUE, PURPLE, ORANGE] },
  { title: '实验：消融证据', focus: '证据', labels: ['Full', 'Abl', 'Risk'], colors: [GREEN, ORANGE, RED] },
  { title: '总结：术语归位', focus: '术语', labels: ['π', 'v', 'A'], colors: [ORANGE, BLUE, GREEN] },
];

function fused(alpha: number) {
  const a = clamp(alpha / 100, 0, 1);
  return actions.map((item) => ({ ...item, fused: (1 - a) * item.wm + a * item.llm }));
}

function bestIndex(alpha: number) {
  return fused(alpha).reduce((best, item, i, arr) => (item.fused > arr[best].fused ? i : best), 0);
}

function clear(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(39, 68, 110, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 24; y < h; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = INK, size = 16, weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.fillText(s, x, y);
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, color = BLUE, active = false) {
  ctx.fillStyle = active ? color : PAPER;
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 3 : 1.5;
  round(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  txt(ctx, label, x + 14, y + 28, active ? '#fff' : color, 16, 800);
}

function line(ctx: CanvasRenderingContext2D, pts: Point[], color: string, width = 4, dash: number[] = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, color = BLUE, width = 4, dash: number[] = []) {
  line(ctx, [from, to], color, width, dash);
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to[0], to[1]);
  ctx.lineTo(to[0] - 11 * Math.cos(a - 0.45), to[1] - 11 * Math.sin(a - 0.45));
  ctx.lineTo(to[0] - 11 * Math.cos(a + 0.45), to[1] - 11 * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

function dotNode(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color = BLUE, active = false, r = 32) {
  ctx.fillStyle = active ? color : PAPER;
  ctx.strokeStyle = color;
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  txt(ctx, label, x - Math.min(42, label.length * 7), y + 5, active ? '#fff' : color, 14, 800);
}

function movingDot(ctx: CanvasRenderingContext2D, from: Point, to: Point, p: number, color = ORANGE) {
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
}

function probBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, label: string, color: string, active = false) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = active ? 3 : 1.5;
  round(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  round(ctx, x, y + h * (1 - value), w, h * value, 8);
  ctx.fill();
  txt(ctx, value.toFixed(2), x + 5, y + h * (1 - value) - 8, color, 13, 800);
  txt(ctx, label, x - 6, y + h + 24, INK, 13, 700);
}

function phase(time: number, s: State, reduceMotion: boolean) {
  if (!s.playing || reduceMotion) return s.step / Math.max(1, specs['6.1'].steps.length - 1);
  return (time * s.speed * 0.45) % 1;
}

function drawHero(ctx: CanvasRenderingContext2D, good: boolean, time: number, w: number, h: number) {
  clear(ctx, w, h);
  const llm: Point = [92, 86];
  const wm: Point = [218, 52];
  const env: Point = [336, 124];
  arrow(ctx, llm, wm, good ? GREEN : ORANGE, 3);
  arrow(ctx, wm, env, good ? GREEN : BLUE, 3);
  arrow(ctx, env, llm, good ? GREEN : RED, 3, good ? [] : [6, 6]);
  dotNode(ctx, llm[0], llm[1], 'LLM', ORANGE, good, 24);
  dotNode(ctx, wm[0], wm[1], 'WM', BLUE, good, 24);
  dotNode(ctx, env[0], env[1], 'Env', good ? GREEN : RED, !good, 24);
  const p = (Math.sin(time * 1.8) + 1) / 2;
  movingDot(ctx, good ? wm : llm, good ? env : env, p, good ? GREEN : RED);
  txt(ctx, good ? '根先验 + 搜索闭环' : '语义与反馈冲突', 96, 162, good ? GREEN : RED, 15, 800);
}

function drawAnalogy(ctx: CanvasRenderingContext2D, chapter: number, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const scene = analogyScenes[Math.max(0, Math.min(analogyScenes.length - 1, chapter - 1))];
  const p = phase(time, s, reduceMotion);
  const cx = w / 2;
  const cy = h / 2 + 4;
  const radius = 36 + (chapter % 3) * 5;
  const turn = (chapter - 1) * 0.17;
  const active = (s.step + chapter - 1) % scene.labels.length;
  const pts = scene.labels.map((_, i) => [cx + Math.cos(-Math.PI / 2 + turn + i * 2.1) * radius, cy + Math.sin(-Math.PI / 2 + turn + i * 2.1) * radius] as Point);
  pts.forEach((pt, i) => {
    arrow(ctx, pt, pts[(i + 1) % pts.length], scene.colors[i], i === active ? 3.4 : 2.3);
    dotNode(ctx, pt[0], pt[1], scene.labels[i], scene.colors[i], i === active, 20);
  });
  movingDot(ctx, pts[active], pts[(active + 1) % pts.length], p, scene.colors[active]);
  card(ctx, cx - 56, cy - 18, 112, 36, scene.focus, scene.colors[active], false);
  txt(ctx, `第 ${chapter} 章机制缩略图`, 20, 28, INK, 15, 800);
  txt(ctx, scene.title, 20, 50, scene.colors[active], 13, 800);
}

function drawResearch(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const llm: Point = [190, 92];
  const wm: Point = [540, 82];
  const env: Point = [870, 214];
  const p = phase(time, s, reduceMotion);
  arrow(ctx, llm, wm, BLUE, 5);
  arrow(ctx, wm, env, GREEN, 5);
  arrow(ctx, env, llm, s.step >= 2 ? GREEN : RED, 5, s.step >= 2 ? [] : [8, 8]);
  dotNode(ctx, llm[0], llm[1], '语言模型', ORANGE, s.step === 0, 46);
  dotNode(ctx, wm[0], wm[1], '世界模型', BLUE, s.step === 1, 46);
  dotNode(ctx, env[0], env[1], '环境反馈', GREEN, s.step === 2, 46);
  movingDot(ctx, s.step % 3 === 0 ? llm : s.step % 3 === 1 ? wm : env, s.step % 3 === 0 ? wm : s.step % 3 === 1 ? env : llm, p, s.step < 3 ? ORANGE : GREEN);
  card(ctx, 70, 205, 270, 72, '传统冲突点：把语义分数直接当 return', RED, s.step === 3);
  card(ctx, 405, 205, 280, 72, 'PriorZero：语义只注入根节点', GREEN, s.step >= 3);
  card(ctx, 745, 42, 250, 72, '反馈闭环：轨迹训练模型', BLUE, s.step >= 2);
}

function drawLanguagePrior(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  card(ctx, 58, 52, 190, 84, 'LLM 读取 C_t', ORANGE, true);
  arrow(ctx, [248, 94], [346, 94], ORANGE, 5);
  const p = phase(time, s, reduceMotion);
  for (let i = 0; i < 5; i++) movingDot(ctx, [260, 94], [340, 94], (p + i * 0.18) % 1, ORANGE);
  const bars = actions.map((a) => a.llm);
  actions.forEach((a, i) => {
    const x = 370 + i * 140;
    probBar(ctx, x, 70, 70, 150, bars[i], a.label, i === s.selected ? GREEN : BLUE, i === s.selected);
  });
  const selected = actions[s.selected] ?? actions[0];
  card(ctx, 780, 70, 240, 150, '点击动作解释', GREEN, true);
  txt(ctx, selected.label, 804, 122, '#fff', 18, 800);
  txt(ctx, selected.reason, 804, 158, '#fff', 14, 650);
  txt(ctx, '粒子流表示 LLM 将文本语境转成候选动作概率。', 72, 282, INK, 16, 750);
}

function drawRootPrior(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const rows = fused(s.alpha);
  const root: Point = [540, 82];
  dotNode(ctx, root[0], root[1], 'Root', GREEN, true, 40);
  const childPts: Point[] = [[250, 230], [445, 235], [640, 235], [835, 230]];
  const best = bestIndex(s.alpha);
  rows.forEach((row, i) => {
    const width = 2 + row.fused * 12;
    arrow(ctx, root, childPts[i], i === best ? GREEN : BLUE, width);
    dotNode(ctx, childPts[i][0], childPts[i][1], `${i + 1}`, i === best ? GREEN : BLUE, i === best, 28);
    txt(ctx, row.label, childPts[i][0] - 38, childPts[i][1] + 50, INK, 13, 700);
    txt(ctx, `w=${row.fused.toFixed(2)}`, childPts[i][0] - 28, childPts[i][1] + 70, i === best ? GREEN : BLUE, 13, 800);
  });
  card(ctx, 72, 40, 210, 72, 'π_WM 世界模型先验', BLUE, s.step === 0);
  card(ctx, 800, 40, 210, 72, 'π_LLM 语言先验', ORANGE, s.step === 1);
  arrow(ctx, [800, 76], [582, 76], ORANGE, s.step >= 1 ? 5 : 2, s.step >= 1 ? [] : [6, 6]);
  const p = phase(time, s, reduceMotion);
  if (s.step >= 1) movingDot(ctx, [790, 76], [588, 76], p, ORANGE);
  txt(ctx, `P_root=(1-α)π_WM+απ_LLM,  α=${(s.alpha / 100).toFixed(2)}`, 350, 316, INK, 16, 800);
}

function drawRepresentation(ctx: CanvasRenderingContext2D, s: State, w: number, h: number) {
  clear(ctx, w, h);
  const boxes = [
    ['历史 H_t', 70, 80, BLUE],
    ['文本 C_t', 330, 55, ORANGE],
    ['latent z_t', 330, 170, GREEN],
    ['LLM 打分', 645, 55, ORANGE],
    ['世界模型推演', 645, 170, GREEN],
    ['根节点对齐', 880, 112, PURPLE],
  ] as const;
  boxes.forEach(([label, x, y, color], i) => card(ctx, x, y, 170, 72, label, color, i <= s.step));
  arrow(ctx, [240, 116], [330, 92], ORANGE, s.step >= 1 ? 5 : 2);
  arrow(ctx, [240, 116], [330, 206], GREEN, s.step >= 2 ? 5 : 2);
  arrow(ctx, [500, 92], [645, 92], ORANGE, s.step >= 1 ? 5 : 2);
  arrow(ctx, [500, 206], [645, 206], GREEN, s.step >= 2 ? 5 : 2);
  arrow(ctx, [815, 92], [880, 135], PURPLE, s.step >= 3 ? 5 : 2);
  arrow(ctx, [815, 206], [880, 150], PURPLE, s.step >= 3 ? 5 : 2);
  txt(ctx, '文本通道负责语义，latent 通道负责动力学；可靠交汇点是根节点。', 230, 300, INK, 16, 750);
}

function drawMcts(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const root: Point = [540, 58];
  const a: Point[] = [[320, 142], [540, 142], [760, 142]];
  const leaves: Point[] = [[260, 245], [380, 245], [500, 245], [620, 245], [700, 245], [820, 245]];
  const activeBranch = 1;
  a.forEach((pt, i) => arrow(ctx, root, pt, s.step >= 1 && i === activeBranch ? GREEN : LINE, s.step >= 1 && i === activeBranch ? 7 : 3));
  leaves.forEach((pt, i) => arrow(ctx, a[Math.floor(i / 2)], pt, s.step >= 2 && (i === 2 || i === 3) ? BLUE : LINE, s.step >= 2 && (i === 2 || i === 3) ? 5 : 2));
  dotNode(ctx, root[0], root[1], 'Root', GREEN, true, 30);
  a.forEach((pt, i) => dotNode(ctx, pt[0], pt[1], `a${i + 1}`, i === activeBranch ? GREEN : BLUE, s.step >= 1 && i === activeBranch, 25));
  leaves.forEach((pt, i) => dotNode(ctx, pt[0], pt[1], s.step >= 2 && i === 3 ? 'new' : `v${i + 1}`, s.step >= 2 && (i === 2 || i === 3) ? PURPLE : MUTED, s.step >= 2 && (i === 2 || i === 3), 22));
  if (s.step >= 3) {
    const rollout: Point[] = [[620, 245], [700, 286], [790, 280], [875, 250]];
    line(ctx, rollout, ORANGE, 4, [7, 7]);
    const p = phase(time, s, reduceMotion);
    movingDot(ctx, rollout[0], rollout[Math.min(3, 1 + Math.floor(p * 3))], p, ORANGE);
    txt(ctx, 'Simulation 虚拟轨迹', 760, 304, ORANGE, 14, 800);
  }
  if (s.step >= 4) {
    arrow(ctx, [620, 235], [548, 70], RED, 5);
    txt(ctx, '价值回传：Q↑ N↑', 650, 84, RED, 16, 800);
  }
  const scale = s.searches / 96;
  const visits = [Math.round(12 + 10 * scale), Math.round(22 + 48 * scale), Math.round(10 + 18 * scale)];
  visits.forEach((v, i) => probBar(ctx, 72 + i * 92, 70, 45, 120, v / 80, `N${i + 1}`, i === activeBranch ? GREEN : BLUE, i === activeBranch));
  txt(ctx, `MCTS 搜索次数 ${s.searches} 会改变访问计数。`, 56, 42, INK, 15, 800);
}

function drawWorldModel(ctx: CanvasRenderingContext2D, s: State, w: number, h: number) {
  clear(ctx, w, h);
  const originX = 105;
  const originY = 58;
  const cell = 48;
  const start = [2, 2];
  const plans = [
    { label: '向左', delta: [-1, 0], color: ORANGE, reward: 0.04, value: 0.38 },
    { label: '向右', delta: [1, 0], color: BLUE, reward: 0.10, value: 0.62 },
    { label: '前进', delta: [0, -1], color: GREEN, reward: 0.22, value: 0.86 },
  ];
  const plan = plans[clamp(s.selected, 0, plans.length - 1)];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = LINE;
      round(ctx, originX + c * cell, originY + r * cell, cell - 5, cell - 5, 8);
      ctx.fill();
      ctx.stroke();
    }
  }
  const sx = originX + start[0] * cell + 22;
  const sy = originY + start[1] * cell + 22;
  const tx = originX + (start[0] + plan.delta[0]) * cell + 22;
  const ty = originY + (start[1] + plan.delta[1]) * cell + 22;
  dotNode(ctx, sx, sy, 's', BLUE, true, 18);
  arrow(ctx, [sx, sy], [tx, ty], plan.color, 6);
  dotNode(ctx, tx, ty, '?', plan.color, true, 18);
  plans.forEach((p, i) => card(ctx, 430 + i * 150, 62, 120, 58, p.label, p.color, i === s.selected));
  card(ctx, 430, 152, 420, 98, '预测结果', GREEN, true);
  txt(ctx, `动作：${plan.label}`, 456, 195, '#fff', 17, 800);
  txt(ctx, `r?=${plan.reward.toFixed(2)}    v?=${plan.value.toFixed(2)}    下一个状态 ?`, 456, 226, '#fff', 16, 700);
  txt(ctx, '点击动作卡片或使用单步，查看不同 imagined future。', 122, 298, INK, 16, 750);
}

function heatColor(v: number, weight: number) {
  const a = clamp(0.16 + v * (0.35 + weight * 0.55), 0.08, 0.95);
  return `rgba(34, 141, 92, ${a})`;
}

function drawValueGuidance(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const originX = 110;
  const originY = 48;
  const cell = 54;
  const weight = s.valueWeight / 100;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const v = gridValues[r][c];
      ctx.fillStyle = heatColor(v, weight);
      ctx.strokeStyle = LINE;
      round(ctx, originX + c * cell, originY + r * cell, cell - 4, cell - 4, 8);
      ctx.fill();
      ctx.stroke();
      txt(ctx, v.toFixed(2), originX + c * cell + 11, originY + r * cell + 30, v > 0.7 && weight > 0.45 ? '#fff' : INK, 12, 800);
    }
  }
  const pathLow: Point[] = [[132, 210], [186, 210], [240, 156], [294, 156], [348, 102]];
  const pathHigh: Point[] = [[132, 210], [186, 156], [240, 156], [294, 102], [348, 102]];
  const chosen = weight > 0.45 ? pathHigh : pathLow;
  line(ctx, chosen, GREEN, 7);
  const p = phase(time, s, reduceMotion);
  const idx = Math.min(chosen.length - 2, Math.floor(p * (chosen.length - 1)));
  movingDot(ctx, chosen[idx], chosen[idx + 1], (p * (chosen.length - 1)) % 1, BLUE);
  card(ctx, 470, 58, 420, 82, 'Value Guidance', GREEN, true);
  txt(ctx, `世界模型价值权重：${s.valueWeight}%`, 500, 104, '#fff', 18, 800);
  txt(ctx, `优势信号 A≈${(0.18 + weight * 0.72).toFixed(2)}`, 500, 132, '#fff', 16, 700);
  card(ctx, 470, 172, 420, 78, weight > 0.45 ? '路径转向高价值热区' : '路径仍较保守', weight > 0.45 ? GREEN : ORANGE, true);
  txt(ctx, '颜色越深表示状态价值越高，路径会随权重实时变化。', 118, 300, INK, 16, 750);
}

function drawAlternating(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const wm: Point = [360, 155];
  const llm: Point = [710, 155];
  dotNode(ctx, wm[0], wm[1], '世界模型', BLUE, s.step <= 1, 58);
  dotNode(ctx, llm[0], llm[1], 'LLM', ORANGE, s.step >= 2, 58);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(wm[0], wm[1], 110, -0.6, Math.PI * 1.45);
  ctx.stroke();
  ctx.strokeStyle = ORANGE;
  ctx.beginPath();
  ctx.arc(llm[0], llm[1], 110, Math.PI * 0.55, Math.PI * 2.6);
  ctx.stroke();
  arrow(ctx, [430, 95], [640, 95], GREEN, 5);
  arrow(ctx, [640, 215], [430, 215], PURPLE, 5);
  const p = phase(time, s, reduceMotion);
  movingDot(ctx, s.step < 2 ? [430, 95] : [640, 215], s.step < 2 ? [640, 95] : [430, 215], p, s.step < 2 ? GREEN : PURPLE);
  card(ctx, 260, 268, 220, 48, '训练 WM → 价值信号', BLUE, s.step === 0 || s.step === 1);
  card(ctx, 595, 268, 230, 48, '微调 LLM → 新动作', ORANGE, s.step >= 2);
  txt(ctx, '双环表示两个模型交替更新，反馈信号沿绿色/紫色通道动态流动。', 250, 40, INK, 16, 800);
}

function drawInference(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const labels = ['输入状态', '语言先验', 'MCTS 搜索', '价值评估', '最终动作'];
  const colors = [BLUE, ORANGE, GREEN, PURPLE, GREEN];
  const pts = labels.map((_, i) => [100 + i * 210, 140] as Point);
  labels.forEach((label, i) => {
    card(ctx, pts[i][0] - 70, pts[i][1] - 38, 140, 76, label, colors[i], i <= s.step);
    if (i < labels.length - 1) arrow(ctx, [pts[i][0] + 70, 140], [pts[i + 1][0] - 70, 140], i < s.step ? GREEN : LINE, 5);
  });
  const p = phase(time, s, reduceMotion);
  const seg = Math.min(3, s.step);
  if (seg < 4) movingDot(ctx, [pts[seg][0] + 70, 140], [pts[seg + 1][0] - 70, 140], p, ORANGE);
  txt(ctx, '数据沿流程线传递；推理阶段不训练参数，每步重新规划。', 245, 250, INK, 16, 800);
}

function drawTrainingTimeline(ctx: CanvasRenderingContext2D, s: State, w: number, h: number) {
  clear(ctx, w, h);
  const labels = ['数据准备', '先验提取', 'WM 训练', '价值优化', '策略更新'];
  labels.forEach((label, i) => {
    const x = 80 + i * 190;
    card(ctx, x, 94, 145, 82, label, i === s.selected ? GREEN : BLUE, i === s.selected || i <= s.step);
    if (i < labels.length - 1) arrow(ctx, [x + 145, 134], [x + 182, 134], i < s.step ? GREEN : LINE, 4);
  });
  card(ctx, 185, 224, 720, 62, '阶段说明', GREEN, true);
  txt(ctx, trainingStages[s.selected] ?? trainingStages[0], 212, 262, '#fff', 16, 700);
  txt(ctx, '点击阶段卡片展开具体内容；播放会沿时间轴逐步推进。', 278, 52, INK, 16, 800);
}

function drawAblation(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const vals = [0.82, 0.64, 0.46, 0.22, 0.08];
  const labels = ['完整', '冻结', '非交替', '无 CoT', '无 MCTS'];
  const p = s.playing && !reduceMotion ? easeInOutQuad((time * s.speed * 0.5) % 1) : 1;
  labels.forEach((label, i) => {
    const v = vals[i] * (i <= s.step ? p : 0.1);
    const color = vals[i] > 0.7 ? GREEN : vals[i] > 0.35 ? ORANGE : RED;
    probBar(ctx, 120 + i * 170, 72, 80, 170, v, label, color, i === s.step);
  });
  line(ctx, vals.map((v, i) => [160 + i * 170, 242 - v * 170] as Point), BLUE, 3);
  txt(ctx, '柱状图 + 折线展示消融趋势；具体数值以论文协议为准。', 240, 314, INK, 16, 750);
}

function drawExperiment(ctx: CanvasRenderingContext2D, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  clear(ctx, w, h);
  const p = s.playing && !reduceMotion ? easeInOutQuad((time * s.speed * 0.5) % 1) : 1;
  resultRows.forEach((row, i) => {
    const x = 110 + i * 220;
    probBar(ctx, x, 82, 60, 150, row.pz * p, 'PZ', GREEN, s.selected === i);
    probBar(ctx, x + 78, 82, 60, 150, row.base * p, 'Base', BLUE, s.selected === i);
    txt(ctx, row.label, x - 16, 262, INK, 13, 800);
  });
  const row = resultRows[clamp(s.selected, 0, resultRows.length - 1)];
  card(ctx, 710, 30, 300, 72, '悬停指标', row.note.includes('示意') ? ORANGE : GREEN, true);
  txt(ctx, `${row.label}: PriorZero ${row.pz.toFixed(3)} / Baseline ${row.base.toFixed(3)}`, 732, 76, '#fff', 14, 700);
  txt(ctx, row.note, 732, 96, '#fff', 13, 700);
  txt(ctx, '移动鼠标悬停不同组，查看协议和指标。', 82, 314, INK, 16, 750);
}

function drawGlossary(ctx: CanvasRenderingContext2D, s: State, w: number, h: number) {
  clear(ctx, w, h);
  const terms = [['π_LLM', '语言先验'], ['P_root', '根融合先验'], ['?', '想象状态'], ['v_θ', '价值估计'], ['A', '优势信号']];
  terms.forEach(([sym, label], i) => {
    const x = 85 + i * 190;
    card(ctx, x, i === s.step ? 78 : 98, 140, 96, sym, i === s.step ? GREEN : BLUE, i <= s.step);
    txt(ctx, label, x + 28, i === s.step ? 142 : 162, i === s.step ? '#fff' : INK, 15, 800);
  });
  txt(ctx, '术语表将论文机制压缩为五个可点击概念。', 300, 265, INK, 17, 800);
}

function drawModule(ctx: CanvasRenderingContext2D, key: string, s: State, time: number, w: number, h: number, reduceMotion: boolean) {
  if (key === '1.1' || key === '1.2') drawResearch(ctx, s, time, w, h, reduceMotion);
  else if (key === '2.1') drawLanguagePrior(ctx, s, time, w, h, reduceMotion);
  else if (key === '3.1' || key === '4.1') drawRootPrior(ctx, s, time, w, h, reduceMotion);
  else if (key === '5.1') drawRepresentation(ctx, s, w, h);
  else if (key === '6.1') drawMcts(ctx, s, time, w, h, reduceMotion);
  else if (key === '7.1') drawWorldModel(ctx, s, w, h);
  else if (key === '7.2') drawValueGuidance(ctx, s, time, w, h, reduceMotion);
  else if (key === '8.1') drawAlternating(ctx, s, time, w, h, reduceMotion);
  else if (key === '8.2') drawInference(ctx, s, time, w, h, reduceMotion);
  else if (key === '8.3') drawTrainingTimeline(ctx, s, w, h);
  else if (key === '9.1') drawAblation(ctx, s, time, w, h, reduceMotion);
  else if (key === '10.1') drawExperiment(ctx, s, time, w, h, reduceMotion);
  else if (key === '10.2') drawGlossary(ctx, s, w, h);
  else drawResearch(ctx, s, time, w, h, reduceMotion);
}

function hoverText(key: string, s: State) {
  if (key === '2.1') return `当前动作：${actions[s.selected]?.label ?? actions[0].label}。点击柱状图可查看语义解释。`;
  if (key === '3.1' || key === '4.1') return '树边粗细表示根节点初始权重，α 会实时改变分支。';
  if (key === '6.1') return '树搜索按 Selection、Expansion、Simulation、Backpropagation 单步推进。';
  if (key === '7.1') return '点击向左、向右、前进，世界模型会显示不同 imagined future。';
  if (key === '7.2') return '热力图颜色和路径由世界模型价值权重实时控制。';
  if (key === '8.1') return '双环中绿色是价值反馈，紫色是 LLM 微调后的动作反馈。';
  if (key === '8.3') return '点击时间轴阶段卡片可展开训练流程细节。';
  if (key === '10.1') return '悬停图表组可查看指标；未报告场景会明确标为示意值。';
  return `当前步骤：${(specs[key] ?? fallback).steps[s.step]}`;
}

function hitTest(key: string, x: number, y: number) {
  if (key === '2.1') {
    const idx = Math.floor((x - 370) / 140);
    if (idx >= 0 && idx < actions.length && y >= 60 && y <= 250) return idx;
  }
  if (key === '7.1') {
    const idx = Math.floor((x - 430) / 150);
    if (idx >= 0 && idx < 3 && y >= 50 && y <= 132) return idx;
  }
  if (key === '8.3') {
    const idx = Math.floor((x - 80) / 190);
    if (idx >= 0 && idx < trainingStages.length && y >= 80 && y <= 190) return idx;
  }
  if (key === '10.1') {
    const idx = Math.floor((x - 90) / 220);
    if (idx >= 0 && idx < resultRows.length && y >= 70 && y <= 280) return idx;
  }
  return null;
}

export const PriorzeroCanvas: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isHero = chapterId === 'hero';
  const isAnalogy = moduleId === 'ana';
  const key = moduleId;
  const spec = useMemo(() => specs[key] ?? fallback, [key]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<State>(baseState);
  const [reduceMotion, setReduceMotion] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const w = isAnalogy ? 560 : isHero ? 430 : 1080;
  const h = isAnalogy ? 150 : isHero ? 180 : 340;
  const last = spec.steps.length - 1;

  useEffect(() => setState(baseState), [chapterId, moduleId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!state.playing || isHero || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setState((prev) => (prev.step >= last ? { ...prev, playing: false } : { ...prev, step: prev.step + 1 }));
    }, 1200 / state.speed);
    return () => window.clearInterval(timer);
  }, [state.playing, state.speed, isHero, reduceMotion, last]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = setupCanvas(canvas, w, h);
    const tick = () => {
      const time = performance.now() / 1000;
      if (isHero) drawHero(ctx, moduleId === 'new', time, w, h);
      else if (isAnalogy) drawAnalogy(ctx, Number(chapterId.replace('chap-', '')) || 1, stateRef.current, time, w, h, reduceMotion);
      else drawModule(ctx, key, stateRef.current, time, w, h, reduceMotion);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId, moduleId, isHero, isAnalogy, key, w, h, reduceMotion]);

  const update = (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch }));
  const reset = () => update({ step: 0, playing: false, selected: 0, quiz: null, hover: '' });
  const back = () => update({ step: Math.max(0, state.step - 1), playing: false });
  const single = () => update({ step: Math.min(last, state.step + 1), playing: false });
  const pointer = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * w, ((e.clientY - rect.top) / rect.height) * h] as Point;
  };
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = pointer(e);
    const hit = hitTest(key, x, y);
    update({ hover: hoverText(key, { ...stateRef.current, selected: hit ?? stateRef.current.selected }), ...(key === '10.1' && hit !== null ? { selected: hit } : {}) });
  };
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = pointer(e);
    const hit = hitTest(key, x, y);
    if (hit !== null) update({ selected: hit, hover: hoverText(key, { ...stateRef.current, selected: hit }) });
  };

  if (isHero || isAnalogy) {
    return <canvas ref={canvasRef} width={w} height={h} onMouseMove={onMove} onClick={onClick} onMouseLeave={() => update({ hover: '' })} />;
  }

  const answered = state.quiz !== null;
  const correct = state.quiz === spec.quiz.answer;

  return (
    <div className="pz-widget">
      <canvas ref={canvasRef} width={w} height={h} onMouseMove={onMove} onClick={onClick} onMouseLeave={() => update({ hover: '' })} />
      <div className="pz-controls">
        <button className="tiny" onClick={() => update({ playing: !state.playing })} disabled={reduceMotion}>{state.playing ? '暂停' : '播放'}</button>
        <button className="tiny ghost" onClick={reset}>重置</button>
        <button className="tiny ghost" onClick={back} disabled={state.step === 0}>上一步</button>
        <button className="tiny ghost" onClick={single} disabled={state.step === last}>单步</button>
        <span className="pz-step-pill">步骤 {state.step + 1}/{spec.steps.length}</span>
      </div>
      <div className="ctrl pz-param">
        <label>速度 <span className="val">{state.speed.toFixed(1)}x</span></label>
        <input type="range" min={0.5} max={2} step={0.1} value={state.speed} onChange={(e) => update({ speed: Number(e.target.value) })} />
      </div>
      {(key === '3.1' || key === '4.1') ? (
        <div className="ctrl pz-param">
          <label>语言先验权重 α <span className="val">{(state.alpha / 100).toFixed(2)}</span></label>
          <input type="range" min={0} max={100} value={state.alpha} onChange={(e) => update({ alpha: Number(e.target.value) })} />
        </div>
      ) : null}
      {key === '6.1' ? (
        <div className="ctrl pz-param">
          <label>MCTS 搜索次数 <span className="val">{state.searches}</span></label>
          <input type="range" min={16} max={96} step={8} value={state.searches} onChange={(e) => update({ searches: Number(e.target.value) })} />
        </div>
      ) : null}
      {key === '7.2' ? (
        <div className="ctrl pz-param">
          <label>世界模型价值权重 <span className="val">{state.valueWeight}%</span></label>
          <input type="range" min={0} max={100} value={state.valueWeight} onChange={(e) => update({ valueWeight: Number(e.target.value) })} />
        </div>
      ) : null}
      <div className="pz-status"><span className="pz-status-label">当前步骤</span><span>{spec.steps[state.step]}</span></div>
      <div className="pz-hover-note">{reduceMotion ? '系统处于减少动画模式：自动播放已禁用，可使用单步执行。' : state.hover || '悬停或点击图形元素查看中文解释。'}</div>
      {state.step === last ? <div className="feedback good">{spec.done}</div> : null}
      <div className="pz-quiz">
        <div className="pz-quiz-title">小测验：{spec.quiz.q}</div>
        <div className="pz-quiz-options">
          {spec.quiz.options.map((option, i) => (
            <button key={option} className={`chip ${state.quiz === i ? 'selected' : ''}`} onClick={() => update({ quiz: i })}>{option}</button>
          ))}
        </div>
        {answered ? <div className={`feedback ${correct ? 'good' : 'bad'}`}>{correct ? '正确。' : '错误。'} {spec.quiz.explain} <b>{spec.quiz.mapping}</b></div> : null}
      </div>
    </div>
  );
};

export default PriorzeroCanvas;
