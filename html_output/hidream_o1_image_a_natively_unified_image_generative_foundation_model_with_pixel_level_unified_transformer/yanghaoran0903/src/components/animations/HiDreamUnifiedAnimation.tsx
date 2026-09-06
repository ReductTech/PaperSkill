import React, { useEffect, useState } from 'react';
import type { WidgetProps } from '../../modules/registry';

type TabKey = 'token' | 'pixel' | 'attention';

export interface HiDreamUnifiedAnimationProps extends WidgetProps {
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

  return {
    frozen,
    phase: frozen ? 3 : Math.min(3, Math.floor((elapsed % LOOP_MS) / 1000)),
    progress: frozen ? 1 : (elapsed % 1000) / 1000,
  };
}

export function HiDreamUnifiedAnimation({ onTabChange }: HiDreamUnifiedAnimationProps) {
  const { frozen, phase, progress } = useLoopState();
  const [tab, setTab] = useState<TabKey>('token');

  useEffect(() => {
    const next: TabKey = phase === 0 ? 'token' : phase === 1 ? 'pixel' : 'attention';
    setTab(next);
    onTabChange?.(next);
  }, [onTabChange, phase]);

  const title =
    phase === 0 ? '文本 + 条件 + 噪声同时输入' : phase === 1 ? '统一 Token 空间' : phase === 2 ? 'Hybrid Attention' : '2048x2048 原生保真';

  const rightShift = 18 + progress * 52;
  const tokenScale = 0.92 + progress * 0.08;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div
        style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-sm)',
          padding: 24,
          minHeight: 270,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24, alignItems: 'start' }}>
          <div style={{ padding: 10, borderRadius: 14, border: '1px solid var(--color-token-text)', background: 'var(--color-token-text-bg)', color: 'var(--color-token-text)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
            文本
          </div>
          <div style={{ padding: 10, borderRadius: 14, border: '1px solid var(--color-token-condition)', background: 'var(--color-token-condition-bg)', color: 'var(--color-token-condition)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
            条件图像
          </div>
          <div style={{ padding: 10, borderRadius: 14, border: '1px solid var(--color-token-generation)', background: 'var(--color-token-generation-bg)', color: 'var(--color-token-generation)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
            待生成图像
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr 220px', gap: 24, alignItems: 'center' }}>
          <div style={{ color: 'var(--color-primary)', fontSize: 'var(--type-h3)', fontWeight: 600, textAlign: 'center' }}>→</div>
          <div
            style={{
              minHeight: 156,
              borderRadius: 16,
              border: '1px dashed var(--color-border)',
              background: 'linear-gradient(180deg, var(--color-bg-card), var(--color-bg-elevated))',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', left: 14, top: 12, right: 14, color: 'var(--color-text-secondary)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
              {title}
            </div>
            <div style={{ position: 'absolute', left: 14, top: 48, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 180 }}>
              {['文', '本', '图', '像', '条', '件'].slice(0, phase >= 1 ? 6 : 3).map((t, i) => (
                <span
                  key={`${t}-${i}`}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    fontSize: 'var(--type-caption)',
                    fontWeight: 500,
                    lineHeight: 'var(--leading-caption)',
                    transform: `translateY(${Math.sin((progress + i * 0.2) * Math.PI * 2) * 2}px)`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                right: rightShift,
                bottom: 18,
                width: 110,
                height: 92,
                borderRadius: 18,
                border: '1px solid var(--color-primary)',
                background: 'linear-gradient(180deg, #ffffff, var(--color-primary-light))',
                transform: `scale(${tokenScale})`,
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            <div style={{ position: 'absolute', left: 18, bottom: 14, color: 'var(--color-text-secondary)', fontSize: 'var(--type-caption)', lineHeight: 'var(--leading-caption)' }}>
              先统一，再一起处理
            </div>
          </div>

          <div
            style={{
              minHeight: 156,
              borderRadius: 16,
              border: '1px solid var(--color-border)',
              background: 'linear-gradient(180deg, var(--color-bg-elevated), var(--color-bg-card))',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(46,92,170,0.04), rgba(46,92,170,0.14), rgba(46,92,170,0.04))' }} />
            <div style={{ position: 'absolute', left: 16, top: 16, right: 16, height: 8, borderRadius: 999, background: 'var(--color-primary-light)' }} />
            <div style={{ position: 'absolute', left: 16, top: 40, color: 'var(--color-primary-dark)', fontSize: 'var(--type-caption)', fontWeight: 500, lineHeight: 'var(--leading-caption)' }}>
              统一 Token 空间
            </div>
            <div style={{ position: 'absolute', left: 16, top: 72, right: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const kind = i % 3;
                return (
                  <div
                    key={i}
                    style={{
                      height: 24,
                      borderRadius: 8,
                      background:
                        kind === 0 ? 'var(--color-token-text-bg)' : kind === 1 ? 'var(--color-token-condition-bg)' : 'var(--color-token-generation-bg)',
                      border:
                        kind === 0 ? '1px solid var(--color-token-text)' : kind === 1 ? '1px solid var(--color-token-condition)' : '1px solid var(--color-token-generation)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className={`chip ${tab === 'token' ? 'selected' : ''}`} onClick={() => setTab('token')}>
          统一 Token
        </button>
        <button className={`chip ${tab === 'pixel' ? 'selected' : ''}`} onClick={() => setTab('pixel')}>
          像素空间
        </button>
        <button className={`chip ${tab === 'attention' ? 'selected' : ''}`} onClick={() => setTab('attention')}>
          混合注意力
        </button>
      </div>

      <div
        style={{
          justifySelf: 'center',
          maxWidth: 'var(--measure-card)',
          padding: '10px 12px',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--type-body)',
          lineHeight: 'var(--leading-relaxed)',
          textAlign: 'center',
        }}
      >
        {tab === 'token'
          ? '三种输入先汇成同一种语言。'
          : tab === 'pixel'
            ? '不先压缩到低分辨率，像素信息保留得更完整。'
            : '同一个 Transformer 里，语言和图像各用适合自己的注意力。'}
      </div>

      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--type-caption)', lineHeight: 'var(--leading-caption)', textAlign: 'center' }}>
        {frozen ? '动画停在结果上，便于讲解。' : '动画循环播放，先建立直觉。'}
      </div>
    </div>
  );
}

export const HiDreamUnifiedAnimationWidget: React.FC<WidgetProps> = (props) => <HiDreamUnifiedAnimation {...props} />;
