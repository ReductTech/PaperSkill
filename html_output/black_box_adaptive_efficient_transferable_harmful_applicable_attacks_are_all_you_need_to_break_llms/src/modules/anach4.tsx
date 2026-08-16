import React from 'react';
import type { WidgetProps } from './registry';

export const AnaCh4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <img
      id={`cv-${chapterId}-${moduleId}`}
      src={`${import.meta.env.BASE_URL}images/high-danger.png`}
      alt="门缝 vs 真打开"
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

export default AnaCh4;
