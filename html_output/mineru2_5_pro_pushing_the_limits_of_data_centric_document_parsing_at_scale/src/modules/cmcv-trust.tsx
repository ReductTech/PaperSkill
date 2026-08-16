import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Answer = 'yes' | 'no' | null;

const C = {
  text: '#21324a', muted: '#68778f', border: '#d7deea', blue: '#27446e',
  green: '#228d5c', orange: '#d97706', red: '#c43f52', paper: '#ffffff', quiet: '#f5f8f0',
};

function parseGuided(value?: string): Answer | undefined {
  const key = value?.toLowerCase();
  if (!key) return undefined;
  if (key.includes('question') || key.includes('hidden') || key.includes('reset')) return null;
  if (key.includes('wrong') || key.includes('yes')) return 'yes';
  if (key.includes('correct') || key.includes('no') || key.includes('reveal')) return 'no';
  return undefined;
}

export const CmcvTrust: React.FC<WidgetProps> = ({ guidedState, onInteract, onStateChange }) => {
  const [answer, setAnswer] = useState<Answer>(null);

  useEffect(() => {
    const next = parseGuided(guidedState);
    if (next !== undefined) setAnswer(next);
  }, [guidedState]);

  const choose = (next: Exclude<Answer, null>) => {
    setAnswer(next);
    onInteract?.();
    onStateChange?.(next === 'no' ? 'consensus:correct' : 'consensus:wrong');
  };

  const revealed = answer !== null;
  const correct = answer === 'no';
  const tone = !revealed ? C.blue : correct ? C.green : C.red;

  return (
    <section
      className="cmcv-trust motion-cmcv-trust"
      data-revealed={revealed ? 'true' : 'false'}
      data-correct={correct ? 'true' : 'false'}
      aria-label="CMCV 共识可信度判断题"
      style={{ display: 'grid', gap: 15, color: C.text }}
    >
      <div style={{ display: 'grid', gap: 5, textAlign: 'center' }}>
        <strong style={{ fontSize: 18 }}>共识陷阱：三个模型都输出 A</strong>
        <span style={{ color: C.muted, fontSize: 13 }}>教学示意 · 论文未量化模型之间的错误相关性</span>
      </div>

      <div
        className="cmcv-trust__evidence"
        role="img"
        aria-label={revealed ? '三模型一致输出 A，但源图证据显示可能应为 B' : '三个模型全部输出 A，源图证据暂未揭示'}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'stretch' }}
      >
        <div style={{ flex: '2 1 280px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, border: `1px solid ${C.border}`, borderRadius: 14, background: C.quiet, padding: 12 }}>
          {['目标模型', '外部 1', '外部 2'].map((name) => (
            <div className="cmcv-trust__consensus-card" key={name} style={{ minHeight: 92, display: 'grid', placeItems: 'center', border: `2px solid ${C.blue}`, borderRadius: 10, background: C.paper, padding: 8, textAlign: 'center' }}>
              <span style={{ color: C.muted, fontSize: 12 }}>{name}</span>
              <strong style={{ color: C.blue, fontSize: 30 }}>A</strong>
            </div>
          ))}
        </div>
        <div className="cmcv-trust__relation" aria-hidden="true" style={{ display: 'grid', placeItems: 'center', color: tone, fontSize: 24, fontWeight: 900 }}>
          {revealed ? '≠' : '?'}
        </div>
        <div className="cmcv-trust__source-card" style={{ flex: '1 1 160px', minHeight: 118, display: 'grid', placeItems: 'center', border: `2px ${revealed ? 'solid' : 'dashed'} ${revealed ? C.red : C.border}`, borderRadius: 14, background: revealed ? '#fdecef' : C.paper, padding: 12, textAlign: 'center' }}>
          <div>
            <span style={{ display: 'block', color: C.muted, fontSize: 12 }}>源图 / 渲染证据</span>
            <strong style={{ display: 'block', color: revealed ? C.red : C.muted, fontSize: 30, marginTop: 7 }}>{revealed ? 'B' : '未检查'}</strong>
          </div>
          <span className="cmcv-trust__evidence-cover" aria-hidden="true">检查源图</span>
        </div>
      </div>

      <div className="cmcv-trust__question" style={{ display: 'grid', gap: 10, border: `1px solid ${C.border}`, borderRadius: 14, background: C.paper, padding: 14 }}>
        <strong style={{ textAlign: 'center' }}>“A = A = A” 能否直接当作真值 GT？</strong>
        <div role="group" aria-label="判断模型共识是否等于真值" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 9 }}>
          <button
            type="button"
            className={`cmcv-trust__choice ${answer === 'yes' ? 'is-selected' : ''}`}
            aria-pressed={answer === 'yes'}
            onClick={() => choose('yes')}
            style={{ minHeight: 50, border: `2px solid ${answer === 'yes' ? C.red : C.border}`, borderRadius: 11, background: answer === 'yes' ? '#fdecef' : C.paper, color: answer === 'yes' ? C.red : C.text, padding: '9px 12px', cursor: 'pointer', font: 'inherit', fontWeight: 800 }}
          >
            能，三者一致就是 GT
          </button>
          <button
            type="button"
            className={`cmcv-trust__choice ${answer === 'no' ? 'is-selected' : ''}`}
            aria-pressed={answer === 'no'}
            onClick={() => choose('no')}
            style={{ minHeight: 50, border: `2px solid ${answer === 'no' ? C.green : C.border}`, borderRadius: 11, background: answer === 'no' ? '#edf8f2' : C.paper, color: answer === 'no' ? C.green : C.text, padding: '9px 12px', cursor: 'pointer', font: 'inherit', fontWeight: 800 }}
          >
            不能，共识只是证据信号
          </button>
        </div>
      </div>

      <div
        className="cmcv-trust__ladder"
        aria-label="从模型共识到专家复核的证据阶梯"
        aria-hidden={!revealed}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 8 }}
      >
        {[
          ['1', '模型共识', '用于分流 / 候选标注'],
          ['2', '源图与渲染证据', '暴露相关错误'],
          ['3', '专家复核', '处理自动流程残留'],
        ].map(([index, title, note], step) => (
          <div className="cmcv-trust__ladder-step" key={index} style={{ minHeight: 84, borderTop: `4px solid ${step === 0 ? C.blue : step === 1 ? C.orange : C.green}`, background: C.quiet, padding: '10px 11px', '--ladder-order': step } as React.CSSProperties}>
            <strong>{index}. {title}</strong>
            <span style={{ display: 'block', color: C.muted, fontSize: 12, marginTop: 5, lineHeight: 1.4 }}>{note}</span>
          </div>
        ))}
      </div>

      <div className="cmcv-trust__feedback" role="status" aria-live="polite" style={{ borderLeft: `4px solid ${tone}`, borderRadius: '0 10px 10px 0', background: !revealed ? '#eef3f8' : correct ? '#edf8f2' : '#fdecef', color: tone, padding: '11px 13px', fontWeight: 700, lineHeight: 1.55 }}>
        {!revealed
          ? '先判断共识的证据等级，再揭示源图反证。'
          : correct
            ? '判断正确：共识能辅助路由和标注，但模型可能共享盲点；共识 ≠ GT。'
            : '这个结论过强：三模型可能相关地出错，仍需源图、渲染验证与必要的专家复核。'}
      </div>
    </section>
  );
};

export default CmcvTrust;
