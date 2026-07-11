import { Pressable, Text } from 'react-native';
import { HIGHLIGHT_CLOSE, HIGHLIGHT_OPEN, type SearchResult } from '@/db/repositories/searchRepo';

// Splits snippet text on ⟪…⟫ markers into alternating normal/highlighted spans.
export function renderHighlighted(text: string, highlightClass: string, baseClass: string) {
  const parts = text.split(new RegExp(`${HIGHLIGHT_OPEN}([^${HIGHLIGHT_CLOSE}]*)${HIGHLIGHT_CLOSE}`, 'g'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} className={highlightClass}>
        {part}
      </Text>
    ) : (
      <Text key={i} className={baseClass}>
        {part}
      </Text>
    ),
  );
}

function highlightTitle(title: string, query: string): string {
  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  let out = title;
  for (const term of terms) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(${esc})`, 'ig'), `${HIGHLIGHT_OPEN}$1${HIGHLIGHT_CLOSE}`);
  }
  return out;
}

interface Props {
  result: SearchResult;
  query: string;
  onPress: (noteId: string) => void;
}

export function SearchResultRow({ result, query, onPress }: Props) {
  return (
    <Pressable
      testID={`search-result-${result.noteId}`}
      accessibilityRole="button"
      accessibilityLabel={result.title || 'Untitled'}
      className="gap-1 border-b border-border px-4 py-3"
      onPress={() => onPress(result.noteId)}
    >
      <Text numberOfLines={1} className="text-base font-semibold text-foreground">
        {renderHighlighted(highlightTitle(result.title || 'Untitled', query), 'bg-primary/20 rounded-sm font-bold', '')}
      </Text>
      {result.snippet.length > 0 && (
        <Text numberOfLines={2} className="text-sm text-muted-foreground">
          {renderHighlighted(result.snippet, 'bg-primary/20 rounded-sm text-foreground', '')}
        </Text>
      )}
      {result.folderName ? <Text className="text-xs text-muted-foreground">{result.folderName}</Text> : null}
    </Pressable>
  );
}
