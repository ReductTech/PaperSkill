// A compact semantic conclusion, without decorative emoji.
export function InsightBar({ text }: { text: string }) {
  return <div className="insight-bar show" dangerouslySetInnerHTML={{ __html: text }} />;
}
