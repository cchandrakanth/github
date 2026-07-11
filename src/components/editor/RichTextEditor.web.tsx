import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { htmlToText } from '@/lib/htmlToText';

interface Props {
  initialHtml: string;
  onChangeHtml: (html: string) => void;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function textToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

// Web fallback editor (v1): plain text editing; rich formatting is native-only.
// Formatting from mobile is preserved unless the note body is edited here.
export function RichTextEditor({ initialHtml, onChangeHtml }: Props) {
  const initialText = useRef(htmlToText(initialHtml));
  const [text, setText] = useState(initialText.current);
  const dirty = useRef(false);

  return (
    <View className="flex-1">
      <TextInput
        testID="web-editor"
        multiline
        className="flex-1 px-4 py-2 text-base text-foreground"
        value={text}
        placeholder="Start writing…"
        onChangeText={(t) => {
          dirty.current = true;
          setText(t);
          onChangeHtml(textToHtml(t));
        }}
      />
    </View>
  );
}
