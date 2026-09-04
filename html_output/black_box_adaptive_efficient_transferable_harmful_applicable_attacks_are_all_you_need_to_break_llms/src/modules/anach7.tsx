import React from 'react';
import type { WidgetProps } from './registry';

export const AnaCh7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <img
      id={`cv-${chapterId}-${moduleId}`}
      src={`${import.meta.env.BASE_URL}images/full-pipeline.png`}
      alt="全流程工具台"
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

export default AnaCh7;
