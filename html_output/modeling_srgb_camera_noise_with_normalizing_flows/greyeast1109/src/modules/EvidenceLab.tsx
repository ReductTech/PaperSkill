import { useState } from 'react';
import { densityRows, denoiseRows, paperUrl, photoUrl, projectUrl } from '../data/study';
import type { PhotoKind } from '../data/study';
import { GaussianSampleEquation, InverseEquation, SynthesisEquation } from './MathExpression';
import { PhotoWipe, ScenePicker } from './PhotoLab';
import type { PhotoState } from './PhotoLab';
import { PaperFigure, Readout, SourceLink, StudySection, StudyTable, Switcher } from './StudyUI';

const metrics = [{ value: 'nll', label: 'NLL · 密度拟合' }, { value: 'kl', label: '边际 KL · 样本分布' }] as const;

export function ResultsLab() {
  const [metric, setMetric] = useState<'nll' | 'kl'>('nll');
  const ranking = [...densityRows].sort((a, b) => a[metric] - b[metric]);
  const maximum = Math.max(...densityRows.map(row => row[metric]));
  const before = densityRows.find(row => row.name === 'Noise Flow')!;
  const after = densityRows.find(row => row.name === 'Noise Flow-Large')!;
  const number = (value: number) => value.toFixed(3);
  return <>
    <ol className="sampling-steps" aria-label="固定干净图、相机和 ISO 后的生成流程">
      <li><small>从标准高斯抽样</small><strong><GaussianSampleEquation /></strong></li>
      <li><small>反向变换</small><strong><InverseEquation /></strong></li>
      <li><small>合成带噪图</small><strong><SynthesisEquation /></strong></li>
    </ol>
    <div className="lab-panel">
      <div className="control-line"><Switcher label="切换噪声模型评价指标" value={metric} options={metrics} onChange={setMetric} />
        <span className="lab-kicker">越低越好 · 原文表 1</span></div>
      <div className="metric-spotlight" aria-live="polite">
        <div><span className="lab-kicker">Noise Flow → Large</span><strong>{number(before[metric])} <span aria-hidden="true">→</span> {number(after[metric])}</strong></div>
        <p>{metric === 'nll' ? '增加参数后，NLL 从 3.311 降到 3.288，真实残差的平均密度评分更好。切换到 KL 看采样效果。' :
          '换成边际 KL，增加参数后的数值从 0.198 升到 0.227，采样直方图离真实噪声更远。'}</p>
      </div>
      <ol className="ranking" aria-label={metric === 'nll' ? '按 NLL 从低到高排序' : '按边际 KL 从低到高排序'}>
        {ranking.map((row, index) => <li key={row.name} data-paper={row.name === '本文模型'} data-baseline={row.name.startsWith('Noise Flow')}>
          <span className="rank-index">{String(index + 1).padStart(2, '0')}</span><span className="rank-name">{row.name}</span>
          <span className="rank-track" aria-hidden="true"><span style={{ width: `${row[metric] / maximum * 100}%` }} /></span>
          <strong>{number(row[metric])}</strong>
        </li>)}
      </ol>
      <p className="evidence-note">{metric === 'nll' ? 'NLL 为测试集每维负对数似然。' : '边际 KL 比较真实与合成残差的直方图，数值受分箱设置影响。'} 条形从零起算，按本指标的最大值缩放。</p>
    </div>
    <StudySection title="完整结果与噪声方差证据">
      <StudyTable columns={['模型', 'NLL ↓', '边际 KL ↓', '参数量']} rows={densityRows.map(row => [row.name, number(row.nll), number(row.kl), String(row.params)])} />
      <PaperFigure number={7} alt="原文图 7，iPhone 7、ISO 100 的红通道噪声方差对照" />
      <p>图 7 中，iPhone 7、ISO 100 的红色通道存在明显的非线性趋势。Noise Flow 在许多亮度区间高估了方差，本文模型更接近实测曲线。</p>
      <SourceLink page={6}>原文表 1、图 7</SourceLink>
    </StudySection>
    <StudySection title="论文模型生成的噪声（图 8）">
      <p>在相同的干净图和拍摄条件下比较不同模型的生成结果。图中从左到右依次是全协方差高斯、Noise Flow、本文模型、真实带噪图和干净图。</p>
      <PaperFigure number={8} alt="原文图 8，四种 ISO 下的全协方差高斯、Noise Flow、本文合成、真实噪声与干净图像" />
      <SourceLink page={7}>原文图 8</SourceLink>
    </StudySection>
  </>;
}

type DenoiseKind = Exclude<PhotoKind, 'clean' | 'noisy'>;
const denoiseModes = [
  { value: 'paper', label: '本文合成' }, { value: 'real', label: '真实噪声训练' },
  { value: 'noise-flow', label: 'Noise Flow' }, { value: 'gaussian', label: '全协方差高斯' },
] as const;

export function DenoiseLab({ scene, point, onScene }: PhotoState) {
  const [mode, setMode] = useState<DenoiseKind>('paper');
  const label = denoiseModes.find(item => item.value === mode)!.label;
  return <>
    <div className="lab-panel">
      <div className="control-line"><Switcher label="选择 DnCNN 的训练噪声来源" value={mode} options={denoiseModes} onChange={setMode} />
        <ScenePicker scene={scene} onScene={onScene} /></div>
      <div className="denoise-layout">
        <div><PhotoWipe left={photoUrl(scene, 'noisy')} right={photoUrl(scene, mode)} leftLabel="带噪输入" rightLabel={label} point={point} />
          <p className="evidence-note">SIDD-Validation · 原文图 10 第 {scene.row} 行。十字沿用先前选中的像素。</p></div>
        <div className="denoise-info">
          <span className="lab-kicker">SIDD-Benchmark · 表 3</span>
          <div className="readout-grid triple benchmark">
            <Readout label="Noise Flow 合成" value="33.81 dB" />
            <Readout label="本文合成" value="34.74 dB" tone="mint" />
            <Readout label="真实噪声训练" value="36.51 dB" />
          </div>
          <p className="lab-note">同样是 DnCNN，本文合成训练比 Noise Flow 高 <b>0.93 dB</b>，与真实噪声训练仍相差 <b>1.77 dB</b>。</p>
          <p className="evidence-note">拖动照片分割线比较局部去噪效果。右侧分数是测试集汇总，照片来自验证集。</p>
        </div>
      </div>
    </div>
    <StudySection title="完整去噪结果和实验边界">
      <StudyTable columns={['DnCNN 训练噪声来源', 'PSNR ↑（dB）', 'SSIM ↑']} rows={denoiseRows} />
      <p>DnCNN 使用 SIDD-Medium 训练、SIDD-Validation 验证，并在 SIDD-Benchmark 上测试。论文中的 sRGB 样本由软件 ISP 渲染，ISO 3200 样本较少且出现过拟合。对未见相机或其他 ISP 的效果需要另行验证。</p>
      <SourceLink page={8}>原文表 3、图 10</SourceLink>
    </StudySection>
    <StudySection title="术语与延伸阅读">
      <dl className="study-glossary"><dt>ISP</dt><dd>图像信号处理器，把传感器 RAW 数据处理为可显示的照片。</dd>
        <dt>归一化流</dt><dd>通过可逆变换在复杂数据分布与简单基分布之间转换。</dd>
        <dt>边际 KL</dt><dd>这里比较真实和合成噪声的直方图。</dd></dl>
      <div className="resource-links">
        <a href={paperUrl} target="_blank" rel="noreferrer">CVPR 2022 原文 ↗</a>
        <a href={projectUrl} target="_blank" rel="noreferrer">作者项目页 ↗</a>
        <a href="https://www.bilibili.com/video/BV1dS4y1c7xB/" target="_blank" rel="noreferrer">归一化流与 Glow 讲解 ↗</a>
        <a href="https://www.bilibili.com/video/BV1T24y1t7Ro/" target="_blank" rel="noreferrer">归一化流入门视频 ↗</a>
      </div>
    </StudySection>
  </>;
}
