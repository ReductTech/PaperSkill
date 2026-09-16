import { useLessonPlayback } from './useLessonPlayback';
import { PlaybackBar } from './lesson-labs';
import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ModalityId = 'text' | 'audio' | 'video';
type Focus = ModalityId | 'all';

const modalities: Array<{
  id: ModalityId;
  name: string;
  model: string;
  dim: string;
  time: string;
}> = [
  { id: 'text', name: '文本', model: 'Llama-3.2-3B', dim: '单层 2048D', time: '当前词之前最多 1024 个词' },
  { id: 'audio', name: '音频', model: 'Wav2Vec-BERT 2.0', dim: '单层 1024D', time: '60 秒 chunk，包含过去与未来' },
  { id: 'video', name: '视频', model: 'V-JEPA-2-Giant', dim: '单层 1280D', time: '此前约 4 秒，共 64 帧' },
];

const focusText: Record<Focus, string> = {
  text: '文本路径独立完成多层处理与 384D 投影，再放到 2 Hz 时间网格。',
  audio: '音频路径独立完成多层处理与 384D 投影；60 秒 chunk 内含双向上下文。',
  video: '视频路径独立完成多层处理与 384D 投影，每个时间点读取此前约 4 秒、64 帧。',
  all: '三条路径各自完成维度规范与时间对齐，最后保留三种表示并拼接为 1152D。',
};

export const ModalityAligner: React.FC<WidgetProps> = () => {
  const [focus, setFocus] = useState<Focus>('all');
  const player=useLessonPlayback(7,10);
  const stages=['多层特征','层分组','组内平均','组间拼接','Linear','384D','LayerNorm'];

  return (
    <div className="chapter2-aligner" ref={player.root}>
      <div className="visual-source-tag teaching">教学示意 · 非论文原图</div>
      <div className="segmented chapter2-controls" role="group" aria-label="选择要查看的模态路径">
        {modalities.map((item) => (
          <button key={item.id} type="button" aria-pressed={focus === item.id} onClick={() => setFocus(item.id)}>
            {item.name}
          </button>
        ))}
        <button type="button" aria-pressed={focus === 'all'} onClick={() => setFocus('all')}>三模态</button>
      </div>

      <section className="chapter2-dimension-zone" aria-labelledby="chapter2-dimension-title">
        <div className="chapter2-zone-title" id="chapter2-dimension-title">
          <b>A. 维度统一</b><span>每个模态内部单独处理</span>
        </div>
        <div className="chapter2-lanes">
          {modalities.map((item) => {
            const active = focus === 'all' || focus === item.id;
            return (
              <article key={item.id} className={`chapter2-lane ${item.id} ${active ? 'is-active' : 'is-muted'}`}>
                <header>
                  <div><span>{item.name}</span><strong>{item.model}</strong></div>
                  <div className="chapter2-source-dim"><small>冻结编码器</small><b>{item.dim}</b></div>
                </header>
                <div className="chapter2-process" aria-label={`${item.name}维度规范流程`}>
                  {['多层特征', '层分组', '组内平均', '组间拼接', 'Linear', '384D', 'LayerNorm'].map((step, index) => (
                    <React.Fragment key={step}>
                      <span className={(step === '384D' ? 'result ' : '')+(index===player.step?'is-processing':'')}>{step}</span>
                      {index < 6 ? <i aria-hidden="true">→</i> : null}
                    </React.Fragment>
                  ))}
                </div>
                <div className="chapter2-time-rule"><span>时间取样</span><b>{item.time}</b></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="chapter2-time-zone" aria-labelledby="chapter2-time-title">
        <div className="chapter2-zone-title" id="chapter2-time-title">
          <b>B. 时间统一</b><span>与 384D 投影分开处理</span>
        </div>
        <div className="chapter2-clock"><span>文本 384D</span><span>音频 384D</span><span>视频 384D</span><strong>共同时间网格&nbsp;2 Hz</strong></div>
      </section>

      <div className="chapter2-concat" aria-label="三模态拼接为 1152D">
        <span>384D</span><i>+</i><span>384D</span><i>+</i><span>384D</span><b>→</b><strong>D_model = 1152</strong>
        <small>保留三种模态表示后拼接，不做跨模态平均</small>
      </div>

      <aside className="chapter2-audio-note">
        <b>注意：</b>音频与文本、视频不同。Wav2Vec-BERT 的 60 秒 chunk 内包含过去和未来的双向上下文，因此 TRIBE v2 并不是严格在线因果模型。
      </aside>
      <p className="chapter2-evidence">论文依据：Methods §5.2；整体结构位置参见 Fig.1B</p>
      <div className="feedback good" aria-live="polite">{focusText[focus]} 当前处理：{stages[player.step]}。</div><PlaybackBar player={player} label="维度规范步骤"/>
    </div>
  );
};
