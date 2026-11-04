/** Browser-side geometry gate. Run after fonts/images settle and after each interaction.
 * This checks rendered geometry; source validation alone cannot certify slide fit. */
export function auditSlide(): string[] {
  const errors: string[] = [];
  const stage = document.querySelector<HTMLElement>('[data-slide-canvas]');
  if (!stage) return ['No slide canvas mounted'];
  const bounds = stage.getBoundingClientRect();
  const tolerance = 2;
  const outside = (a: DOMRect, b: DOMRect) => a.left < b.left - tolerance || a.top < b.top - tolerance ||
    a.right > b.right + tolerance || a.bottom > b.bottom + tolerance;
  const root = document.documentElement;
  if (root.scrollHeight > root.clientHeight + tolerance || root.scrollWidth > root.clientWidth + tolerance)
    errors.push('Document scrolls');
  const slots = [...stage.querySelectorAll<HTMLElement>('[data-slot]')];
  for (const slot of slots) {
    const box = slot.getBoundingClientRect();
    if (outside(box, bounds)) errors.push(`${slot.dataset.slot}: outside slide`);
    for (const other of slots) {
      if (slots.indexOf(other) <= slots.indexOf(slot)) continue;
      const b = other.getBoundingClientRect();
      if (Math.min(box.right, b.right) - Math.max(box.left, b.left) > tolerance &&
          Math.min(box.bottom, b.bottom) - Math.max(box.top, b.top) > tolerance)
        errors.push(`${slot.dataset.slot}: overlaps ${other.dataset.slot}`);
    }
  }
  for (const element of stage.querySelectorAll<HTMLElement>('*')) {
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height || getComputedStyle(element).visibility === 'hidden') continue;
    const slot = element.closest<HTMLElement>('[data-slot]');
    const name = slot?.dataset.slot ?? element.className;
    if (outside(box, slot?.getBoundingClientRect() ?? bounds)) errors.push(`${name}: descendant outside allocated region`);
    if (!element.matches('input, select, textarea') && element.clientWidth && (element.scrollWidth > element.clientWidth + tolerance ||
        element.scrollHeight > element.clientHeight + tolerance)) errors.push(`${name}: content overflows or is clipped`);
  }
  return [...new Set(errors)];
}
