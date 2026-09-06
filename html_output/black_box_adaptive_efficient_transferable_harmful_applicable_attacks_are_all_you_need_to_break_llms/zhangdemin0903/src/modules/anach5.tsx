import React from 'react';
import type { WidgetProps } from './registry';

export const AnaCh5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <img
      id={`cv-${chapterId}-${moduleId}`}
      src={`${import.meta.env.BASE_URL}images/getting-stronger.png`}
      alt="成对打磨，越练越强"
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

export default AnaCh5;
