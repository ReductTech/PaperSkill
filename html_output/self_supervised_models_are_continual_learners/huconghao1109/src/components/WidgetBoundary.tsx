import React from 'react';

/**
 * 单个 Canvas 组件出错时只替换该组件，不让整页白屏。
 */
export class WidgetBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // 静默降级：错误信息不回显到页面，避免打断阅读。
  }

  render() {
    if (this.state.failed) {
      return <div className="feedback bad">这个交互组件加载失败，不影响其余内容阅读。</div>;
    }
    return this.props.children;
  }
}
