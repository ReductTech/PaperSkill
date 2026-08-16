import React from 'react';
import type { WidgetProps } from './registry';

export const AnaCh3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <img
      id={`cv-${chapterId}-${moduleId}`}
      src="/images/bidirectional.png"
      alt="按标签双向填空"
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

export default AnaCh3;
