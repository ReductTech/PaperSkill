import { useState } from 'react';

const protocols = ['合成去噪', 'Kodak 去马赛克', '实拍 RAW'];
const denoisingMethods = ['GSM', 'FoE', 'K-SVD', 'BM3D', 'SC', 'LSC', 'LSSC'];
const denoisingScores = [
  { sigma: 5, psnr: [37.05, 37.03, 37.42, 37.62, 37.46, 37.66, 37.67] },
  { sigma: 10, psnr: [33.34, 33.11, 33.62, 34.00, 33.76, 33.98, 34.06] },
  { sigma: 15, psnr: [30.58, 30.99, 31.58, 32.05, 31.72, 31.99, 32.12] },
  { sigma: 20, psnr: [29.91, 29.62, 30.18, 30.73, 30.29, 30.60, 30.78] },
  { sigma: 25, psnr: [28.84, 28.36, 29.10, 29.72, 29.18, 29.52, 29.74] },
  { sigma: 50, psnr: [25.66, 24.36, 25.61, 26.38, 25.83, 26.18, 26.57] },
  { sigma: 100, psnr: [22.80, 21.36, 22.10, 23.25, 22.46, 22.62, 23.39] },
];
const demosaicingMethods = ['AP', 'DL', 'LPA', 'SC', 'LSC', 'LSSC'];
const demosaicingScores = [39.21, 40.05, 40.52, 40.88, 41.13, 41.39];

export function ResultsCompare() {
  const [protocol, select] = useState(0);
  const [noiseIndex, setNoiseIndex] = useState(4);
  const denoising = denoisingScores[noiseIndex];
  const psnr = protocol === 0 ? denoising.psnr : demosaicingScores;
  const methods = protocol === 0 ? denoisingMethods : demosaicingMethods;

  return (
    <div className="paper-experiment">
      <div className="chip-row" role="group" aria-label="原文实验类型">
        {protocols.map((name, index) => (
          <button key={name} className={'chip' + (index === protocol ? ' selected' : '')} type="button" aria-pressed={index === protocol} onClick={() => select(index)}>
            {name}
          </button>
        ))}
      </div>
      {protocol === 2 ? (
        <div className="paper-experiment-note">
          <p><strong>原文图 4 · 定性对照</strong></p>
          <p>同一台相机以 ISO 1600 拍摄三种短曝光场景。作者比较显影结果的纹理、伪色和残噪，并指出第三张的背景仍含部分噪声。此组没有可用于计算 PSNR 的无噪声真值。</p>
          <a className="paper-source" href="#real-raw">查看实拍原图与处理流程 →</a>
        </div>
      ) : (
        <>
          <div className="paper-experiment-note">
            {protocol === 0 ? (
              <p>原文表 2 · 十二张标准图的合成高斯白噪声去噪结果。调整 σ 可对照原文报告的七档噪声强度。</p>
            ) : (
              <p>原文表 3 · 对 24 张 Kodak 图像应用 Bayer 掩码，比较时裁去 15 像素边界。</p>
            )}
          </div>
          {protocol === 0 ? (
            <div className="paper-choice">
              <label htmlFor="paper-noise">噪声标准差 σ</label>
              <select id="paper-noise" value={noiseIndex} onChange={event => setNoiseIndex(Number(event.target.value))}>
                {denoisingScores.map(({ sigma }, index) => <option key={sigma} value={index}>{sigma}</option>)}
              </select>
            </div>
          ) : null}
          <table className="paper-metrics">
            <caption>平均 PSNR（dB，越高越好）</caption>
            <thead><tr><th scope="col">方法</th><th scope="col">PSNR</th></tr></thead>
            <tbody>
              {methods.map((name, index) => (
                <tr key={name} className={name === 'LSSC' ? 'paper-emphasis' : undefined}>
                  <th scope="row">{name}</th><td>{psnr[index].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="feedback" aria-live="polite">
            {protocol === 0
              ? `σ＝${denoising.sigma} 时，LSSC 与 BM3D 分别为 ${denoising.psnr[6].toFixed(2)} 与 ${denoising.psnr[3].toFixed(2)} dB。`
              : 'LSSC 比同表的 LPA 高 0.87 dB。这里衡量的是去马赛克后的重建质量。'}
          </p>
        </>
      )}
    </div>
  );
}
