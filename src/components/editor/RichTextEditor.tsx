import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { RichText, Toolbar, useEditorBridge, useEditorContent, DEFAULT_TOOLBAR_ITEMS, TenTapStartKit } from '@10play/tentap-editor';

interface Props {
  initialHtml: string;
  onChangeHtml: (html: string) => void;
}

// Native WYSIWYG editor (TipTap in a WebView). Web uses RichTextEditor.web.tsx.
export function RichTextEditor({ initialHtml, onChangeHtml }: Props) {
  const editor = useEditorBridge({
    initialContent: initialHtml || '<p></p>',
    avoidIosKeyboard: true,
    bridgeExtensions: TenTapStartKit,
  });
  const content = useEditorContent(editor, { type: 'html' });

  useEffect(() => {
    if (typeof content === 'string') onChangeHtml(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <View className="flex-1">
      <RichText editor={editor} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="border-t border-border bg-background">
          <Toolbar editor={editor} items={DEFAULT_TOOLBAR_ITEMS} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
