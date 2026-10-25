import React from 'react';

// 每个交互组件外包一层错误边界：单个组件出错时只在原位显示提示，不影响整页。
interface Props {
  name: string;
  children: React.ReactNode;
}
interface State {
  err: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error) {
    console.error(`[${this.props.name}]`, err);
  }

  render() {
    if (this.state.err) {
      return (
        <div className="eb" role="alert">
          <b>这个交互组件暂时无法显示</b>
          <span>（{this.props.name}）其余内容不受影响。</span>
          <button type="button" className="btn" onClick={() => this.setState({ err: null })}>
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
