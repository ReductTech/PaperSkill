// 测量用帧时钟：在应用脚本之前加载，接管 requestAnimationFrame，由测试脚本手动推进帧。
// 浏览器窗格在后台时真实 rAF 不触发，所以用虚拟帧做“同一操作、同一设备”的确定性对比。
// 只用于测量页 measure.html，不进入正式构建。（取自 DivPrune v9.5 tools/measure/harness.js，未改逻辑）
(function () {
  const queue = new Map();
  let nextId = 0;
  let vt = performance.now();
  const draws = new Map();
  window.requestAnimationFrame = (cb) => { nextId += 1; queue.set(nextId, cb); return nextId; };
  window.cancelAnimationFrame = (id) => { queue.delete(id); };
  const clear = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    draws.set(this.canvas, (draws.get(this.canvas) || 0) + 1);
    return clear.apply(this, args);
  };
  // 后台窗格里 IntersectionObserver 也不触发：换成手动版，测试脚本调用 __io() 时按 rootMargin 计算一次相交状态
  const observers = new Set();
  window.IntersectionObserver = class {
    constructor(cb, opts = {}) {
      this.cb = cb;
      const m = String(opts.rootMargin || '0px').split(/\s+/).map((x) => parseFloat(x) || 0);
      this.mv = m[0];
      this.targets = new Map();
      observers.add(this);
    }
    observe(el) { this.targets.set(el, undefined); }
    unobserve(el) { this.targets.delete(el); }
    disconnect() { this.targets.clear(); observers.delete(this); }
    takeRecords() { return []; }
  };
  window.__io = () => {
    for (const o of observers) {
      const entries = [];
      for (const [el, prev] of o.targets) {
        const r = el.getBoundingClientRect();
        const hit = r.width > 0 && r.bottom > -o.mv && r.top < innerHeight + o.mv;
        if (hit !== prev) { o.targets.set(el, hit); entries.push({ target: el, isIntersecting: hit, boundingClientRect: r }); }
      }
      if (entries.length) o.cb(entries, o);
    }
  };
  const tick = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  const visible = (c) => { const r = c.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };

  /** 推进 n 帧；每帧后让 React 提交一次，再统计这一帧里各画布的重绘 */
  window.__pump = async (n, step = 1000 / 60) => {
    const frames = [];
    for (let i = 0; i < n; i += 1) {
      vt += step;
      const cbs = [...queue.values()];
      queue.clear();
      draws.clear();
      const t0 = performance.now();
      for (const cb of cbs) cb(vt);
      await tick();
      const ms = performance.now() - t0;
      let on = 0, off = 0;
      for (const c of draws.keys()) (visible(c) ? on += 1 : off += 1);
      frames.push({ loops: cbs.length, on, off, ms });
    }
    return frames;
  };
  window.__pending = () => queue.size;
  window.__summary = (frames) => {
    const avg = (k) => frames.reduce((a, f) => a + f[k], 0) / frames.length;
    const ms = frames.map((f) => f.ms).sort((a, b) => a - b);
    return { frames: frames.length, loopsPerFrame: +avg('loops').toFixed(2), onscreenDrawsPerFrame: +avg('on').toFixed(2), offscreenDrawsPerFrame: +avg('off').toFixed(2), msAvg: +avg('ms').toFixed(2), msP95: +ms[Math.floor(ms.length * 0.95)].toFixed(2) };
  };
  /** 画布像素摘要，用来判断画面何时静止 */
  window.__hash = (canvas) => {
    const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 53) h = (h * 31 + d[i]) | 0;
    return h;
  };
  /** 推进帧直到画布连续 3 帧不变（最多 maxFrames），返回静止所需帧数；-1 表示一直在变 */
  window.__settle = async (canvas, maxFrames = 240) => {
    let last = window.__hash(canvas), same = 0;
    for (let i = 1; i <= maxFrames; i += 1) {
      await window.__pump(1);
      const h = window.__hash(canvas);
      same = h === last ? same + 1 : 0;
      last = h;
      if (same >= 3) return i - 3;
    }
    return -1;
  };
})();
