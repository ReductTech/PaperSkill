import React from 'react';
import type { WidgetProps } from './registry';

export const AnaCh2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <img
      id={`cv-${chapterId}-${moduleId}`}
      src="/images/tools-vs-skill.png"
      alt="换工具还是练手法"
      width={244}
      height={130}
      style={{
        width: 244,
        height: 130,
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
        borderRadius: 6,
        background: '#f5f8f0',
      }}
    />
  );
};

export default AnaCh2;
