import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawLegend, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Ch.8 module 8.1 (P5 hotspots, 1080x280): the 7-node RT-2 pipeline.
// Canvas click (hit-test via bounding-rect ratio) OR the mirrored DOM button
// row selects a node: green ring on it, upstream path animated blue. A fixed
// .hotspot-info region shows the ①–⑦ detail strings; the backbone chips
// (PaLI-X / PaLM-E) change node ④'s detail text.
const W = 1080;
const H = 280;
const BOX_W = 118;
const BOX_H = 56;
const CY = 104; // box center y
const CX = [95, 240, 385, 530, 675, 820, 965];

const NODES = ['输入', 'ViT', '主干', '动作词', '约束', '反token化', '执行'];
const NUMS = ['1', '2', '3', '4', '5', '6', '7'];

// detail strings ①–⑦ (SKILL §8.1, verbatim); ④ varies with the backbone
const DETAIL_BASE = [
  '① 输入：相机图像 x + 自然语言指令 l（VQA 格式提问）',
  '② ViT：图像切成 patch 编码为视觉 token',
  '③ 语言主干：PaLI-X（5B/55B）或 PaLM-E（12B）——预训练权重直接沿用，不新增参数',
  '',
  '⑤ 输出约束：机器人任务只从合法动作词中采样',
  '⑥ 反 token 化：词 → 档位数 → 连续分量，还原成可执行动作',
  '⑦ 执行：末端执行器按 6-DoF+夹爪动作走一步，闭环回①',
];
const DETAIL_4_PALIX =
  '④ 动作 token：一次动作 = 8 个词；PaLI-X 用现成整数词 / PaLM-E 征用 256 个最低频词';
const DETAIL_4_PALME =
  '④ 动作 token：一次动作 = 8 个词；PaLM-E 征用 256 个最低频词改造成动作词（symbol tuning）';

const FEEDBACKS = [
  '输入：相机图像 x 与指令 l 以 VQA 提问格式进入——和看图问答完全同构。',
  'ViT：图像切成 patch 变成视觉 token——画面以「词」的身份进主干。',
  '语言主干：PaLI-X / PaLM-E 预训练权重原封沿用，不为动作新增参数。',
  '动作词怎么来：PaLI-X 直接用整数词；PaLM-E 把最少用的 256 个词改造成动作词——两条路都通。',
  '输出约束：机器人任务解码只采样合法动作词——保证每句输出都可执行。',
  '反 token 化：把动作词还原成档位数，再映射回连续分量。',
  '执行：末端执行器走一步，随即回到 ①——闭环里每步都过这条管线。',
];
const INIT_INFO = '尚未选中部件：点击任一节点（画布或按钮行）查看张量/设计说明。';
const INIT_FB = '点击管线任一部件：高亮该部件、上游路径与详情。';

type Backbone = 'palix' | 'palme';

const detailFor = (node: number, bb: Backbone): string =>
  node === 3 ? (bb === 'palix' ? DETAIL_4_PALIX : DETAIL_4_PALME) : DETAIL_BASE[node];

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ node: null as number | null, bb: 'palix' as Backbone });
  const [node, setNode] = useState<number | null>(null);
  const [bb, setBb] = useState<Backbone>('palix');
  const [info, setInfo] = useState(INIT_INFO);
  const [feedback, setFeedback] = useState({ text: INIT_FB, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const edge = (x1: number, x2: number, y: number, color: string, animated: boolean) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = animated ? 2.5 : 1.75;
      if (animated) ctx.lineDashOffset = -performance.now() / 40;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2 - 8, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y);
      ctx.lineTo(x2 - 9, y - 5);
      ctx.lineTo(x2 - 9, y + 5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      const { node: sel, bb: backbone } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // pipeline edges (upstream of the selection lights up blue)
      for (let i = 0; i < 6; i++) {
        const active = sel !== null && i < sel;
        edge(CX[i] + BOX_W / 2 + 4, CX[i + 1] - BOX_W / 2 - 4, CY, active ? C.blue : C.border, active);
      }
      // closed loop: ⑦ back to ①
      ctx.save();
      const loopActive = sel === 6;
      ctx.strokeStyle = loopActive ? C.blue : C.border;
      ctx.lineWidth = loopActive ? 2.5 : 1.5;
      ctx.setLineDash([6, 5]);
      if (loopActive) ctx.lineDashOffset = -performance.now() / 40;
      ctx.beginPath();
      ctx.moveTo(CX[6], CY + BOX_H / 2);
      ctx.lineTo(CX[6], 172);
      ctx.lineTo(CX[0], 172);
      ctx.lineTo(CX[0], CY + BOX_H / 2 + 10);
      ctx.stroke();
      ctx.restore();

      // node boxes
      for (let i = 0; i < 7; i++) {
        const x0 = CX[i] - BOX_W / 2;
        const y0 = CY - BOX_H / 2;
        const isSel = sel === i;
        const isUp = sel !== null && i < sel;
        ctx.save();
        ctx.fillStyle = isSel ? '#e9f6f0' : isUp ? '#eef3fa' : '#f5f6f8';
        ctx.strokeStyle = isSel ? C.green : isUp ? C.blue : C.border;
        ctx.lineWidth = isSel ? 3.5 : isUp ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x0, y0, BOX_W, BOX_H, 8);
        ctx.fill();
        ctx.stroke();
        // number disc
        ctx.fillStyle = isSel ? C.green : isUp ? C.blue : C.muted;
        ctx.beginPath();
        ctx.arc(CX[i] - 34, CY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NUMS[i], CX[i] - 34, CY + 1);
        // short caption
        ctx.fillStyle = isSel ? C.green : isUp ? C.blue : C.muted;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(NODES[i], CX[i] + 12, CY + 1);
        ctx.restore();
      }

      // chef hat over the language backbone (the VLM brain keeps its weights)
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(521, 60, 18, 6, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(524, 57, 4.5, 0, Math.PI * 2);
      ctx.arc(536, 57, 4.5, 0, Math.PI * 2);
      ctx.arc(530, 53, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(backbone === 'palix' ? 'PaLI-X' : 'PaLM-E', 530, 146);
      ctx.restore();

      drawSceneLabel(ctx, 'VLA 管线', 36, 22);
      drawLegend(ctx, [['选中', C.green], ['上游通路', C.blue], ['未激活', C.muted]], 36, 252);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const selectNode = (i: number) => {
    const next = stateRef.current.node === i ? null : i;
    stateRef.current.node = next;
    setNode(next);
    if (next === null) {
      setInfo(INIT_INFO);
      setFeedback({ text: INIT_FB, cls: '' });
    } else {
      setInfo(detailFor(next, stateRef.current.bb));
      setFeedback({ text: FEEDBACKS[next], cls: 'good' });
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    for (let i = 0; i < 7; i++) {
      const x0 = CX[i] - BOX_W / 2 - 6;
      const x1 = CX[i] + BOX_W / 2 + 6;
      const y0 = CY - BOX_H / 2 - 6;
      const y1 = CY + BOX_H / 2 + 6;
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
        selectNode(i);
        return;
      }
    }
  };

  const onBackbone = (b: Backbone) => {
    stateRef.current.bb = b;
    setBb(b);
    if (stateRef.current.node === 3) {
      setInfo(detailFor(3, b));
      setFeedback({ text: FEEDBACKS[3], cls: 'good' });
    } else {
      setFeedback({
        text:
          b === 'palix'
            ? '骨干 PaLI-X：动作词用现成整数词（点 ④ 看差异）。'
            : '骨干 PaLM-E：征用 256 个最低频词当动作词（点 ④ 看差异）。',
        cls: '',
      });
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <label>骨干</label>
        <button className={`chip ${bb === 'palix' ? 'selected' : ''}`} onClick={() => onBackbone('palix')}>
          PaLI-X
        </button>
        <button className={`chip ${bb === 'palme' ? 'selected' : ''}`} onClick={() => onBackbone('palme')}>
          PaLM-E
        </button>
        <label>部件</label>
        {NODES.map((n, i) => (
          <button key={n} className={`tiny ${node === i ? '' : 'ghost'}`} onClick={() => selectNode(i)}>
            {n}
          </button>
        ))}
      </div>
      <div className="hotspot-info" style={{ minHeight: 64 }}>
        {info}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Arch;
