// Allow-list HTML sanitizer for editor output (AC-2.4). Not a general-purpose
// sanitizer: input is our own editor's HTML, sanitized again on save as defense
// in depth. Unknown tags are dropped, disallowed attributes stripped.
const ALLOWED_TAGS = new Set([
  'p', 'div', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'h1', 'h2', 'h3',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'a', 'input', 'label',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['data-type', 'data-checked']),
  a: new Set(['href']),
  input: new Set(['type', 'checked', 'disabled']),
};

function sanitizeAttrs(tag: string, rawAttrs: string): string {
  const out: string[] = [];
  const attrRe = /([a-zA-Z][a-zA-Z0-9-]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s>]*))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(rawAttrs))) {
    const name = m[1].toLowerCase();
    const allowed = ALLOWED_ATTRS['*'].has(name) || ALLOWED_ATTRS[tag]?.has(name);
    if (!allowed) continue;
    let value = m[2] ?? '';
    value = value.replace(/^["']|["']$/g, '');
    if (tag === 'a' && name === 'href' && !/^https?:\/\//i.test(value)) continue;
    if (tag === 'input' && name === 'type' && value.toLowerCase() !== 'checkbox') return '__DROP__';
    out.push(value === '' ? name : `${name}="${value.replace(/"/g, '&quot;')}"`);
  }
  return out.length ? ' ' + out.join(' ') : '';
}

export function sanitizeHtml(html: string): string {
  let out = html
    .replace(/<(script|style|iframe|object|embed|svg|math|form)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math|form)\b[^>]*\/?>/gi, '');

  out = out.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (_all, close, rawTag, rawAttrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (close) return `</${tag}>`;
    const attrs = sanitizeAttrs(tag, rawAttrs);
    if (attrs === '__DROP__') return '';
    const selfClose = tag === 'br' || tag === 'input' ? ' /' : '';
    return `<${tag}${attrs}${selfClose}>`;
  });

  return out.replace(/<[^a-zA-Z/][^>]*>/g, '');
}
