// 页面内的轻量事件：让背景海面与章节进程、用户操作联动（纯视觉，不影响内容）。
// - vtw:chapter：当前阅读的章节序号（封面 = 0，第 n 章 = n，结尾 = 11）
// - vtw:pulse：模块里的关键时刻（例如视觉 token 被撤走），背景泛起一圈涟漪

export type PulseKind = 'withdraw' | 'fill' | 'soft';

export function emitChapter(index: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('vtw:chapter', { detail: index }));
}

export function emitPulse(kind: PulseKind = 'soft') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('vtw:pulse', { detail: kind }));
}
