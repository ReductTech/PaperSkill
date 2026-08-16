import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { EvidenceMediaDrawer, PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', line: '#d7deea', ink: '#21324a', muted: '#68778f', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#d97706', white: '#ffffff',
};

type CaseId = 'projection' | 'latent' | 'pixel';

const cases: Record<CaseId, { title: string; problem: string; fix: string; layer: string; conclusion: string }> = {
  projection: {
    title: '相机参数不可靠', problem: '显式投影把错误焦距直接放大成弯曲与拉伸。',
    fix: '隐式映射让 MMDiT 在统一潜空间学习透视条件与 ERP token 的对应。', layer: '输入到潜空间',
    conclusion: 'HY-Pano 2.0 不是先猜一组精确内参再投影，而是学习条件图像与全景噪声之间的对应。',
  },
  latent: {
    title: '潜空间左右断开', problem: '普通卷积把 ERP 左右边缘当成互不相关的两端。',
    fix: 'Circle Padding 在每个去噪阶段把左右特征互相补到对侧，使它们成为周期邻居。', layer: '扩散去噪潜空间',
    conclusion: '循环填充解决的是特征层的周期边界，不等同于最后在像素上抹平一条线。',
  },
  pixel: {
    title: '解码后仍有亮度跳变', problem: '即使潜空间连续，VAE 解码后的颜色与纹理仍可能在边界处轻微突变。',
    fix: 'Pixel Blending 在线性重叠带内混合左右像素，消除最终可见接缝。', layer: '解码后的像素空间',
    conclusion: '像素融合是最后一道可见修复；它与潜空间循环填充处于不同层级，二者不能互相替代。',
  },
};

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = `700 ${size}px Segoe UI, sans-serif`; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function drawPanoramaBase(ctx: CanvasRenderingContext2D) {
  const x = 30, y = 48, w = 560, h = 216;
  ctx.fillStyle = '#d9e8f2'; ctx.fillRect(x, y, w, h * .52);
  ctx.fillStyle = '#9eb48d'; ctx.beginPath(); ctx.moveTo(x, y + 150); ctx.lineTo(x + 82, y + 92); ctx.lineTo(x + 170, y + 145); ctx.lineTo(x + 270, y + 76); ctx.lineTo(x + 360, y + 146); ctx.lineTo(x + 470, y + 94); ctx.lineTo(x + w, y + 142); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9bd8a'; ctx.fillRect(x + 242, y + 82, 76, 134);
  ctx.fillStyle = '#6f8c6a'; ctx.fillRect(x + 58, y + 142, 68, 74); ctx.fillRect(x + 448, y + 132, 72, 84);
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(x + 414, y + 112, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.white; ctx.fillRect(x + 405, y + 107, 18, 4);
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}

function drawFailureOverlay(ctx: CanvasRenderingContext2D, mode: CaseId) {
  const x = 30, y = 48, w = 560, h = 216;
  if (mode === 'projection') {
    ctx.fillStyle = 'rgba(255,245,246,.72)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.setLineDash([7,5]);
    ctx.strokeRect(x + 242, y + 82, 76, 134); ctx.setLineDash([]);
    label(ctx, '正确落点', x + 280, y + 76, C.muted, 9, 'center');

    ctx.fillStyle = 'rgba(196,63,82,.18)';
    ctx.beginPath(); ctx.moveTo(x + 188, y + 70); ctx.lineTo(x + 350, y + 88); ctx.lineTo(x + 370, y + h); ctx.lineTo(x + 168, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.red; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 188, y + 70); ctx.lineTo(x + 350, y + 88); ctx.lineTo(x + 370, y + h); ctx.lineTo(x + 168, y + h); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#d9bd8a'; ctx.beginPath(); ctx.moveTo(x + 214, y + 93); ctx.lineTo(x + 334, y + 104); ctx.lineTo(x + 348, y + h); ctx.lineTo(x + 198, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.red; ctx.lineWidth = 2;
    [[x+242,y+96,x+205,y+89],[x+318,y+96,x+350,y+99],[x+242,y+178,x+190,y+182],[x+318,y+178,x+358,y+183]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
    label(ctx, '错误 FoV 把同一建筑投得过宽', x + w / 2, y + 29, C.red, 10, 'center');
    label(ctx, '轮廓与 ERP 地标错位', x + w / 2, y + 202, C.red, 10, 'center');
  }
  if (mode === 'latent') {
    ctx.fillStyle = 'rgba(41,85,143,.42)'; ctx.fillRect(x, y, 46, h); ctx.fillStyle = 'rgba(217,119,6,.46)'; ctx.fillRect(x + w - 46, y, 46, h);
    ctx.fillStyle = '#567360'; ctx.fillRect(x, y + 122, 46, 94); ctx.fillStyle = '#c49c68'; ctx.fillRect(x + w - 46, y + 70, 46, 146);
    ctx.strokeStyle = C.red; ctx.lineWidth = 7; ctx.setLineDash([10, 7]); ctx.beginPath(); ctx.moveTo(x + 23, y); ctx.lineTo(x + 23, y + h); ctx.moveTo(x + w - 23, y); ctx.lineTo(x + w - 23, y + h); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, '左边界特征', x + 58, y + 28, C.blue, 9, 'center'); label(ctx, '右边界特征', x + w - 60, y + 28, C.orange, 9, 'center'); label(ctx, '本应相邻，却各自去噪', x + w / 2, y + 202, C.red, 10, 'center');
    ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+42,y+184);ctx.quadraticCurveTo(x+w/2,y+232,x+w-42,y+184);ctx.stroke();
  }
  if (mode === 'pixel') {
    const left = ctx.createLinearGradient(x, 0, x + 104, 0); left.addColorStop(0, 'rgba(39,68,110,.72)'); left.addColorStop(1, 'rgba(39,68,110,0)'); ctx.fillStyle = left; ctx.fillRect(x, y, 110, h);
    const right = ctx.createLinearGradient(x + w - 110, 0, x + w, 0); right.addColorStop(0, 'rgba(217,119,6,0)'); right.addColorStop(1, 'rgba(217,119,6,.78)'); ctx.fillStyle = right; ctx.fillRect(x + w - 110, y, 110, h);
    ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y + h); ctx.moveTo(x + w - 4, y); ctx.lineTo(x + w - 4, y + h); ctx.stroke();
    ctx.fillStyle=C.blue;ctx.fillRect(x+16,y+18,34,18);ctx.fillStyle=C.orange;ctx.fillRect(x+w-50,y+18,34,18);label(ctx,'冷暗',x+33,y+32,C.white,8,'center');label(ctx,'暖亮',x+w-33,y+32,C.white,8,'center');label(ctx,'同一球面方向出现颜色跳变',x+w/2,y+202,C.red,10,'center');
  }
}

function drawRepairCue(ctx: CanvasRenderingContext2D, mode: CaseId) {
  const x = 30, y = 48, w = 560, h = 216;
  ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+3,y+4);ctx.lineTo(x+3,y+h-4);ctx.moveTo(x+w-3,y+4);ctx.lineTo(x+w-3,y+h-4);ctx.stroke();
  if(mode==='projection'){ctx.strokeStyle='rgba(34,141,92,.42)';ctx.lineWidth=1.5;for(let i=1;i<7;i+=1){ctx.beginPath();ctx.moveTo(x+i*w/7,y);ctx.lineTo(x+i*w/7,y+h);ctx.stroke();}label(ctx,'隐式映射保持 ERP 结构',x+w/2,y+202,C.green,10,'center');}
  if(mode==='latent'){ctx.strokeStyle=C.green;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+w/2,y+190,52,.08,Math.PI*1.92);ctx.stroke();label(ctx,'Circle Padding：左右互为邻居',x+w/2,y+202,C.green,10,'center');}
  if(mode==='pixel'){const blend=ctx.createLinearGradient(x,0,x+80,0);blend.addColorStop(0,'rgba(34,141,92,.18)');blend.addColorStop(1,'rgba(34,141,92,0)');ctx.fillStyle=blend;ctx.fillRect(x,y,80,h);const blendR=ctx.createLinearGradient(x+w-80,0,x+w,0);blendR.addColorStop(0,'rgba(34,141,92,0)');blendR.addColorStop(1,'rgba(34,141,92,.18)');ctx.fillStyle=blendR;ctx.fillRect(x+w-80,y,80,h);label(ctx,'Pixel Blending 平滑重叠带',x+w/2,y+202,C.green,10,'center');}
}

function paintCanvas(canvas: HTMLCanvasElement, mode: CaseId, reveal: number) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.clearRect(0, 0, 620, 320); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 620, 320); drawPanoramaBase(ctx);
  const cut = 30 + reveal / 100 * 560;
  ctx.save(); ctx.beginPath(); ctx.rect(cut, 48, Math.max(0, 590 - cut), 216); ctx.clip(); drawFailureOverlay(ctx, mode); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(30, 48, Math.max(0, cut - 30), 216); ctx.clip(); drawRepairCue(ctx, mode); ctx.restore();
  ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cut, 36); ctx.lineTo(cut, 278); ctx.stroke();
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(cut, 36, 8, 0, Math.PI * 2); ctx.fill();
  label(ctx, reveal === 0 ? '全部为修复前' : reveal === 100 ? '全部为修复后' : '左：修复后｜右：修复前', 310, 304, reveal === 100 ? C.green : reveal === 0 ? C.red : C.orange, 12, 'center');
  canvas.classList.add('is-ready');
}

function PanoramaCanvas({ mode, reveal }: { mode: CaseId; reveal: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode, reveal }); stateRef.current = { mode, reveal };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    try { setupCanvas(canvas, 620, 320); } catch { return; }
    const paint = () => paintCanvas(canvas, stateRef.current.mode, stateRef.current.reveal);
    const disconnect = observeCanvas(canvas, paint, () => undefined); paint(); return disconnect;
  }, []);
  useEffect(() => { if (ref.current) paintCanvas(ref.current, mode, reveal); }, [mode, reveal]);
  return <canvas ref={ref} width={620} height={320} />;
}

export const HyPanorama: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<CaseId>('projection');
  const [reveal, setReveal] = useState(0);
  const active = cases[mode];
  return <div className="panorama-rebuild">
    <div className="learning-contract">
      <div><span>为什么学</span><p>HY-Pano 必须把有限视场变成首尾相接的 360° 世界种子，错误会传给后续规划与生成。</p></div>
      <div><span>本次操作</span><p>选择一种故障，再把扫描线从 0% 拖到 100%，直接比较同一场景修复前后。</p></div>
      <div><span>应得判断</span><p>隐式映射、Circle Padding、Pixel Blending 分别解决不同层级的问题，不能只留其中一个。</p></div>
    </div>
    <div className="panorama-rebuild-tabs" role="tablist" aria-label="选择 HY-Pano 故障层级">
      {(Object.keys(cases) as CaseId[]).map((id) => <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'selected' : ''} onClick={() => setMode(id)}><strong>{cases[id].title}</strong><small>{cases[id].layer}</small></button>)}
    </div>
    <PanoramaCanvas mode={mode} reveal={reveal} />
    <label className="panorama-full-range"><span>修复后覆盖范围</span><strong>{reveal}%</strong><input type="range" min={0} max={100} value={reveal} onChange={(event) => setReveal(Number(event.target.value))} /></label>
    <section className="panorama-cause-effect"><div><span>修复前为什么错</span><strong>{active.problem}</strong></div><i aria-hidden="true">→</i><div><span>论文怎么修</span><strong>{active.fix}</strong></div></section>
    <div className={`feedback ${reveal === 100 ? 'good' : reveal === 0 ? 'bad' : ''}`}>{active.conclusion} {reveal === 100 ? '当前已完整显示修复后状态。' : reveal === 0 ? '当前完整保留故障状态。' : '继续拖动可检查边界与主体是否同时恢复。'}</div>
    <section className="panorama-evidence-boundary"><header><span>论文证据</span><strong>Table 4 报告完整系统，不是三个开关的独立消融</strong></header><div><p>Section 3.2 明确描述三层机制；I2P 中 CLIP-I 从 HY-World 1.0 的 0.831 提升到 HY-Pano 2.0 的 0.844。</p><strong>0.831 → 0.844</strong><small>CLIP-I，越高越好</small></div></section>
    <div className="panorama-glossary-grid"><details><summary>ERP 为什么首尾相接？</summary><p>ERP 将球面展开为矩形，因此最左列与最右列在球面上是相邻方向。</p></details><details><summary>补全是否等于测量？</summary><p>不是。输入视角外的区域来自生成先验，不能当成真实观测或确定几何。</p></details></div>
    <EvidenceMediaDrawer mediaType="官方架构图" src="/images/official-stage-pano.webp" title="HY-Pano 2.0：隐式映射与双层接缝修复" caption="官方图用于核对透视条件、ERP 输出、Circle Padding 与 Pixel Blending 的真实位置。" alt="HY-Pano 2.0 官方架构图" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗" />
    <PaperTable tableId="table-4" />
  </div>;
};

export default HyPanorama;
