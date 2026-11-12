import { GLOSSARY, EVIDENCE } from './glossary';

// ============================================================================
//  全局弹注：术语（data-term）、证据定位（data-ev）、公式符号（data-tip-title / data-tip-body）。
//  - 鼠标：悬停 120ms 后打开；已有弹注打开时，移到相邻触发点立即切换（不再等待）
//  - 键盘：Tab 聚焦即打开，Enter / 空格固定，Esc 关闭
//  - 触摸：点按切换，点空白处关闭
//  动效：opacity + scale(0.97) → 1，160ms 强 ease-out，从触发点一侧展开。
// ============================================================================

const SEL = '[data-term],[data-ev],[data-tip-title]';
let installed = false;

function contentFor(el: HTMLElement): string | null {
  const t = el.getAttribute('data-term');
  if (t) {
    const g = GLOSSARY[t];
    if (!g) return null;
    return `<div class="tp-kicker">术语</div><div class="tp-title">${g.name}</div><div class="tp-row"><b>直觉</b><span>${g.intuition}</span></div><div class="tp-row"><b>本文中</b><span>${g.role}</span></div>`;
  }
  const e = el.getAttribute('data-ev');
  if (e) {
    const v = EVIDENCE[e];
    if (!v) return null;
    return `<div class="tp-kicker">证据定位</div><div class="tp-title">${v.where}</div><div class="tp-row single"><span>${v.what}</span></div><a class="tp-link" href="${v.href}" target="_blank" rel="noopener">打开原文 ↗</a>`;
  }
  const title = el.getAttribute('data-tip-title');
  if (title) {
    const body = el.getAttribute('data-tip-body') || '';
    return `<div class="tp-kicker">符号</div><div class="tp-title tp-sym">${title}</div><div class="tp-row single"><span>${body}</span></div>`;
  }
  return null;
}

export function installPopover() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const pop = document.createElement('div');
  pop.className = 'tip-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-live', 'polite');
  pop.id = 'tip-pop';
  document.body.appendChild(pop);

  let current: HTMLElement | null = null;
  let pinned = false;
  let openTimer = 0;
  let closeTimer = 0;
  let lastClosedAt = 0;

  const place = () => {
    if (!current) return;
    const r = current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(360, vw - 16);
    pop.style.width = w + 'px';
    const ph = pop.offsetHeight;
    const above = r.top > ph + 14 || r.bottom + ph + 14 > vh;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(vw - w - 8, left));
    const top = above ? r.top - ph - 10 : r.bottom + 10;
    pop.style.left = left + 'px';
    // 上下都放不下时，限制在视口内（宁可盖住触发点，也不超出屏幕）
    pop.style.top = Math.max(8, Math.min(vh - ph - 8, top)) + 'px';
    pop.style.maxHeight = vh - 16 + 'px';
    pop.style.overflowY = ph > vh - 16 ? 'auto' : '';
    const ox = Math.max(10, Math.min(w - 10, r.left + r.width / 2 - left));
    pop.style.transformOrigin = `${ox}px ${above ? '100%' : '0%'}`;
  };

  const open = (el: HTMLElement, isPinned: boolean) => {
    window.clearTimeout(closeTimer);
    const html = contentFor(el);
    if (!html) return;
    if (current && current !== el) current.removeAttribute('aria-expanded');
    current = el;
    pinned = isPinned;
    pop.innerHTML = html;
    el.setAttribute('aria-expanded', 'true');
    el.setAttribute('aria-controls', 'tip-pop');
    // 已有弹注时立即切换，不再播放入场动画
    const instant = pop.classList.contains('is-open') || performance.now() - lastClosedAt < 250;
    pop.classList.toggle('is-instant', instant);
    pop.classList.add('is-open');
    place();
  };

  const close = () => {
    window.clearTimeout(openTimer);
    if (!current) return;
    current.removeAttribute('aria-expanded');
    current = null;
    pinned = false;
    pop.classList.remove('is-open');
    lastClosedAt = performance.now();
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (!pinned) close();
    }, 160);
  };

  document.addEventListener('pointerover', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    const t = (ev.target as HTMLElement).closest?.(SEL) as HTMLElement | null;
    if (t) {
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
      if (current === t) return;
      const delay = pop.classList.contains('is-open') ? 0 : 120;
      openTimer = window.setTimeout(() => open(t, false), delay);
    } else if ((ev.target as HTMLElement).closest?.('.tip-pop')) {
      window.clearTimeout(closeTimer);
    }
  });
  document.addEventListener('pointerout', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    const from = (ev.target as HTMLElement).closest?.(`${SEL},.tip-pop`);
    const to = (ev.relatedTarget as HTMLElement | null)?.closest?.(`${SEL},.tip-pop`);
    window.clearTimeout(openTimer);
    if (from && from !== to && !(to && (to === current || to === pop))) scheduleClose();
  });

  document.addEventListener('click', (ev) => {
    const t = (ev.target as HTMLElement).closest?.(SEL) as HTMLElement | null;
    if (t) {
      ev.preventDefault();
      if (current === t && pinned) close();
      else open(t, true);
      return;
    }
    if (!(ev.target as HTMLElement).closest?.('.tip-pop')) close();
  });

  document.addEventListener('focusin', (ev) => {
    const t = (ev.target as HTMLElement).closest?.(SEL) as HTMLElement | null;
    if (t && current !== t) open(t, false);
  });
  document.addEventListener('focusout', (ev) => {
    const to = ev.relatedTarget as HTMLElement | null;
    if (to && (to.closest?.('.tip-pop') || to === current)) return;
    if (current && ev.target === current && !pinned) scheduleClose();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && current) {
      const back = current;
      close();
      back.focus();
      return;
    }
    const t = (ev.target as HTMLElement).closest?.(SEL) as HTMLElement | null;
    if (t && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      if (current === t && pinned) close();
      else open(t, true);
    }
  });

  window.addEventListener('scroll', () => current && place(), { passive: true });
  window.addEventListener('resize', () => current && place());
}
