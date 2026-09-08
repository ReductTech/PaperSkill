import { useMemo, useState, type CSSProperties } from 'react';
import type { WidgetProps } from './registry';

const ACTION_KEYS = ['W', 'A', 'S', 'D', 'I', 'J', 'K', 'L'] as const;
const ACTION_FORMULA_HTML = '<math aria-label="tilde a 下标 tau 等于四帧动作拼接"><msub><mover accent="true"><mi>a</mi><mo>˜</mo></mover><mi>τ</mi></msub><mo>=</mo><mi>Concat</mi><mo>(</mo><msub><mi>a</mi><mrow><mn>4</mn><mi>τ</mi><mo>−</mo><mn>3</mn></mrow></msub><mo>,</mo><mo>…</mo><mo>,</mo><msub><mi>a</mi><mrow><mn>4</mn><mi>τ</mi></mrow></msub><mo>)</mo><mo>∈</mo><msup><mrow><mo>{</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>}</mo></mrow><mn>32</mn></msup></math><math aria-label="动作适配器输出加到视频块表示"><mover accent="true"><mi>z</mi><mo>ˆ</mo></mover><mo>=</mo><mi>PatchEmbed</mi><mo>(</mo><mi>z</mi><mo>)</mo><mo>+</mo><msub><mi>F</mi><mi>ψ</mi></msub><mo>(</mo><mover accent="true"><mi>a</mi><mo>˜</mo></mover><mo>)</mo></math>';

function maskToBits(mask: number) {
  return ACTION_KEYS.map((_, index) => (mask & (1 << index) ? 1 : 0));
}

function activeKeyNames(mask: number) {
  return ACTION_KEYS.filter((_, index) => Boolean(mask & (1 << index)));
}

function keyLabel(mask: number) {
  const keys = activeKeyNames(mask);
  return keys.length ? keys.join(' + ') : '无按键';
}

function motionLabel(mask: number) {
  const names: string[] = [];
  if (mask & 1) names.push('前进');
  if (mask & (1 << 1)) names.push('左移');
  if (mask & (1 << 2)) names.push('后退');
  if (mask & (1 << 3)) names.push('右移');
  if (mask & (1 << 4)) names.push('抬升视角');
  if (mask & (1 << 5)) names.push('左转视角');
  if (mask & (1 << 6)) names.push('降低视角');
  if (mask & (1 << 7)) names.push('右转视角');
  return names.length ? names.join(' + ') : '保持当前状态';
}

export function ChapterThreeActionIdentity(_props: WidgetProps) {
  const [mode, setMode] = useState<'action' | 'identity'>('action');
  const [activeMask, setActiveMask] = useState(1 | (1 << 3));

  const frameMasks = useMemo(() => [1, activeMask, 1 << 3, 1], [activeMask]);
  const packedBits = useMemo(() => frameMasks.flatMap(maskToBits), [frameMasks]);
  const horizontal = Number(Boolean(activeMask & ((1 << 3) | (1 << 7)))) - Number(Boolean(activeMask & ((1 << 1) | (1 << 5))));
  const vertical = Number(Boolean(activeMask & ((1 << 2) | (1 << 6)))) - Number(Boolean(activeMask & (1 | (1 << 4))));
  const sceneStyle = {
    '--scene-x': `${horizontal * 48}px`,
    '--scene-y': `${vertical * 25}px`,
  } as CSSProperties;

  const toggleKey = (keyIndex: number) => {
    setActiveMask((current) => current ^ (1 << keyIndex));
  };

  return (
    <section className="chapter-three-condition-paths" data-mode={mode} aria-label="动作与身份记忆两条独立条件路径">
      <div className="condition-path-summary">
        <strong>Action 管怎么动，Identity Memory 管是谁。</strong>
        <span>两条条件路径分别进入视频模型。</span>
      </div>

      <div className="mechanism-tabs" role="tablist" aria-label="切换条件路径">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'action'}
          className={`mechanism-tab action ${mode === 'action' ? 'active' : ''}`}
          onClick={() => {
            setMode('action');
            setActiveMask(1 | (1 << 3));
          }}
        >
          动作控制（Action）· 怎么动
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'identity'}
          className={`mechanism-tab identity ${mode === 'identity' ? 'active' : ''}`}
          onClick={() => setMode('identity')}
        >
          身份记忆（Identity Memory）· 我是谁
        </button>
      </div>

      {mode === 'action' ? (
        <div className="chapter-three-action action-big-story">
          <div className="action-story-stage">
            <div className="action-story-keyboard">
              <div>
                <strong>点击编辑第2帧的按键组合</strong>
                <span>可以同时按多个键，例如 W + D，不是八选一。</span>
              </div>
              <div className="action-keyboard" aria-label="编辑第二帧的按键组合">
                {ACTION_KEYS.map((key, index) => {
                  const isActive = Boolean(activeMask & (1 << index));
                  return (
                    <button
                      type="button"
                      key={key}
                      aria-label={`${key} 键`}
                      aria-pressed={isActive}
                      className={isActive ? 'active' : ''}
                      onClick={() => toggleKey(index)}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="action-four-moments" aria-label="连续四帧动作">
              <div className="action-timeline-line" aria-hidden="true" />
              {frameMasks.map((mask, index) => (
                <div className={index === 1 ? 'is-edited' : ''} key={`${index}-${mask}`}>
                  <small>第{index + 1}帧</small>
                  <strong>{keyLabel(mask)}</strong>
                </div>
              ))}
            </div>

            <div className="action-merge" aria-label="四帧动作合并为三十二维动作指令">
              <span>连续4帧动作向中间汇合</span>
              <div className="action-merge-lines" aria-hidden="true"><i /><i /><i /><i /></div>
              <strong>32维动作指令</strong>
            </div>

            <div className="action-video-journey" aria-label="动作指令经过适配器并改变下一视频块">
              <div className="action-video-spine" aria-hidden="true" />
              <div className="action-adapter-main">
                <small>转换到视频表示空间</small>
                <strong>动作适配器</strong>
              </div>
              <div className="action-addition-main">
                <span>＋ 当前视频表示</span>
                <strong>加入动作后的对应视频表示</strong>
              </div>
              <div className="action-next-scene" key={activeMask} style={sceneStyle}>
                <div className="scene-sky" />
                <div className="scene-ground"><i /><i /><i /></div>
                <div className="scene-subject" aria-hidden="true"><i /><b /></div>
                <div className="scene-motion-path" aria-hidden="true" />
                <div className="scene-caption">
                  <small>下一视频块</small>
                  <strong>{motionLabel(activeMask)}</strong>
                  <span>输入：{keyLabel(activeMask)}</span>
                </div>
              </div>
            </div>

            <p className="action-core-sentence">四帧按键先合成一条动作指令，再注入对应的视频表示。</p>
          </div>

          <details className="deep-reading chapter-three-tech-details action-paper-encoding">
            <summary>展开技术细节：动作在论文里如何编码</summary>
            <p>每帧按键编码为8维组合表示；四帧沿通道维拼接，因此得到32维动作指令。</p>
            <div className="action-tech-vectors">
              {frameMasks.map((mask, index) => (
                <span key={index}><b>第{index + 1}帧</b><code>[{maskToBits(mask).join(',')}]</code></span>
              ))}
            </div>
            <div className="action-tech-packed"><b>4 × 8 = 32</b><code>{packedBits.join(' ')}</code></div>
            <div className="chapter-three-paper-formula" dangerouslySetInnerHTML={{ __html: ACTION_FORMULA_HTML }} />
            <small>论文术语：8D multi-hot、32D action token、Action Adapter、Video Patch Embedding。</small>
          </details>

          <p className="action-time-note">
            模型把连续4帧视频对应到一个压缩后的时间步，因此这4帧动作也一起合并。
            <small>temporal patch size = 4</small>
          </p>
        </div>
      ) : (
        <div className="chapter-three-identity identity-big-story">
          <div className="identity-story-stage">
            <div className="identity-source-journey">
              <div className="identity-reference-portrait" aria-label="参考角色图像">
                <i /><b /><span>参考角色图像</span>
              </div>
              <div className="identity-source-line">
                <span>提取身份信息</span>
                <i aria-hidden="true" />
                <strong>放在视频时间轴之前</strong>
              </div>
            </div>

            <div className="identity-main-timeline" aria-label="身份记忆位于负时间位置，生成视频从零开始">
              <div className="memory-side">
                <span>固定身份记忆</span>
                <strong><i>−3</i><i>−2</i><i>−1</i></strong>
              </div>
              <em aria-hidden="true">|</em>
              <div className="video-side">
                <span>持续生成的视频</span>
                <strong><i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>…</i></strong>
              </div>
            </div>

            <div className="identity-read-directions" aria-label="视频读取身份记忆，但不能反向改写">
              <div className="allowed">
                <span>Identity Memory</span><i aria-hidden="true" /><strong>视频可以读取身份信息</strong><b>Generated Video</b>
              </div>
              <div className="blocked">
                <span>Generated Video</span><i aria-hidden="true"><b>×</b></i><strong>生成视频不能反向改写身份记忆</strong><b>Identity Memory</b>
              </div>
            </div>

            <div className="identity-continuity-demo" aria-label="身份记忆机制示意">
              <div className="identity-strip stable">
                <span>有固定身份记忆</span>
                <div>{[0, 1, 2, 3, 4].map((frame) => <i key={frame}><b /></i>)}</div>
                <strong>身份线索持续被读取</strong>
              </div>
              <div className="identity-strip drifting">
                <span>无固定身份锚点</span>
                <div>{[0, 1, 2, 3, 4].map((frame) => <i key={frame} style={{ '--drift-step': frame } as CSSProperties}><b /></i>)}</div>
                <strong>外观可能逐渐变化</strong>
              </div>
              <small>机制示意，非论文定量实验。</small>
            </div>
          </div>

          <details className="deep-reading chapter-three-tech-details identity-paper-memory">
            <summary>展开技术细节：论文如何实现固定身份记忆</summary>
            <p><b>Memory Tokens：</b>参考图像被编码为独立的身份 / 记忆 token，而不是动作适配器的后续模块。</p>
            <p><b>Negative-time RoPE：</b>记忆使用 −3、−2、−1 等负时间位置，生成视频从 0 开始。</p>
            <p><b>Asymmetric Attention：</b>Video 可以读取 Memory；Memory 不读取 Video，避免生成内容反向写入固定身份锚点。</p>
          </details>
        </div>
      )}
    </section>
  );
}
