import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const SCRATCH_MODELS = [
  { name: 'JiT-H/16', fid: 1.86, display: '1.86*' },
  { name: 'PixelREPA-H/16', fid: 1.81, display: '1.81*' },
  { name: 'AsymFlow-H/16', fid: 1.57, display: '1.57' },
] as const;

const T2I_MODELS = [
  { name: 'FLUX.2 klein Base', family: 'Latent', hps: '9.50', dpg: '85.2', geneval: '0.80' },
  { name: 'PixelDiT-T2I', family: 'Pixel', hps: '8.95', dpg: '83.5', geneval: '0.74' },
  { name: 'AsymFLUX.2 klein', family: 'Pixel', hps: '10.66', dpg: '86.8', geneval: '0.82' },
] as const;

const FILM_MODELS = [
  { key: 'qwen', label: 'Qwen Image', family: 'Latent' },
  { key: 'flux', label: 'FLUX.2 klein Base', family: 'Latent' },
  { key: 'pixeld', label: 'PixelDiT-T2I', family: 'Pixel' },
  { key: 'asym', label: 'AsymFLUX.2 klein', family: 'Pixel' },
] as const;

// Source: AsymFlow paper Fig. 7, page 8. Each prompt column keeps the paper's row order.
const PROMPTS = [
  { key: 'portrait', label: '人物风格' },
  { key: 'hazmat', label: '防护服写实' },
] as const;

const fidPosition = (fid: number) => `${((fid - 1.5) / 0.4) * 100}%`;

export const FinalPerformanceEvidence: React.FC<WidgetProps> = () => {
  const [scratchFocus, setScratchFocus] = useState(2);
  const [t2iFocus, setT2iFocus] = useState(2);
  const [prompt, setPrompt] = useState<'portrait' | 'hazmat'>('portrait');

  return (
    <div className="af-mechanism-block af-final-evidence">
      <div className="af-final-result-grid">
        <section className="af-result-panel scratch">
          <header><div><h3>From Scratch · ImageNet</h3></div><small>Table 2</small></header>
          <div className="af-fid-axis" aria-hidden="true"><span>1.5</span><span>FID ↓</span><span>1.9</span></div>
          <div className="af-fid-lanes" aria-label="ImageNet FID comparison">
            {SCRATCH_MODELS.map((model, index) => (
              <div
                key={model.name}
                className={`${index === scratchFocus ? 'active' : ''} ${index === 2 ? 'asymflow' : ''}`}
                tabIndex={0}
                onMouseEnter={() => setScratchFocus(index)}
                onFocus={() => setScratchFocus(index)}
              >
                <span>{model.name}</span>
                <i><b style={{ left: fidPosition(model.fid) }} /></i>
                <strong>{model.display}</strong>
              </div>
            ))}
          </div>
          <p>AsymFlow-H/16 · r=8 + standard REPA</p>
          <small className="af-protocol-note">* JiT protocol；与 ADM 最多相差 0.08 FID。</small>
        </section>

        <section className="af-result-panel transfer">
          <header><div><h3>Latent-to-Pixel · Text-to-Image</h3></div><small>Table 4</small></header>
          <div className="af-system-metrics" role="table" aria-label="Text-to-image system metrics">
            <div className="head" role="row"><span>Model</span><b>HPSv3↑</b><b>DPG↑</b><b>GenEval↑</b></div>
            {T2I_MODELS.map((model, index) => (
              <div
                key={model.name}
                className={`${index === t2iFocus ? 'active' : ''} ${index === 2 ? 'asymflow' : ''}`}
                role="row"
                tabIndex={0}
                onMouseEnter={() => setT2iFocus(index)}
                onFocus={() => setT2iFocus(index)}
              >
                <span><strong>{model.name}</strong></span>
                <b>{model.hps}</b><b>{model.dpg}</b><b>{model.geneval}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="af-qualitative-filmstrip">
        <header><div><h3>定性结果</h3></div><small>Fig. 7</small></header>
        <div className="af-prompt-focus" role="group" aria-label="Qualitative prompt focus">
          {PROMPTS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={prompt === item.key ? 'active' : ''}
              onMouseEnter={() => setPrompt(item.key)}
              onFocus={() => setPrompt(item.key)}
              onClick={() => setPrompt(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="af-filmstrip-track" aria-live="polite">
          {FILM_MODELS.map((model) => (
            <figure key={`${prompt}-${model.key}`} className={model.key === 'asym' ? 'active' : ''}>
              {/* Source: AsymFlow paper Fig. 7, page 8. */}
              <img src={`/images/experiments/fig7-${prompt}-${model.key}.png`} alt={`${PROMPTS.find((item) => item.key === prompt)?.label}: ${model.label}`} />
              <figcaption><b>{model.label}</b></figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
};
