import React, { useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, inset, legend, rrect, text } from './kit';

const W = 720;
const H = 280;

type RKey = 'R1' | 'R2' | 'R3' | 'R4';

const ROT: Record<RKey, {
  label: string; color: string; pos: [string, string];
  fuse: string; fuseOk: boolean; learn: string; learned: boolean;
  fb: string; purple: boolean;
}> = {
  R1: {
    label: 'R₁', color: C.green, pos: ['残差流入口：进块前 X·R₁', '回加前用 R₁ᵀ 转回'],
    fuse: '能：融进相邻权重', fuseOk: true, learn: 'Cayley SGD 学习', learned: true,
    fb: 'R₁ 残差捷径旋转，可融合可学习', purple: false,
  },
  R2: {
    label: 'R₂', color: C.green, pos: ['Wv 输出与注意力输出', '按 head_dim 分块作用'],
    fuse: '能：融进 Wv / Wo', fuseOk: true, learn: 'Cayley SGD 学习', learned: true,
    fb: 'R₂ Wv–Wo 对旋转，可融合可学习', purple: false,
  },
  R3: {
    label: 'H₃', color: C.purple, pos: ['K 在 RoPE 之后', '以在线矩阵乘作用'],
    fuse: '不能：RoPE 逐元素', fuseOk: false, learn: '固定 Hadamard', learned: false,
    fb: 'H₃ 在线作用于 K，不可融合，固定 Hadamard', purple: true,
  },
  R4: {
    label: 'H₄', color: C.purple, pos: ['down_proj 输入侧', '以在线矩阵乘作用'],
    fuse: '不能：随输入相乘', fuseOk: false, learn: '固定 Hadamard', learned: false,
    fb: 'H₄ 在线于 MLP，不可融合，固定 Hadamard', purple: true,
  },
};

function node(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, hot: boolean) {
  rrect(ctx, x, y, w, 36, hot ? '#eef4e6' : C.white, hot ? C.blue : C.axis, hot ? 2.5 : 1.5, 7);
  text(ctx, label, x + w / 2, y + 18, hot ? C.blue : C.ink, 13, 'center');
}

function badge(ctx: CanvasRenderingContext2D, cx: number, cy: number, label: string, color: string, sel: boolean, t: number) {
  const w = 30;
  const h = 20;
  if (sel) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4);
    ctx.beginPath();
    ctx.arc(cx, cy, 17 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, sel ? color : C.white, color, sel ? 1 : 1.5, 5);
  text(ctx, label, cx, cy + 0.5, sel ? C.white : color, 12, 'center');
}

function arrowH(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, hot: boolean) {
  ctx.strokeStyle = hot ? C.blue : C.light;
  ctx.lineWidth = hot ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 6, y);
  ctx.stroke();
  ctx.fillStyle = hot ? C.blue : C.light;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 8, y - 4);
  ctx.lineTo(x2 - 8, y + 4);
  ctx.closePath();
  ctx.fill();
}

// ch5-locations：P4 芯片切换 R1–R4，管线挂点高亮 + 右侧三行属性联动
export const Ch5Locations: React.FC = () => {
  const [sel, setSel] = useState<RKey>('R1');
  const d = ROT[sel];

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    grid(ctx, 20, 16, 488, 248, 26);

    text(ctx, 'LLaMA 块（单层示意）', 24, 30, C.muted, 12);
    legend(ctx, [
      { label: '融合·学习', color: C.green },
      { label: '在线·固定', color: C.purple },
    ], 320, 30, 12);

    const yA = 84;
    const yB = 196;

    // 残差捷径（R1 相关路径）
    const scHot = sel === 'R1';
    ctx.strokeStyle = scHot ? C.blue : C.light;
    ctx.lineWidth = scHot ? 2.5 : 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(58, 102);
    ctx.lineTo(58, 130);
    ctx.lineTo(468, 130);
    ctx.lineTo(468, 100);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = scHot ? C.blue : C.light;
    ctx.beginPath();
    ctx.moveTo(468, 96);
    ctx.lineTo(464, 104);
    ctx.lineTo(472, 104);
    ctx.closePath();
    ctx.fill();

    // Row A：Embedding → RMSNorm → Wqkv → Attention → Wo → ⊕
    arrowH(ctx, 92, 120, yA, sel === 'R1');
    node(ctx, 24, yA - 18, 68, 'Embed', false);
    node(ctx, 120, yA - 18, 70, 'RMSNorm', false);
    arrowH(ctx, 190, 206, yA, sel === 'R2');
    node(ctx, 206, yA - 18, 64, 'Wqkv', false);
    arrowH(ctx, 270, 300, yA, sel === 'R2');
    node(ctx, 300, yA - 18, 76, 'Attention', false);
    arrowH(ctx, 376, 404, yA, sel === 'R2');
    node(ctx, 404, yA - 18, 44, 'Wo', false);
    arrowH(ctx, 448, 452, yA, false);

    // ⊕1 残差汇合
    ctx.strokeStyle = sel === 'R1' ? C.blue : C.ink;
    ctx.lineWidth = sel === 'R1' ? 2.5 : 1.5;
    ctx.fillStyle = sel === 'R1' ? '#eef4e6' : C.white;
    ctx.beginPath();
    ctx.arc(468, yA, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, '+', 468, yA + 1, sel === 'R1' ? C.blue : C.ink, 16, 'center');

    // K 分支（R3）
    const kHot = sel === 'R3';
    ctx.strokeStyle = kHot ? C.blue : C.light;
    ctx.lineWidth = kHot ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(238, yA - 18);
    ctx.lineTo(238, 50);
    ctx.stroke();
    ctx.fillStyle = kHot ? C.blue : C.light;
    ctx.beginPath();
    ctx.moveTo(238, 46);
    ctx.lineTo(234, 54);
    ctx.lineTo(242, 54);
    ctx.closePath();
    ctx.fill();

    // 换行连接：⊕1 → 下 → 左 → 上 → RMSNorm-B
    ctx.strokeStyle = C.light;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(480, yA);
    ctx.lineTo(500, yA);
    ctx.lineTo(500, 250);
    ctx.lineTo(56, 250);
    ctx.lineTo(56, 218);
    ctx.stroke();
    ctx.fillStyle = C.light;
    ctx.beginPath();
    ctx.moveTo(56, 214);
    ctx.lineTo(52, 222);
    ctx.lineTo(60, 222);
    ctx.closePath();
    ctx.fill();

    // Row B：RMSNorm → Up/Gate → Wdown → ⊕ → lm_head
    node(ctx, 28, yB - 18, 70, 'RMSNorm', false);
    arrowH(ctx, 98, 118, yB, false);
    node(ctx, 118, yB - 18, 72, 'Up/Gate', false);
    arrowH(ctx, 190, 220, yB, sel === 'R4');
    node(ctx, 220, yB - 18, 68, 'Wdown', false);
    arrowH(ctx, 288, 294, yB, false);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(310, yB, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, '+', 310, yB + 1, C.ink, 16, 'center');
    arrowH(ctx, 322, 334, yB, false);
    node(ctx, 334, yB - 18, 72, 'lm_head', false);

    // 四个旋转徽标
    badge(ctx, 106, yA, 'R₁', C.green, sel === 'R1', t);
    badge(ctx, 285, yA, 'R₂', C.green, sel === 'R2', t);
    badge(ctx, 390, yA, 'R₂', C.green, sel === 'R2', t);
    badge(ctx, 238, 38, 'H₃', C.purple, sel === 'R3', t);
    badge(ctx, 205, yB, 'H₄', C.purple, sel === 'R4', t);
    badge(ctx, 400, 130, 'R₁ᵀ', C.green, sel === 'R1', t);

    // 右侧详情面板
    inset(ctx, 524, 20, 176, 240);
    text(ctx, '当前', 540, 46, C.muted, 12);
    text(ctx, d.label, 576, 46, d.color, 18);
    text(ctx, '位置', 540, 74, C.muted, 12);
    text(ctx, d.pos[0], 540, 92, C.ink, 12.5);
    text(ctx, d.pos[1], 540, 108, C.ink, 12.5);
    text(ctx, '能否融合', 540, 134, C.muted, 12);
    ctx.fillStyle = d.fuseOk ? C.green : C.purple;
    ctx.beginPath();
    ctx.arc(546, 152, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, d.fuse, 556, 152, d.fuseOk ? C.green : C.purple, 12.5);
    text(ctx, '是否学习', 540, 178, C.muted, 12);
    ctx.fillStyle = d.learned ? C.green : C.purple;
    ctx.beginPath();
    ctx.arc(546, 196, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, d.learn, 556, 196, d.learned ? C.green : C.purple, 12.5);
    text(ctx, '每块在线 Hadamard：', 540, 226, C.muted, 11.5);
    text(ctx, 'SpinQuant 2 个 vs QuaRot 4 个', 540, 242, C.muted, 11.5);
  });

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="选择旋转位置">
        {(Object.keys(ROT) as RKey[]).map((k) => (
          <button
            key={k}
            className={`chip${sel === k ? ' on' : ''}`}
            style={sel === k ? { background: ROT[k].color, borderColor: ROT[k].color } : { color: ROT[k].color, borderColor: ROT[k].color }}
            onClick={() => setSel(k)}
          >
            {k === 'R3' || k === 'R4' ? 'H' + k.slice(1) : 'R' + k.slice(1)}
          </button>
        ))}
      </div>
      <div className={`feedback${d.purple ? '' : ' good'}`} style={d.purple ? { color: C.purple, borderColor: C.purple } : undefined}>
        {d.fb}
      </div>
      <p className="sq-note">
        <b>读图方式：</b>绿色徽标 = 可融合、可学习（R₁/R₂），紫色 = 在线固定 Hadamard（H₃/H₄），
        蓝色路径 = 当前选中旋转的数据通路。R₁–R₄ 定义来自论文 §3（html#S3.SS1/S3.SS2）；
        「每块 2 个在线 Hadamard vs QuaRot 4 个」来自论文 §4.2（html#S4.T5）；R₁ᵀ 回加前转回为示意画法。
      </p>
    </div>
  );
};

export default Ch5Locations;
