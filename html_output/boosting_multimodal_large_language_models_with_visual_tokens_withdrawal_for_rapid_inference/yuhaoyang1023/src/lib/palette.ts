// Canvas 与图表用色（与 paper.css 的 CSS 变量保持一致）。
// token 类型：系统 = 月银紫，视觉 = 生物荧光青，指令 = 沙色，输出 = 珍珠白。
// 状态语义固定：绿 = 验证通过，琥珀 = 限制 / 证据边界，红 = 错误或失败。

export const C = {
  bg0: '#050816',
  bg1: '#0A1230',
  bg2: '#111C46',
  panel: '#0E1838',
  ink: '#EAF2FF',
  ink2: '#B9C6E4',
  ink3: '#8392B8',
  ink4: '#56638A',
  line: 'rgba(150,190,255,0.16)',
  sys: '#B4A8FF',
  vis: '#3BE0E8',
  visDeep: '#1E8FB8',
  ins: '#F0D2A8',
  out: '#FFF4E2',
  ok: '#4ADE80',
  warn: '#FBBF24',
  bad: '#FB7185',
  moon: '#F3F0FF',
  fastv: '#C59BFF',
  base: '#8C97B8',
  rand: '#5E6B8F',
};

export const TYPE_COLOR = { sys: C.sys, vis: C.vis, ins: C.ins, out: C.out } as const;
export type TokType = keyof typeof TYPE_COLOR;
export const TYPE_NAME: Record<TokType, string> = { sys: '系统', vis: '视觉', ins: '指令', out: '输出' };

export const METHOD_COLOR: Record<string, string> = {
  base: C.base,
  fastv: C.fastv,
  rand: C.rand,
  vtwr: '#7FB8C9',
  vtw: C.vis,
};

export const FONT_SANS = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
export const FONT_MONO = '"JetBrains Mono", "Cascadia Code", Consolas, "SFMono-Regular", monospace';
export const FONT_SERIF = '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif';

/** #RRGGBB → rgba(...) */
export function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
}
