import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C } from './seesr-cover';

type Key = 'bsrgan' | 'esrgan' | 'stablesr' | 'diffbir' | 'pasd' | 'seesr';

const POINTS: Array<{ key: Key; name: string; psnr: number; clip: number; note: string; tone: string }> = [
  { key: 'bsrgan', name: 'BSRGAN', psnr: 21.87, clip: 0.5183, note: 'BSRGAN 的 PSNR 21.87 更高，但 CLIPIQA 只有 0.5183。', tone: 'is-mid' },
  { key: 'esrgan', name: 'Real-ESRGAN', psnr: 21.94, clip: 0.5424, note: 'Real-ESRGAN 的 PSNR 最高（21.94），感知指标仍偏低。', tone: 'is-mid' },
  { key: 'stablesr', name: 'StableSR', psnr: 20.84, clip: 0.6486, note: 'StableSR 的 PSNR 最低（20.84），换来感知指标明显上升。', tone: 'is-mid' },
  { key: 'diffbir', name: 'DiffBIR', psnr: 20.94, clip: 0.6664, note: 'DiffBIR 与 PASD 在左上方：保真更低，感知更高。', tone: 'is-mid' },
  { key: 'pasd', name: 'PASD', psnr: 20.77, clip: 0.6799, note: 'PASD 的 PSNR 最低一档（20.77），CLIPIQA 接近 SeeSR。', tone: 'is-mid' },
  { key: 'seesr', name: 'SeeSR', psnr: 21.19, clip: 0.6946, note: 'SeeSR 的 CLIPIQA 最高（0.6946），但 PSNR 21.19 低于 GAN 类方法。', tone: 'is-good' },
];

const X_MIN = 20.5;
const X_MAX = 22.1;
const Y_MIN = 0.48;
const Y_MAX = 0.72;
const mapX = (v: number) => 96 + ((v - X_MIN) / (X_MAX - X_MIN)) * 844;
const mapY = (v: number) => 340 - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * 290;

/** S12 — the fidelity / perception trade-off and the applicability boundary. */
export function SeesrBoundary(_props: WidgetProps) {
  const [selected, setSelected] = useState<Key>('seesr');
  const current = POINTS.find((item) => item.key === selected)!;

  return (
    <div className="seesr-scene">
      <div className="seesr-inset" style={{ left: 0, top: 0, width: 980, height: 470 }}>
        <div className="seesr-chartpanel-title">DIV2K-Val：PSNR（→ 保真）与 CLIPIQA（↑ 感知）</div>
        <svg viewBox="0 0 980 430" style={{ width: 944, height: 400 }} role="img"
          aria-label="PSNR 与 CLIPIQA 的散点图：GAN 类方法保真高感知低，扩散类方法相反">
          <line x1="96" y1="340" x2="940" y2="340" stroke={C.line} strokeWidth="2" />
          <line x1="96" y1="50" x2="96" y2="340" stroke={C.line} strokeWidth="2" />
          {[20.6, 21.2, 21.8].map((tick) => (
            <g key={tick}>
              <line x1={mapX(tick)} y1="340" x2={mapX(tick)} y2="348" stroke={C.line} strokeWidth="2" />
              <text x={mapX(tick)} y="378" textAnchor="middle" fill={C.muted} fontSize="24">{tick.toFixed(1)}</text>
            </g>
          ))}
          {[0.5, 0.6, 0.7].map((tick) => (
            <g key={tick}>
              <line x1="88" y1={mapY(tick)} x2="96" y2={mapY(tick)} stroke={C.line} strokeWidth="2" />
              <text x="82" y={mapY(tick) + 9} textAnchor="end" fill={C.muted} fontSize="24">{tick.toFixed(2)}</text>
            </g>
          ))}
          <text x="940" y="412" textAnchor="end" fill={C.muted} fontSize="24">PSNR (dB) ↑</text>
          <text x="26" y="40" fill={C.muted} fontSize="24">CLIPIQA ↑</text>
          {POINTS.map((point) => {
            const isSee = point.key === 'seesr';
            const active = selected === point.key;
            return (
              <g key={point.key} role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                onClick={() => setSelected(point.key)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(point.key); } }}>
                <circle cx={mapX(point.psnr)} cy={mapY(point.clip)} r={isSee ? 14 : 10}
                  fill={isSee ? C.green : active ? C.orange : '#ffffff'}
                  stroke={isSee ? C.green : active ? C.orange : C.muted} strokeWidth="3" />
                <text x={mapX(point.psnr) > 790 ? mapX(point.psnr) - 18 : mapX(point.psnr) + 18} y={mapY(point.clip) + 9}
                  textAnchor={mapX(point.psnr) > 790 ? 'end' : 'start'}
                  fill={active || isSee ? C.ink : C.muted} fontSize="24" fontWeight={isSee ? 700 : 400}>{point.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 0, top: 456, width: 980, height: 166 }}>
        <p className={`seesr-feedback ${current.tone}`} aria-live="polite">{current.note}</p>
        <p className="seesr-muted">同一协议（DIV2K-Val）内比较；只标出 6 个代表方法，其余见论文表 2。</p>
      </div>

      <div className="seesr-panel" style={{ left: 996, top: 0, width: 476, height: 392 }}>
        <div className="seesr-h">什么时候值得用</div>
        <p className="seesr-lead">语义错不起、又能接受保真指标下降时——真实退化照片、需要认出物体的下游任务。</p>
        <p className="seesr-muted">重退化仍可能鉴定错；小尺度文字难重建；推理需 50 步扩散采样（论文设置），比单步 GAN 慢。</p>
        <p className="seesr-muted">代价：PSNR/SSIM 通常不如 GAN 类。</p>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 996, top: 408, width: 476, height: 214 }}>
        <div className="seesr-h">验收要看什么</div>
        <p className="seesr-lead">先看物体有没有被换掉，再看纹理像不像。</p>
      </div>
    </div>
  );
}
