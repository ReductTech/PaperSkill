import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { FrameStrip, PhotoCard, Room } from './sceneKit';

type Mode = 'imagesOnly' | 'withClip';

function PlateStack({ lifted }: { lifted: boolean }) {
  const plates = [0, 1, 2, 3];
  return (
    <g aria-hidden="true">
      <rect x="40" y="352" width="300" height="14" rx="4" fill="#d8c9ad" />
      <rect x="60" y="366" width="12" height="48" fill="#c8b795" />
      <rect x="308" y="366" width="12" height="48" fill="#c8b795" />
      {plates.map(index => {
        const isBottom = index === 3;
        if (isBottom && lifted) return null;
        return (
          <g key={index} transform={`translate(190 ${334 - index * 21})`}>
            <ellipse cx="0" cy="0" rx="84" ry="18" fill="#ffffff" stroke="#b9c2d0" strokeWidth="3" />
            <ellipse cx="0" cy="-7" rx="84" ry="18" fill="#f7f8f4" stroke="#b9c2d0" strokeWidth="2" />
          </g>
        );
      })}
      {lifted ? (
        <g>
          <path d="M190 96 L190 150" stroke="#e5ae78" strokeWidth="10" strokeLinecap="round" />
          <circle cx="190" cy="88" r="13" fill="#e5ae78" />
          <ellipse cx="190" cy="168" rx="84" ry="18" fill="#ffffff" stroke="#f07e47" strokeWidth="4" />
          <ellipse cx="190" cy="161" rx="84" ry="18" fill="#fdf1e8" stroke="#f07e47" strokeWidth="3" />
        </g>
      ) : (
        <g>
          <text x="190" y="196" textAnchor="middle" fontSize="24" fill="#68778f">四只盘子叠在桌上</text>
          <path d="M190 228 V300" stroke="#c43f52" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#s6-arrow)" />
          <text x="216" y="292" fontSize="26" fontWeight="700" fill="#c43f52">会一起掉吗？</text>
          <defs>
            <marker id="s6-arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="#c43f52" />
            </marker>
          </defs>
        </g>
      )}
    </g>
  );
}

export function S6Integrate(_props: WidgetProps) {
  const [mode, setMode] = useState<Mode>('imagesOnly');
  const withClip = mode === 'withClip';
  return (
    <div className="ps-page s6-page">
      <div className="ps-scene">
        <svg viewBox="0 0 640 480" role="img" aria-label={withClip ? '生成片段显示其余盘子留在原处' : '只看原图时判断盘子会一起掉落'}>
          <Room />
          <PlateStack lifted={withClip} />
          <PhotoCard x={418} y={54} w={168} h={104} label="照片 1" rotation={-2} variant="a" />
          <PhotoCard x={418} y={244} w={168} h={104} label="照片 2" rotation={2} variant="shifted" />
        </svg>
      </div>
      <div className="ps-right">
        <div className="ps-question">抽出最下面的盘子后，上面三个盘子会怎样？</div>
        <div className="ps-strip">
          <svg viewBox="0 0 520 170" role="img" aria-label="生成的三帧片段">
            <FrameStrip x={6} y={6} labels={['抽出底盘', '一瞬间', '结果']}
              states={withClip ? ['ok', 'ok', 'ok'] : ['bad', 'bad', 'bad']} width={156} height={100} dashed={!withClip} />
          </svg>
        </div>
        <div className="ps-answers">
          <button className={`ps-answer ${!withClip ? 'is-bad' : ''}`} onClick={() => setMode('imagesOnly')}>
            <span className="ps-answer-label">只看原图</span>
            <span className="ps-answer-value">一起掉落</span>
          </button>
          <button className={`ps-answer ${withClip ? 'is-good' : ''}`} onClick={() => setMode('withClip')}>
            <span className="ps-answer-label">加上生成视频</span>
            <span className="ps-answer-value">留在原处</span>
          </button>
        </div>
        <div className={`ps-feedback ${withClip ? 'is-success' : 'is-fail'}`} aria-live="polite">
          {withClip ? '生成的片段显示其余盘子保持原位，答案随之改写。' : '只看两张照片，很容易以为整摞都会垮掉。'}
        </div>
      </div>
    </div>
  );
}
