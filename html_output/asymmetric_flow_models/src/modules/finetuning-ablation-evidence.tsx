import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

type Stage = {
  short: string;
  label: string;
  hps: number;
  pfid: number;
  asset: 'ddt' | 'standard' | 'vr' | 'lpips' | null;
  evidence: string;
  hpsDelta: string;
  pfidDelta: string;
  pfidState: 'neutral' | 'better' | 'worse';
};

const STAGES: Stage[] = [
  {
    short: 'Latent',
    label: 'Latent Finetune',
    hps: 10.70,
    pfid: 18.8,
    asset: null,
    evidence: 'Fig. 8 无该阶段图像。',
    hpsDelta: 'controlled reference',
    pfidDelta: 'controlled reference',
    pfidState: 'neutral',
  },
  {
    short: 'DDT',
    label: 'DDT Pixel Finetune',
    hps: 10.33,
    pfid: 26.0,
    asset: 'ddt',
    evidence: 'DDT baseline 的局部细节较模糊，并出现轻微 patch seams。',
    hpsDelta: '−0.37 vs latent',
    pfidDelta: '+7.2 · worse',
    pfidState: 'worse',
  },
  {
    short: 'AsymFlow',
    label: 'AsymFlow · Standard FM',
    hps: 12.03,
    pfid: 25.4,
    asset: 'standard',
    evidence: '细节更清晰。',
    hpsDelta: '+1.33 vs latent',
    pfidDelta: '25.4 · lower is better',
    pfidState: 'neutral',
  },
  {
    short: '+ VR',
    label: '+ Variance Reduction',
    hps: 12.99,
    pfid: 27.8,
    asset: 'vr',
    evidence: 'texture / detail 增强，但 excessive noise 增加。',
    hpsDelta: '+0.96 vs standard',
    pfidDelta: '+2.4 · worse',
    pfidState: 'worse',
  },
  {
    short: '+ LPIPS',
    label: '+ LPIPS',
    hps: 13.06,
    pfid: 22.5,
    asset: 'lpips',
    evidence: 'Perceptual Correction 抑制 noise artifact，同时保留 sharpness。',
    hpsDelta: '+0.07 vs VR',
    pfidDelta: '−5.3 · corrected',
    pfidState: 'better',
  },
];

const FULL_METRICS = [
  ['FLUX.2 klein Base + latent finetune', '10.70', '0.290', '0.936', '0.276', '15.0', '18.8'],
  ['FLUX.2 klein Base + DDT finetune', '10.33', '0.291', '0.922', '0.273', '20.4', '26.0'],
  ['AsymFLUX.2 klein · standard FM', '12.03', '0.293', '0.922', '0.277', '20.2', '25.4'],
  ['+ Variance Reduction', '12.99', '0.296', '0.925', '0.280', '18.5', '27.8'],
  ['+ Perceptual Correction', '13.06', '0.297', '0.925', '0.278', '19.1', '22.5'],
] as const;

// Source: AsymFlow paper Fig. 8, page 9. The four crops follow the paper's stage order.

export const FinetuningAblationEvidence: React.FC<WidgetProps> = () => {
  const [activeIndex, setActiveIndex] = useState(2);
  const [dragging, setDragging] = useState(false);
  const active = STAGES[activeIndex];

  const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const horizontal = rect.width > rect.height * 1.35;
    const ratio = Math.min(1, Math.max(0, horizontal
      ? (event.clientX - rect.left) / rect.width
      : (event.clientY - rect.top) / rect.height));
    setActiveIndex(Math.round(ratio * (STAGES.length - 1)));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    setActiveIndex((current) => Math.min(STAGES.length - 1, Math.max(0, current + direction)));
  };

  return (
    <div className="af-mechanism-block af-ablation-evidence">
      <InteractiveActivity
        className="af-evidence-activity"
        instruction="在阶段轨道上点击或拖动，比较指标与同一区域的局部图像。"
      >
        <div className="af-stage-workspace">
          <div
            className="af-stage-rail"
            role="slider"
            tabIndex={0}
            aria-label="Finetuning stage progression"
            aria-valuemin={0}
            aria-valuemax={STAGES.length - 1}
            aria-valuenow={activeIndex}
            aria-valuetext={active.label}
            style={{ '--stage': `${(activeIndex / (STAGES.length - 1)) * 100}%` } as React.CSSProperties}
            onKeyDown={onKeyDown}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              updateFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (dragging) updateFromPointer(event);
            }}
            onPointerUp={(event) => {
              setDragging(false);
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
          >
            <span className="rail-line"><i /></span>
            {STAGES.map((stage, index) => (
              <div
                key={stage.label}
                className={index === activeIndex ? 'active' : index < activeIndex ? 'passed' : ''}
                style={{ '--position': `${(index / (STAGES.length - 1)) * 100}%` } as React.CSSProperties}
              >
                <i /><span>{stage.short}</span>
              </div>
            ))}
          </div>

          <section className="af-stage-evidence-panel" aria-live="polite">
            <header><div><h3>{active.label}</h3></div><small>Table 3 · Fig. 8</small></header>
            <div className="af-primary-metrics">
              <div>
                <span>HPSv3 ↑</span>
                <strong>{active.hps.toFixed(2)}</strong>
              </div>
              <div className={`pfid ${active.pfidState}`}>
                <span>pFID ↓</span>
                <strong>{active.pfid.toFixed(1)}</strong>
              </div>
            </div>
            <div className={`af-qualitative-scrub ${active.asset ? '' : 'is-placeholder'}`}>
              {active.asset ? (
                <img
                  key={active.asset}
                  src={`/images/experiments/fig8-eyes-${active.asset}.png`}
                  alt={`Figure 8 crop: ${active.label}`}
                />
              ) : (
                <div><span>Fig. 8 无该阶段图像</span></div>
              )}
              {active.asset ? <footer><span>局部细节</span><b>{active.short}</b></footer> : null}
            </div>
          </section>
        </div>
      </InteractiveActivity>

      <details className="af-full-metrics-details">
        <summary>查看完整指标 <span>Table 3 · COCO-10K</span></summary>
        <div className="af-full-metrics-table-wrap">
          <table>
            <thead><tr><th>Method</th><th>HPSv3↑</th><th>HPSv2.1↑</th><th>VQA↑</th><th>CLIP↑</th><th>FID↓</th><th>pFID↓</th></tr></thead>
            <tbody>
              {FULL_METRICS.map((row) => (
                <tr key={row[0]}>
                  <th scope="row">{row[0]}</th>
                  {row.slice(1).map((value, index) => <td key={`${row[0]}-${index}`} data-label={['HPSv3↑', 'HPSv2.1↑', 'VQA↑', 'CLIP↑', 'FID↓', 'pFID↓'][index]}>{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
