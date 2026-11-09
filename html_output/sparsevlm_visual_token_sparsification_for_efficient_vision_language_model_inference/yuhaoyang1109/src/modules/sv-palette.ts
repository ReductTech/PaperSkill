// SparseVLM 精读的语义配色：全站唯一的颜色来源。
// CSS 通过 applyPaletteVars() 写入的 --sv-* 变量取色，画布直接读 C；同一种 token / 状态在两边是同一个颜色。
// token 类型：视觉 token（保留）蓝、文本 token 浅紫、评分员（rater）深紫、系统 / 模板 token 灰、
// 被剪掉的 token 浅灰（虚线框）、回收池 token 浅青、回收合并后的 token 青。
// 状态色语义固定：绿 = 通过 / 本文方法，琥珀 = 限制 / 证据边界，红 = 错误 / 反例；蓝 = 当前选中 / 引导。

export const C = {
  ink: '#21324a',
  muted: '#68778f',
  faint: '#8b97ab',
  line: '#d7deea',
  line2: '#9fb0c8',
  stage: '#f8fafd',
  stageLine: '#e3e8f0',

  // token 类型
  vis: '#3567c9',
  visSoft: '#d9e4fa',
  text: '#b3a6dc',
  rater: '#6a3fcf',
  raterSoft: '#efe9fd',
  sys: '#a3adbf',
  pruned: '#cdd3dd',
  prunedLine: '#8d97a8',
  pool: '#8fd3da',
  merged: '#0f97a6',

  // 状态
  blue: '#27446e',
  blueSoft: '#eef3fb',
  green: '#228d5c',
  greenSoft: '#e6f4ec',
  amber: '#c07100',
  amberSoft: '#fbf1e1',
  red: '#c43f52',
  redSoft: '#fbe9ec',

  // 对比方法（只在结果图里出现，不表示 token 类型）
  mVanilla: '#5b6678',
  mToMe: '#a0703c',
  mFastV: '#c2549d',
  mPDrop: '#7d8a1f',
  mSparse: '#228d5c',
} as const;

export type ColorKey = keyof typeof C;

/** token 图例：图例只在“来源与证据边界”一节集中展示，模块里按需引用。 */
export const TOKEN_LEGEND: { key: ColorKey; label: string; note: string; dashed?: boolean }[] = [
  { key: 'vis', label: '视觉 token（保留）', note: '图像经视觉编码器与投影层得到的 token，仍参与后续各层计算' },
  { key: 'text', label: '文本 token', note: '图像之后的问题与对话模板 token，未被选为评分员' },
  { key: 'rater', label: '评分员（rater）', note: '与图像相关度高于平均值、被用来给视觉 token 打分的文本 token' },
  { key: 'sys', label: '系统 / 模板 token', note: '图像之前的系统提示与“USER:”等，始终保留' },
  { key: 'pruned', label: '被剪掉的视觉 token', note: '本层分数排在配额之外，从后续各层的输入里删除', dashed: true },
  { key: 'pool', label: '回收池里的 token', note: '被剪 token 中分数最高的约 30%，等待聚类' },
  { key: 'merged', label: '回收合并后的 token', note: '每个簇平均成 1 个新 token，插回保留的视觉 token 之后' },
];

export const STATUS_LEGEND: { key: ColorKey; label: string }[] = [
  { key: 'green', label: '通过 / 本文方法' },
  { key: 'amber', label: '限制 / 证据边界' },
  { key: 'red', label: '错误 / 反例' },
  { key: 'blue', label: '当前选中 / 引导' },
];

/** 把调色板写成 CSS 变量（--sv-vis 等），页面启动时调用一次。 */
export function applyPaletteVars(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(C)) root.style.setProperty(`--sv-${k}`, v);
}
