import React, { useEffect, useState } from 'react';

type CookingMode = 'source' | 'filter' | 'prompt';

export function CookingIntro({ mode }: { mode: CookingMode }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((v) => (v + 1) % 3), 900);
    return () => window.clearInterval(id);
  }, []);

  const scenes =
    mode === 'source'
      ? ['六大来源先上桌', '再做语义去重', '像把菜先分盘再处理']
      : mode === 'filter'
        ? ['先过安全关', '再过审美关', '最后过图文一致性']
        : ['先看任务类型', '再选提示格式', '像按菜谱出题'];

  const colors =
    mode === 'source'
      ? ['var(--color-token-text)', 'var(--color-token-condition)', 'var(--color-token-generation)']
      : mode === 'filter'
        ? ['var(--color-error)', 'var(--color-warning)', 'var(--color-success)']
        : ['var(--color-primary)', 'var(--color-token-text)', 'var(--color-token-generation)'];

  return (
    <div className="hd-cook-intro" aria-label="做饭类比引言">
      <div className="hd-cook-track">
        {scenes.map((text, idx) => (
          <div key={text} className={`hd-cook-item ${idx === step ? 'is-active' : ''}`} style={{ borderColor: colors[idx % colors.length] }}>
            <span className="hd-cook-dot" style={{ background: colors[idx % colors.length] }} />
            <span>{text}</span>
          </div>
        ))}
      </div>
      <div className="hd-cook-note">{'>'} 引言：先把材料处理清楚，再进入后面的主流程。</div>
    </div>
  );
}
