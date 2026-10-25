// Canvas 用色（与 paper.css 中的 CSS 变量保持一致）。
// 语义：朱红 = DivPrune / 已选；钴蓝 = 候选 / 距离 / 当前状态；芥黄 = 重要性方法（FastV）；
// 紫 = VTW；灰 = 随机 / 未选；绿 = 复现一致；琥珀 = 不一致 / 警示。
export const C = {
  // 冷白“晨光实验室”主题：paper = 画布底色，ink = 前景文字 / 点
  paper: '#ffffff',
  paper2: '#f3f5fb',
  ink: '#141c34',
  ink2: '#4a5470',
  muted: '#7d869d',
  faint: '#c3cad9',
  rule: 'rgba(20,28,52,0.12)',
  verm: '#ff5a3c',
  vermD: '#e2401f',
  vermSoft: 'rgba(255,90,60,0.14)',
  cobalt: '#3b5bff',
  cobaltD: '#2a44d8',
  cobaltSoft: 'rgba(59,91,255,0.12)',
  mustard: '#d69412',
  mustardSoft: 'rgba(214,148,18,0.18)',
  purple: '#8a5cf0',
  gray: '#8b93a7',
  green: '#12a06a',
  amber: '#d9800b',
  teal: '#119c9a',
  olive: '#7b8c1c',
  brown: '#a8673f',
};

export const METHOD_COLOR: Record<string, string> = {
  原模型: C.ink,
  DivPrune: C.verm,
  'DivPrune*': '#ff8f78',
  FastV: C.mustard,
  VTW: C.purple,
  PruMerge: C.teal,
  'PruMerge△': C.teal,
  'FitPrune△': C.olive,
  'M³•': C.brown,
  'PruMerge-LoRA•': '#4e9f9c',
  随机: C.gray,
};

export const FONT_SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif';
export const FONT_MONO = 'ui-monospace,"Cascadia Code","SFMono-Regular",Consolas,monospace';
export const FONT_SERIF = '"Songti SC","Noto Serif SC","Source Han Serif SC","STSong","SimSun",Georgia,serif';
