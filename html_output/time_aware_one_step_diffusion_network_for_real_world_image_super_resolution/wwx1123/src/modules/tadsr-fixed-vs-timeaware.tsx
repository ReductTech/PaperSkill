import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const nearest = (t: number) => t <= 300 ? 2 : t <= 450 ? 3 : t <= 550 ? 4 : 5;
const tvOf = (t: number) => Math.round(t * 0.5);

export function TadsrFixedVsTimeaware(_: WidgetProps) {
  const [mode, setMode] = useState<'fixed' | 'aware'>('fixed');
  const [ts, setTs] = useState(500);
  const aware = mode === 'aware';
  const studentAngle = -120 + ((ts - 200) / 400) * 240;
  const teacherAngle = aware ? -120 + (tvOf(ts) / 500) * 240 : 0;
  const img = `face-${nearest(ts)}`;
  const ghosts = aware ? [tvOf(ts)] : [100, 300, 600];
  const feedback = aware
    ? `映射后 tᵥ≈${tvOf(ts)}：老师在看与学生同一档位的照片。`
    : `学生示意固定在 500 档，老师却在 ${ghosts.join(' / ')} 档之间随机换灯。`;

  return (
    <div className="studio-page tadsr-fixed">
      <section className="studio-card tadsr-fixed-panel">
        <p className="studio-heading">固定档位</p>
        <div className="studio-photo-wrap"><img src="./images/face-4.png" alt="固定档位的人脸输出" /></div>
        <div className="tadsr-fixed-dial"><div className="studio-brass"><div className="studio-needle" style={{ transform: 'rotate(0deg)' }} /></div></div>
        <div className="tadsr-fixed-ghost" aria-label="老师随机档位">
          {[100, 300, 600].map((v, k) => <span key={v} style={{ left: k * 78, top: 12, opacity: .35 + k * .18 }} title={`老师档位 ${v}`} />)}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 24, color: '#a34918', fontWeight: 750 }}>老师档位随机跳</div>
        </div>
        <p className="studio-feedback is-warn">学生 500 档（示意）· 老师随机 tᵥ：指导方向互相打架</p>
      </section>

      <section className="studio-card tadsr-fixed-panel">
        <p className="studio-heading">时间感知档位</p>
        <div className="studio-photo-wrap"><img src={`./images/${img}.png`} alt={`当前档位 ${ts} 的人脸输出`} /></div>
        <div className="tadsr-fixed-dial"><div className="studio-brass"><div className="studio-needle" style={{ transform: `rotate(${teacherAngle}deg)` }} /></div></div>
        <div className="tadsr-fixed-ghost" aria-label="老师档位跟随学生">
          <span style={{ left: '42%', top: 12, background: '#27446e' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 24, color: '#27446e', fontWeight: 750 }}>老师 tᵥ = λtₛ + γ</div>
        </div>
        <p className="studio-feedback is-good">学生 {ts} 档 · 老师 {tvOf(ts)} 档：同一焦点</p>
      </section>

      <div className="tadsr-fixed-bottom">
        <div style={{ display: 'grid', gap: 8 }}>
          <label className="studio-slider">
            <span>学生档位 tₛ</span><b>{ts}</b>
            <input type="range" min={200} max={600} step={50} value={ts} aria-label="学生档位"
              onChange={e => setTs(Number(e.target.value))} />
          </label>
          <p className="studio-feedback is-paper">{feedback}</p>
        </div>
        <div className="studio-row">
          <button className={`studio-btn ${!aware ? 'is-on' : ''}`} onClick={() => setMode('fixed')}>固定</button>
          <button className={`studio-btn ${aware ? 'is-on' : ''}`} onClick={() => setMode('aware')}>时间感知</button>
        </div>
      </div>
    </div>
  );
}
