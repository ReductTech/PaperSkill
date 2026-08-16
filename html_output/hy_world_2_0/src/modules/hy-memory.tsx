import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

const C = { bg: '#f5f8f0', line: '#d7deea', ink: '#21324a', muted: '#68778f', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed', white: '#fff' };
type Mode = 'none' | 'ggm' | 'ssm' | 'both';

const modes: Record<Mode, { title: string; geometry: string; texture: string; conclusion: string }> = {
  none: { title: '无记忆', geometry: '门框漂移、墙角错位', texture: '局部纹理随机续写', conclusion: '只看目标相机条件时，跨路线没有共享的世界锚点。' },
  ggm: { title: '仅 GGM', geometry: '粗结构稳定', texture: '细节偏软、材质不连续', conclusion: 'GGM 能守住全局骨架，但粗点云渲染不足以恢复高频纹理。' },
  ssm: { title: '仅 SSM++', geometry: '细节清晰但位置可能错', texture: '门牌与砖纹被找回', conclusion: '相关历史帧能补局部细节，却不能独自保证它被放在正确世界坐标。' },
  both: { title: 'GGM + SSM++', geometry: '结构与位置稳定', texture: '局部纹理连续', conclusion: '全局几何锚点与局部相关视角分工协作，才形成论文的双记忆。' },
};

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = `700 ${size}px Segoe UI, sans-serif`; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function drawRoom(ctx: CanvasRenderingContext2D, x: number, y: number, mode: Mode) {
  const hasGgm = mode === 'ggm' || mode === 'both'; const hasSsm = mode === 'ssm' || mode === 'both';
  const drift = hasGgm ? 0 : 26; const doorX = x + 88 + drift; const cornerX = x + 236 - drift * .55;
  ctx.fillStyle = '#dce8d2'; ctx.fillRect(x, y, 250, 152);
  ctx.strokeStyle = hasGgm ? C.green : C.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 18, y + 130); ctx.lineTo(cornerX, y + 92); ctx.lineTo(x + 232, y + 24); ctx.stroke();
  ctx.fillStyle = '#d7b986'; ctx.fillRect(doorX, y + 54, 54, 98); ctx.strokeStyle = hasGgm ? C.green : C.red; ctx.strokeRect(doorX, y + 54, 54, 98);
  ctx.fillStyle = '#83a5b8'; ctx.fillRect(x + 172 - drift * .35, y + 54, 42, 45);
  if (hasSsm) {
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
    for (let row = 0; row < 4; row += 1) for (let col = 0; col < 6; col += 1) ctx.strokeRect(x + 18 + col * 34, y + 18 + row * 25, 29, 20);
    ctx.fillStyle = C.orange; ctx.fillRect(doorX + 12, y + 76, 30, 10); label(ctx, 'A-17', doorX + 27, y + 85, C.white, 8, 'center');
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.44)'; ctx.fillRect(x + 10, y + 8, 230, 136);
  }
  if (!hasGgm) {
    ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeRect(x + 82, y + 48, 62, 104); ctx.setLineDash([]);
    label(ctx, '世界坐标漂移', x + 124, y + 174, C.red, 10, 'center');
  } else label(ctx, 'GGM 锚定门框与墙角', x + 125, y + 174, C.green, 10, 'center');
}

function MemoryCanvas({ mode }: { mode: Mode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 620, 330); } catch { return; }
    const paint = () => {
      ctx.clearRect(0, 0, 620, 330); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 620, 330);
      label(ctx, '记忆输入', 24, 28, C.ink, 13); label(ctx, '目标视角生成结果', 590, 28, C.ink, 13, 'right');
      const hasGgm = mode === 'ggm' || mode === 'both'; const hasSsm = mode === 'ssm' || mode === 'both';
      ctx.fillStyle = hasGgm ? '#f2edff' : C.white; ctx.strokeStyle = hasGgm ? C.purple : C.line; ctx.lineWidth = hasGgm ? 3 : 2; ctx.fillRect(28, 55, 142, 92); ctx.strokeRect(28, 55, 142, 92);
      for (let i = 0; i < 26; i += 1) { ctx.fillStyle = hasGgm ? C.purple : '#cfd6df'; ctx.globalAlpha = hasGgm ? .75 : .28; ctx.beginPath(); ctx.arc(48 + (i * 37) % 105, 72 + (i * 29) % 56, 2.5, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
      label(ctx, 'GGM', 99, 119, hasGgm ? C.purple : C.muted, 13, 'center'); label(ctx, '360° 粗点云渲染', 99, 166, C.muted, 10, 'center');
      ctx.fillStyle = hasSsm ? '#fff7e9' : C.white; ctx.strokeStyle = hasSsm ? C.orange : C.line; ctx.lineWidth = hasSsm ? 3 : 2; ctx.fillRect(28, 202, 142, 82); ctx.strokeRect(28, 202, 142, 82);
      ctx.fillStyle = '#dce8d2'; ctx.fillRect(42, 214, 114, 55); if (hasSsm) { ctx.strokeStyle = C.orange; for (let i = 0; i < 5; i += 1) ctx.strokeRect(48 + i * 20, 220, 16, 35); }
      label(ctx, 'SSM++', 99, 300, hasSsm ? C.orange : C.muted, 10, 'center');
      ctx.strokeStyle = hasGgm ? C.purple : C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(170, 100); ctx.lineTo(244, 130); ctx.stroke();
      ctx.strokeStyle = hasSsm ? C.orange : C.line; ctx.beginPath(); ctx.moveTo(170, 242); ctx.lineTo(244, 194); ctx.stroke();
      drawRoom(ctx, 326, 70, mode);
      ctx.fillStyle = mode === 'both' ? C.green : mode === 'none' ? C.red : C.orange; ctx.fillRect(244, 122, 62, 82); label(ctx, 'DiT', 275, 169, C.white, 14, 'center');
      label(ctx, modes[mode].title, 451, 292, mode === 'both' ? C.green : mode === 'none' ? C.red : C.orange, 12, 'center');
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, paint, () => undefined); paint(); return disconnect;
  }, [mode]);
  return <canvas ref={ref} width={620} height={330} />;
}

export const HyMemory: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('none');
  const active = modes[mode];
  return <div className="memory-rebuild">
    <div className="learning-contract">
      <div><span>为什么学</span><p>WorldStereo 会沿多条轨迹生成关键帧；如果每条路线只顾自己，同一扇门会在不同视角漂移。</p></div>
      <div><span>本次操作</span><p>依次切换无记忆、仅 GGM、仅 SSM++ 和双记忆，观察结构位置与局部纹理分别由谁负责。</p></div>
      <div><span>应得判断</span><p>GGM 是全局几何锚点，SSM++ 是局部相关视角检索；它们不是两个同类缓存。</p></div>
    </div>
    <section className="ggm-definition"><span>先定义术语</span><strong>GGM = Global-Geometric Memory</strong><p>它把 360° 全景点云从目标相机渲染成粗几何条件，用来固定墙、门、转角等全局结构。它不是保存全部历史 token 的通用缓存。</p></section>
    <div className="memory-mode-tabs" role="tablist" aria-label="选择记忆组合">
      {(Object.keys(modes) as Mode[]).map((id) => <button key={id} type="button" role="tab" aria-selected={mode === id} className={mode === id ? 'selected' : ''} onClick={() => setMode(id)}><strong>{modes[id].title}</strong><small>{id === 'ggm' ? '只守骨架' : id === 'ssm' ? '只补细节' : id === 'both' ? '论文组合' : '失败基线'}</small></button>)}
    </div>
    <MemoryCanvas mode={mode} />
    <div className="memory-role-ledger"><div><span>结构结果</span><strong>{active.geometry}</strong></div><div><span>纹理结果</span><strong>{active.texture}</strong></div></div>
    <div className={`feedback ${mode === 'both' ? 'good' : mode === 'none' ? 'bad' : ''}`}>{active.conclusion}</div>
    <section className="memory-paper-spotlight"><header><span>论文 Table 8</span><strong>这些数值属于完整配置行，不由上方动画计算</strong></header><div className="memory-evidence-cards"><div><span>相机控制基线</span><strong>PSNR 16.13</strong><small>SSIM 0.474 · PSNRm 28.81</small></div><div className={mode === 'both' ? 'active' : ''}><span>配置 A · GGM + SSM++</span><strong>PSNR 20.94</strong><small>SSIM 0.640 · PSNRm 30.27</small></div><div><span>A* · 时间拼接替代</span><strong>PSNR 19.83</strong><small>SSIM 0.581 · PSNRm 29.77</small></div><div><span>配置 F · 完整中训</span><strong>PSNR 21.63</strong><small>SSIM 0.669 · PSNRm 30.76</small></div></div><p>配置 F 还包含可训练 FFN、数据增强、相机嵌入和更大 batch，不能把全部提升只归因于双记忆。</p></section>
    <div className="memory-glossary-grid"><details><summary>SSM++ 如何选择参考？</summary><p>它只检索与目标视角最相关的历史关键帧，并让检索帧直接进入主 DiT。</p></details><details><summary>为什么采用空间拼接？</summary><p>检索帧与目标帧横向组成 2W 配对并共享时间索引，使模型把它们理解为同一时刻的两种空间观察。</p></details></div>
    <PaperTable tableId="table-8" />
  </div>;
};

export default HyMemory;
