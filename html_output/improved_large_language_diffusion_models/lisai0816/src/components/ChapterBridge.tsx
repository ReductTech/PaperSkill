export function ChapterBridge({ text }: { text: string }) {
  if (!text.trim()) return null;
  return <div className="script-copy" dangerouslySetInnerHTML={{ __html: text }} />;
}
