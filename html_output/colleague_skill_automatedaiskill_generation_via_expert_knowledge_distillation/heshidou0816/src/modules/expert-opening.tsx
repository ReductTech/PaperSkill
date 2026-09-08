import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const events = [
  { time: '09:12', channel: '微信', quote: '“这个接口没有输入校验。”', token: 'Chat', icon: '●', tone: 'chat' },
  { time: '11:26', channel: '代码评审', quote: '“先检查 authentication。”', token: 'Review', icon: '◆', tone: 'review' },
  { time: '15:43', channel: '邮件', quote: '“P0 时需要直接 escalation。”', token: 'Email', icon: '✉', tone: 'email' },
  { time: '18:20', channel: '事件记录', quote: '“Rollback 前先判断数据一致性。”', token: 'Incident', icon: '!', tone: 'incident' },
] as const;

export const ExpertOpening: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(6);
      return undefined;
    }
    const timings = [650, 2050, 3450, 4850, 6500, 8050];
    const cycleLength = 11200;
    const timers: number[] = [];

    const playCycle = () => {
      setStage(0);
      timings.forEach((delay, index) => {
        timers.push(window.setTimeout(() => setStage(index + 1), delay));
      });
    };

    playCycle();
    const loop = window.setInterval(playCycle, cycleLength);
    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      window.clearInterval(loop);
    };
  }, []);

  const activeEvent = useMemo(() => events[Math.max(0, Math.min(events.length - 1, stage - 1))], [stage]);
  const sceneTitle = stage < 5
    ? '一位资深同事正在工作'
    : stage === 5
      ? '资深同事正在离开'
      : '资深同事已离开，痕迹仍在';

  return <div className={`expert-opening expert-stage-${stage}`} aria-label="资深同事的工作痕迹依次出现；资深同事离开后，痕迹仍然保留">
    <div className="opening-eyebrow" aria-live="polite"><b>{sceneTitle}</b></div>
    <div className="opening-scene">
      <div className={`expert-worker${stage >= 5 ? ' is-leaving' : ''}`}>
        <div className="expert-avatar" aria-hidden="true">
          <span className="expert-emoji">👨‍💻</span>
          <span className="typing-dot dot-one" />
          <span className="typing-dot dot-two" />
          <span className="typing-dot dot-three" />
        </div>
        <strong>Senior Engineer</strong>
        <small>{stage > 0 && stage < 5 ? `${activeEvent.time} · ${activeEvent.channel}` : '工作中的资深同事'}</small>
      </div>

      <div className={`work-event-list${stage >= 5 ? ' is-leaving' : ''}`} aria-live="polite">
        {events.map((event, index) => <div key={event.time} className={`work-event event-${event.tone}${stage >= index + 1 ? ' is-visible' : ''}${stage === index + 1 ? ' is-current' : ''}`}>
          <time>{event.time}</time>
          <div><b>{event.channel}</b><p>{event.quote}</p></div>
        </div>)}
      </div>

      <div className="opening-token-field" aria-label="留下的 Trace Token">
        {events.map((event, index) => <div key={event.token} className={`opening-token token-${event.tone} token-pos-${index + 1}${stage >= index + 1 ? ' is-visible' : ''}`}>
          <span aria-hidden="true">{event.icon}</span><b>{event.token}</b><small>Trace Token</small>
        </div>)}
      </div>

      <div className={`opening-message${stage >= 6 ? ' is-visible' : ''}`} aria-live="polite">
        <span>The colleague leaves. What remains?</span>
        <b>资深同事已离开，但专业经验仍散落在痕迹中。</b>
      </div>
    </div>
  </div>;
};

export default ExpertOpening;
