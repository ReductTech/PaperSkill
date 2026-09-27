import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawRuler, drawManual, drawArm } from './flatKit';
import type { WidgetProps } from './registry';

// Ch8 module 8.1 — 交互架构图 (P5 hotspots): the 7-node OpenVLA forward
// pipeline laid out horizontally. Click a canvas node (bounding-rect hit test
// via CSS-size ratio) or the mirrored DOM button row; the selected node gets a
// green ring, upstream nodes turn blue; the fixed .hotspot-info region shows
// the node's detail string verbatim.
const W = 1080;
const H = 280;

interface NodeDef {
  btn: string;
  badge: string;
  detail: string;
  fb: string;
}

const NODES: NodeDef[] = [
  {
    btn: '输入',
    badge: '①',
    detail: '①输入：224×224 图像 x + 语言指令 l',
    fb: '一张 224×224 图像加一句指令就是全部输入——没有本体感知、没有历史帧。',
  },
  {
    btn: 'SigLIP',
    badge: '②',
    detail: '②SigLIP：语义特征——认出『这是什么』',
    fb: 'SigLIP 语义眼先认出『这是什么』——网页级图文预训练攒下的本事。',
  },
  {
    btn: 'DINOv2',
    badge: '③',
    detail: '③DINOv2：空间特征——量准『在哪里』',
    fb: 'DINOv2 空间眼量准『在哪里』——空间细节是精确控制的命根。',
  },
  {
    btn: '拼接',
    badge: '④',
    detail: '④通道拼接：两路特征并排绑定',
    fb: '通道拼接：语义与空间两路特征并排绑定，双眼合一。',
  },
  {
    btn: '投影',
    badge: '⑤',
    detail: '⑤MLP 投影：2 层，把视觉特征誊进语言空间',
    fb: '2 层 MLP 投影：把视觉读数誊进 Llama 2 读得懂的语言空间。',
  },
  {
    btn: 'Llama 2',
    badge: '⑥',
    detail: '⑥Llama 2 7B：标准下一词预测，只对动作词算损失',
    fb: 'Llama 2 7B 这本随箱说明书：标准下一词预测，只对动作词算损失。',
  },
  {
    btn: '执行',
    badge: '⑦',
    detail: '⑦反 token 化：档位→连续分量→机械臂执行；bf16 下 4090 约 6Hz',
    fb: '反 token 化：档位还原成连续分量交给机械臂——bf16 下 4090 约 6Hz。',
  },
];

const CX = NODES.map((_, i) => 90 + i * 151);
const BOX_W = 118;
const BOX_H = 82;
const BOX_Y = 84;
const CY = BOX_Y + BOX_H / 2;

const drawIcon = (
  ctx: CanvasRenderingContext2D,
  i: number,
  cx: number,
  ms: number
) => {
  const cy = CY;
  if (i === 0) {
    // camera + instruction card
    ctx.fillStyle = '#3b4a63';
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 34, 112, 30, 21, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.arc(cx - 19, 122, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(cx + 2, 108, 27, 31, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.25;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.moveTo(cx + 6, 115 + r * 7);
      ctx.lineTo(cx + 25, 115 + r * 7);
      ctx.stroke();
    }
  } else if (i === 1) {
    drawRuler(ctx, cx - 30, cy + 12, 60, { semantic: true });
    ctx.fillStyle = C.blue;
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('语义', cx, 106);
  } else if (i === 2) {
    drawRuler(ctx, cx - 30, cy + 12, 60, {});
    ctx.fillStyle = C.orange;
    ctx.font = 'bold 11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('空间', cx, 106);
  } else if (i === 3) {
    // two streams merged into one bound block
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.roundRect(cx - 36, 110, 26, 9, 2);
    ctx.fill();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.roundRect(cx - 36, 122, 26, 9, 2);
    ctx.fill();
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx + 6, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 4);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx + 2, cy + 4);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(cx + 10, 110, 24, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.roundRect(cx + 10, 121, 24, 10, 2);
    ctx.fill();
    ctx.stroke();
  } else if (i === 4) {
    // transcription card: visual readings copied into language space
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.roundRect(cx - 22, 104, 44, 34, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.25;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.moveTo(cx - 16, 111 + r * 7);
      ctx.lineTo(cx + 16, 111 + r * 7);
      ctx.stroke();
    }
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 142);
    ctx.lineTo(cx, 152);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 4, 148);
    ctx.lineTo(cx, 154);
    ctx.lineTo(cx + 4, 148);
    ctx.stroke();
  } else if (i === 5) {
    drawManual(ctx, cx, cy + 16, 1.0);
  } else {
    drawArm(ctx, cx - 10, cy + 30, {
      scale: 1.1,
      angle: 0.22 + 0.1 * Math.sin(ms / 400),
      grip: 0.6 + 0.4 * Math.sin(ms / 300),
    });
  }
};

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(0);
  const [sel, setSel] = useState(0);

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

    const render = (ms: number) => {
      const s = selRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // travelling action dot (under the boxes, visible on the arrows)
      const dotX = 90 + ((ms / 2800) % 1) * (CX[6] - 90);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(dotX, CY, 4, 0, Math.PI * 2);
      ctx.fill();

      // arrows between nodes
      for (let i = 0; i < 6; i++) {
        const x1 = CX[i] + BOX_W / 2 + 3;
        const x2 = CX[i + 1] - BOX_W / 2 - 3;
        ctx.strokeStyle = i < s ? C.blue : C.border;
        ctx.lineWidth = i < s ? 2.5 : 1.75;
        ctx.beginPath();
        ctx.moveTo(x1, CY);
        ctx.lineTo(x2, CY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2 - 5, CY - 4);
        ctx.lineTo(x2 + 1, CY);
        ctx.lineTo(x2 - 5, CY + 4);
        ctx.closePath();
        ctx.fillStyle = i < s ? C.blue : C.border;
        ctx.fill();
      }

      // nodes
      NODES.forEach((n, i) => {
        const cx = CX[i];
        const up = i < s;
        const me = i === s;
        const bx = cx - BOX_W / 2;
        if (me) {
          ctx.save();
          ctx.globalAlpha = 0.22 + 0.14 * (0.5 + 0.5 * Math.sin(ms / 300));
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.roundRect(bx - 4, BOX_Y - 4, BOX_W + 8, BOX_H + 8, 12);
          ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        if (i > s) ctx.globalAlpha = 0.55;
        ctx.fillStyle = up ? '#eaf0f8' : C.white;
        ctx.strokeStyle = me ? C.green : up ? C.blue : C.border;
        ctx.lineWidth = me ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(bx, BOX_Y, BOX_W, BOX_H, 10);
        ctx.fill();
        ctx.stroke();
        drawIcon(ctx, i, cx, ms);
        ctx.fillStyle = me ? C.green : up ? C.blue : C.muted;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(n.badge, bx + 8, BOX_Y + 6);
        ctx.restore();
      });

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

  const pick = (i: number) => {
    selRef.current = i;
    setSel(i);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    const my = ((e.clientY - r.top) / r.height) * H;
    const i = CX.findIndex(
      (cx) =>
        mx >= cx - BOX_W / 2 - 6 &&
        mx <= cx + BOX_W / 2 + 6 &&
        my >= BOX_Y - 6 &&
        my <= BOX_Y + BOX_H + 6
    );
    if (i >= 0) pick(i);
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
        {NODES.map((n, i) => (
          <button
            key={n.btn}
            className={`chip${i === sel ? ' selected' : ''}`}
            onClick={() => pick(i)}
          >
            {n.btn}
          </button>
        ))}
        <span className="tiny">Prismatic 双编码器 · 点击节点或按钮</span>
      </div>
      <div className="hotspot-info" style={{ minHeight: 64 }}>
        {NODES[sel].detail}
      </div>
      <div className="feedback good">{NODES[sel].fb}</div>
    </div>
  );
};

export default Ch8Arch;
