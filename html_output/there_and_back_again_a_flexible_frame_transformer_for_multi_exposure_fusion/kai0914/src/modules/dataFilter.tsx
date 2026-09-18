import { useState } from 'react';
const rows = [
  { name: 'FreeMEF', frames: 'SICE / 2 帧', psnr: '17.087', ssim: '0.731', lpips: '0.225' },
  { name: 'FreeMEF', frames: 'SICE / 3 帧', psnr: '19.326', ssim: '0.774', lpips: '0.199' },
  { name: 'FreeMEF', frames: 'SICE / 5 帧', psnr: '22.269', ssim: '0.851', lpips: '0.149' },
  { name: 'SCTNet', frames: 'SICE / 5 帧', psnr: '21.153', ssim: '0.842', lpips: '0.177' },
];
export function DataFilter() {
  const [filter, setFilter] = useState<'all' | 'sice'>('all');
  const filtered = filter === 'all' ? rows : rows.filter(r => r.frames.includes('SICE'));
  return (
    <div className="module">
      <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>全部</button>
      <button onClick={() => setFilter('sice')} className={filter === 'sice' ? 'active' : ''}>SICE</button>
      <table>
        <thead><tr><th>方法</th><th>数据/帧数</th><th>PSNR</th><th>SSIM</th><th>LPIPS</th></tr></thead>
        <tbody>{filtered.map(r => (
          <tr key={r.frames}><td>{r.name}</td><td>{r.frames}</td><td>{r.psnr}</td><td>{r.ssim}</td><td>{r.lpips}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}