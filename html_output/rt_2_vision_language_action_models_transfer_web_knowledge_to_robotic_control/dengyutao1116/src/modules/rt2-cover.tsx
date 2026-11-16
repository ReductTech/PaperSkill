import React from 'react';
import type { WidgetProps } from './registry';
import { Svg } from './kit';

const COMIC: Record<'old' | 'new', string> = {
  old: './images/comic/rt2-cover-old.png',
  new: './images/comic/rt2-cover-new.png',
};

// Cover: one two-panel watercolour comic instead of two schematic diagrams.
// The left panel shows a VLM producing words while the arm stays still; the
// right panel shows the same arm executing a strawberry pick from action tokens.
export const CoverWidget: React.FC<WidgetProps> = ({ moduleId }) => {
  const side = moduleId === 'new' ? 'new' : 'old';
  return (
    <Svg w={560} h={246} label={side === 'new' ? 'RT-2 把动作写成 token，机械臂完成抓取' : '纯语言模型只会输出词句，机械臂不动'}>
      <image
        href={COMIC[side]}
        x={0}
        y={0}
        width={560}
        height={246}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      />
    </Svg>
  );
};

export default CoverWidget;
