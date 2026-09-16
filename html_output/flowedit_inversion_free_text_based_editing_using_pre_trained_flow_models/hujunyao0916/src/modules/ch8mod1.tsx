import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 360;
const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  brown: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
  red: '#c43f52',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

type NodeId = 'Xsrc' | 'Zsrc_t' | 'Ztar_t' | 'VΔ' | 'ZFE_t';

const NODES: { id: NodeId; x: number; y: number; label: string }[] = [
  { id: 'Xsrc', x: 110, y: 200, label: 'Xsrc' },
  { id: 'Zsrc_t', x: 250, y: 80, label: 'Zsrc_t' },
  { id: 'Ztar_t', x: 420, y: 80, label: 'Ztar_t' },
  { id: 'VΔ', x: 520, y: 170, label: 'VΔ' },
  { id: 'ZFE_t', x: 660, y: 200, label: 'ZFE_t' },
];

const DETAIL: Record<NodeId, string> = {
  Xsrc: 'Xsrc：干净源图，结构锚点。右侧预览是清晰原图。',
  Zsrc_t: 'Zsrc_t：源提示下的噪声态，原图被噪声淹没但仍偏「源语义」。',
  Ztar_t: 'Ztar_t：目标提示下的噪声态，轮廓开始偏向目标对象。',
  VΔ: 'VΔ = V_tar − V_src：两边预测之差，驱动直接编辑方向。',
  ZFE_t: 'ZFE_t：沿短路径更新后的当前态，结构仍在，语义已部分改写。',
};

const PREVIEW_TITLE: Record<NodeId, string> = {
  Xsrc: '源图预览',
  Zsrc_t: '源噪声态',
  Ztar_t: '目标噪声态',
  VΔ: '速度差示意',
  ZFE_t: 'FlowEdit 当前态',
};

/** Draw a small stylized "photo" content that differs by node. */
function drawSceneContent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  mode: NodeId,
  seed: number
) {
  // sky / ground
  ctx.fillStyle = '#d7e6f2';
  ctx.fillRect(x, y, w, h * 0.55);
  ctx.fillStyle = '#c5d6a8';
  ctx.fillRect(x, y + h * 0.55, w, h * 0.45);

  const cx = x + w * 0.42;
  const cy = y + h * 0.62;

  if (mode === 'Xsrc' || mode === 'Zsrc_t') {
    // cat-like blob (source)
    ctx.fillStyle = '#c4a574';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 18);
    ctx.lineTo(cx - 10, cy - 34);
    ctx.lineTo(cx - 2, cy - 16);
    ctx.moveTo(cx + 2, cy - 16);
    ctx.lineTo(cx + 10, cy - 34);
    ctx.lineTo(cx + 18, cy - 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#21324a';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 2, 3, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (mode === 'Ztar_t' || mode === 'ZFE_t') {
    // dog-like / raccoon-like target silhouette
    const alpha = mode === 'ZFE_t' ? 1 : 0.85;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = mode === 'ZFE_t' ? '#8b6b4a' : '#7a5c3e';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // snout
    ctx.beginPath();
    ctx.ellipse(cx + 28, cy + 4, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // ear
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 16);
    ctx.lineTo(cx - 2, cy - 38);
    ctx.lineTo(cx + 12, cy - 18);
    ctx.fill();
    ctx.fillStyle = '#21324a';
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (mode === 'VΔ') {
    // split compare + orange delta arrow
    ctx.fillStyle = '#c4a574';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.28, cy, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5c3e';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.72, cy, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.4, cy);
    ctx.lineTo(x + w * 0.6, cy);
    ctx.stroke();
    // arrow head
    ctx.beginPath();
    ctx.moveTo(x + w * 0.6, cy);
    ctx.lineTo(x + w * 0.54, cy - 7);
    ctx.lineTo(x + w * 0.54, cy + 7);
    ctx.closePath();
    ctx.fillStyle = C.orange;
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('源', x + w * 0.22, cy + 36);
    ctx.fillText('目标', x + w * 0.66, cy + 36);
  }

  // noise overlay for noisy states
  if (mode === 'Zsrc_t' || mode === 'Ztar_t') {
    for (let i = 0; i < 90; i++) {
      const px = x + ((seed * 17 + i * 47) % 1000) / 1000 * w;
      const py = y + ((seed * 31 + i * 91) % 1000) / 1000 * h;
      const g = 40 + ((seed + i * 13) % 180);
      ctx.fillStyle = `rgba(${g},${g},${g},${mode === 'Zsrc_t' ? 0.45 : 0.4})`;
      ctx.fillRect(px, py, 3, 3);
    }
  }

  // FE: keep structure marker (fence / ground line) to show preservation
  if (mode === 'ZFE_t' || mode === 'Xsrc') {
    ctx.strokeStyle = C.brown;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + h * 0.78);
    ctx.lineTo(x + w - 12, y + h * 0.78);
    ctx.stroke();
  }
}

/** P8：点击计算图节点，右侧预览五种「图像态」差别 */
export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ sel: NodeId; t: number }>({ sel: 'Xsrc', t: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<NodeId>('Xsrc');
  const [feedback, setFeedback] = useState({ text: DETAIL.Xsrc, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<
      NodeId,
      (typeof NODES)[0]
    >;

    const render = (now: number) => {
      const selected = stateRef.current.sel;
      stateRef.current.t = now;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // left graph panel
      ctx.fillStyle = C.light;
      ctx.fillRect(30, 24, 700, H - 48);
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 24, 700, H - 48);

      ctx.fillStyle = C.text;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('编辑计算图', 48, 48);

      const edges: [NodeId, NodeId][] = [
        ['Xsrc', 'Zsrc_t'],
        ['Zsrc_t', 'Ztar_t'],
        ['Ztar_t', 'VΔ'],
        ['Xsrc', 'ZFE_t'],
        ['VΔ', 'ZFE_t'],
        ['Zsrc_t', 'VΔ'],
      ];
      edges.forEach(([a, b]) => {
        const on = a === selected || b === selected;
        ctx.strokeStyle = on ? C.green : C.border;
        ctx.lineWidth = on ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(nodeMap[a].x, nodeMap[a].y);
        ctx.lineTo(nodeMap[b].x, nodeMap[b].y);
        ctx.stroke();
      });

      // parallelogram hint
      ctx.strokeStyle = 'rgba(39,68,110,0.25)';
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(200, 70, 280, 140);
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('平行四边形构造', 280, 62);

      NODES.forEach((n) => {
        const isSel = n.id === selected;
        ctx.fillStyle = isSel ? C.green : '#fff';
        ctx.strokeStyle = isSel ? C.green : C.blue;
        ctx.lineWidth = isSel ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(n.x - 46, n.y - 20, 92, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isSel ? '#fff' : C.text;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + 5);
      });
      ctx.textAlign = 'left';

      // right preview panel
      const px = 760;
      const py = 24;
      const pw = 290;
      const ph = H - 48;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(PREVIEW_TITLE[selected], px + 16, py + 28);

      // photo frame
      const fx = px + 28;
      const fy = py + 48;
      const fw = pw - 56;
      const fh = 170;
      ctx.fillStyle = '#eef3e8';
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(fx, fy, fw, fh);

      drawSceneContent(ctx, fx + 8, fy + 8, fw - 16, fh - 16, selected, selected.length * 17);

      // caption strip under photo
      const captions: Record<NodeId, string> = {
        Xsrc: '清晰 · 无噪声',
        Zsrc_t: '噪声大 · 仍像源',
        Ztar_t: '噪声大 · 偏目标',
        VΔ: '差分方向',
        ZFE_t: '已改语义 · 保结构',
      };
      ctx.fillStyle =
        selected === 'ZFE_t' || selected === 'VΔ'
          ? C.green
          : selected === 'Zsrc_t' || selected === 'Ztar_t'
            ? C.red
            : C.blue;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(captions[selected], px + 16, py + ph - 18);

      // five mini thumbnails under graph for comparison
      const thumbs: NodeId[] = ['Xsrc', 'Zsrc_t', 'Ztar_t', 'VΔ', 'ZFE_t'];
      thumbs.forEach((id, i) => {
        const tx = 48 + i * 130;
        const ty = 268;
        const tw = 110;
        const th = 70;
        const active = id === selected;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = active ? C.orange : C.border;
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.fillRect(tx, ty, tw, th);
        ctx.strokeRect(tx, ty, tw, th);
        drawSceneContent(ctx, tx + 4, ty + 4, tw - 8, th - 22, id, id.length * 11);
        ctx.fillStyle = active ? C.orange : C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(id, tx + tw / 2, ty + th - 6);
      });
      ctx.textAlign = 'left';

      canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const off = observeCanvas(canvas, start, stop);

    const select = (id: NodeId) => {
      stateRef.current.sel = id;
      setSel(id);
      setFeedback({
        text: DETAIL[id],
        cls: id === 'VΔ' || id === 'ZFE_t' ? 'good' : id === 'Zsrc_t' || id === 'Ztar_t' ? 'bad' : '',
      });
    };

    const hit = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      for (const n of NODES) {
        if (Math.abs(x - n.x) < 50 && Math.abs(y - n.y) < 24) {
          select(n.id);
          return;
        }
      }
      // hit mini thumbs
      const thumbs: NodeId[] = ['Xsrc', 'Zsrc_t', 'Ztar_t', 'VΔ', 'ZFE_t'];
      thumbs.forEach((id, i) => {
        const tx = 48 + i * 130;
        const ty = 268;
        if (x >= tx && x <= tx + 110 && y >= ty && y <= ty + 70) select(id);
      });
    };
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('pointerdown', hit);
    return () => {
      stop();
      off();
      canvas.removeEventListener('pointerdown', hit);
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {NODES.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`chip${sel === n.id ? ' selected' : ''}`}
            aria-pressed={sel === n.id}
            onClick={() => {
              stateRef.current.sel = n.id;
              setSel(n.id);
              setFeedback({
                text: DETAIL[n.id],
                cls:
                  n.id === 'VΔ' || n.id === 'ZFE_t'
                    ? 'good'
                    : n.id === 'Zsrc_t' || n.id === 'Ztar_t'
                      ? 'bad'
                      : '',
              });
            }}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
