import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawLegend, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// §8 module 8.1 交互架构图 — a horizontal 2-row pipeline graph with 8 clickable
// nodes. Clicking (canvas hit-test or the mirrored button row) highlights the
// node in green, lights the upstream path in blue, dims the rest, and shows the
// exact tensor-shape / design note in the fixed DOM detail region below.
const W = 1080;
const H = 280;
const NW = 170;
const NH = 50;
const COLS = [150, 410, 670, 930];
const ROWS = [72, 202];
const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
const EDGES: [number, number][] = [
  [1, 3],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
];

interface NodeDef {
  n: number;
  short: string;
  detail: string;
  fb: string;
}

const NODES: NodeDef[] = [
  {
    n: 1,
    short: 'RGB编码',
    detail: 'VAE_rgb：Iⱼ → zʳᵍᵇⱼ ∈ ℝʰˣʷˣᶜ，逐帧编码（时序维当 batch，绕过时序压缩）',
    fb: 'VAE_rgb 逐帧把画面编码成 RGB 潜变量——时序维当 batch、绕过时序压缩，保住每帧空间精度。',
  },
  {
    n: 2,
    short: '点图编码',
    detail: 'VAE_pm：Pⱼ(tⱼ) → zᵖᵐⱼ，点图先归一化到约 [−1,1]',
    fb: 'VAE_pm 把点图先归一化到约 [-1,1] 再编码——几何信息进入潜空间。',
  },
  {
    n: 3,
    short: '通道拼接',
    detail: '通道拼接：gⱼ = [zʳᵍᵇⱼ ; zᵖᵐⱼ]，c→2c，token 数不变',
    fb: '通道拼接把 RGB 与点图潜变量逐位置绑定——c→2c，token 数不变。',
  },
  {
    n: 4,
    short: '序列拼接',
    detail: 'token 拼接：{gⱼ} 与 {rⱼ} 沿序列维拼接，rⱼ = g₀ 复印',
    fb: 'token 拼接把 {g} 与复印的 {r} 沿序列维接起来——rⱼ=g₀ 就是『追谁』的稠密查询。',
  },
  {
    n: 5,
    short: 'DiT×30',
    detail: 'DiT×30：全 3D 注意力，q·k/√dₖ，跨帧跨位置匹配；LoRA 秩 1024 微调',
    fb: '30 块 DiT 全 3D 注意力跨帧跨位置自由匹配——LoRA 秩 1024 即可完成微调。',
  },
  {
    n: 6,
    short: '时间RoPE',
    detail: '时间 RoPE：gⱼ 与 rⱼ 同贴 tⱼ；注意力只依赖位置差',
    fb: '时间 RoPE 给每个查询盖上目标时刻——没有它 AJ 掉到 0.4450。',
  },
  {
    n: 7,
    short: '输出对半',
    detail: '输出对半：前一半→残差，后一半→可见性',
    fb: '输出通道对半分：前一半走残差轨迹，后一半走可见性。',
  },
  {
    n: 8,
    short: '双解码器',
    detail: '双解码器：D_track→Δ̂ⱼ；D_vis→ôⱼ；P̂₀(tⱼ) = P₀(t₀) + Δ̂ⱼ',
    fb: '双解码器分别给出 Δ̂ 与 ô——P̂₀(tⱼ)=P₀(t₀)+Δ̂ⱼ，一步前向完成。',
  },
];

const pos = (n: number): { x: number; y: number } => ({
  x: COLS[Math.floor((n - 1) / 2)],
  y: ROWS[(n - 1) % 2],
});

// upstream(n): {n} for n<3, otherwise every node 1..n (the chain feeds forward)
const upstream = (n: number): boolean[] => {
  const up = new Array(9).fill(false);
  for (let k = 1; k <= n; k++) up[k] = n < 3 ? k === n : true;
  return up;
};

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ node: number | null }>({ node: null });
  const [node, setNode] = useState<number | null>(null);
  const [fb, setFb] = useState({ text: '整条通路就绪——点击任一部件，或用下方按钮选择。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (sel: number | null, ms: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      const up = sel === null ? null : upstream(sel);
      // paths: inactive #d7deea, active blue — drawn under the node boxes
      EDGES.forEach(([a, b]) => {
        const pa = pos(a);
        const pb = pos(b);
        const active = sel !== null && b <= sel;
        ctx.strokeStyle = active ? C.blue : '#d7deea';
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.globalAlpha = sel === null || active ? 1 : 0.45;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const tx = pb.x - ux * 102;
        const ty = pb.y - uy * 102;
        ctx.fillStyle = active ? C.blue : '#d7deea';
        ctx.beginPath();
        ctx.moveTo(tx + ux * 10, ty + uy * 10);
        ctx.lineTo(tx - uy * 6, ty + ux * 6);
        ctx.lineTo(tx + uy * 6, ty - ux * 6);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      // nodes
      NODES.forEach((nd) => {
        const p = pos(nd.n);
        const isSel = sel === nd.n;
        const isUp = up !== null && up[nd.n] && !isSel;
        const dim = sel !== null && !isSel && !isUp;
        ctx.save();
        ctx.globalAlpha = dim ? 0.4 : 1;
        ctx.fillStyle = C.white;
        ctx.strokeStyle = isSel ? C.green : isUp ? C.blue : C.purple;
        ctx.lineWidth = isSel || isUp ? 2.5 : 2;
        ctx.beginPath();
        ctx.roundRect(p.x - NW / 2, p.y - NH / 2, NW, NH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isSel ? C.green : isUp ? C.blue : C.purple;
        ctx.beginPath();
        ctx.roundRect(p.x - NW / 2 + 5, p.y - NH / 2 + 8, 4, NH - 16, 2);
        ctx.fill();
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${CIRC[nd.n - 1]} ${nd.short}`, p.x + 4, p.y + 1);
        if (isSel) {
          const pulse = 0.4 + 0.25 * Math.sin((ms / 900) * Math.PI * 2);
          ctx.globalAlpha = dim ? 0.4 : pulse;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(p.x - NW / 2 - 5, p.y - NH / 2 - 5, NW + 10, NH + 10, 11);
          ctx.stroke();
        }
        ctx.restore();
      });
      drawSceneLabel(ctx, '输入', 30, 137);
      drawSceneLabel(ctx, '输出', W - 30, 137, { align: 'right' });
      drawLegend(ctx, [['激活路径', C.blue], ['选中部件', C.green]], 16, H - 16);
    };

    const tick = (ms: number) => {
      render(stateRef.current.node, ms);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (n: number | null) => {
    stateRef.current.node = n;
    setNode(n);
    if (n === null) {
      setFb({ text: '整条通路就绪——点击任一部件，或用下方按钮选择。', cls: '' });
    } else {
      setFb({ text: NODES[n - 1].fb, cls: 'good' });
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let hit: number | null = null;
    for (const nd of NODES) {
      const p = pos(nd.n);
      if (Math.abs(x - p.x) <= NW / 2 + 8 && Math.abs(y - p.y) <= NH / 2 + 8) {
        hit = nd.n;
        break;
      }
    }
    pick(hit);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <label>部件</label>
        {NODES.map((nd) => (
          <button
            key={nd.n}
            className={`chip ${node === nd.n ? 'selected' : ''}`}
            onClick={() => pick(nd.n)}
          >
            {CIRC[nd.n - 1]} {nd.short}
          </button>
        ))}
      </div>
      <div className="hotspot-info" style={{ minHeight: 64 }}>
        {node === null ? '点击任一部件查看详情。' : `${CIRC[node - 1]} ${NODES[node - 1].detail}`}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Arch;
