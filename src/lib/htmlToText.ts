const BLOCK_END = /<\/(p|div|h1|h2|h3|li|blockquote|pre|tr)>/gi;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

// Plain-text projection of editor HTML — feeds notes.body_text and FTS (AC-2.5).
export function htmlToText(html: string): string {
  let text = html
    .replace(/<li[^>]*data-checked="true"[^>]*>/gi, '[x] ')
    .replace(/<li[^>]*data-checked="false"[^>]*>/gi, '[ ] ')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCK_END, '\n')
    .replace(/<[^>]+>/g, '');
  text = text.replace(/&[a-zA-Z#0-9]+;/g, (e) => ENTITIES[e.toLowerCase()] ?? e);
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function firstLine(text: string): string {
  return text.split('\n').find((l) => l.trim().length > 0)?.trim() ?? '';
}
