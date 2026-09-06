import React from 'react';
import type { WidgetProps } from './registry';

export const AnaCh8: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <img
      id={`cv-${chapterId}-${moduleId}`}
      src={`${import.meta.env.BASE_URL}images/experiment.png`}
      alt="同一套工具开不同强度的锁"
      width={244}
      height={130}
      style={{
        width: 244,
        height: 130,
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        borderRadius: 6,
        background: '#f5f8f0',
      }}
    />
  );
};

export default AnaCh8;
