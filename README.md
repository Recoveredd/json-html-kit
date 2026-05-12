# json-html-kit

[![CI](https://github.com/Recoveredd/json-html-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/Recoveredd/json-html-kit/actions/workflows/ci.yml)

Modern TypeScript utilities for rendering arbitrary JSON as safe, themed, human-friendly HTML.

`json-html-kit` is designed for reports, admin tools, demos, documentation pages and support dashboards where a raw JSON tree is too technical, but building a custom view is too slow.

Demo: https://packages.wasta-wocket.fr/json-html-kit

## Package quality

- TypeScript types are generated from the source.
- ESM-only package with no runtime dependencies.
- Marked as side-effect free for bundlers.
- Tested on Node.js 20 and 22 with GitHub Actions.
- Designed to work without framework lock-in.

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

Render a standalone HTML fragment with styles included:

```ts
import { renderJsonToHtml } from 'json-html-kit';

const report = {
  customer: 'Ada',
  invoices: [
    { id: 'INV-001', total: 120, paid: true },
    { id: 'INV-002', total: 80, paid: false }
  ]
};

const html = renderJsonToHtml(report, {
  theme: 'clean',
  includeStyles: true
});
```

Render into an existing page:

```ts
import { renderJsonToElement } from 'json-html-kit';

const container = document.querySelector('#report');

if (container) {
  renderJsonToElement(report, container, {
    theme: 'clean'
  });
}
```

## Ecosystem recipes

`json-html-kit` works well as the final rendering step for data produced by small parsing utilities.

Render terminal table output as browsable JSON:

```ts
import { renderJsonToHtml } from 'json-html-kit';
import { parseTerminalTable } from 'terminal-table-kit';

const rows = parseTerminalTable(psOutput, {
  keyStyle: 'camel'
});

const html = renderJsonToHtml(rows, {
  theme: 'clean',
  tableMode: 'auto'
});
```

Inspect unknown JSON structure before rendering it:

```ts
import { getPathEntries } from 'object-key-paths';
import { renderJsonToHtml } from 'json-html-kit';

const html = renderJsonToHtml(getPathEntries(payload), {
  theme: 'clean',
  tableMode: 'auto'
});
```

For report tables, use `array-table-kit` when you need Markdown or plain HTML table output instead of a nested JSON viewer.

For CSV exports from the same records, use `json-csv-kit`:

```ts
import { jsonToCsv } from 'json-csv-kit';
import { renderJsonToHtml } from 'json-html-kit';

const html = renderJsonToHtml(rows, {
  theme: 'clean',
  tableMode: 'auto'
});

const csv = jsonToCsv(rows);
```

## API

### `renderJsonToHtml(value, options?)`

Returns an HTML string.

```ts
renderJsonToHtml(data, {
  theme: 'slate',
  tableMode: 'auto',
  collapseDepth: 2,
  maxArrayItems: 100,
  maxObjectKeys: 100,
  maxStringLength: 2000,
  tablePageSize: 50,
  sortKeys: true,
  includeStyles: true
});
```

### `renderJsonToElement(value, element, options?)`

Renders directly into a DOM element and injects the selected theme CSS into the document once by default. Pass `includeStyles: false` if your app already loads the theme CSS.

### `createJsonHtmlRenderer(defaultOptions?)`

Creates a renderer with shared defaults.

### `getThemeCss(theme, scopeClass?)`

Returns scoped CSS for one of the built-in themes: `clean`, `slate`, `paper`, `terminal`.

### `getThemeStyleTag(theme, scopeClass?)`

Returns a complete `<style>` tag for server-side templates or static HTML generation.

### `injectThemeCss(target, options?)`

Injects or updates a scoped theme `<style>` tag in a browser document.

### `createJsonHtmlViewer(element, value, options?)`

Creates a small DOM viewer with optional top-level array pagination.

```ts
import { createJsonHtmlViewer } from 'json-html-kit';

const viewer = createJsonHtmlViewer(container, hugeRows, {
  theme: 'clean',
  pageSize: 100
});

viewer.nextPage();
viewer.setPage(10);
viewer.destroy();
```

The viewer is intentionally separate from `renderJsonToHtml`. The renderer stays static and string-based; the viewer owns DOM state for pagination.

## Custom themes

Presets are only a starting point. You can pass a custom theme object anywhere a preset name is accepted.

Use `createTheme` when you want to keep a preset structure but override a few visual tokens.

```ts
import { createTheme, getThemeStyleTag, renderJsonToHtml } from 'json-html-kit';

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
  ${getThemeStyleTag(theme)}
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

## Large JSON

`json-html-kit` renders static HTML. For huge API responses or log-like JSON, keep rendering bounded with limits:

```ts
const html = renderJsonToHtml(largePayload, {
  maxArrayItems: 100,
  maxObjectKeys: 100,
  maxStringLength: 2000,
  tablePageSize: 50
});
```

These limits do not mutate your data. They only control how much HTML is generated:

- `maxArrayItems` limits rendered items in regular arrays.
- `maxObjectKeys` limits rendered keys in large objects.
- `maxStringLength` truncates very long strings.
- `tablePageSize` limits rendered rows when an array of objects is displayed as a table.

When content is omitted, the renderer adds a summary row such as `124 items omitted`.

For full top-level array browsing, use the DOM viewer:

```ts
createJsonHtmlViewer(container, hugeRows, {
  pageSize: 100
});
```

## Security

String values and keys are escaped by default. Set `allowHtml: true` only for trusted content.
