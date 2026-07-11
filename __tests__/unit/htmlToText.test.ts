import { htmlToText, firstLine } from '@/lib/htmlToText';

describe('htmlToText (UT-3 / AC-2.5)', () => {
  it('extracts readable text from headings, lists and paragraphs', () => {
    const html = '<h1>Plan</h1><p>Intro</p><ul><li>one</li><li>two</li></ul>';
    expect(htmlToText(html)).toBe('Plan\nIntro\n• one\n• two');
  });

  it('renders checklist state as [x] / [ ] prefixes', () => {
    const html = '<ul data-type="taskList"><li data-checked="true"><p>milk</p></li><li data-checked="false"><p>eggs</p></li></ul>';
    expect(htmlToText(html)).toContain('[x] milk');
    expect(htmlToText(html)).toContain('[ ] eggs');
  });

  it('decodes common entities and drops tags', () => {
    expect(htmlToText('<p>a &amp; b &lt;c&gt;&nbsp;d</p>')).toBe('a & b <c> d');
  });

  it('firstLine returns the first non-empty line', () => {
    expect(firstLine('\n\nhello\nworld')).toBe('hello');
    expect(firstLine('')).toBe('');
  });
});
