/**
 * 框架约定：components.css 里 `canvas { opacity: 0 }`，模块必须在首次绘制成功后
 * 给画布加上 `.is-ready`，画布才会淡入（见 paper-skill/scripts/validation-checklist.md
 * 「Every Canvas/widget adds is-ready after its first successful draw」）。
 *
 * 漏加这个类不会报错，画布尺寸和像素都正常，只是永远不可见 —— 排查起来很不直观，
 * 所以本教程的模块统一走这一个入口，避免任何一个模块漏掉。
 *
 * 调用点放在取到 2D 上下文之后即可：模块的绘制都在同一段同步代码里紧随其后完成，
 * 浏览器不会在两者之间插入绘制，所以不会出现「先亮后画」的闪烁。
 */
export function markCanvasReady(canvas: HTMLCanvasElement | null | undefined): void {
  if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}
