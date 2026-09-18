import React, { useCallback, useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

let localMathFont: Promise<FontFace> | null = null;

function ensureLocalMathFont() {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  if (document.fonts.check('1em "Latin Modern Math Local"')) {
    document.documentElement.classList.add('math-font-ready');
    return;
  }
  if (!localMathFont) {
    const source = `${import.meta.env.BASE_URL}images/latinmodern-math.otf`;
    localMathFont = new FontFace('Latin Modern Math Local', `url("${source}") format("opentype")`, {
      style: 'normal',
      weight: '400',
      display: 'swap',
    }).load();
  }
  localMathFont.then((font) => {
    document.fonts.add(font);
    document.documentElement.classList.add('math-font-ready');
  }).catch(() => {
    document.documentElement.classList.add('math-font-fallback');
  });
}

export const COLORS = {
  page: '#F3F0E8',
  surface: '#FFFDFC',
  surfaceSoft: '#F8F5EE',
  grid: '#E3DED4',
  line: '#D8D1C5',
  ink: '#29312F',
  muted: '#6B746F',
  primary: '#496052',
  normal: '#496052',
  normalSoft: '#E8EFEA',
  emphasis: '#C8754E',
  actual: '#C8754E',
  prediction: '#806A9E',
  corrector: '#806A9E',
  predictionSoft: '#F0ECF5',
  predictionInk: '#67547F',
  anomaly: '#B64F4F',
  anomalyInk: '#8F393D',
  recovery: '#3F7C5A',
  recoverySoft: '#EDF5EF',
  recoveryInk: '#315F47',
  actualInk: '#965038',
  table: '#E9E3D8',
  tableLine: '#CFC6B7',
  armStructure: '#B9C2BC',
  pending: '#9DA8A1',
  sand: '#E8E1D5',
  /* Compatibility aliases for older widgets; new drawing code uses semantic names above. */
  bg: '#F3F0E8',
  blue: '#496052',
  green: '#3F7C5A',
  red: '#B64F4F',
  orange: '#C8754E',
  purple: '#806A9E',
} as const;

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) => void;

export function useResponsiveCanvas(
  draw: DrawFn,
  deps: React.DependencyList,
  options: { mobileHeight?: number; desktopRatio?: number; minDesktopHeight?: number; maxDesktopHeight?: number; animate?: boolean; playOnceSeconds?: number } = {},
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  const sceneRef = useRef<{ render: (time: number) => void } | null>(null);
  drawRef.current = draw;
  const { mobileHeight = 300, desktopRatio = 0.3, minDesktopHeight = 250, maxDesktopHeight = 360, animate = false, playOnceSeconds } = options;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    let width = 0;
    let height = 0;
    let raf = 0;
    let startedAt = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = !animate || reducedMotion;

    const render = (time: number) => {
      if (!ctx) return;
      drawRef.current(ctx, width, height, time);
    };
    sceneRef.current = { render };

    const resize = () => {
      const parentWidth = canvas.parentElement?.getBoundingClientRect().width || 720;
      const renderedWidth = canvas.getBoundingClientRect().width;
      width = Math.max(240, Math.floor(renderedWidth > 0 ? renderedWidth : parentWidth));
      height = width < 620
        ? mobileHeight
        : Math.max(minDesktopHeight, Math.min(maxDesktopHeight, Math.round(width * desktopRatio)));
      ctx = setupCanvas(canvas, width, height);
      canvas.style.width = '100%';
      canvas.style.height = `${height}px`;
      canvas.style.aspectRatio = `${width} / ${height}`;
      render(performance.now() / 1000);
      canvas.classList.add('is-ready');
    };

    const frame = (now: number) => {
      if (!running || !ctx) return;
      if (!startedAt) startedAt = now;
      render(now / 1000);
      if (playOnceSeconds && now - startedAt >= playOnceSeconds * 1000) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!animate || reducedMotion || running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!animate || reducedMotion) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    const disconnectVisibility = animate ? observeCanvas(canvas, start, stop) : () => {};

    return () => {
      stop();
      resizeObserver.disconnect();
      disconnectVisibility();
      sceneRef.current = null;
    };
  }, [animate, desktopRatio, maxDesktopHeight, minDesktopHeight, mobileHeight, playOnceSeconds]);

  useEffect(() => {
    sceneRef.current?.render(performance.now() / 1000);
  }, deps);

  return ref;
}

export function easeInOutCubic(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export function animationCycle(time: number, travelSeconds = 3.4, holdSeconds = 1) {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 1;
  const phase = time % (travelSeconds + holdSeconds);
  return phase >= travelSeconds ? 1 : easeInOutCubic(phase / travelSeconds);
}

export function segmentProgress(progress: number, start: number, end: number) {
  if (end <= start) return progress >= end ? 1 : 0;
  return easeInOutCubic(Math.max(0, Math.min(1, (progress - start) / (end - start))));
}

export function useTweenedNumber(target: number, duration = 420, immediate = false) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (immediate || reduced || Math.abs(target - current.current) < 0.00001) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / Math.max(1, duration));
      const next = from + (target - from) * easeInOutCubic(progress);
      current.current = next;
      setValue(next);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [duration, immediate, target]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return value;
}

export function useTweenedRecord<T extends Record<string, number>>(target: T, duration = 420, immediate = false) {
  const signature = JSON.stringify(target);
  const [value, setValue] = useState<T>(target);
  const current = useRef<T>(target);
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (immediate || reduced) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = { ...current.current } as Record<string, number>;
    const targetRecord = target as Record<string, number>;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / Math.max(1, duration));
      const eased = easeInOutCubic(progress);
      const next = Object.fromEntries(Object.keys(targetRecord).map((key) => [key, from[key] + (targetRecord[key] - from[key]) * eased])) as T;
      current.current = next;
      setValue(next);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // `signature` intentionally captures every numeric target field.
  }, [duration, immediate, signature]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return value;
}

export function useRevealProgress(signal: string | number, duration = 460) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    setProgress(0);
    const started = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - started) / Math.max(1, duration));
      setProgress(easeInOutCubic(next));
      if (next < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [duration, signal]);

  return progress;
}

export function CountUp({ value, digits = 0, prefix = '', suffix = '', immediate = false }: { value: number; digits?: number; prefix?: string; suffix?: string; immediate?: boolean }) {
  const animated = useTweenedNumber(value, 420, immediate);
  return <>{prefix}{animated.toFixed(digits)}{suffix}</>;
}

const rememberedState = new Map<string, unknown>();

/** Preserve an interaction while the slide shell temporarily unmounts a chapter. */
export function useRememberedState<T>(key: string, initial: T) {
  const [value, setValueInner] = useState<T>(() => (rememberedState.has(key) ? rememberedState.get(key) as T : initial));
  const setValue = useCallback((next: React.SetStateAction<T>) => {
    setValueInner((previous) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(previous) : next;
      rememberedState.set(key, resolved);
      return resolved;
    });
  }, [key]);
  return [value, setValue] as const;
}

/**
 * The bundled slide shell owns navigation. This allowed widget hook adds deep links and
 * keeps an interactive control's arrow keys from bubbling into chapter navigation.
 */
let initialHashPhase: 'pending' | 'done' = 'pending';

export function useTutorialRuntime(chapterId: string) {
  useEffect(() => {
    ensureLocalMathFont();
    const interactive = 'input, button, select, textarea, [contenteditable="true"], [role="slider"], canvas[tabindex]';
    const stopChapterKeys = (event: KeyboardEvent) => {
      if (!event.key.startsWith('Arrow')) return;
      const target = event.target as Element | null;
      if (target?.closest(interactive)) event.stopPropagation();
    };
    document.addEventListener('keydown', stopChapterKeys);

    const items = Array.from(document.querySelectorAll<HTMLButtonElement>('.slide-sidebar-item'));
    const index = chapterId === 'hero' ? 0 : Number(chapterId.replace('chap-', ''));
    const wantedHash = index === 0 ? '#cover' : `#chapter-${index}`;
    const incomingHash = window.location.hash;

    const applyHash = () => {
      const match = window.location.hash.match(/^#chapter-(\d+)$/);
      const targetIndex = window.location.hash === '#cover' ? 0 : match ? Number(match[1]) : null;
      if (targetIndex !== null && targetIndex >= 0 && targetIndex < items.length) items[targetIndex]?.click();
    };
    const isInitialDeepLink = chapterId === 'hero' && initialHashPhase === 'pending' && /^#chapter-\d+$/.test(incomingHash);
    if (isInitialDeepLink) {
      requestAnimationFrame(() => {
        applyHash();
        initialHashPhase = 'done';
      });
    } else {
      initialHashPhase = 'done';
      if (window.location.hash !== wantedHash) history.replaceState(null, '', wantedHash);
    }
    window.addEventListener('hashchange', applyHash);

    const menuButton = document.querySelector<HTMLButtonElement>('.slide-sidebar-toggle');
    const sidebar = document.querySelector<HTMLElement>('.slide-sidebar');
    const layout = document.querySelector<HTMLElement>('.slide-layout');
    const coverButton = items[0];
    const coverLabel = coverButton?.querySelector<HTMLElement>('.slide-sidebar-num');
    if (coverButton && coverLabel) {
      coverButton.classList.add('cover-link');
      coverButton.setAttribute('aria-label', '返回封面');
      coverLabel.textContent = '返回封面';
    }
    if (menuButton && sidebar) {
      sidebar.id = 'chapter-switcher';
      menuButton.setAttribute('aria-controls', sidebar.id);
      menuButton.setAttribute('aria-expanded', String(layout?.classList.contains('sidebar-open') ?? false));
    }
    document.querySelectorAll('.module-head h4').forEach((heading) => {
      heading.setAttribute('role', 'heading');
      heading.setAttribute('aria-level', '3');
    });

    const formulaCards = Array.from(document.querySelectorAll<HTMLElement>('.formula-explain'));
    const helpRows = formulaCards.map((card, index) => {
      const help = document.createElement('div');
      help.id = `formula-inline-help-${chapterId}-${index}`;
      help.className = 'formula-inline-help';
      help.setAttribute('role', 'status');
      help.innerHTML = '<b>符号说明</b><span>把鼠标移到主要符号上，或用 Tab 聚焦；点击可固定解释。</span>';
      card.appendChild(help);
      return help;
    });
    let pinnedToken: Element | null = null;

    const showFormulaHelp = (token: Element, pin = false) => {
      const tip = token.getAttribute('data-tip');
      if (!tip) return;
      const card = token.closest<HTMLElement>('.formula-explain');
      const help = card?.querySelector<HTMLElement>('.formula-inline-help');
      if (!card || !help) return;
      card.querySelectorAll<HTMLElement>('[data-selected="true"]').forEach((node) => delete node.dataset.selected);
      if (pin) {
        pinnedToken = token;
        (token as HTMLElement).dataset.selected = 'true';
      }
      const label = token.getAttribute('data-label') || token.textContent?.trim() || '公式符号';
      help.innerHTML = '';
      const strong = document.createElement('b');
      const body = document.createElement('span');
      strong.textContent = label;
      body.textContent = tip;
      help.append(strong, body);
      help.classList.add('has-symbol');
      token.setAttribute('aria-describedby', help.id);
      token.setAttribute('aria-label', `${label}：${tip}`);
    };
    const formulaToken = (target: EventTarget | null) => target instanceof Element
      ? target.closest('.formula-explain math [data-sym][data-tip]')
      : null;
    const previewFormulaTip = (event: Event) => {
      const token = formulaToken(event.target);
      if (!token) return;
      showFormulaHelp(token);
    };
    const pinFormulaTip = (event: Event) => {
      const token = formulaToken(event.target);
      if (!token) return;
      showFormulaHelp(token, true);
    };
    const activateFormulaKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        pinnedToken = null;
        formulaCards.forEach((card, index) => {
          card.querySelectorAll<HTMLElement>('[data-selected="true"]').forEach((node) => delete node.dataset.selected);
          helpRows[index].innerHTML = '<b>符号说明</b><span>把鼠标移到主要符号上，或用 Tab 聚焦；点击可固定解释。</span>';
          helpRows[index].classList.remove('has-symbol');
        });
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const token = formulaToken(event.target);
      if (!token) return;
      event.preventDefault();
      showFormulaHelp(token, true);
    };
    document.querySelectorAll<Element>('.formula-explain math [data-sym][data-tip]').forEach((token) => {
      const tip = token.getAttribute('data-tip');
      if (tip) token.setAttribute('aria-label', `${token.textContent?.trim() || '公式符号'}：${tip}`);
    });
    document.addEventListener('pointerover', previewFormulaTip);
    document.addEventListener('focusin', previewFormulaTip);
    document.addEventListener('click', pinFormulaTip);
    document.addEventListener('keydown', activateFormulaKey);

    return () => {
      document.removeEventListener('keydown', stopChapterKeys);
      window.removeEventListener('hashchange', applyHash);
      document.removeEventListener('pointerover', previewFormulaTip);
      document.removeEventListener('focusin', previewFormulaTip);
      document.removeEventListener('click', pinFormulaTip);
      document.removeEventListener('keydown', activateFormulaKey);
      helpRows.forEach((help) => help.remove());
      pinnedToken = null;
    };
  }, [chapterId]);
}

export function clearScene(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 12,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

export function drawCamera(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  color: string = COLORS.normal,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  roundRect(ctx, -30, -18, 60, 38, 7);
  ctx.fill();
  ctx.fillStyle = COLORS.surface;
  ctx.beginPath();
  ctx.arc(0, 1, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = color;
  roundRect(ctx, -18, -25, 25, 10, 4);
  ctx.fill();
  ctx.restore();
}

export function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius = 12,
  color: string = COLORS.actual,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.surface;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

export function drawWorkbench(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const tableY = height * 0.77;
  ctx.save();
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(0, tableY, width, height - tableY);
  ctx.strokeStyle = COLORS.tableLine;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, tableY); ctx.lineTo(width, tableY); ctx.stroke();
  ctx.restore();
}

export function drawBowl(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color: string = COLORS.recovery) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = `${color}22`; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-29, 0); ctx.quadraticCurveTo(-22, 27, 0, 28); ctx.quadraticCurveTo(22, 27, 29, 0); ctx.stroke();
  ctx.restore();
}

export function drawObject(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color: string = COLORS.actual) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.surface; ctx.lineWidth = 2;
  roundRect(ctx, -10, -10, 20, 20, 5); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawRobotArm(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  targetX: number,
  targetY: number,
  scale = 1,
  color: string = COLORS.normal,
) {
  const elbowX = baseX + (targetX - baseX) * 0.46;
  const elbowY = Math.min(baseY - 62 * scale, targetY - 30 * scale);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.armStructure; ctx.lineWidth = 19 * scale;
  ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(elbowX, elbowY); ctx.lineTo(targetX, targetY); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 10 * scale;
  ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(elbowX, elbowY); ctx.lineTo(targetX, targetY); ctx.stroke();
  [ [baseX, baseY], [elbowX, elbowY] ].forEach(([x, y]) => {
    ctx.fillStyle = COLORS.surface; ctx.strokeStyle = color; ctx.lineWidth = 4 * scale;
    ctx.beginPath(); ctx.arc(x, y, 10 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  ctx.strokeStyle = color; ctx.lineWidth = 4 * scale;
  ctx.beginPath(); ctx.moveTo(targetX - 7 * scale, targetY + 2 * scale); ctx.lineTo(targetX - 2 * scale, targetY + 13 * scale);
  ctx.moveTo(targetX + 7 * scale, targetY + 2 * scale); ctx.lineTo(targetX + 2 * scale, targetY + 13 * scale); ctx.stroke();
  ctx.restore();
}

export function drawActionTokens(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  executed: number,
  truncatedFrom = Infinity,
  gap = 22,
) {
  for (let index = 0; index < count; index += 1) {
    const px = x + index * gap;
    const stale = index >= truncatedFrom;
    ctx.fillStyle = index < executed ? COLORS.normal : COLORS.surface;
    ctx.strokeStyle = stale ? COLORS.anomaly : index < executed ? COLORS.normal : COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (stale) {
      ctx.beginPath(); ctx.moveTo(px - 6, y - 6); ctx.lineTo(px + 6, y + 6); ctx.moveTo(px + 6, y - 6); ctx.lineTo(px - 6, y + 6); ctx.stroke();
    }
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = COLORS.normal,
  dashed = false,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  if (dashed) ctx.setLineDash([8, 6]);
  roundRect(ctx, x, y, width, height, 10);
  ctx.stroke();
  const c = 12;
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(([cx, cy], i) => {
    const sx = i % 2 === 0 ? 1 : -1;
    const sy = i < 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * c);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * c, cy);
    ctx.stroke();
  });
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 3,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 11 * Math.cos(angle - Math.PI / 6), y2 - 11 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 11 * Math.cos(angle + Math.PI / 6), y2 - 11 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  width = 3,
  dashed = false,
  alpha = 1,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dashed) ctx.setLineDash([9, 7]);
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.stroke();
  ctx.restore();
}

export function drawFeatureMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  values: number[],
  color: string = COLORS.prediction,
  reveal = 1,
) {
  const columns = 4;
  const rows = 3;
  const gap = 5;
  const cellW = (width - gap * (columns - 1)) / columns;
  const cellH = (height - gap * (rows - 1)) / rows;
  ctx.save();
  for (let index = 0; index < columns * rows; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const visible = Math.max(0, Math.min(1, reveal * 12 - index));
    const value = values[index % values.length] ?? 0.5;
    ctx.globalAlpha = 0.14 + visible * 0.86;
    ctx.fillStyle = color;
    roundRect(ctx, x + column * (cellW + gap), y + row * (cellH + gap), cellW, cellH, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = COLORS.surface;
    ctx.globalAlpha = visible * (0.55 + 0.45 * value);
    roundRect(ctx, x + column * (cellW + gap) + 3, y + row * (cellH + gap) + 3, Math.max(2, (cellW - 6) * value), Math.max(2, cellH - 6), 3);
    ctx.fill();
  }
  ctx.restore();
}

export function drawToken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  state: 'executed' | 'pending' | 'stale' | 'new',
  alpha = 1,
) {
  const color = state === 'stale' ? COLORS.anomaly : state === 'new' ? COLORS.recovery : COLORS.normal;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = state === 'executed' || state === 'new' ? color : COLORS.surface;
  ctx.strokeStyle = state === 'pending' ? COLORS.pending : color;
  ctx.lineWidth = state === 'pending' ? 1.5 : 2.5;
  roundRect(ctx, x, y, width, 32, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state === 'executed' || state === 'new' ? COLORS.surface : color;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + width / 2, y + 16);
  if (state === 'stale') {
    ctx.strokeStyle = COLORS.anomaly;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 27);
    ctx.lineTo(x + width - 5, y + 5);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawAxis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.stroke();
  ctx.restore();
}

export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  baselineY: number,
  width: number,
  height: number,
  color: string,
) {
  ctx.fillStyle = color;
  roundRect(ctx, x, baselineY - height, width, height, 6);
  ctx.fill();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = COLORS.ink,
  size = 15,
  align: CanvasTextAlign = 'left',
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function canvasPoint(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * (canvas.width / (window.devicePixelRatio || 1)),
    y: ((event.clientY - rect.top) / rect.height) * (canvas.height / (window.devicePixelRatio || 1)),
  };
}

export function Metrics({ items }: { items: Array<{ label: string; value: React.ReactNode; tone?: string }> }) {
  return (
    <div className="v2-metrics">
      {items.map((item) => (
        <div className={`v2-metric ${item.tone || ''}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Feedback({ tone = 'neutral', children }: { tone?: 'neutral' | 'good' | 'bad' | 'warn' | 'aux'; children: React.ReactNode }) {
  return <div className={`feedback v2-feedback ${tone}`}>{children}</div>;
}

export const JOURNEY_STEPS = ['正常执行', '读取观测', '计算残差', '累计异常', '截断', '一次 OGG', '普通推理'] as const;

export function JourneySteps({ active, reached = active, compact = false }: { active: number; reached?: number; compact?: boolean }) {
  return (
    <div className={`journey-steps ${compact ? 'compact' : ''}`} aria-label="检测纠正七步过程">
      {JOURNEY_STEPS.map((label, index) => (
        <div className={`journey-step ${index === active ? 'active' : ''} ${index < active || index <= reached ? 'reached' : ''}`} key={label}>
          <span>{index + 1}</span><b>{label}</b>
        </div>
      ))}
    </div>
  );
}

export function ChipButton({ selected, children, onClick, ariaLabel }: { selected?: boolean; children: React.ReactNode; onClick: () => void; ariaLabel?: string }) {
  return <button type="button" className={`chip ${selected ? 'selected' : ''}`} aria-pressed={selected} aria-label={ariaLabel} onClick={onClick}>{children}</button>;
}
