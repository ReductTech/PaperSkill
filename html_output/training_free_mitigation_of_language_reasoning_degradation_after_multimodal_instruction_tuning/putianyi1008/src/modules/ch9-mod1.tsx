import React, { useEffect, useRef, useState } from 'react';
import { C, stage, rack, label, legend, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// Three use-case zones drawn on the board; clicking a zone (P5 hotspot) selects it.
// Each zone carries its own identity colour so the legend below actually identifies
// the clickable regions instead of being a decorative key.
type Zone = { key: string; x: number; w: number; need: number; name: string; color: string };
const ZONES: Zone[] = [
  { key: 'vision', x: 70, w: 300, need: 10, name: '以视觉为主', color: C.purple },
  { key: 'both', x: 390, w: 300, need: 50, name: '两者都要', color: C.blue },
  { key: 'text', x: 710, w: 300, need: 90, name: '以文本为主', color: C.green },
];

const alphaFor = (need: number) => Math.min(0.4, Math.max(0.05, 0.05 + (need / 100) * 0.35));

const FEEDBACK: Record<string, { t: string; c: string }> = {
  vision: {
    t: '你几乎只需要视觉能力：α 应该压到很小，甚至保持不合并，语言退化在这个场景里不是主要代价。',
    c: '',
  },
  both: {
    t: '两边都要：论文的方向是小 α（例如 0.1 量级），用最小的代价把语言拉回来。',
    c: 'good',
  },
  text: {
    t: '如果你主要用文本：可以把 α 往大推，但要接受视觉指标明显下降，甚至 GQA 趋近于 0。',
    c: 'bad',
  },
};

export const Ch9Mod1: React.FC = () => {
  const [sel, setSel] = useState('both');
  const [hover, setHover] = useState<string | null>(null);
  const selRef = useRef(sel);
  selRef.current = sel;
  const hoverRef = useRef<string | null>(null);
  hoverRef.current = hover;
  const [fb, setFb] = useState(FEEDBACK.both);

  const pick = (key: string) => {
    setSel(key);
    setFb(FEEDBACK[key]);
  };

  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);
    const active = selRef.current;
    const hovered = hoverRef.current;

    ZONES.forEach((z) => {
      const isActive = z.key === active;
      const isHover = z.key === hovered;
      // identity colour for every zone; the selected one is filled and pulsing
      rack(ctx, z.x, 44, z.w, 150, z.color, isActive);
      if (!isActive) {
        ctx.strokeStyle = isHover ? C.orange : z.color;
        ctx.lineWidth = isHover ? 3.4 : 2.2;
        ctx.stroke();
      }
      // pulse the selected zone so the active state is unmistakable
      if (isActive) {
        const pulse = 2 + (Math.sin((now % 1400) / 1400 * Math.PI * 2) + 1) * 2;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = pulse / 1.6;
        rack(ctx, z.x - 4, 40, z.w + 8, 158, z.color);
        ctx.stroke();
      }
      // headphone glyph inside each zone: cup height encodes the language need
      ctx.strokeStyle = isActive ? C.white : C.muted;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(z.x + z.w / 2, 112, 26, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      rack(ctx, z.x + z.w / 2 - 30, 104, 12, 26, isActive ? C.white : C.purple, true);
      const cupY = 128 - (z.need / 100) * 30;
      rack(ctx, z.x + z.w / 2 + 18, cupY, 12, 26, isActive ? C.white : C.green, true);
    });

    // recommendation marker on a 0..0.5 scale, driven by the selected zone
    const need = ZONES.find((z) => z.key === active)?.need ?? 50;
    const scaleX = 200 + (alphaFor(need) / 0.5) * 620;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(200, 236);
    ctx.lineTo(820, 236);
    ctx.stroke();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.moveTo(scaleX, 210);
    ctx.lineTo(scaleX - 10, 226);
    ctx.lineTo(scaleX + 10, 226);
    ctx.closePath();
    ctx.fill();

    label(ctx, 200, 258, '推荐 α', C.text, 'left');
    legend(ctx, 480, 258, ZONES.map((z) => [z.name, z.color] as [string, string]));
  });

  // Canvas hotspot hit testing (P5) with CSS-to-intrinsic coordinate mapping.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const zoneAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / (r.width || W));
      const y = (e.clientY - r.top) * (H / (r.height || H));
      if (y < 40 || y > 200) return null;
      return ZONES.find((z) => x >= z.x && x <= z.x + z.w)?.key ?? null;
    };
    const down = (e: PointerEvent) => {
      const key = zoneAt(e);
      if (key) pick(key);
    };
    const move = (e: PointerEvent) => {
      const key = zoneAt(e);
      setHover(key);
      canvas.style.cursor = key ? 'pointer' : 'default';
    };
    const leave = () => setHover(null);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
    };
  }, [ref, sel]);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        {ZONES.map((z) => (
          <button
            key={z.key}
            className={z.key === sel ? 'chip active' : 'chip'}
            onClick={() => pick(z.key)}
          >
            {z.name}
          </button>
        ))}
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        画布上的三个分区从左到右分别是：以视觉为主（紫）、两者都要（蓝）、以文本为主（绿）；
        直接点击分区即可选择。当前选择的推荐合并权重 α ≈ {(0.05 + (ZONES.find((z) => z.key === sel)!.need / 100) * 0.35).toFixed(2)}
        （论文未给出 α 的最优值，此处只是把取舍显式化的示意）。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch9Mod1;
