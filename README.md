# json-html-kit

Modern TypeScript utilities for rendering arbitrary JSON as safe, themed, human-friendly HTML.

`json-html-kit` is designed for reports, admin tools, demos, documentation pages and support dashboards where a raw JSON tree is too technical, but building a custom view is too slow.

Demo: https://json-html-kit.wasta-wocket.fr/

## Goals

- Render unknown JSON into readable HTML without framework lock-in.
- Escape user data by default.
- Use native `<details>` for collapsible nested structures.
- Detect arrays of objects and render them as tables.
- Provide theme presets plus a CSS variable surface for custom branding.
- Work in browsers, Vite apps, docs sites and server-side HTML generation.

## Install

```bash
npm install json-html-kit
```

## Usage

```ts
import { getThemeCss, renderJsonToHtml } from 'json-html-kit';

const report = {
  customer: 'Ada',
  invoices: [
    { id: 'INV-001', total: 120, paid: true },
    { id: 'INV-002', total: 80, paid: false }
  ]
};

const html = `
  <style>${getThemeCss('clean')}</style>
  ${renderJsonToHtml(report)}
`;
```

## API

### `renderJsonToHtml(value, options?)`

Returns an HTML string.

```ts
renderJsonToHtml(data, {
  theme: 'slate',
  tableMode: 'auto',
  collapseDepth: 2,
  sortKeys: true,
  includeThemeCss: true
});
```

### `renderJsonToElement(value, element, options?)`

Renders directly into a DOM element.

### `createJsonHtmlRenderer(defaultOptions?)`

Creates a renderer with shared defaults.

### `getThemeCss(theme, scopeClass?)`

Returns scoped CSS for one of the built-in themes: `clean`, `slate`, `paper`, `terminal`.

## Custom themes

Presets are only a starting point. You can pass a custom theme object anywhere a preset name is accepted.

Use `createTheme` when you want to keep a preset structure but override a few visual tokens.

```ts
import { createTheme, getThemeCss, renderJsonToHtml } from 'json-html-kit';

const theme = createTheme(
  {
    name: 'brand',
    background: '#f8fbff',
    surface: '#ffffff',
    surfaceAlt: '#edf4ff',
    text: '#172033',
    muted: '#607089',
    border: '#c8d7ef',
    accent: '#7c3aed',
    code: '#0f766e',
    radius: '10px'
  },
  'clean'
);

const html = `
  <style>${getThemeCss(theme)}</style>
  ${renderJsonToHtml(data, {
    theme,
    collapseDepth: 2,
    tableMode: 'auto'
  })}
`;
```

For a fully custom theme, provide every token:

```ts
import type { JsonHtmlTheme } from 'json-html-kit';

const theme: JsonHtmlTheme = {
  name: 'dashboard',
  background: '#0b1020',
  surface: '#121a2f',
  surfaceAlt: '#19233d',
  text: '#eef4ff',
  muted: '#9fb0cc',
  border: '#2b3856',
  accent: '#6ee7b7',
  code: '#fde68a',
  radius: '12px',
  shadow: '0 18px 45px rgba(0, 0, 0, 0.35)',
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  monoFontFamily: '"SFMono-Regular", Consolas, monospace'
};
```

The generated CSS is scoped by default to `.jhk`. Pass a second argument to `getThemeCss(theme, 'my-json-report')` when you need a custom scope class.

## Security

String values and keys are escaped by default. Set `allowHtml: true` only for trusted content.
