import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Icon } from './Icon'

type PipelineMode = 'inference' | 'training'

const defaultPrompt = 'Language generation has traditionally been dominated by'
const englishSuffixes = [
  'the autoregressive paradigm, while visual generation has converged toward continuous diffusion modeling.',
  'sequential decoding, while continuous latent diffusion offers a parallel generation path.',
  'token-by-token prediction, while TextLDM explores denoising in a learned latent space.',
]
const chineseSuffixes = [
  '自回归范式，而视觉生成逐渐收敛到连续扩散建模。',
  '逐 token 解码范式，而连续潜扩散提供了并行生成路径。',
  '顺序预测范式，而 TextLDM 在连续潜空间中执行去噪。',
]

const tokenize = (text: string) => {
  const matches = text.match(/[\u3400-\u9fff]|[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|[^\s]/g) ?? []
  return matches.slice(0, 12)
}

const hashToken = (token: string, salt = 0) => {
  let hash = 2166136261 + salt
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function TextLDMPipeline() {
  const [mode, setMode] = useState<PipelineMode>('inference')
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [time, setTime] = useState(1)
  const [isAutoDenoising, setIsAutoDenoising] = useState(false)
  const [trainingRun, setTrainingRun] = useState(0)
  const [trainingStage, setTrainingStage] = useState<'vae' | 'dit'>('vae')

  const tokens = useMemo(() => tokenize(prompt || '<empty prompt>'), [prompt])
  const tokenBlocks = useMemo(
    () => tokens.map((token) => {
      const hash = hashToken(token)
      return {
        token,
        latentHue: hash % 360,
        noiseHue: (hash * 7 + 41) % 360,
        height: 58 + ((hash >> 3) % 26),
      }
    }),
    [tokens],
  )

  const decodedSuffix = useMemo(() => {
    const hash = hashToken(prompt || defaultPrompt, 17)
    const isChinese = /[\u3400-\u9fff]/.test(prompt)
    const list = isChinese ? chineseSuffixes : englishSuffixes
    return list[hash % list.length]
  }, [prompt])

  const flowProgress = Math.round((1 - time) * 100)
  const decoded = time <= 0.02

  useEffect(() => {
    if (!isAutoDenoising) return undefined
    const start = performance.now()
    const duration = 3000
    const timer = window.setInterval(() => {
      const next = clamp(1 - (performance.now() - start) / duration, 0, 1)
      setTime(next)
      if (next <= 0.001) {
        setTime(0)
        setIsAutoDenoising(false)
      }
    }, 45)
    return () => window.clearInterval(timer)
  }, [isAutoDenoising])

  const startAutoDenoising = () => {
    setTime(1)
    setIsAutoDenoising(true)
  }

  const setModeAndReset = (nextMode: PipelineMode) => {
    setMode(nextMode)
    setIsAutoDenoising(false)
    if (nextMode === 'inference') setTime(1)
  }

  return (
    <div className="pipeline-shell">
      <div className="pipeline-head">
        <div>
          <p className="eyebrow">Token → latent → flow → text</p>
          <h3>{mode === 'inference' ? 'TextLDM 推理流水线' : 'TextLDM 训练流水线'}</h3>
          <p>
            色块矩阵仅用于可视化 token 对应的连续 latent。本地页面不运行真实 TextVAE 或 TextDiT；
            推理输出由提示词与固定示意模板合成，用于解释流水线而不是评价生成质量。
          </p>
        </div>
        <div className="pipeline-mode-switch" role="tablist" aria-label="流水线模式">
          <button aria-selected={mode === 'training'} className={mode === 'training' ? 'is-active' : ''} onClick={() => setModeAndReset('training')} role="tab" type="button">训练模式</button>
          <button aria-selected={mode === 'inference'} className={mode === 'inference' ? 'is-active' : ''} onClick={() => setModeAndReset('inference')} role="tab" type="button">推理模式</button>
        </div>
      </div>

      <div className="pipeline-prompt">
        <label htmlFor="pipeline-prompt-input"><Icon name="layers" size={15} />输入 tokens / prompt</label>
        <textarea
          id="pipeline-prompt-input"
          rows={2}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="输入一段提示词，观察它如何进入连续潜空间"
        />
        <div className="pipeline-token-preview">
          {tokenBlocks.length ? tokenBlocks.map((block, index) => (
            <span key={`${block.token}-${index}`}>
              <i style={{ background: `hsl(${block.latentHue} 72% 58%)` }} />
              {block.token}
            </span>
          )) : <em>等待输入</em>}
        </div>
      </div>

      {mode === 'inference' ? (
        <div className="inference-pipeline">
          <div className="pipeline-stage-axis">
            <span className="is-complete"><b>01</b>Encode</span><i />
            <span className={time === 1 ? 'is-active' : 'is-complete'}><b>02</b>Noise</span><i />
            <span className={time < 1 && !decoded ? 'is-active' : decoded ? 'is-complete' : ''}><b>03</b>Flow Matching</span><i />
            <span className={decoded ? 'is-active' : ''}><b>04</b>Parallel decode</span>
          </div>

          <div className="pipeline-board">
            <section className="pipeline-node pipeline-node--input">
              <div className="pipeline-node__label"><span>Input</span><strong>Discrete tokens</strong></div>
              <div className="token-stack">
                {tokenBlocks.slice(0, 8).map((block, index) => <span key={`${block.token}-input-${index}`}>{block.token}</span>)}
              </div>
            </section>

            <div className="pipeline-connector"><Icon name="arrow" size={18} /></div>

            <section className="pipeline-node pipeline-node--vae">
              <div className="pipeline-node__label"><span>TextVAE Encoder</span><strong>Token → latent</strong></div>
              <div className="latent-matrix">
                {tokenBlocks.map((block, index) => (
                  <span key={`${block.token}-latent-${index}`} style={{ '--block-hue': block.latentHue, height: `${block.height}px` } as CSSProperties}>
                    <i />{index + 1}
                  </span>
                ))}
              </div>
              <small>one-to-one continuous latent zᵢ</small>
            </section>

            <div className="pipeline-connector"><Icon name="arrow" size={18} /></div>

            <section className="pipeline-node pipeline-node--dit">
              <div className="pipeline-node__label"><span>TextDiT · Flow Matching</span><strong>t = {time.toFixed(2)}</strong></div>
              <div className="denoising-matrix">
                {tokenBlocks.map((block, index) => (
                  <span
                    key={`${block.token}-denoise-${index}`}
                    style={{
                      '--latent-color': `hsl(${block.latentHue} 72% 58%)`,
                      '--noise-color': `hsl(${block.noiseHue} 48% 34%)`,
                      '--time': time,
                    } as CSSProperties}
                  >
                    <i />
                  </span>
                ))}
              </div>
              <small>t=1 高斯噪声 → t=0 收敛 latent · 连续 flow time；步序映射见下方说明</small>
            </section>

            <div className="pipeline-connector"><Icon name="arrow" size={18} /></div>

            <section className={`pipeline-node pipeline-node--decode ${decoded ? 'is-decoded' : ''}`}>
              <div className="pipeline-node__label"><span>TextVAE Decoder</span><strong>{decoded ? 'Ready' : 'Waiting for t=0'}</strong></div>
              <div className="parallel-output">
                {decoded ? (
                  <p>{decodedSuffix}</p>
                ) : (
                  <span className="decode-lock"><Icon name="shield" size={19} />latent 尚未收敛</span>
                )}
              </div>
              <small>target latents → target tokens only · prompt remains context · not token-by-token</small>
            </section>
          </div>

          <div className="flow-control">
            <div className="flow-control__head">
              <div><span>Flow time t</span><strong>{time.toFixed(2)}</strong></div>
              <div><span>Flow progress</span><strong>{flowProgress}</strong><small>% of schematic path</small></div>
              <button onClick={startAutoDenoising} type="button"><Icon name="play" size={14} />自动去噪</button>
            </div>
            <input
              aria-label="Flow time"
              min="0"
              max="1"
              step="0.02"
              type="range"
              value={time}
              onChange={(event) => {
                setIsAutoDenoising(false)
                setTime(Number(event.target.value))
              }}
            />
            <div className="flow-control__labels"><span>t=0 · clean latent</span><span>t=0.5 · mixed</span><span>t=1 · pure noise</span></div>
          </div>

          <p className="pipeline-accuracy-note">
            这里的 t 是连续 flow time，不是把论文的 logit-normal 调度线性化成 50 个等距步骤。论文推理使用 50-step Euler，
            并说明训练与推理采用同一 timestep scheduler；精确的 tₖ 序列需要作者实现或日志。Appendix A 还写明未注入 timestep embedding，
            而正文速度场写成 vθ(zₜ,t,z_c)，该细节在论文内部存在歧义，网页不对此作额外推断。
          </p>
        </div>
      ) : (
        <div className={`training-pipeline training-pipeline--${trainingStage}`} key={`${trainingRun}-${trainingStage}`}>
          <div className="training-stage-switch" role="tablist" aria-label="训练阶段">
            <button aria-selected={trainingStage === 'vae'} className={trainingStage === 'vae' ? 'is-active' : ''} onClick={() => setTrainingStage('vae')} role="tab" type="button">
              <span>Stage 1</span><strong>TextVAE + REPA</strong>
            </button>
            <button aria-selected={trainingStage === 'dit'} className={trainingStage === 'dit' ? 'is-active' : ''} onClick={() => setTrainingStage('dit')} role="tab" type="button">
              <span>Stage 2</span><strong>TextDiT Flow Matching</strong>
            </button>
          </div>

          {trainingStage === 'vae' ? (
            <>
          <div className="training-flow">
            <section className="pipeline-node pipeline-node--input">
              <div className="pipeline-node__label"><span>Training sample</span><strong>Token sequence x</strong></div>
              <div className="token-stack">{tokenBlocks.slice(0, 7).map((block, index) => <span key={`${block.token}-train-${index}`}>{block.token}</span>)}</div>
            </section>
            <div className="pipeline-connector"><Icon name="arrow" size={18} /></div>
            <section className="pipeline-node pipeline-node--vae is-training">
              <div className="pipeline-node__label"><span>Trainable</span><strong>TextVAE Encoder</strong></div>
              <div className="latent-matrix">
                {tokenBlocks.map((block, index) => <span key={`${block.token}-train-latent-${index}`} style={{ '--block-hue': block.latentHue, height: `${block.height}px` } as CSSProperties}><i />{index + 1}</span>)}
              </div>
              <small>encoder output + intermediate representation hᵉⁿᶜ</small>
            </section>
          </div>

          <div className="training-branches">
            <article className="training-branch training-branch--reconstruction">
              <div className="training-branch__line" />
              <span>01 · Reconstruction</span>
              <strong>TextVAE Decoder</strong>
              <p>并行重建原始 token，优化交叉熵。</p>
              <b>L_CE</b>
            </article>

            <article className="training-branch training-branch--kl">
              <div className="training-branch__line" />
              <span>02 · Latent regularization</span>
              <strong>Gaussian posterior</strong>
              <p>约束 latent 后验接近标准高斯先验。</p>
              <b>D_KL</b>
            </article>

            <article className="training-branch training-branch--repa">
              <div className="training-branch__line training-branch__line--repa" />
              <span>03 · Representation alignment</span>
              <div className="frozen-llm"><Icon name="shield" size={16} />Frozen LLM hidden states</div>
              <strong>REPA cosine alignment</strong>
              <p>冻结教师只提供目标表示，不对其反向传播。</p>
              <b>L_REPA</b>
            </article>
          </div>

          <div className="training-objective">
            <div><span>TextVAE objective</span><code>L_VAE = L_CE + β · D_KL + λ · L_REPA</code></div>
            <button onClick={() => setTrainingRun((value) => value + 1)} type="button"><Icon name="play" size={14} />重播训练流</button>
          </div>

          <p className="training-note">
            Stage 1 对应论文的 TextVAE 训练：随机截断输入并行重建，优化 CE 和 KL，并通过 REPA 对齐冻结 Qwen3-1.7B 的倒数第三层表示。教师模型只提供对齐目标，不参与反向传播。
          </p>
            </>
          ) : (
            <div className="dit-training-stage">
              <div className="training-flow training-flow--dit">
                <section className="pipeline-node pipeline-node--input">
                  <div className="pipeline-node__label"><span>Frozen TextVAE Encoder</span><strong>Context / target separation</strong></div>
                  <div className="token-stack">{tokenBlocks.slice(0, 7).map((block, index) => <span key={`${block.token}-dit-train-${index}`}>{block.token}</span>)}</div>
                  <small>context 与 target 分别编码，防止 target 泄漏到 context latent。</small>
                </section>
                <div className="pipeline-connector"><Icon name="arrow" size={18} /></div>
                <section className="pipeline-node pipeline-node--dit is-training">
                  <div className="pipeline-node__label"><span>Trainable</span><strong>TextDiT</strong></div>
                  <div className="denoising-matrix">
                    {tokenBlocks.map((block, index) => (
                      <span key={`${block.token}-dit-train-denoise-${index}`} style={{ '--latent-color': `hsl(${block.latentHue} 72% 58%)`, '--noise-color': `hsl(${block.noiseHue} 48% 34%)`, '--time': 0.55 } as CSSProperties}><i /></span>
                    ))}
                  </div>
                  <small>clean context latent + noisy target latent → predict velocity field</small>
                </section>
                <div className="pipeline-connector"><Icon name="arrow" size={18} /></div>
                <section className="pipeline-node pipeline-node--decode is-decoded">
                  <div className="pipeline-node__label"><span>Flow Matching loss</span><strong>L_FM</strong></div>
                  <div className="parallel-output"><p>vθ(zₜ, t, z_c) → z_tgt − z₀</p></div>
                  <small>logit-normal std=1.5 · unconditional dropout p=0.1</small>
                </section>
              </div>

              <div className="dit-training-specs">
                <article><span>08 × H200</span><strong>Compute</strong><p>约 100K tokens / GPU / mini-batch；DiT 训练约 2 天。</p></article>
                <article><span>AdamW · 1e-4</span><strong>Optimizer</strong><p>消融模型训练 1M steps，主结果模型训练 2M steps。</p></article>
                <article><span>Frozen VAE</span><strong>Two-stage dependency</strong><p>Stage 2 只训练 TextDiT，TextVAE encoder 与 decoder 保持冻结。</p></article>
              </div>

              <div className="training-objective">
                <div><span>Conditional Flow Matching objective</span><code>L_FM = E ‖vθ(zₜ, t, z_c) − (z_tgt − z₀)‖²</code></div>
                <button onClick={() => setTrainingRun((value) => value + 1)} type="button"><Icon name="play" size={14} />重播训练流</button>
              </div>

              <p className="training-note">
                Stage 2 对应论文第二阶段：冻结 TextVAE encoder 后，TextDiT 在连续 latent 空间学习条件速度场。正文速度场写有 t，但 Appendix A 又说明未注入 timestep embedding；精确实现仍需作者代码确认。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}





