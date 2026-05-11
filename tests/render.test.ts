import { describe, expect, it } from 'vitest';
import { createTheme, getThemeCss, getThemeStyleTag, renderJsonToHtml } from '../src';

describe('renderJsonToHtml', () => {
  it('escapes unsafe strings by default', () => {
    const html = renderJsonToHtml({ name: '<img src=x onerror=alert(1)>' });

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x');
  });

  it('renders arrays of objects as tables', () => {
    const html = renderJsonToHtml([
      { name: 'Ada', score: 98 },
      { name: 'Grace', score: 99 }
    ]);

    expect(html).toContain('<thead>');
    expect(html).toContain('<th>name</th>');
    expect(html).toContain('<th>score</th>');
    expect(html).toContain('Table(2 rows)');
  });

  it('can limit large arrays', () => {
    const html = renderJsonToHtml([1, 2, 3, 4], { maxArrayItems: 2 });

    expect(html).toContain('Array(4)');
    expect(html).toContain('2 items omitted');
    expect(html).toContain('<td class="jhk-key">0</td>');
    expect(html).not.toContain('<td class="jhk-key">3</td>');
  });

  it('can limit large object key sets', () => {
    const html = renderJsonToHtml({ a: 1, b: 2, c: 3 }, { maxObjectKeys: 2 });

    expect(html).toContain('Object(3)');
    expect(html).toContain('1 item omitted');
    expect(html).toContain('<td class="jhk-key">a</td>');
    expect(html).not.toContain('<td class="jhk-key">c</td>');
  });

  it('can limit table rows separately from array size', () => {
    const html = renderJsonToHtml([
      { name: 'Ada', score: 98 },
      { name: 'Grace', score: 99 },
      { name: 'Katherine', score: 100 }
    ], { tablePageSize: 2 });

    expect(html).toContain('Table(3 rows)');
    expect(html).toContain('1 item omitted');
    expect(html).toContain('Grace');
    expect(html).not.toContain('Katherine');
  });

  it('can truncate long strings', () => {
    const html = renderJsonToHtml({ message: 'abcdefghij' }, { maxStringLength: 4 });

    expect(html).toContain('abcd… (6 characters omitted)');
    expect(html).not.toContain('abcdefghij');
  });

  it('collapses nested structures after the configured depth', () => {
    const html = renderJsonToHtml({ a: { b: { c: true } } }, { collapseDepth: 1 });

    expect(html).toContain('<details open>');
    expect(html).toContain('<details><summary>Object(1)</summary>');
  });

  it('can include scoped theme css', () => {
    const css = getThemeCss('terminal', 'preview-json');

    expect(css).toContain('.preview-json');
    expect(css).toContain('--jhk-accent: #34d399');
  });

  it('can include styles in a standalone html fragment', () => {
    const html = renderJsonToHtml({ ok: true }, { includeStyles: true, theme: 'clean' });

    expect(html).toContain('<style>');
    expect(html).toContain('--jhk-accent: #2563eb');
    expect(html).toContain('<div class="jhk jhk-theme-clean">');
  });

  it('keeps includeThemeCss as a backward-compatible alias', () => {
    const html = renderJsonToHtml({ ok: true }, { includeThemeCss: true, theme: 'paper' });

    expect(html).toContain('<style>');
    expect(html).toContain('--jhk-accent: #b45309');
  });

  it('can return a full style tag for server-side templates', () => {
    const tag = getThemeStyleTag('slate', 'json-report');

    expect(tag).toContain('<style>');
    expect(tag).toContain('.json-report');
    expect(tag).toContain('--jhk-background: #111827');
  });

  it('can create a custom theme from a preset', () => {
    const theme = createTheme({ accent: '#ff3366', radius: '12px' }, 'slate');
    const css = getThemeCss(theme);

    expect(theme.name).toBe('custom');
    expect(theme.background).toBe('#111827');
    expect(css).toContain('--jhk-accent: #ff3366');
    expect(css).toContain('--jhk-radius: 12px');
  });

  it('rejects unsafe scope class names', () => {
    expect(() => getThemeCss('clean', 'x} body { color: red')).toThrow('Invalid json-html-kit scope class');
  });

  it('throws a clear error for unknown theme names in JavaScript', () => {
    expect(() => getThemeCss('missing' as never)).toThrow('Unknown json-html-kit theme "missing"');
  });
});
