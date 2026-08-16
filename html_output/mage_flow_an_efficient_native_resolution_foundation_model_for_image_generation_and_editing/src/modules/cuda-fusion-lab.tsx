import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const rows = [
  { label: 'FLUX.2-VAE 基线', fused: 0, time: '1.9285s', mfu: '13.88%', memory: '175.45GB' },
  { label: '替换 Mage-VAE', fused: 0, time: '1.3647s', mfu: '17.44%', memory: '175.47GB' },
  { label: '+ VAE Fuse', fused: 1, time: '1.3609s', mfu: '17.41%', memory: '175.47GB' },
  { label: '+ Text Fuse', fused: 2, time: '1.3258s', mfu: '17.88%', memory: '175.47GB' },
  { label: '+ NR-MMDiT Fuse', fused: 3, time: '0.7775s', mfu: '29.28%', memory: '141.44GB' },
] as const;

export function CudaFusionLab(_: WidgetProps) {
  const [level, setLevel] = useState(0);
  const row = rows[level];
  return (
    <div className="framework-lab">
      <div className="fusion-controls" role="group" aria-label="融合范围">
        {rows.map((item, index) => (
          <button className={`chip${level === index ? ' active' : ''}`} onClick={() => setLevel(index)} key={item.label}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="fusion-chain" aria-label="栈级融合示意">
        {['Mage-VAE', 'Qwen3-VL', 'NR-MMDiT'].map((item, index) => (
          <div className={index < row.fused ? 'is-fused' : ''} key={item}>
            <span>{item}</span><b>{index < row.fused ? '链内算子已融合' : '独立内核往返'}</b>
          </div>
        ))}
      </div>
      <div className="metric-strip">
        <span>每步时间 <b>{row.time}</b></span>
        <span>MFU <b>{row.mfu}</b></span>
        <span>峰值显存 <b>{row.memory}</b></span>
      </div>
      <div className={`feedback ${level === 4 ? 'good' : level === 0 ? 'bad' : ''}`}>
        {level === 4 ? '完整系统达到 0.7775 秒/步、29.28% MFU 和 141.44 GB/卡；这些是 8-GPU B200 训练协议下的结果。' : level === 1 ? '仅替换 Mage-VAE 已带来主要的前段收益；继续打开三个融合项可分辨各自贡献。' : '逐层打开融合，观察收益主要在反复执行的 4B NR-MMDiT 块中释放。'}
      </div>
    </div>
  );
}
