import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary: catches rendering errors in child widgets (e.g. Canvas 2D context
 * unavailable) and shows a notice instead of blanking the whole page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] widget render failed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="feedback bad" style={{ marginTop: 12 }}>
          该交互组件加载失败：{this.state.error?.message ?? '未知错误'}
          <br />
          <span style={{ opacity: 0.7, fontSize: '0.9em' }}>
            页面其余内容不受影响，可继续阅读。
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}
