import React, { useEffect, useState } from 'react';
import type { WidgetProps } from '../../modules/registry';

type TabKey = 'cook' | 'split' | 'unified';

export interface LDMPipelineAnimationProps extends WidgetProps {
  onTabChange?: (tab: TabKey) => void;
}

const LOOP_MS = 4000;

function useLoopState() {
  const [elapsed, setElapsed] = useState(0);
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = now - start;
      if (next >= LOOP_MS * 2) {
        setElapsed(LOOP_MS * 2);
        setFrozen(true);
        return;
      }
      setElapsed(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const phase = frozen ? 3 : Math.min(3, Math.floor((elapsed % LOOP_MS) / 1000));
  const progress = frozen ? 1 : (elapsed % 1000) / 1000;
  return { frozen, phase, progress };
}

function StepLabel({ active, text, color }: { active: boolean; text: string; color: string }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? color : 'var(--color-border)'}`,
        background: active ? 'var(--color-primary-light)' : 'var(--color-bg-elevated)',
        color: active ? color : 'var(--color-text-secondary)',
        fontSize: 'var(--type-caption)',
        fontWeight: 500,
        lineHeight: 'var(--leading-caption)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
}

export function LDMPipelineAnimation({ onTabChange }: LDMPipelineAnimationProps) {
  const { frozen, phase, progress } = useLoopState();
  const [tab, setTab] = useState<TabKey>('cook');

  useEffect(() => {
    onTabChange?.(tab);
  }, [onTabChange, tab]);

  const showLine =
    phase === 0
      ? '食材分开摆盘'
      : phase === 1
        ? '切分前后各管各的'
        : phase === 2
          ? '最后再拼到一起'
          : '成品还是有点散';

  const sharedStyle = {
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-elevated)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-sm)',
  } as const;

  const ingredientX = 28 + progress * 60;
  const sliceX = 108 + progress * 84;
  const wokScale = 0.96 + progress * 0.04;
  const blur = Math.max(0, 1.6 * (1 - progress));

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ ...sharedStyle, padding: 24, minHeight: 270, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <StepLabel active={phase === 0} text="文本 / 图像 / 条件" color="var(--color-token-text)" />
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid var(--color-token-text)', background: 'var(--color-token-text-bg)', color: 'var(--color-token-text)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
                食材 A：文本
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid var(--color-token-condition)', background: 'var(--color-token-condition-bg)', color: 'var(--color-token-condition)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
                食材 B：参考图
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid var(--color-token-generation)', background: 'var(--color-token-generation-bg)', color: 'var(--color-token-generation)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
                食材 C：待生成内容
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', color: 'var(--color-primary)', fontSize: 'var(--type-h3)', fontWeight: 600 }}>→</div>

          <div style={{ display: 'grid', gap: 12 }}>
            <StepLabel active={phase >= 1} text={showLine} color="var(--color-primary)" />
            <div style={{ ...sharedStyle, padding: 20, minHeight: 164, position: 'relative', background: 'linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg-card))' }}>
              <div style={{ position: 'absolute', inset: 12, borderRadius: 14, border: '1px dashed var(--color-border)' }} />
              <div style={{ position: 'absolute', left: ingredientX, top: 18, width: 58, height: 58, borderRadius: 16, background: 'var(--color-token-text-bg)', border: '1px solid var(--color-token-text)', transform: `translateY(${Math.sin(progress * Math.PI * 2) * 3}px)` }} />
              <div style={{ position: 'absolute', left: ingredientX + 66, top: 18, width: 58, height: 58, borderRadius: 16, background: 'var(--color-token-condition-bg)', border: '1px solid var(--color-token-condition)', transform: `translateY(${Math.cos(progress * Math.PI * 2) * 3}px)` }} />
              <div style={{ position: 'absolute', left: ingredientX + 132, top: 18, width: 58, height: 58, borderRadius: 16, background: 'var(--color-token-generation-bg)', border: '1px solid var(--color-token-generation)', transform: `translateY(${Math.sin(progress * Math.PI * 2 + 1) * 3}px)` }} />
              <div style={{ position: 'absolute', right: 18, bottom: 14, width: 100, height: 86, borderRadius: 999, background: 'radial-gradient(circle at 50% 40%, #fff7ed 0%, #fed7aa 48%, #f59e0b 100%)', border: '1px solid #f4c06d', transform: `scale(${wokScale})`, filter: `blur(${phase >= 1 ? 0 : 0.2}px)` }} />
              <div style={{ position: 'absolute', left: sliceX, top: 92, width: 150, height: 40, borderRadius: 12, background: 'rgba(46,92,170,0.08)', border: '1px solid rgba(46,92,170,0.24)', filter: `blur(${blur}px)` }} />
              <div style={{ position: 'absolute', left: 18, bottom: 10, color: 'var(--color-text-secondary)', fontSize: 'var(--type-caption)', lineHeight: 'var(--leading-caption)' }}>
                旧路线：先分开处理，再勉强拼起来
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className={`chip ${tab === 'cook' ? 'selected' : ''}`} onClick={() => setTab('cook')}>食材摆盘</button>
        <button className={`chip ${tab === 'split' ? 'selected' : ''}`} onClick={() => setTab('split')}>分开处理</button>
        <button className={`chip ${tab === 'unified' ? 'selected' : ''}`} onClick={() => setTab('unified')}>统一下锅</button>
      </div>

      <div style={{ justifySelf: 'center', maxWidth: 'var(--measure-card)', padding: '10px 12px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', fontSize: 'var(--type-body)', lineHeight: 'var(--leading-relaxed)', textAlign: 'center' }}>
        {tab === 'cook' ? '传统路线像摆盘：食材都在，但没有真正变成一道完整的菜。' : tab === 'split' ? '分开处理会留下割裂感：各做各的，味道不容易统一。' : 'HiDream 更像一锅炒：先统一切好，再放进同一口锅里处理。'}
      </div>

      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--type-caption)', lineHeight: 'var(--leading-caption)', textAlign: 'center' }}>
        {frozen ? '动画停在结果上，便于讲解。' : '动画会循环播放，帮助先建立直觉。'}
      </div>
    </div>
  );
}

export const LDMPipelineAnimationWidget: React.FC<WidgetProps> = (props) => <LDMPipelineAnimation {...props} />;
