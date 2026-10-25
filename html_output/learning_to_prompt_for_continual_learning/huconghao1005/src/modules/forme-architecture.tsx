import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpFont,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawSort,
  drawPress,
  drawSheet,
  drawLabel,
  drawLegend,
  drawLink,
  drawPlate,
} from './letterpressKit';

// 第 8 章「挪格」· 交互式版式结构（架构模块，P3 点击节点）
// 主导操作：点结构链上的任一节点读它的输入输出与参数预算；切换池化范围。

const W_FULL = 1080;
const H_FULL = 360;
const W_ANA = 560;
const H_ANA = 140;

type NodeId = 'input' | 'embed' | 'prompt' | 'patch' | 'encoder' | 'pool' | 'cls';
type PoolMode = 'prompt' | 'all' | 'none';

const ORDER: NodeId[] = ['input', 'embed', 'prompt', 'patch', 'encoder', 'pool', 'cls'];
const TITLES: Record<NodeId, string> = {
  input: '食材',
  embed: '切配',
  prompt: '调料',
  patch: 'patch',
  encoder: '灶台',
  pool: '品菜',
  cls: '出锅',
};

interface NodeBox {
  id: NodeId;
  x: number;
  w: number;
}

const BOXES: NodeBox[] = [
  { id: 'input', x: 40, w: 110 },
  { id: 'embed', x: 180, w: 110 },
  { id: 'prompt', x: 322, w: 130 },
  { id: 'patch', x: 484, w: 130 },
  { id: 'encoder', x: 646, w: 150 },
  { id: 'pool', x: 824, w: 110 },
  { id: 'cls', x: 964, w: 76 },
];

const BOX_Y = 96;
const BOX_H = 56;

const SHAPE: Record<NodeId, { shape: string; param: string; frozen: boolean; note: string }> = {
  input: { shape: '224 × 224 × 3', param: '0', frozen: true, note: '一份食材，还没有被切开；没有任何可训练参数。' },
  embed: { shape: '197 × 768', param: '0', frozen: true, note: 'f_e 把每个格子摊平成一行；输出是 1 行 [class] 记录员 + 196 行补丁 = 197 行。这一层是预训练好并冻结的。' },
  prompt: {
    shape: 'M × L_p × D',
    param: '46,080',
    frozen: false,
    note: '整池调料 + key：CIFAR-100 系设定（M = 10、L_p = 5）是 10×5×768 + 10×768 = 38,400 + 7,680 = 46,080；5-datasets（M = 20、L_p = 5）是 92,160。官方 config 用 L_p = 10，复算是 84,480。',
  },
  patch: { shape: '196 × 768', param: '0', frozen: true, note: '16 × 16 一块切出来的 196 行补丁，主干冻结，所以它也冻着。' },
  encoder: { shape: 'N·L_p + 197 行', param: '0（约 86M）', frozen: true, note: 'f_r 是 12 层自注意力主干，整块冻住：ViT-B/16 规格约 86M 参数，更新 0 次，只管前向。输入行数是 N·L_p 行 prompt + 197 行 x_e = N·L_p + 197；CIFAR-100 系（N = 5、L_p = 5）就是 25 + 197 = 222 行。' },
  pool: {
    shape: 'N·L_p × 768',
    param: '0',
    frozen: true,
    note: 'AvgPool 只品调料那 N·L_p 行；品菜本身没有参数，它决定出锅能尝到什么。',
  },
  cls: { shape: '→ 类别数', param: '76,800', frozen: false, note: 'g_φ 是线性分类头：100 类读 768 维就是 76,800 个数，是唯一和类数一起长的部分。' },
};

function nodeIndex(id: NodeId): number {
  return ORDER.indexOf(id);
}

function FormeArchitectureInner({ chapterId, moduleId }: WidgetProps) {
  const isAna = moduleId === 'ana';
  const W = isAna ? W_ANA : W_FULL;
  const H = isAna ? H_ANA : H_FULL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef({ phase: 0 });
  const animRef = useRef({ node: 'input' as NodeId, poolMode: 'prompt' as PoolMode, ana: isAna, raf: null as number | null });

  const [node, setNode] = useState<NodeId>('input');
  const [poolMode, setPoolMode] = useState<PoolMode>('prompt');
  const [feedback, setFeedback] = useState({
    text: '点一个节点，看它的输入输出形状。',
    cls: '',
  });

  useEffect(() => {
    animRef.current.node = node;
    animRef.current.poolMode = poolMode;
    animRef.current.ana = isAna;
  }, [node, poolMode, isAna]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const a = animRef.current;
      const s = sceneRef.current;
      s.phase += 0.02;

      ctx.clearRect(0, 0, W, H);
      drawField(ctx, 0, 0, W, H);

      if (a.ana) {
        // 类比卡：后厨流程自动逐节点点亮，没有控件
        const active = ORDER[Math.floor((s.phase * 0.55) % ORDER.length)];
        const bx = 10;
        const by = 48;
        const kitchenLabels = ['食材', '腌制', '调料', '灶台', '品菜', '出锅'];
        const kitchenColors = [LP.success, LP.aux, LP.accent, LP.support, LP.guide, LP.failure];
        ctx.save();
        ctx.strokeStyle = LP.dark;
        ctx.lineWidth = LP_LW;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(bx + 8, by + 86);
        ctx.lineTo(bx + 92, by + 86);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        for (let i = 0; i < ORDER.length; i++) {
          const x = bx + i * 76;
          const on = ORDER[i] === active;
          const done = nodeIndex(ORDER[i]) < nodeIndex(active);
          // 厨房元素：用调料瓶/食材/锅等简单图形
          ctx.save();
          ctx.fillStyle = on ? LP.accent : done ? LP.success : kitchenColors[i % kitchenColors.length];
          ctx.strokeStyle = LP.ink;
          ctx.lineWidth = on ? 2.5 : 1.5;
          ctx.globalAlpha = on ? 1 : done ? 0.85 : 0.5;
          lpRoundRect(ctx, x, by + 20, 50, 60, 6, true, true);
          // 简单图标
          ctx.fillStyle = on ? '#fffdf8' : LP.bg;
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const icons = ['🥬', '🧂', '🍶', '🍳', '👅', '🍽️'];
          ctx.fillText(icons[i % icons.length], x + 25, by + 42);
          // 标签
          ctx.fillStyle = on ? LP.ink : LP.muted;
          ctx.font = '10px sans-serif';
          ctx.fillText(kitchenLabels[i % kitchenLabels.length], x + 25, by + 65);
          ctx.restore();
          if (i < ORDER.length - 1) {
            drawLink(ctx, x + 50, by + 50, x + 76, by + 50, {
              color: done ? LP.success : LP.axis,
              width: LP_LW,
              arrow: true,
            });
          }
        }
        drawPlate(ctx, 508, by + 50, 28, { withFood: true, foodColor: LP.accent });
        drawLink(ctx, bx + 6 * 76 + 10, by + 50, 480, by + 50, {
          color: LP.guide,
          width: LP_LW,
          arrow: true,
        });
        drawLabel(ctx, '后厨流程', 12, 28, { size: 12, color: LP.muted, weight: 600 });
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        return;
      }

      const ni = nodeIndex(a.node);
      const boxMap: Record<string, NodeBox> = {};
      BOXES.forEach((b) => (boxMap[b.id] = b));

      // ---- 1. 链条外框与基线
      ctx.save();
      ctx.strokeStyle = LP.axis;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(40, BOX_Y + BOX_H / 2);
      ctx.lineTo(1040, BOX_Y + BOX_H / 2);
      ctx.stroke();
      ctx.restore();

      // ---- 2. 节点之间的箭头
      const live = (i: number) => i >= ni - 1 && i <= ni + 1;
      for (let i = 0; i < BOXES.length - 1; i++) {
        const b0 = BOXES[i];
        const b1 = BOXES[i + 1];
        const active = i === ni - 1 || i === ni;
        drawLink(ctx, b0.x + b0.w + 4, BOX_Y + BOX_H / 2, b1.x - 4, BOX_Y + BOX_H / 2, {
          color: active ? LP.guide : LP.axis,
          width: active ? LP_LW_EMPH : LP_LW,
          arrow: true,
        });
      }

      // ---- 3. 池化连线（版头 / 全部行）
      const seamY = BOX_Y + BOX_H + 26;
      const promptBox = boxMap['prompt'];
      const patchBox = boxMap['patch'];
      const poolBox = boxMap['pool'];
      const drop = (x: number, color: string, dashed: boolean, alpha: number) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = LP_LW;
        if (dashed) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(x, BOX_Y + BOX_H - 4);
        ctx.lineTo(x, seamY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      };
      if (a.poolMode === 'prompt') {
        for (let i = 0; i < 5; i++) {
          drop(promptBox.x + 14 + i * 24, LP.success, false, lerp(0.45, 1, i / 4));
        }
      } else if (a.poolMode === 'all') {
        for (let i = 0; i < 5; i++) {
          drop(promptBox.x + 14 + i * 24, LP.failure, false, lerp(0.45, 1, i / 4));
        }
        for (let i = 0; i < 6; i++) {
          drop(patchBox.x + 12 + i * 20, LP.failure, true, lerp(0.3, 0.8, i / 5));
        }
      } else {
        // none：没有 prompt，只从 patch 行下拉
        for (let i = 0; i < 6; i++) {
          drop(patchBox.x + 12 + i * 20, LP.failure, true, lerp(0.3, 0.8, i / 5));
        }
      }
      // 汇流横线
      ctx.save();
      ctx.strokeStyle = a.poolMode === 'prompt' ? LP.success : LP.failure;
      ctx.lineWidth = LP_LW;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      if (a.poolMode === 'prompt') {
        ctx.moveTo(promptBox.x + 14, seamY);
        ctx.lineTo(promptBox.x + 110, seamY);
      } else if (a.poolMode === 'all') {
        ctx.moveTo(patchBox.x + 12, seamY);
        ctx.lineTo(promptBox.x + 110, seamY);
      } else {
        ctx.moveTo(patchBox.x + 12, seamY);
        ctx.lineTo(patchBox.x + patchBox.w - 12, seamY);
      }
      ctx.stroke();
      ctx.restore();
      drawLink(ctx, promptBox.x + 62, seamY, poolBox.x + poolBox.w / 2, BOX_Y + BOX_H - 4, {
        color: a.poolMode === 'prompt' ? LP.success : LP.failure,
        width: LP_LW_EMPH,
        arrow: true,
      });

      // ---- 4. 节点本体
      for (const b of BOXES) {
        const i = nodeIndex(b.id);
        const isActive = b.id === a.node;
        const related = live(i);
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : related ? 0.92 : 0.4;
        if (b.id === 'encoder') {
          drawPress(ctx, b.x, BOX_Y, b.w, BOX_H, {
            press: 0.22 + 0.14 * Math.sin(s.phase * 1.3),
            active: isActive,
          });
          ctx.globalAlpha = isActive ? 1 : related ? 0.92 : 0.4;
          ctx.strokeStyle = isActive ? LP.guide : LP.dark;
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.stroke();
        } else if (b.id === 'prompt') {
          const noPrompt = a.poolMode === 'none';
          drawTypeCase(ctx, b.x, BOX_Y, b.w, BOX_H, {
            cols: 3,
            rows: 2,
            fill: noPrompt ? LP.light : LP.accent,
            cellText: (r, c) => (r === 0 && c === 0 ? (noPrompt ? '—' : 'P0') : ''),
            highlight: isActive && !noPrompt ? [[0, 0]] : [],
          });
          ctx.strokeStyle = noPrompt ? LP.muted : (isActive ? LP.guide : LP.dark);
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.stroke();
          if (noPrompt) {
            ctx.save();
            ctx.strokeStyle = LP.muted;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(b.x + 8, BOX_Y + BOX_H - 8);
            ctx.lineTo(b.x + b.w - 8, BOX_Y + 8);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }
        } else if (b.id === 'patch') {
          drawTypeCase(ctx, b.x, BOX_Y, b.w, BOX_H, {
            cols: 4,
            rows: 3,
            fill: LP.light,
          });
          ctx.strokeStyle = isActive ? LP.guide : LP.dark;
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.stroke();
        } else if (b.id === 'input') {
          ctx.fillStyle = LP.bg;
          ctx.strokeStyle = isActive ? LP.guide : LP.dark;
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.fill();
          ctx.stroke();
          // 原稿：被切开的格子与切割器
          drawTypeCase(ctx, b.x + 8, BOX_Y + 8, b.w - 16, BOX_H - 16, {
            cols: 4,
            rows: 3,
            fill: LP.light,
            gap: 3,
            radius: 3,
          });
          ctx.save();
          ctx.strokeStyle = LP.support;
          ctx.lineWidth = LP_LW;
          ctx.beginPath();
          ctx.moveTo(b.x + 8 + Math.abs(Math.sin(s.phase * 0.9)) * (b.w - 24), BOX_Y + 4);
          ctx.lineTo(b.x + 8 + Math.abs(Math.sin(s.phase * 0.9)) * (b.w - 24), BOX_Y + BOX_H - 4);
          ctx.stroke();
          ctx.restore();
        } else if (b.id === 'pool') {
          ctx.fillStyle = LP.bg;
          ctx.strokeStyle = isActive ? LP.guide : LP.dark;
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.fill();
          ctx.stroke();
          // 只读版头的那几行
          for (let k = 0; k < 4; k++) {
            if (a.poolMode === 'prompt' && k > 1) continue;
            ctx.save();
            ctx.fillStyle = a.poolMode === 'prompt' ? LP.success : LP.failure;
            ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(s.phase * 1.4 + k));
            ctx.beginPath();
            ctx.rect(b.x + 12 + k * 22, BOX_Y + 16, 18, 6);
            ctx.fill();
            ctx.restore();
          }
        } else if (b.id === 'cls') {
          ctx.fillStyle = LP.accent;
          ctx.strokeStyle = isActive ? LP.guide : LP.dark;
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = LP.light;
          ctx.strokeStyle = isActive ? LP.guide : LP.dark;
          ctx.lineWidth = isActive ? LP_LW_EMPH : LP_LW;
          ctx.beginPath();
          ctx.rect(b.x, BOX_Y, b.w, BOX_H);
          ctx.fill();
          ctx.stroke();
        }
        // 节点名
        ctx.fillStyle = LP.ink;
        ctx.font = lpFont(isActive ? 15 : 14, isActive ? 700 : 600);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TITLES[b.id], b.x + b.w / 2, BOX_Y + BOX_H / 2);
        ctx.restore();
      }

      // 单场景唯一标签
      drawLabel(ctx, '12层', 646 + 75, BOX_Y - 12, { size: 11, color: LP.muted, align: 'center' });

      // ---- 5. 形状读数
      const info = SHAPE[a.node];
      ctx.save();
      const readY = 236;
      ctx.fillStyle = 'rgba(232,228,216,0.5)';
      ctx.beginPath();
      ctx.rect(40, readY - 20, 1000, 30);
      ctx.fill();
      ctx.fillStyle = LP.guide;
      ctx.font = lpFont(15, 700);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${TITLES[a.node]}  ${info.shape}`, 52, readY - 5);
      ctx.fillStyle = LP.muted;
      ctx.font = lpFont(12, 500);
      ctx.textAlign = 'right';
      ctx.fillText(`${a.poolMode === 'prompt' ? '品菜：调料 N·L_p 行' : a.poolMode === 'all' ? '品菜：全部行' : '品菜：patch 行（无调料）'}`, 1028, readY - 5);
      ctx.restore();

      // ---- 6. 常驻图例（≤3 项）
      drawLegend(
        ctx,
        [
          { label: '可训练', color: LP.accent },
          { label: '冻结', color: LP.dark },
          { label: '无梯度', color: LP.aux },
        ],
        46,
        H - 24,
        { size: 12 }
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let live = false;
    const tick = () => {
      if (!live) return;
      render();
      animRef.current.raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (live) return;
      live = true;
      animRef.current.raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      live = false;
      if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H]);

  const pickNode = (id: NodeId) => {
    setNode(id);
    if (id === 'prompt') {
      setFeedback({
        text: 'M × L_p × D + M × D_k：CIFAR-100 系（M = 10、L_p = 5）是 10×5×768 + 10×768 = 38,400 + 7,680 = 46,080，5-datasets（M = 20）是 92,160；官方 config 用 L_p = 10，复算是 84,480。',
        cls: 'good',
      });
    } else if (id === 'encoder') {
      setFeedback({
        text: '12 层主干整块冻结：ViT-B/16 规格约 86M 参数、0 次更新，训练时它只负责前向。',
        cls: '',
      });
    } else if (id === 'pool') {
      setFeedback({
        text: 'AvgPool 只读 [0: N·L_p, :] 那几行；池化范围是这张图里唯一「关掉就废掉」的开关。',
        cls: 'good',
      });
    } else if (id === 'cls') {
      setFeedback({
        text: '分类头的输入是池化后的 768 维向量，不是任何 patch 行。',
        cls: 'good',
      });
    } else if (id === 'input') {
      setFeedback({ text: '一张 224×224×3 的食材；它自己没有任何可训练参数。', cls: '' });
    } else if (id === 'embed') {
      setFeedback({ text: '嵌入层把食材摊成 196 行补丁 + 1 行 [class] = 197 行 × 768 维；这一层是预训练好并冻结的。', cls: '' });
    } else {
      setFeedback({ text: '196 行补丁，行宽 768，和调料一样宽，所以能拼在一起。', cls: '' });
    }
  };

  const pickPool = (mode: PoolMode) => {
    setPoolMode(mode);
    if (mode === 'prompt') {
      setFeedback({
        text: '品菜只连调料：出锅前尝到的就是被选中的那几种调料，这是 L2P 的默认读法。',
        cls: 'good',
      });
    } else if (mode === 'all') {
      setFeedback({
        text: '品菜连到全部行：出锅前也会尝到食材本身，灶台虽然冻着，读法已经偏离了 L2P。',
        cls: 'warn',
      });
    } else {
      setFeedback({
        text: '没有调料：品菜只能尝食材本身，出锅直接看冻结灶台的输出——这是 FT-seq-frozen 的配置，同一数据集只有 17.72。',
        cls: 'bad',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      {!isAna && (
        <>
          <div className="chip-row">
            {ORDER.map((id) => (
              <button
                type="button"
                key={id}
                className={`chip${node === id ? ' selected' : ''}`}
                aria-label={`查看${TITLES[id]}节点的输入输出形状`}
                onClick={() => pickNode(id)}
              >
                {TITLES[id]}
              </button>
            ))}
          </div>
          <div className="ctrl">
            <label>品菜范围</label>
            <button
              type="button"
              className={`chip${poolMode === 'prompt' ? ' selected' : ''}`}
              onClick={() => pickPool('prompt')}
            >
              只品调料
            </button>
            <button
              type="button"
              className={`chip${poolMode === 'all' ? ' selected' : ''}`}
              onClick={() => pickPool('all')}
            >
              全部行
            </button>
            <button
              type="button"
              className={`chip${poolMode === 'none' ? ' selected' : ''}`}
              onClick={() => pickPool('none')}
            >
              无调料
            </button>
          </div>
          <div className="metrics">
            <div className="metric">
              <div className="l">主干参数（ViT-B/16 规格）</div>
              <div className="v">~86M</div>
            </div>
            <div className="metric">
              <div className="l">调料 + key</div>
              <div className="v">46,080</div>
            </div>
            <div className="metric">
              <div className="l">主干更新次数</div>
              <div className="v">0</div>
            </div>
          </div>
          <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
        </>
      )}
    </div>
  );
}

export const FormeArchitecture: React.FC<WidgetProps> = (props) => <FormeArchitectureInner {...props} />;

export default FormeArchitecture;
