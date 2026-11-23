import React from 'react';

// One module crashing must not blank the whole tutorial: each widget is mounted
// inside its own boundary, so a broken Canvas or bad state only replaces that module.
class WidgetBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): React.ReactNode {
    if (this.state.failed) {
      return <div className="feedback bad">这个模块没能加载，换一章继续，其余章节不受影响。</div>;
    }
    return this.props.children;
  }
}

type AnyWidget = React.FC<{ chapterId: string; moduleId: string }>;

export function safeWidget(W: AnyWidget): AnyWidget {
  const Guarded: AnyWidget = (props) => (
    <WidgetBoundary>
      <W {...props} />
    </WidgetBoundary>
  );
  return Guarded;
}

export default safeWidget;
