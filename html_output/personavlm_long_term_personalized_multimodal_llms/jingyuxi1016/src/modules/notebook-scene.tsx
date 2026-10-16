import React from 'react';
import type { WidgetProps } from './registry';
import { NotebookScene } from './pvKit';
export function NotebookWidget(props: WidgetProps) { return <NotebookScene {...props} />; }
