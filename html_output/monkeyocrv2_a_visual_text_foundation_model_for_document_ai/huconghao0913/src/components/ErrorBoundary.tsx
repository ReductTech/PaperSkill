import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '32px',
          margin: '16px',
          borderRadius: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>渲染出错</h3>
          <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#b91c1c' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d' }}>
            请刷新页面重试。如问题持续存在，请检查浏览器控制台。
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
