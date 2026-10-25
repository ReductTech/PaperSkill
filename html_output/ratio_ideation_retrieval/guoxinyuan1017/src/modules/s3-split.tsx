import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS3 } from '../screens/s3.mount';
import html from '../screens/s3.html?raw';

// S3 — 切分：时间三段、一个共享池、两个 pilot 陷阱。
export const S3Split: React.FC = () => <ScreenHost html={html} mount={mountS3} />;
