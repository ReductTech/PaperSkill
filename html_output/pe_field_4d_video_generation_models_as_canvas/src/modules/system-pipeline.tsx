import React from 'react';
import type { WidgetProps } from './registry';

export const SystemPipeline: React.FC<WidgetProps> = () => (
  <figure className="system-pipeline-fixed">
    <img
      className="system-pipeline-fixed-svg"
      src="./images/pe-field-4d-fixed-layout.svg"
      alt="PE-Field 4D完整数据流"
    />
    <img
      className="system-pipeline-fixed-raster system-pipeline-fixed-noise"
      src="./images/pe-field-target-noise.png"
      alt=""
      aria-hidden="true"
    />
    <span className="system-pipeline-fixed-raster system-pipeline-fixed-reference" aria-hidden="true">
      <img src="./images/person-drinking-cola-turntable-v3.png" alt="" />
    </span>
  </figure>
);

export default SystemPipeline;
