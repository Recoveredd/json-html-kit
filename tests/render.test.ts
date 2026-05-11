import { describe, expect, it } from 'vitest';
import { createTheme, getThemeCss, renderJsonToHtml } from '../src';

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

  it('can create a custom theme from a preset', () => {
    const theme = createTheme({ accent: '#ff3366', radius: '12px' }, 'slate');
    const css = getThemeCss(theme);

    expect(theme.name).toBe('custom');
    expect(theme.background).toBe('#111827');
    expect(css).toContain('--jhk-accent: #ff3366');
    expect(css).toContain('--jhk-radius: 12px');
  });
});
