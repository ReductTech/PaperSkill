// Insight bar (💡). Rendered only when a chapter supplies `insight`.
export function InsightBar({ text }: { text: string }) {
  return <div className="insight-bar show" dangerouslySetInnerHTML={{ __html: text }} />;
}
