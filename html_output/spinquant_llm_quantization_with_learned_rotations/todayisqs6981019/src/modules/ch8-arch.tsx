import React, { useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, inset, rrect, text } from './kit';

const W = 720;
const H = 300;

type Hot = 'norm' | 'emb' | 'attn' | 'down' | 'head';

const SPOTS: Record<Hot, { chip: string; paper: string; src: string; fb: string; rel: 'R1' | 'R2' | 'R4' | null }> = {
  norm: {
    chip: 'RMSNorm γ', paper: 'fuse_layer_norms：γ 融合进相邻权重',
    src: '融合后 embedding 输出减均值（源码口径）',
    fb: 'γ 融合进相邻权重，随后 embedding 输出减均值（源码口径）', rel: 'R1',
  },
  emb: {
    chip: 'Embedding', paper: 'embedding 输出即 X，进入第一个旋转流',
    src: 'tie 模型需先拷贝 lm_head 再处理（源码口径）',
    fb: 'tie_word_embeddings 模型需拷贝 lm_head，否则旋转只改一半（源码口径）', rel: null,
  },
  attn: {
    chip: 'Wqkv + Wo', paper: 'Wqkv 读旋转流：W̃ = R₁ᵀW 融合',
    src: 'O 投影 bias 额外乘 R2（源码口径）',
    fb: 'Wqkv 读旋转流 → W̃=R₁ᵀW；O 投影 bias 额外乘 R2（源码口径）', rel: 'R2',
  },
  down: {
    chip: 'down_proj', paper: 'R4 融进 down_proj 权重',
    src: '输入侧不另加算子（源码口径）',
    fb: 'R4 融进 down_proj 权重，输入侧不另加算子（源码口径）', rel: 'R4',
  },
  head: {
    chip: 'lm_head', paper: '输出 logits，与 embedding 对齐词表',
    src: 'tie 模型先解除共享再各自处理（源码口径）',
    fb: '若 lm_head 与 embedding 共享，融合前先解除共享再各自处理（源码口径）', rel: null,
  },
};

function hotRrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sel: boolean, t: number) {
  ctx.strokeStyle = sel ? C.orange : C.axis;
  ctx.lineWidth = sel ? 2.5 + Math.sin(t * 5) * 0.8 : 1.5;
  ctx.fillStyle = sel ? '#fdf1e7' : C.white;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();
}

// ch8-arch：P5 热点点击——五个部件的「论文 / 源码」双口径
export const Ch8Arch: React.FC = () => {
  const [hot, setHot] = useState<Hot>('norm');
  const d = SPOTS[hot];

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    grid(ctx, 20, 16, 434, 268, 26);

    text(ctx, 'LLaMA 块', 140, 34, C.muted, 12);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(130, 44, 224, 216, 10);
    ctx.stroke();

    // 块内第一行：RMSNorm γ → Wqkv/Wo
    hotRrect(ctx, 146, 64, 86, 34, hot === 'norm', t);
    text(ctx, 'RMSNorm γ', 189, 81, hot === 'norm' ? C.orange : C.ink, 12.5, 'center');
    ctx.strokeStyle = hot === 'norm' ? C.blue : C.light;
    ctx.lineWidth = hot === 'norm' ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(232, 81);
    ctx.lineTo(252, 81);
    ctx.stroke();
    ctx.fillStyle = hot === 'norm' ? C.blue : C.light;
    ctx.beginPath();
    ctx.moveTo(256, 81);
    ctx.lineTo(248, 77);
    ctx.lineTo(248, 85);
    ctx.closePath();
    ctx.fill();
    hotRrect(ctx, 256, 64, 82, 34, hot === 'attn', t);
    text(ctx, 'Wqkv · Wo', 297, 81, hot === 'attn' ? C.orange : C.ink, 12.5, 'center');

    // 块内第二行：RMSNorm → Up/Gate → down_proj
    hotRrect(ctx, 146, 158, 86, 34, false, t);
    text(ctx, 'RMSNorm', 189, 175, C.ink, 12.5, 'center');
    ctx.strokeStyle = C.light;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(232, 175);
    ctx.lineTo(252, 175);
    ctx.stroke();
    ctx.fillStyle = C.light;
    ctx.beginPath();
    ctx.moveTo(256, 175);
    ctx.lineTo(248, 171);
    ctx.lineTo(248, 179);
    ctx.closePath();
    ctx.fill();
    hotRrect(ctx, 256, 158, 82, 34, hot === 'down', t);
    text(ctx, 'down_proj', 297, 175, hot === 'down' ? C.orange : C.ink, 12.5, 'center');

    // 块内连接与残差
    ctx.strokeStyle = C.light;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(189, 98);
    ctx.lineTo(189, 158);
    ctx.moveTo(297, 98);
    ctx.lineTo(297, 158);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, '残差', 174, 128, C.muted, 11, 'right');

    // Embedding / lm_head
    hotRrect(ctx, 30, 130, 76, 36, hot === 'emb', t);
    text(ctx, 'Embedding', 68, 148, hot === 'emb' ? C.orange : C.ink, 12.5, 'center');
    hotRrect(ctx, 378, 130, 76, 36, hot === 'head', t);
    text(ctx, 'lm_head', 416, 148, hot === 'head' ? C.orange : C.ink, 12.5, 'center');

    // 主数据路径
    const embHot = hot === 'emb' || hot === 'norm';
    ctx.strokeStyle = embHot ? C.blue : C.light;
    ctx.lineWidth = embHot ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(106, 148);
    ctx.lineTo(126, 148);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(189, 98);
    ctx.lineTo(189, 126);
    ctx.lineTo(130, 126);
    ctx.lineTo(130, 148);
    ctx.lineTo(126, 148);
    ctx.stroke();
    const headHot = hot === 'head' || hot === 'down';
    ctx.strokeStyle = headHot ? C.blue : C.light;
    ctx.lineWidth = headHot ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(354, 148);
    ctx.lineTo(374, 148);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(297, 192);
    ctx.lineTo(297, 226);
    ctx.lineTo(366, 226);
    ctx.lineTo(366, 148);
    ctx.lineTo(374, 148);
    ctx.stroke();

    // 相关旋转徽标
    const rOn = (k: 'R1' | 'R2' | 'R4') => d.rel === k;
    const drawR = (x: number, y: number, k: 'R1' | 'R2' | 'R4') => {
      const on = rOn(k);
      ctx.strokeStyle = on ? C.green : C.axis;
      ctx.lineWidth = on ? 2 + Math.sin(t * 5) * 0.6 : 1.2;
      ctx.fillStyle = on ? '#e8f5ec' : C.bg;
      ctx.beginPath();
      ctx.roundRect(x, y, 30, 18, 5);
      ctx.fill();
      ctx.stroke();
      text(ctx, k === 'R4' ? 'H₄' : k, x + 15, y + 9.5, on ? C.green : C.muted, 11, 'center');
    };
    drawR(108, 168, 'R1');
    drawR(300, 104, 'R2');
    drawR(300, 198, 'R4');

    // 右侧详情面板
    inset(ctx, 466, 20, 234, 264);
    text(ctx, d.chip, 482, 46, C.orange, 16);
    rrect(ctx, 482, 62, 48, 20, '#eef3fa', C.blue, 1.2, 5);
    text(ctx, '论文', 506, 72.5, C.blue, 11.5, 'center');
    text(ctx, d.paper, 482, 98, C.ink, 12.5);
    rrect(ctx, 482, 150, 96, 20, '#fdf1e7', C.orange, 1.2, 5);
    text(ctx, '源码核实', 530, 160.5, C.orange, 11.5, 'center');
    text(ctx, d.src, 482, 186, C.ink, 12.5);
    text(ctx, '三处结构对齐后，', 482, 234, C.muted, 12);
    text(ctx, '旋转才能正确融进权重', 482, 250, C.muted, 12);
  });

  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} />
      <div className="ctrl" role="group" aria-label="选择架构热点">
        {(Object.keys(SPOTS) as Hot[]).map((k) => (
          <button
            key={k}
            className={`chip${hot === k ? ' on' : ''}`}
            style={hot === k ? { background: C.orange, borderColor: C.orange } : undefined}
            onClick={() => setHot(k)}
          >
            {SPOTS[k].chip}
          </button>
        ))}
      </div>
      <div className="feedback">{d.fb}</div>
      <p className="sq-note">
        <b>读图方式：</b>橙色脉冲 = 当前热点，蓝色路径 = 激活数据通路，绿色徽标 = 该位置相关的旋转。
        结构位次与论文 §3.1 一致；「γ 融合 + embedding 减均值」「bias 乘 R2」「tie 解共享」为源码核实口径（非论文原文）。
      </p>
    </div>
  );
};

export default Ch8Arch;
