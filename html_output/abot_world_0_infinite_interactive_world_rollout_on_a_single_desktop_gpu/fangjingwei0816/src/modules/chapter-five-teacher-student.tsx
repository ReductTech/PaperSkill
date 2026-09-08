import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const TIME_POINTS = [0, 1, 2, 3, 4, 5] as const;

function AttentionMatrix({ mode, time }: { mode: 'teacher' | 'student'; time: number }) {
  const isTeacher = mode === 'teacher';

  return (
    <div className={`chap5-matrix ${mode}`}>
      <div className="chap5-matrix-title">
        <strong>{isTeacher ? '完整注意力矩阵' : '因果三角 Mask'}</strong>
        <span>列 = 可读取的时间位置</span>
      </div>
      <div
        className="chap5-matrix-grid"
        role="img"
        aria-label={isTeacher ? '双向教师的完整注意力矩阵' : '因果学生的下三角注意力矩阵，未来位置被遮蔽'}
      >
        <span className="axis-corner" />
        {TIME_POINTS.map((column) => <span className="axis-label" key={`col-${column}`}>{column}</span>)}
        {TIME_POINTS.map((row) => (
          <React.Fragment key={`row-${row}`}>
            <span className={`axis-label ${row === time ? 'active' : ''}`}>t={row}</span>
            {TIME_POINTS.map((column) => {
              const accessible = isTeacher || column <= row;
              return (
                <span
                  key={`${row}-${column}`}
                  className={`matrix-cell ${accessible ? 'accessible' : 'masked'} ${row === time ? 'active-row' : ''}`}
                  aria-hidden="true"
                >
                  {accessible ? '●' : '×'}
                </span>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="chap5-matrix-legend">
        <span><i className="accessible" />可读取</span>
        {!isTeacher ? <span><i className="masked" />未来被 Mask</span> : null}
        <span><i className="current" />当前查询行 t={time}</span>
      </div>
    </div>
  );
}

function Timeline({ mode, time }: { mode: 'teacher' | 'student'; time: number }) {
  const isTeacher = mode === 'teacher';
  const visible = useMemo(
    () => TIME_POINTS.filter((point) => isTeacher || point <= time),
    [isTeacher, time],
  );
  const locked = TIME_POINTS.filter((point) => !isTeacher && point > time);

  return (
    <div className={`chap5-permission ${mode}`}>
      <header>
        <span>{isTeacher ? 'Bidirectional Teacher' : 'Causal Student'}</span>
        <strong>{isTeacher ? '训练时读取完整时域' : '在线时只能读取过去和当前'}</strong>
      </header>
      <div className="chap5-timeline" aria-label={`${isTeacher ? '双向教师' : '因果学生'}在时间点 ${time} 的可见范围`}>
        {TIME_POINTS.map((point) => {
          const isLocked = !isTeacher && point > time;
          return (
            <div className={`${point === time ? 'current ' : ''}${isLocked ? 'locked' : 'visible'}`} key={point}>
              <span>{point}</span>
              <small>{isLocked ? '锁定' : point === time ? '当前' : '可见'}</small>
            </div>
          );
        })}
      </div>
      <p className="chap5-visible-readout">
        <b>t={time}</b>
        <span>可读取：{visible.join(' · ')}</span>
        {locked.length > 0 ? <em>未来不可见：{locked.join(' · ')}</em> : null}
      </p>
      <AttentionMatrix mode={mode} time={time} />
    </div>
  );
}

export const ChapterFiveTeacherStudent: React.FC<WidgetProps> = () => {
  const [time, setTime] = useState(3);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current >= TIME_POINTS.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing]);

  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (time === TIME_POINTS.length - 1) setTime(0);
    setPlaying(true);
  };

  return (
    <div className="chapter-five-teacher-student" data-time={time}>
      <div className="chap5-time-control">
        <div>
          <span>选择当前时间点</span>
          <strong>观察同一个 t，Teacher 与 Student 分别能看哪里</strong>
        </div>
        <div className="chap5-time-buttons" role="group" aria-label="选择当前视频时间点">
          {TIME_POINTS.map((point) => (
            <button
              type="button"
              key={point}
              className={time === point ? 'active' : ''}
              aria-pressed={time === point}
              onClick={() => { setPlaying(false); setTime(point); }}
            >
              t={point}
            </button>
          ))}
        </div>
        <button className="chap5-play" type="button" aria-pressed={playing} onClick={togglePlayback}>
          {playing ? '暂停' : '播放时间轴'}
        </button>
      </div>

      <div className="chap5-permission-compare">
        <Timeline mode="teacher" time={time} />
        <div className="chap5-versus" aria-hidden="true">
          <span>同一时刻</span>
          <strong>信息权限不同</strong>
        </div>
        <Timeline mode="student" time={time} />
      </div>

      <div className="chap5-why-grid">
        <div>
          <span>为什么先训练 Teacher？</span>
          <strong>完整时域上下文能够提供更强、更一致的训练目标。</strong>
        </div>
        <div>
          <span>为什么 Teacher 不能直接部署？</span>
          <strong>在线生成时未来视觉尚未发生，部署模型不能依赖未来上下文。</strong>
        </div>
      </div>

      <div className="chap5-transfer-flow" aria-label="从双向教师到因果学生的能力转移关系">
        <div className="teacher"><small>先训练</small><strong>Bidirectional Teacher</strong></div>
        <b>→</b>
        <div><small>提供</small><strong>高质量训练目标</strong></div>
        <b>→</b>
        <div className="transfer"><small>蒸馏动机</small><strong>能力转移</strong></div>
        <b>→</b>
        <div className="student"><small>满足因果约束</small><strong>Causal Student</strong></div>
        <b>→</b>
        <div className="online"><small>用于部署</small><strong>在线块式生成</strong></div>
      </div>

      <div className="chap5-core-summary">
        <strong>教师负责看全局学得好，学生负责只看过去跑得起来。</strong>
        <span>双向教师利用完整时域上下文提供训练目标，学生满足因果约束用于在线生成。</span>
      </div>
    </div>
  );
};
