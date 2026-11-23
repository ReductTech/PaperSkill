import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

const STOPS = [200, 400, 500, 600] as const;
const IMAGES = ['face-2', 'face-3', 'face-4', 'face-5'];

export function TadsrCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const raw = isNew ? Math.min(3, Math.floor(progress * 4)) : 2;
  const index = Math.max(0, Math.min(3, raw));
  const t = STOPS[index];
  const angle = isNew ? -120 + index * 80 : 0;
  const teacher = isNew ? t / 2 : 300;
  const fidelity = isNew ? [86, 72, 60, 64][index] : 58;
  const realism = isNew ? [32, 52, 74, 70][index] : 64;

  return (
    <div className="tadsr-cover">
      <div className="tadsr-cover-bench">
        <div className="tadsr-cover-photo">
          <img src={`./images/${IMAGES[index]}.png`} alt={`论文中 ${t} 档位的人脸修复示例`} />
        </div>
        <div className="tadsr-cover-dial">
          <div className="studio-brass">
            <div className="studio-needle" style={{ transform: `rotate(${angle}deg)` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '44%', textAlign: 'center', fontSize: 20, fontWeight: 850, color: '#5d3e20' }}>
              {isNew ? `tₛ ${t}` : 'tₛ 500'}
            </div>
          </div>
        </div>
        <div className="tadsr-cover-result">
          <div className="studio-big">{isNew ? '档位在动' : '档位锁死'}</div>
          <div className="tadsr-cover-meter">
            <b>保真</b>
            <div className="studio-meter"><span style={{ width: `${fidelity}%`, background: '#27446e' }} /></div>
          </div>
          <div className="tadsr-cover-meter">
            <b>真实感</b>
            <div className="studio-meter"><span style={{ width: `${realism}%`, background: '#228d5c' }} /></div>
          </div>
        </div>
        <div className="tadsr-cover-note">
          {isNew ? `老师档位 tᵥ≈${Math.round(teacher)}，跟着学生一起换灯` : '学生只在一个档位工作，老师却在随机档位给意见'}
        </div>
      </div>
    </div>
  );
}
