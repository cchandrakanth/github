import { sanitizeHtml } from '@/lib/sanitizeHtml';

describe('sanitizeHtml (UT-2 / AC-2.4)', () => {
  it('strips script blocks and event handlers, keeps formatting', () => {
    expect(sanitizeHtml('<b>hi</b><script>x()</script><p onclick="x">p</p>')).toBe('<b>hi</b><p>p</p>');
  });

  it('removes iframe/object/embed entirely including content', () => {
    expect(sanitizeHtml('<p>a</p><iframe src="https://evil"></iframe><object>x</object>')).toBe('<p>a</p>');
  });

  it('keeps checklist structure with data attributes', () => {
    const input = '<ul data-type="taskList"><li data-checked="true"><p>done</p></li></ul>';
    expect(sanitizeHtml(input)).toBe('<ul data-type="taskList"><li data-checked="true"><p>done</p></li></ul>');
  });

  it('drops javascript: links but keeps https links', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(sanitizeHtml('<a href="https://example.com">x</a>')).toBe('<a href="https://example.com">x</a>');
  });

  it('drops non-checkbox inputs, keeps checkbox inputs', () => {
    expect(sanitizeHtml('<input type="text" value="x">')).toBe('');
    expect(sanitizeHtml('<input type="checkbox" checked>')).toBe('<input type="checkbox" checked />');
  });

  it('strips style attributes and unknown tags but keeps their text', () => {
    expect(sanitizeHtml('<p style="color:red">a</p><marquee>b</marquee>')).toBe('<p>a</p>b');
  });
});
