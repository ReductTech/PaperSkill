import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type StageId = 'base' | 'lightvae' | 'fp8' | 'mxfp4';

type DeploymentStage = {
  id: StageId;
  number: string;
  title: string;
  core: string;
  term: string;
  results: string[];
  explanation: string;
};

const stages: DeploymentStage[] = [
  {
    id: 'base',
    number: '①',
    title: '原始方案',
    core: '显存不够，跑不起来',
    term: 'Base',
    results: ['OOM'],
    explanation: '论文 Table 2 中，原始完整管线在单张 RTX 5090 上显存溢出，因此没有可报告的 FPS、显存或模块时延数值。',
  },
  {
    id: 'lightvae',
    number: '②',
    title: '第一次跑起来',
    core: '换轻量解码器',
    term: 'LightVAE',
    results: ['9.117 FPS', '20.491 GiB'],
    explanation: '关键转折：原始方案 OOM；换用轻量解码器后，系统第一次能够在单卡上运行。',
  },
  {
    id: 'fp8',
    number: '③',
    title: '更省显存、更快',
    core: '使用低精度计算',
    term: 'FP8',
    results: ['12.405 FPS', '15.925 GiB'],
    explanation: '进一步压低计算精度后，显存继续下降，同时吞吐提高。',
  },
  {
    id: 'mxfp4',
    number: '④',
    title: '接近实时',
    core: '更低比特运行配置',
    term: 'MXFP4',
    results: ['15.831 FPS', '≈ 16 FPS'],
    explanation: '更低比特运行配置将吞吐提高到 15.831 FPS，论文概括为约 16 FPS。',
  },
];

const tableRows = [
  { config: 'Base', dit: '—', vae: '—', fps: 'OOM', vram: 'OOM' },
  { config: '+ SageAttention2', dit: '—', vae: '—', fps: 'OOM', vram: 'OOM' },
  { config: '+ SageAttention2 + LightVAE', dit: '1191.081', vae: '78.276', fps: '9.117', vram: '20.491' },
  { config: '+ SageAttention2 + LightVAE + FP8', dit: '845.180', vae: '75.980', fps: '12.405', vram: '15.925' },
  { config: '+ SageAttention2 + LightVAE + FP8 + Fast-RoPE', dit: '786.871', vae: '71.730', fps: '13.269', vram: '19.281' },
  { config: '+ SageAttention2 + LightVAE + MXFP6 + Fast-RoPE', dit: '718.281', vae: '85.994', fps: '14.098', vram: '18.287' },
  { config: '+ SageAttention2 + LightVAE + MXFP4 + Fast-RoPE', dit: '638.843', vae: '72.957', fps: '15.831', vram: '17.148' },
];

export const DeploymentTradeoffs: React.FC<WidgetProps> = () => {
  const [activeId, setActiveId] = useState<StageId>('base');
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];

  return (
    <div className="chapter-nine-deployment" data-stage={active.id}>
      <div className="deploy9-context" aria-label="Table 2 实验条件">
        <strong>论文 Table 2 的统一条件</strong>
        <span>单张 NVIDIA RTX 5090</span>
        <span>1280×704</span>
        <span>批量大小 1</span>
        <span>块式流式推理</span>
      </div>

      <section className="deploy9-journey" aria-label="从显存溢出到接近十六帧的四级优化阶梯">
        <div className="deploy9-step-row" role="tablist" aria-label="四级优化阶梯">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              {index > 0 ? <span className="deploy9-step-arrow" aria-hidden="true">→</span> : null}
              <button
                type="button"
                role="tab"
                aria-selected={active.id === stage.id}
                className={`deploy9-step ${stage.id} ${active.id === stage.id ? 'active' : ''}`}
                onClick={() => setActiveId(stage.id)}
              >
                <span className="deploy9-step-title"><b>{stage.number}</b>{stage.title}</span>
                <strong>{stage.core}</strong>
                <div className="deploy9-step-results">
                  {stage.results.map((result) => <em key={result}>{result}</em>)}
                </div>
                <small>{stage.term}</small>
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className={`deploy9-one-explanation ${active.id}`} role="tabpanel" aria-live="polite">
          <b>{active.number}</b>
          <p>{active.explanation}</p>
        </div>
        <p className="deploy9-anchor-boundary">四级是整栈配置的教学锚点，不是四个彼此隔离的单项加速实验；完整配置以 Table 2 为准。</p>
      </section>

      <section className="deploy9-latency-cn" aria-label="按键到第一帧反馈的完整等待时间">
        <header>
          <div>
            <strong>按下按键后，多久看到第一帧？</strong>
            <span>从动作到第一帧反馈的完整链路</span>
          </div>
          <em>≈ 1.2 秒</em>
        </header>
        <div className="deploy9-latency-cn-flow">
          <span>按下按键</span><b>→</b>
          <span>模型生成下一段</span><b>→</b>
          <span>解码成画面</span><b>→</b>
          <span>看到第一帧反馈</span>
        </div>
        <p>这 1.2 秒表示从用户按键到看到第一帧反馈的完整等待时间，不是某一个模块单独的计算时间。</p>
        <small>论文术语：action-to-first-frame latency</small>
      </section>

      <details className="deep-reading deploy9-table-details">
        <summary>深入阅读：Table 2 完整配置</summary>
        <div className="table-scroll">
          <table className="paper">
            <thead>
              <tr><th>配置</th><th>DiT ms/chunk</th><th>VAE ms/chunk</th><th>FPS ↑</th><th>VRAM GiB ↓</th></tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.config}>
                  <td>{row.config}</td><td>{row.dit}</td><td>{row.vae}</td><td>{row.fps}</td><td>{row.vram}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="deploy9-table-note">同一协议：单张 RTX 5090、1280×704、batch size 1、块式流式推理；每个 chunk 含 3 个 latent frames，并生成 12 个解码视频帧。</p>
      </details>
    </div>
  );
};
