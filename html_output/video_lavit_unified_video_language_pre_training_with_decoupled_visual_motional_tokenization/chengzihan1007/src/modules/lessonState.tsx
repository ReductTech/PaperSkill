import React, { createContext, useContext, useState } from 'react';

export type Segment = 'IMG' | 'MOV' | 'TEXT';
type Preset = { visual: number; motion: number; clips: number };
type LessonContextValue = Preset & {
  segments: Segment[];
  setPreset: (preset: Preset) => void;
  setSegments: (segments: Segment[]) => void;
  setClips: (clips: number) => void;
  setVisualFrames: (frames: number) => void;
};

const LessonContext = createContext<LessonContextValue | null>(null);

export function LessonProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Preset>({ visual: 0, motion: 0, clips: 1 });
  const [segments, updateSegments] = useState<Segment[]>([]);
  const setPreset = (preset: Preset) => {
    setCounts(preset);
    updateSegments([]);
  };
  const setSegments = (next: Segment[]) => {
    updateSegments(next);
    setCounts({
      visual: next.filter((item) => item === 'IMG').length * 90,
      motion: next.filter((item) => item === 'MOV').length * 135,
      clips: Math.max(1, next.filter((item) => item === 'MOV').length),
    });
  };
  const setClips = (clips: number) => setCounts({ visual: clips * 90, motion: clips * 135, clips });
  const setVisualFrames = (frames: number) => setCounts({ visual: frames * 90, motion: 0, clips: frames });
  return <LessonContext.Provider value={{ ...counts, segments, setPreset, setSegments, setClips, setVisualFrames }}>{children}</LessonContext.Provider>;
}

export function useLesson() {
  const state = useContext(LessonContext);
  if (!state) throw new Error('LessonProvider is required');
  return state;
}
