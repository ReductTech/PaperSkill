import React, { useEffect, useRef } from 'react';
import { prefersReduced, FORCE_REDUCE } from '../../lib/hooks';

// 全屏背景层：月夜海面。固定在最底层、pointer-events: none；约 30fps；标签页隐藏时暂停；
// 订阅 prefers-reduced-motion 的变化（运行中切换即停 / 恢复）。
// 机制意象：阅读进度 = 层的深度。越往下读，潮水越退，露出沙岸上的“文字足迹”（琥珀沙色光点）。
// 与章节联动：浪尖上的青色光点代表“还在场的视觉 token”——读到第 5 章（撤出）时明显变稀，之后只剩少量；
// 第 3 章（注意力汇聚）月亮更亮；第 9–10 章（结果与边界）海面带一点琥珀暖色。
// 与操作联动：模块里触发“撤出”等关键时刻时，海面泛起一圈涟漪。

interface Spark {
  x: number;
  layer: number;
  phase: number;
  speed: number;
  size: number;
}

export function TideBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let t = 0;
    let level = 0; // 平滑后的退潮程度 0..1
    let reduced = prefersReduced();
    let chapter = 0;
    let sparkLevel = 1; // 平滑后的光点密度
    let moonBoost = 1;
    let warm = 0;
    const pulses: { t0: number; kind: string }[] = [];
    const targets = () => ({
      spark: chapter <= 4 ? 1 : chapter === 5 ? 0.5 : 0.22,
      moon: chapter === 3 ? 1.8 : 1,
      warm: chapter >= 9 ? 1 : 0,
    });
    const sparks: Spark[] = [];
    const prints: { x: number; y: number; a: number }[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 70; i++) sparks.push({ x: rnd(), layer: Math.floor(rnd() * 3), phase: rnd() * 6.28, speed: 0.15 + rnd() * 0.35, size: 0.6 + rnd() * 1.6 });
    for (let i = 0; i < 46; i++) prints.push({ x: rnd(), y: rnd(), a: 0.25 + rnd() * 0.6 });

    const resize = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      if (w < 2 || h < 2) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };

    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const draw = () => {
      if (w < 2 || h < 2) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 夜空
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#04061A');
      sky.addColorStop(0.55, '#081233');
      sky.addColorStop(1, '#0B1B44');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // 月亮与月晕
      const mx = w * 0.82;
      const my = h * 0.14;
      const halo = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(60, w * 0.32));
      halo.addColorStop(0, `rgba(230,226,255,${0.22 * moonBoost})`);
      halo.addColorStop(0.25, 'rgba(160,170,255,0.08)');
      halo.addColorStop(1, 'rgba(60,80,180,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      const mr = Math.max(14, Math.min(34, w * 0.025));
      const moon = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
      moon.addColorStop(0, 'rgba(255,253,245,0.95)');
      moon.addColorStop(1, 'rgba(214,214,255,0.75)');
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      // 水位：0.58h（满潮）→ 0.80h（退潮）
      const horizon = h * (0.58 + 0.22 * level);

      // 沙岸（退潮后露出）
      const sand = ctx.createLinearGradient(0, h * 0.6, 0, h);
      sand.addColorStop(0, 'rgba(60,48,58,0)');
      sand.addColorStop(0.5, 'rgba(84,66,70,0.45)');
      sand.addColorStop(1, 'rgba(120,92,80,0.55)');
      ctx.fillStyle = sand;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
      // 沙上的文字足迹：只在水面以下（已退潮的位置）显现
      for (const p of prints) {
        const py = h * 0.62 + p.y * h * 0.36;
        if (py < horizon + 6) continue;
        const px = p.x * w;
        const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * 0.8 + p.x * 20);
        ctx.fillStyle = `rgba(240,210,168,${0.5 * p.a * tw})`;
        ctx.beginPath();
        ctx.ellipse(px, py, 2.6, 1.4, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 三层海浪（由远及近）
      const layers = [
        { amp: 5, len: 0.012, sp: 0.35, off: 0, col0: 'rgba(14,40,92,0.92)', col1: 'rgba(8,22,60,0.96)', crest: 0.25 },
        { amp: 8, len: 0.008, sp: 0.5, off: 26, col0: 'rgba(12,52,110,0.82)', col1: 'rgba(6,24,64,0.94)', crest: 0.4 },
        { amp: 11, len: 0.006, sp: 0.7, off: 58, col0: 'rgba(10,64,120,0.7)', col1: 'rgba(5,22,56,0.9)', crest: 0.55 },
      ];
      layers.forEach((L, li) => {
        const base = horizon + L.off * (h / 900);
        const yAt = (x: number) =>
          base + Math.sin(x * L.len + t * L.sp) * L.amp + Math.sin(x * L.len * 2.3 - t * L.sp * 1.3) * L.amp * 0.4;
        const g = ctx.createLinearGradient(0, base - L.amp, 0, h);
        g.addColorStop(0, L.col0);
        g.addColorStop(1, L.col1);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w + 12; x += 12) ctx.lineTo(x, yAt(x));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        // 生物荧光浪尖
        ctx.strokeStyle = `rgba(59,224,232,${L.crest * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'rgba(59,224,232,0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let x = 0; x <= w + 12; x += 12) {
          const y = yAt(x);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        // 浪尖上的浮游光点
        for (let si = 0; si < sparks.length; si++) {
          const s = sparks[si];
          if (s.layer !== li) continue;
          // 撤出之后，大部分视觉光点熄灭
          const keep = sparkLevel * sparks.length - si;
          if (keep <= 0) continue;
          const fade = Math.min(1, keep);
          const x = ((s.x + (reduced ? 0 : t * 0.006 * s.speed)) % 1) * w;
          const y = yAt(x) + 2 + Math.sin(s.phase + t * s.speed * 2) * 3;
          // 背景光点整体压暗约 25%：亮光留给舞台、章节转场和交互反馈
          const a = (reduced ? 0.38 : 0.26 + 0.34 * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed * 3))) * fade;
          const r = s.size * 2.2;
          const sg = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
          sg.addColorStop(0, `rgba(160,255,250,${a})`);
          sg.addColorStop(1, 'rgba(59,224,232,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(x, y, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 月光倒影
      for (let i = 0; i < 14; i++) {
        const yy = horizon + 10 + i * (h - horizon) * 0.06;
        if (yy > h) break;
        const ww = (18 + i * 6) * (0.7 + 0.3 * Math.sin(t * 1.3 + i));
        ctx.fillStyle = `rgba(230,228,255,${0.12 * (1 - i / 14)})`;
        ctx.fillRect(mx - ww / 2 + Math.sin(t + i * 1.7) * 6, yy, ww, 1.6);
      }
    };

    const drawOverlay = () => {
      const horizon = h * (0.58 + 0.22 * level);
      if (warm > 0.01) {
        const g = ctx.createLinearGradient(0, horizon - 40, 0, h);
        g.addColorStop(0, `rgba(251,191,36,${0.05 * warm})`);
        g.addColorStop(1, `rgba(240,160,90,${0.09 * warm})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, horizon - 40, w, h - horizon + 40);
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const q = (t - pulses[i].t0) / 1.6;
        if (q >= 1 || q < 0) {
          pulses.splice(i, 1);
          continue;
        }
        const strong = pulses[i].kind === 'withdraw';
        const R = (0.1 + q) * w * 0.7;
        ctx.save();
        ctx.strokeStyle = `rgba(${strong ? '120,250,255' : '200,210,255'},${(1 - q) * (strong ? 0.55 : 0.3)})`;
        ctx.lineWidth = 2 + (1 - q) * 3;
        ctx.beginPath();
        ctx.ellipse(w / 2, horizon + 20, R, R * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / 30) return; // 约 30fps
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t += dt;
      level += (progress() - level) * Math.min(1, dt * 2.2);
      const tg = targets();
      const k = Math.min(1, dt * 1.5);
      sparkLevel += (tg.spark - sparkLevel) * k;
      moonBoost += (tg.moon - moonBoost) * k;
      warm += (tg.warm - warm) * k;
      draw();
      drawOverlay();
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (raf || reduced || document.visibilityState === 'hidden') return;
      last = performance.now() - 40;
      raf = requestAnimationFrame(frame);
    };
    const staticFrame = () => {
      level = progress();
      const tg = targets();
      sparkLevel = tg.spark;
      moonBoost = tg.moon;
      warm = tg.warm;
      draw();
      drawOverlay();
    };

    resize();
    staticFrame();
    start();

    const onResize = () => {
      resize();
      if (reduced) staticFrame();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') stop();
      else if (!reduced) start();
      else staticFrame();
    };
    // 减少动态效果时不跑循环，只在滚动停下后重画一帧静态画面（状态更新，不是动画）
    let scrollTimer = 0;
    const onScroll = () => {
      if (!reduced) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(staticFrame, 120);
    };
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const onMotion = () => {
      reduced = FORCE_REDUCE || !!mq?.matches;
      if (reduced) {
        stop();
        staticFrame();
      } else start();
    };
    const onChapter = (e: Event) => {
      chapter = Number((e as CustomEvent).detail) || 0;
      if (reduced) staticFrame();
    };
    const onPulse = (e: Event) => {
      if (reduced) return;
      pulses.push({ t0: t, kind: String((e as CustomEvent).detail) });
      if (pulses.length > 4) pulses.shift();
    };
    window.addEventListener('vtw:chapter', onChapter);
    window.addEventListener('vtw:pulse', onPulse);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    mq?.addEventListener?.('change', onMotion);
    return () => {
      stop();
      window.clearTimeout(scrollTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('vtw:chapter', onChapter);
      window.removeEventListener('vtw:pulse', onPulse);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      mq?.removeEventListener?.('change', onMotion);
    };
  }, []);

  return <canvas ref={ref} className="tide-bg" aria-hidden="true" />;
}
