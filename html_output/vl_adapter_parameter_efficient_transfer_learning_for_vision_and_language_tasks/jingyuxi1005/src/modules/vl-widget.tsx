import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { AdapterCalculator, AdapterStructure, TrainableMap, SharingExplorer, ResultExplorer, Limitations,
  MethodComparison, NumericEvidence, MobileEvidence, ConclusionExplorer } from './learning-widgets';

const C = { bg: '#f5f8f6', ink: '#21324a', muted: '#68778f', line: '#d7e3df', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', pale: '#e7f3ed' };
const modes: Record<string, string[]> = {
  '2.1': ['图文输入', '视频文本输入'],
  '3.1': ['Input', 'Down', 'GELU', 'Up', 'Residual'],
  '4.1': ['Self-attention', 'Cross-attention', 'Feed-forward'],
  '4.2': ['CLIP', '视觉投影', '语言主干', 'LayerNorm', 'Adapter', '输出层'],
  '5.1': ['Multiple', 'Half-shared', 'Single'],
  '5.2': ['固定任务词', '可训练 Prompt'],
  '6.1': ['Full', 'Adapter', 'Hyperformer', 'Compacter', 'Prompt', 'LoRA'],
  '7.1': ['VQAv2', 'GQA', 'NLVR²', 'MSCOCO', 'TVQA', 'How2QA', 'TVC', 'YC2C'],
  '8.1': ['图文', '视频文本'],
  '8.2': ['VQA', 'NLVR²', 'COCO', 'TVQA', 'TVC', 'YC2C'],
  '9.1': ['共享方式', '模块组成'],
};

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.line, r = 14) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
}
function line(ctx: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number, color = C.line, width = 3) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size = 25, color = C.ink, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = color; ctx.font = `600 ${size}px "Segoe UI", sans-serif`; ctx.textAlign = align; ctx.fillText(s, x, y);
}
function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, value: number, max: number, color: string) {
  round(ctx, x, y, w, 24, '#e8eeec', '#e8eeec', 9);
  round(ctx, x, y, Math.max(10, w * value / max), 24, color, color, 9);
}

const notes: Record<string, string[]> = {
  '2.1': ['图像 → CLIP-ResNet101 特征 → 视觉投影 → BART 文本输出。', '视频帧 → CLIP ViT-B/32 特征；再结合字幕与问题输入 BART。'],
  '3.1': ['原输入 x 保留一条残差通路。', '降维：dᵢ → d，让可训练模块保持轻量。', '论文使用 GELU 非线性。', '升维：d → dᵢ，恢复原维度。', '模块输出与 x 相加，而非覆盖原输入。'],
  '4.1': ['Adapter 位于语言侧 self-attention 后。', '解码器的 cross-attention 后也有 Adapter。', 'Adapter 也位于 feed-forward 后。'],
  '4.2': ['CLIP 视觉编码器冻结。', '视觉投影层可训练。', 'BART/T5 主干权重冻结。', 'LayerNorm 可训练。', '语言侧 Adapter 可训练。', '绑权的输出层冻结。'],
  '5.1': ['每个任务独立 Adapter；主 Table 1：12.22% / Avg. 75.9。', '主实验共享升维层，降维层仍任务专用；8.36% / Avg. 75.9。', '全部任务共用一套 Adapter；4.18% / Avg. 77.4。'],
  '5.2': ['“vqa:” 是固定的文本任务标识，不是学习出的参数。', 'Prompt-tuning 学习连续提示向量，是另一种 PEFT baseline。'],
  '6.1': ['更新语言侧主干；主要比较中 CLIP 仍冻结。', '新增瓶颈残差模块。', '共享超网络按任务和层生成 Adapter 权重。', 'PHM / Kronecker 参数化；本文移除跨层矩阵共享与进一步低秩分解。', '学习输入端的连续提示。', '学习原权重的低秩增量；本文将其作为 baseline。'],
  '7.1': ['图文问答 · Accuracy (%)', '图文问答 · Accuracy (%)', '视觉推理 · Accuracy (%)', '图像描述 · CIDEr', '视频问答 · Accuracy (%)', '视频问答 · Accuracy (%)', '视频描述 · CIDEr', '视频描述 · CIDEr'],
  '8.1': ['CLIP-BART 图文四任务：100%/77.6 对 4.18%/77.4；论文 Avg. 混合 Accuracy 与 CIDEr。', 'CLIP-BART 视频文本四任务：100%/87.4 对 3.39%/87.4；同样是混合指标的 Avg.。'],
  '8.2': ['VQA Accuracy：67.6 → 65.9，Single Adapter 较低。', 'NLVR² Accuracy：73.0 → 74.2，Single Adapter 较高。', 'COCO CIDEr：112.9 → 114.9，Single Adapter 较高。', 'TVQA Accuracy：76.3 → 76.6，Single Adapter 略高。', 'TVC CIDEr：45.7 → 46.3，Single Adapter 略高。', 'YC2C CIDEr：154.0 → 152.9，Single Adapter 略低。'],
  '9.1': ['共享消融：参数更少时，Single Adapter 在本文图文设置中汇总分更高。', '模块消融：投影与 LayerNorm 有帮助，加入 Adapter 后汇总分进一步提高。'],
};

function draw(ctx: CanvasRenderingContext2D, moduleId: string, chapterId: string, selected: number, count: number, w: number, h: number) {
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  if (moduleId === 'old' || moduleId === 'new') {
    const old = moduleId === 'old';
    for (let i = 0; i < 3; i++) {
      const x = 100 + i * 305;
      round(ctx, x, 62, old ? 245 : 240, 125, old ? '#fff0f1' : '#e7f3ed', old ? C.red : C.green);
      if (!old) round(ctx, x + 80, 164, 80, 25, C.orange, C.orange, 7);
    }
    label(ctx, old ? '每任务完整更新' : '共享主干 + 小模块', w / 2, 245, 29, old ? C.red : C.green);
    return;
  }
  if (moduleId === 'ana') {
    round(ctx, 125, 38, 820, 170, '#ffffff', C.blue, 18);
    line(ctx, 540, 40, 540, 207, C.line, 2);
    const n = Number(chapterId.replace('chap-', ''));
    round(ctx, 160 + (n % 4) * 185, 74, 100, 32, C.orange, C.orange, 8);
    label(ctx, '共用教材', 540, 157, 30, C.blue);
    return;
  }
  if (moduleId === '1.1') {
    for (let i = 0; i < count; i++) { round(ctx, 65 + i * (880 / count), 52, Math.min(170, 800 / count), 78, '#fff0f1', C.red); round(ctx, 65 + i * (880 / count), 174, Math.min(170, 800 / count), 20, C.green, C.green, 5); }
    label(ctx, '完整副本', 60, 105, 20, C.red, 'left'); label(ctx, '小模块', 60, 215, 20, C.green, 'left');
    return;
  }
  if (moduleId === '2.1') {
    const xs = [60, 330, 600, 860]; const names = [selected ? '视频帧' : '图像', 'CLIP 特征', '视觉投影', 'BART 输出'];
    names.forEach((n, i) => { round(ctx, xs[i], 95, 195, 94, i === 1 ? '#e9eef8' : i === 2 ? '#e7f3ed' : '#fff', i === 2 ? C.green : C.line); label(ctx, n, xs[i] + 97, 150, 22); if (i < 3) line(ctx, xs[i] + 200, 142, xs[i + 1] - 5, 142, C.blue, 4); }); return;
  }
  if (moduleId === '3.1') {
    const names = ['Input', 'Down', 'GELU', 'Up', '+ x'];
    names.forEach((n, i) => { const x = 55 + i * 210; round(ctx, x, 98, i === 1 || i === 2 ? 120 : 150, 92, i === selected ? '#dbf3e6' : '#fff', i === selected ? C.green : C.line); label(ctx, n, x + (i === 1 || i === 2 ? 60 : 75), 151, 25, i === selected ? C.green : C.ink); if (i < 4) line(ctx, x + 155, 143, x + 202, 143, C.blue, 3); }); return;
  }
  if (moduleId === '4.1') {
    ['Self-attention', 'Cross-attention', 'Feed-forward'].forEach((n, i) => { const x = 70 + i * 345; round(ctx, x, 70, 245, 90, i === selected ? '#e8f0fb' : '#fff', i === selected ? C.blue : C.line); label(ctx, n, x + 122, 124, 22); round(ctx, x + 64, 174, 120, 47, i === selected ? '#dbf3e6' : '#f6f8f7', i === selected ? C.green : C.line, 9); label(ctx, 'Adapter', x + 124, 204, 18, i === selected ? C.green : C.muted); }); return;
  }
  if (moduleId === '4.2') {
    modes['4.2'].forEach((n, i) => { const x = 48 + (i % 3) * 340, y = 45 + Math.floor(i / 3) * 120; const train = [1,3,4].includes(i); round(ctx, x, y, 265, 77, i === selected ? train ? '#dff3e7' : '#e9eef8' : '#fff', i === selected ? train ? C.green : C.blue : C.line); label(ctx, n, x + 132, y + 47, 23, i === selected ? train ? C.green : C.blue : C.ink); }); return;
  }
  if (moduleId === '5.1') {
    for (let i = 0; i < 4; i++) { const x = 60 + i * 248; round(ctx, x, 35, 190, 55, '#fff'); label(ctx, ['VQA','GQA','NLVR²','COCO'][i], x + 95, 70, 20); const down = selected === 2 ? C.green : [C.orange,C.purple,C.blue,C.red][i]; const up = selected === 0 ? [C.orange,C.purple,C.blue,C.red][i] : C.green; round(ctx, x + 12, 112, 166, 45, down, down); round(ctx, x + 12, 174, 166, 45, up, up); }
    label(ctx, 'D', 44, 142, 22, C.ink); label(ctx, 'U', 44, 205, 22, C.ink); return;
  }
  if (moduleId === '5.2') { round(ctx, 130, 80, 810, 115, selected ? '#ece7fb' : '#e8f1fb', selected ? C.purple : C.blue); label(ctx, selected ? '可训练连续向量 → 模型输入' : '固定文本词「vqa:」→ 模型输入', 540, 148, 27, selected ? C.purple : C.blue); return; }
  if (moduleId === '6.1') { round(ctx, 300, 65, 470, 150, selected === 0 ? '#fff0f1' : '#e7f3ed', selected === 0 ? C.red : C.green); label(ctx, modes['6.1'][selected], 535, 130, 35); label(ctx, ['主干权重','附加模块','超网络','结构化 Adapter','输入提示','低秩增量'][selected], 535, 178, 24, C.muted); return; }
  if (moduleId === '7.1') { const isVideo = selected > 3; round(ctx, 120, 58, 350, 155, isVideo ? '#e9eef8' : '#e7f3ed', isVideo ? C.blue : C.green); label(ctx, isVideo ? 'VIDEO-TEXT' : 'IMAGE-TEXT', 295, 147, 29, isVideo ? C.blue : C.green); round(ctx, 605, 58, 350, 155, '#fff'); label(ctx, modes['7.1'][selected], 780, 130, 33); label(ctx, notes['7.1'][selected], 780, 177, 22, C.muted); return; }
  if (moduleId === '8.1') { const p = selected ? 3.39 : 4.18, f = selected ? 87.4 : 77.6, s = selected ? 87.4 : 77.4; label(ctx, '可更新参数', 70, 73, 23, C.ink, 'left'); bar(ctx, 245, 50, 610, 100, 100, C.red); bar(ctx, 245, 112, 610, p, 100, C.green); label(ctx, '100%', 925, 74, 26, C.red); label(ctx, `${p}%`, 925, 137, 26, C.green); label(ctx, `论文 Avg.：Full ${f} · Single ${s}`, 540, 235, 28, C.blue); return; }
  if (moduleId === '8.2') { const vals = [[67.6,65.9],[73,74.2],[112.9,114.9],[76.3,76.6],[45.7,46.3],[154,152.9]][selected]; const max = Math.max(...vals)*1.1; label(ctx, modes['8.2'][selected], 540, 55, 29); bar(ctx, 235, 95, 650, vals[0], max, C.red); bar(ctx, 235, 160, 650, vals[1], max, C.green); label(ctx, `Full ${vals[0]}`, 110, 118, 22, C.red); label(ctx, `Single ${vals[1]}`, 110, 183, 22, C.green); return; }
  if (moduleId === '9.1') { const names = selected ? ['投影','+ LN','+ Adapter'] : ['Multiple','Half','Single']; const vals = selected ? [47.1,62.9,77.4] : [75.9,75.9,77.4]; names.forEach((n,i) => { const x=110+i*330; label(ctx,n,x+120,80,25); bar(ctx,x,120,240,vals[i],80,i===2?C.green:C.blue); label(ctx,`${vals[i]}`,x+120,207,28,i===2?C.green:C.ink); }); return; }
}

export const VlWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(3);
  const compact = chapterId === 'hero' || moduleId === 'ana';
  const w = 1080, h = compact && moduleId === 'ana' ? 250 : 280;
  useEffect(() => { const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas,w,h); } catch { return; } const render = () => { draw(ctx,moduleId,chapterId,selected,count,w,h); canvas.classList.add('is-ready'); }; render(); return observeCanvas(canvas,render,()=>{}); }, [chapterId,moduleId,selected,count,h]);
  const options = modes[moduleId];
  if (moduleId === '3.1') return <AdapterStructure />;
  if (moduleId === '3.2') return <AdapterCalculator />;
  if (moduleId === '4.2') return <TrainableMap />;
  if (moduleId === '5.1') return <SharingExplorer />;
  if (moduleId === '8.1') return <ResultExplorer />;
  if (moduleId === '10.0') return <Limitations />;
  if (moduleId === '10.1') return <ConclusionExplorer />;
  if (moduleId === 'ana') return null;
  if (chapterId === 'hero') return <div className={'hero-model ' + (moduleId === 'new' ? 'peft' : '')}>
    <small>图文四任务 → 同一模型</small>
    <strong>CLIP-BART</strong>
    <span>{moduleId === 'new' ? '视觉投影 + LayerNorm + Adapter 更新' : '语言侧主干全量更新'}</span>
    <small>CLIP 冻结 · 多任务联合训练</small>
  </div>;
  if (compact) return <div className="vl-widget compact"><canvas ref={ref} width={w} height={h} aria-label="教学示意图，根据论文方法整理" /></div>;
  return <div className="vl-widget">
    {moduleId === '1.1' ? <div className="ctrl"><label htmlFor={`count-${chapterId}`}>任务数量 <span className="val">{count}</span></label><input id={`count-${chapterId}`} type="range" min="1" max="4" value={count} onChange={e=>setCount(Number(e.target.value))} /></div> : null}
    {options ? <div className="vl-controls" role="group" aria-label="选择交互状态">{options.map((x,i)=><button key={x} type="button" className={`vl-chip ${selected===i?'selected':''}`} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{x}</button>)}</div> : null}
    {moduleId === '6.1' ? <MethodComparison selected={selected} />
      : moduleId === '8.2' || moduleId === '9.1' ? <NumericEvidence moduleId={moduleId} selected={selected} />
      : moduleId === '1.1' ? <div className="storage-demo">
          <div><strong>{count} 份完整模型</strong><div className="copy-row">{Array.from({length:count},(_,i)=><span key={i}>模型 {i+1}</span>)}</div></div>
          <div><strong>1 份共享骨干 + {count} 个任务模块</strong><div className="shared-base">共享骨干</div><div className="copy-row small-modules">{Array.from({length:count},(_,i)=><span key={i}>模块 {i+1}</span>)}</div></div>
        </div>
      : <><canvas className="vl-desktop-canvas" ref={ref} width={w} height={h} aria-label="教学示意图，根据论文方法整理" /><MobileEvidence moduleId={moduleId} selected={selected} /></>}
    <div className="feedback">{moduleId === '1.1' ? `${count} 项任务：完整副本随任务数增加；共享骨干时只增加小型任务参数。` : notes[moduleId]?.[selected] || '点击选项，查看论文中的结构或实验。'}</div>
  </div>;
};
