import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 700, H = 330;
type Tokenizer = 'flux2' | 'mage';
const metrics = {
  flux2: { label: 'FLUX.2-VAE', enc: 2134, dec: 4798, psnr: '36.88', lpips: '0.0139', color: '#c64545' },
  mage: { label: 'Mage-VAE', enc: 173, dec: 215, psnr: '36.61', lpips: '0.0148', color: '#5db872' },
} as const;

export const VaeTokenizerLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluxRef = useRef<HTMLButtonElement>(null);
  const mageRef = useRef<HTMLButtonElement>(null);
  const [tokenizer, setTokenizer] = useState<Tokenizer>('flux2');
  const m = metrics[tokenizer];
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.maxWidth = '100%'; canvas.style.height = 'auto';
    ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#252523'; ctx.font = '600 16px "Segoe UI", sans-serif'; ctx.fillText(`${m.label}：每像素计算`, 28, 32);
    const rows = [{ name: '编码', value: m.enc, max: 2134 }, { name: '解码', value: m.dec, max: 4798 }];
    rows.forEach((row, i) => { const y = 78 + i * 78; ctx.fillStyle = '#252523'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText(`${row.name} ${row.value} kMACs/像素`, 30, y - 10); ctx.fillStyle = '#e6dfd8'; ctx.fillRect(30, y, 390, 25); ctx.fillStyle = m.color; ctx.fillRect(30, y, Math.max(14, 390 * row.value / row.max), 25); });
    ctx.fillStyle = '#faf9f5'; ctx.strokeStyle = tokenizer === 'mage' ? '#5db872' : '#cc785c'; ctx.lineWidth = 2.5; ctx.fillRect(485, 68, 170, 170); ctx.strokeRect(485, 68, 170, 170);
    ctx.fillStyle = '#cc785c'; ctx.fillRect(505, 91, 82, 14); ctx.fillStyle = '#e6dfd8'; ctx.fillRect(505, 122, 124, 9); ctx.fillRect(505, 142, 105, 9); ctx.fillRect(505, 180, 130, 35);
    ctx.fillStyle = '#6c6a64'; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('CLIC 重建预览示意', 505, 257);
    ctx.fillText('kMACs/像素 ↓ 越低越好', 30, 288); ctx.fillText('精确质量值见下方表格', 485, 288);
    canvas.classList.add('is-ready');
  }, [tokenizer, m]);
  const choose = (next: Tokenizer) => { setTokenizer(next); (next === 'flux2' ? fluxRef : mageRef).current?.focus(); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'Home') { e.preventDefault(); choose('flux2'); }
    if (e.key === 'ArrowRight' || e.key === 'End') { e.preventDefault(); choose('mage'); }
  };
  return <div>
    <div className="ctrl" role="radiogroup" aria-label="选择潜变量分词器" onKeyDown={onKeyDown}>
      <button ref={fluxRef} type="button" role="radio" aria-checked={tokenizer === 'flux2'} tabIndex={tokenizer === 'flux2' ? 0 : -1} className={`chip ${tokenizer === 'flux2' ? 'active' : ''}`} onClick={() => choose('flux2')}>FLUX.2-VAE</button>
      <button ref={mageRef} type="button" role="radio" aria-checked={tokenizer === 'mage'} tabIndex={tokenizer === 'mage' ? 0 : -1} className={`chip ${tokenizer === 'mage' ? 'active' : ''}`} onClick={() => choose('mage')}>Mage-VAE</button>
    </div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} aria-label={`${m.label} 编码 ${m.enc}、解码 ${m.dec} kMACs 每像素`} />
    <div className="table-wrap"><table><caption>CLIC 2020 原生分辨率与每像素计算</caption><thead><tr><th scope="col">分词器</th><th scope="col">编码 kMACs/像素 ↓</th><th scope="col">解码 kMACs/像素 ↓</th><th scope="col">PSNR dB ↑</th><th scope="col">LPIPS ↓</th></tr></thead><tbody><tr className={tokenizer === 'flux2' ? 'active' : ''}><th scope="row">FLUX.2-VAE</th><td>2134</td><td>4798</td><td>36.88</td><td>0.0139</td></tr><tr className={tokenizer === 'mage' ? 'active' : ''}><th scope="row">Mage-VAE</th><td>173</td><td>215</td><td>36.61</td><td>0.0148</td></tr></tbody></table></div>
    <p className="module-note">重建：CLIC 2020 原生分辨率；计算：每像素 kMACs。PSNR 越高越好，LPIPS 越低越好，不同协议的数值不可混比。</p>
    <div className={`feedback ${tokenizer === 'mage' ? 'good' : 'bad'}`} aria-live="polite">{tokenizer === 'mage' ? 'Mage-VAE 以接近的 CLIC 重建质量换来约 12.3×/22.3× 编解码计算下降。' : '重型 VAE 重建略占优，但高分辨率编解码成本很高。'}</div>
    <p className="module-note">Mage-VAE 直接输出 16× 空间下采样、128 通道的潜变量；锚点潜变量兼容性只由论文报告的 FLUX.2-VAE 交换实验支持。</p>
  </div>;
};

export default VaeTokenizerLab;
