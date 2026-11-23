import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const interp = (t: number, a: number, b: number, c: number) => t <= 400
  ? a + (b - a) * (t - 200) / 200
  : b + (c - b) * (t - 400) / 200;

export function TadsrTae(_: WidgetProps) {
  const [ts, setTs] = useState(400);
  const [mode, setMode] = useState<'vae' | 'tae'>('tae');
  const tae = mode === 'tae';
  const measured = ts === 200 || ts === 400 || ts === 600;
  const mean = tae ? interp(ts, 0.369, 0.281, 0.153) : 0.369;
  const std = tae ? interp(ts, 0.554, 0.425, 0.243) : 0.554;
  const cells = Array.from({ length: 36 }, (_, k) => {
    const row = Math.floor(k / 6);
    const col = k % 6;
    const wave = 0.5 + 0.5 * Math.sin((col + 1) * 1.3 + (row + 1) * 0.8 + ts / 95);
    const v = tae ? Math.max(0.08, Math.min(1, wave * (1 - mean * 0.6) + (1 - mean) * 0.25)) : 0.48;
    const hue = tae ? 258 + (ts - 200) * 0.09 : 258;
    return { color: `hsl(${hue} 48% ${Math.round(70 - v * 34)}%)`, dx: tae ? Math.round((ts - 200) / 80) : 0, v };
  });
  const feedback = !tae
    ? '普通 VAE：换档位，工作底稿不变，UNet 只能靠时间嵌入猜。'
    : ts < 330
      ? '底稿均值/方差较大，保留更多图像信息。'
      : ts < 520
        ? '底稿整体收紧：同一张图被写成更偏向生成的表示。'
        : '底稿更收紧，语义先验更强；但不等于修复结果一定更好。';

  return (
    <div className="studio-page tadsr-tae">
      <div className="studio-frame tadsr-tae-scene">
        <div className="tadsr-tae-sheet" aria-label="示意性 latent 工作底稿">
          <img className="tadsr-tae-photo" src={`./images/face-${ts < 350 ? 2 : ts < 550 ? 4 : 5}.png`} alt="" />
          <div className="tadsr-tae-grid">
            {cells.map((c, k) => <span key={k} style={{ background: c.color }} />)}
          </div>
        </div>
        <div className="studio-lamp" style={{ right: 24, top: 20, width: 90, height: 165 }}>
          <svg viewBox="0 0 90 150"><path d="M62 12 L22 68 H44 L32 138" fill="none" stroke="#7c5636" strokeWidth="7" strokeLinecap="round"/><path d="M10 62 Q42 38 78 62 L68 78 Q40 60 18 78 Z" fill="#f6d38b" stroke="#b98a5a" strokeWidth="3"/></svg>
        </div>
        <p className="studio-caption" style={{ position: 'absolute', left: 54, bottom: 36, right: 30 }}>6×6 格子是示意；Fig.3 的 PCA 才是测量结果。</p>
      </div>

      <div className="tadsr-tae-side">
        <div className="studio-row" style={{ justifyContent: 'flex-end' }}>
          <button className={`studio-btn ${!tae ? 'is-on' : ''}`} onClick={() => setMode('vae')}>普通 VAE</button>
          <button className={`studio-btn ${tae ? 'is-on' : ''}`} onClick={() => setMode('tae')}>TAE</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 10, minHeight: 0 }}>
          <img className="tadsr-tae-fig" src="./images/fig3_pca.png" alt="论文 Fig.3：TAE 在不同时间步的 latent PCA 与均值、标准差" style={{ height: 230 }} />
          <div className="tadsr-tae-read" style={{ gridTemplateColumns: '1fr', alignContent: 'center' }}>
            <div><span>{tae ? (measured ? 'mean（论文点）' : 'mean（插值）') : 'mean（固定）'}</span><b style={{ fontSize: tae ? undefined : 28 }}>{tae ? mean.toFixed(3) : '不随 t 变'}</b></div>
            <div><span>{tae ? (measured ? 'std（论文点）' : 'std（插值）') : 'std（固定）'}</span><b style={{ fontSize: tae ? undefined : 28 }}>{tae ? std.toFixed(3) : '不随 t 变'}</b></div>
          </div>
        </div>
        <label className="studio-slider">
          <span>学生档位 tₛ</span><b>{ts}</b>
          <input type="range" min={200} max={600} step={10} value={ts} aria-label="学生档位"
            onChange={e => setTs(Number(e.target.value))} />
        </label>
        <p className="studio-eq"><SymbolHint meaning="TAE 的输出：同一张 LQ 图在档位 ts 下编码成的 latent。">z<sub>L</sub></SymbolHint> = <SymbolHint meaning="时间感知 VAE 编码器，含时间嵌入层。">E<sub>θ</sub></SymbolHint>(<SymbolHint meaning="低质输入照片。">x<sub>L</sub></SymbolHint>, <SymbolHint meaning="学生端时间步/补全档位。">t<sub>s</sub></SymbolHint>)</p>
        <p className="studio-feedback is-paper">{feedback}</p>
      </div>
    </div>
  );
}
