import { useState } from 'react';
const stats: Record<string, { label: string; psnr: string; ssim: string; lpips: string }> = {
  I: { label: '暗→亮', psnr: '22.269', ssim: '0.851', lpips: '0.149' },
  II: { label: '亮→暗', psnr: '21.463', ssim: '0.836', lpips: '0.163' },
  III: { label: '相近→跨度大', psnr: '22.152', ssim: '0.848', lpips: '0.152' },
  IV: { label: '跨度大→相近', psnr: '22.181', ssim: '0.849', lpips: '0.151' },
};
export function FusionOrderPicker() {
  const [order, setOrder] = useState<'I' | 'II' | 'III' | 'IV'>('I');
  const s = stats[order];
  return (
    <div className="module">
      <div>{(['I', 'II', 'III', 'IV'] as const).map(o => (
        <button key={o} onClick={() => setOrder(o)} className={order === o ? 'active' : ''}>方案 {o}</button>
      ))}</div>
      <p>{s.label}：PSNR {s.psnr} / SSIM {s.ssim} / LPIPS {s.lpips}</p>
    </div>
  );
}