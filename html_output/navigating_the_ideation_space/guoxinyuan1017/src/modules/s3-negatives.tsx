import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS3 } from '../screens/s3.mount';
import html from '../screens/s3.html?raw';

// S3 screen — markup and behaviour ported from the single-file prototype.
export const S3Negatives: React.FC = () => <ScreenHost html={html} mount={mountS3} />;
