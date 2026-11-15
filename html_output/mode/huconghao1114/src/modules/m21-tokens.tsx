import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, slip, filmChip, label, legend, toLocal, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 2.1 Interleaved sequence inspector. Click any token to see, in the DOM
// info panel, what that position predicts in understanding vs generation mode.
const W = 700;
const H = 280;
const BLOCK = 52;
const GAP = 8;

type Block = { x: number; y: number; kind: 'img' | 'ins' | 'ans' | 'prompt' };

function layout(mode: 'understand' | 'generate'): Block[] {
  const blocks: Block[] = [];
  const seq: Block['kind'][] =
    mode === 'understand'
      ? ['img', 'img', 'img', 'img', 'img', 'img', 'ins', 'ins', 'ins', 'ins', 'ans', 'ans', 'ans', 'ans', 'ans']
      : ['prompt', 'prompt', 'prompt', 'prompt', 'img', 'img', 'img', 'img', 'img', 'img', 'img', 'img'];
  seq.forEach((kind, i) => {
    const row = i < 9 ? 0 : 1;
    const col = row === 0 ? i : i - 9;
    blocks.push({ x: 24 + col * (BLOCK + GAP), y: 64 + row * (BLOCK + 30), kind });
  });
  return blocks;
}

const INFO: Record<string, { title: string; body: string }> = {
  'understand:null': { title: '理解模式', body: '图像 token 与指令 token 先入列，答案 token 逐个生成。点一个位置看它的预测目标。' },
  'generate:null': { title: '生成模式', body: '提示字条保持不变，模型逐格向外长图像 token，拼满后解码成片。点一格看它的预测目标。' },
};

function infoFor(mode: 'understand' | 'generate', sel: number | null, blocks: Block[]): { title: string; body: string } {
  if (sel === null) return INFO[`${mode}:null`];
  const kind = blocks[sel]?.kind;
  if (mode === 'understand') {
    if (kind === 'img') return { title: '位置 ' + (sel + 1) + '：图像 token', body: '给定图像与指令，它是<b>条件</b>的一部分——答案段的交叉熵（式2）以它为输入。' };
    if (kind === 'ins') return { title: '位置 ' + (sel + 1) + '：指令 token', body: '指令告诉模型要答什么；它与图像一起构成预测答案 token 的条件。' };
    return { title: '位置 ' + (sel + 1) + '：答案 token', body: '给定图像、指令和已生成的答案，预测第 ' + (sel - 9) + ' 个答案 token——这就是理解任务的损失（式2）。' };
  }
  if (kind === 'prompt') return { title: '位置 ' + (sel + 1) + '：提示 token', body: '提示是条件：生成时它保持不变，只往外长图像 token（式3）。' };
  return { title: '位置 ' + (sel + 1) + '：图像 token', body: '给定提示与已生成的 ' + (sel - 4) + ' 格，预测下一格图像 token（式3），拼满后用解码器还原成片。' };
}

export const M21Tokens: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'understand' | 'generate'>('understand');
  const [sel, setSel] = useState<number | null>(null);
  const blocksRef = useRef<Block[]>(layout('understand'));

  useEffect(() => {
    blocksRef.current = layout(mode);
    if (sel !== null && sel >= blocksRef.current.length) setSel(null);
  }, [mode, sel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.classList.add('is-ready');
    const blocks = blocksRef.current;
    clearStudio(ctx, W, H, 0.94);
    blocks.forEach((b, i) => {
      const active = i === sel;
      if (b.kind === 'img') filmChip(ctx, b.x, b.y, BLOCK, active ? mix(SC.green, SC.blue, 0.25) : SC.green);
      else if (b.kind === 'ans') {
        ctx.setLineDash([4, 3]);
        slip(ctx, b.x, b.y, BLOCK, BLOCK, active ? SC.blue : SC.muted);
        ctx.setLineDash([]);
      } else slip(ctx, b.x, b.y, BLOCK, BLOCK, active ? SC.blue : b.kind === 'prompt' ? SC.orange : SC.blue);
      if (active) {
        ctx.strokeStyle = SC.blue;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x - 3, b.y - 3, BLOCK + 6, BLOCK + 6);
      }
    });
    // 片夹边框：整条序列装在一只片夹里
    ctx.strokeStyle = mix(SC.blue, SC.bg, 0.3);
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 52, 552, 162);
    ctx.fillStyle = mix(SC.blue, SC.bg, 0.55);
    for (const hx of [42, 534]) {
      ctx.beginPath();
      ctx.arc(hx, 58, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // index marks under the first row only (sparse)
    label(ctx, '1', 24 + BLOCK / 2, 56, SC.muted, 10, 'center');
    label(ctx, String(blocks.length), 24 + 8 * (BLOCK + GAP) + BLOCK / 2, 56, SC.muted, 10, 'center');
    if (mode === 'understand') {
      legend(ctx, [[SC.green, '图像 token'], [SC.blue, '文本 token'], [SC.muted, '答案（未生成）']], 24, 216);
    } else {
      legend(ctx, [[SC.orange, '提示 token'], [SC.green, '图像 token（逐格生成）']], 24, 216);
    }
  }, [mode, sel]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toLocal(canvas, e.clientX, e.clientY);
    const hit = blocksRef.current.findIndex(
      (b) => x >= b.x - 4 && x <= b.x + BLOCK + 4 && y >= b.y - 4 && y <= b.y + BLOCK + 4
    );
    setSel(hit >= 0 ? hit : null);
  };

  const info = infoFor(mode, sel, blocksRef.current);

  return (
    <div>
      <div className="chip-row">
        <button className={`chip ${mode === 'understand' ? 'selected' : ''}`} onClick={() => setMode('understand')}>
          理解模式
        </button>
        <button className={`chip ${mode === 'generate' ? 'selected' : ''}`} onClick={() => setMode('generate')}>
          生成模式
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <canvas ref={canvasRef} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer', maxWidth: '100%' }} />
        <div className="hotspot-info" style={{ flex: 1, minWidth: 220, maxWidth: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{info.title}</div>
          <div dangerouslySetInnerHTML={{ __html: info.body }} />
        </div>
      </div>
      <div className="feedback">
        {mode === 'understand'
          ? '理解与生成唯一的区别是「预测哪种 token」——参数必然共用。'
          : '生成时提示不变，图像 token 逐格长出——同一套参数在两种模式间来回服务。'}
      </div>
    </div>
  );
};
export default M21Tokens;
