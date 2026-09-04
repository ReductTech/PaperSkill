import React from 'react';

interface LabPlaybackProps {
  progress: number;
  playing: boolean;
  label: string;
  onToggle: () => void;
  onReplay: () => void;
  onScrub: (progress: number) => void;
}

export function LabPlayback({ progress, playing, label, onToggle, onReplay, onScrub }: LabPlaybackProps) {
  return (
    <div className="mvl-lab-playback">
      <label>
        <span>{label}</span>
        <input
          type="range"
          min="0"
          max="1000"
          step="1"
          value={Math.round(progress * 1000)}
          onChange={(event) => onScrub(Number(event.target.value) / 1000)}
        />
      </label>
      <div className="mvl-lab-playback-actions">
        <button className="tiny" onClick={onToggle}>{playing ? '暂停' : '继续播放'}</button>
        <button className="tiny ghost" onClick={onReplay}>从头重播</button>
      </div>
    </div>
  );
}

interface StageRailProps {
  labels: string[];
  active: number;
  onSelect?: (index: number) => void;
  tone?: 'codec' | 'rope' | 'stream';
}

export function StageRail({ labels, active, onSelect, tone = 'codec' }: StageRailProps) {
  return (
    <div className={`mvl-stage-rail tone-${tone}`} role="group" aria-label="实验阶段">
      {labels.map((label, index) => onSelect ? (
        <button
          key={label}
          className={`mvl-stage-step ${index === active ? 'active' : index < active ? 'done' : ''}`}
          aria-pressed={index === active}
          onClick={() => onSelect(index)}
        >
          <i>{index + 1}</i><span>{label}</span>
        </button>
      ) : (
        <div key={label} className={`mvl-stage-step ${index === active ? 'active' : index < active ? 'done' : ''}`}>
          <i>{index + 1}</i><span>{label}</span>
        </div>
      ))}
    </div>
  );
}
