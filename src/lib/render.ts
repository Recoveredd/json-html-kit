import { escapeHtml, safeText } from './escape';
import { getThemePreset, getThemeStyleTag, injectThemeCss } from './themes';
import type { JsonHtmlRenderer, JsonHtmlRenderOptions, JsonValue } from './types';

type ResolvedRenderOptions = Required<Omit<JsonHtmlRenderOptions, 'className' | 'theme' | 'styleId' | 'includeThemeCss' | 'includeStyles'>> & {
  includeStyles: boolean;
};

const DEFAULT_OPTIONS: ResolvedRenderOptions = {
  includeStyles: false,
  scopeClass: 'jhk',
  tableMode: 'auto',
  collapseDepth: 2,
  maxDepth: 12,
  sortKeys: false,
  allowHtml: false,
  emptyValueLabel: 'Empty'
};

export function renderJsonToHtml(value: unknown, options: JsonHtmlRenderOptions = {}): string {
  const settings = resolveRenderOptions(options);
  const theme = getThemePreset(options.theme);
  const classes = [
    settings.scopeClass,
    `jhk-theme-${theme.name}`,
    options.className
  ].filter(Boolean).join(' ');

  const body = renderValue(toJsonValue(value), settings, 0, 'root');
  const style = settings.includeStyles ? getThemeStyleTag(theme, settings.scopeClass) : '';

  return `${style}<div class="${escapeHtml(classes)}"><div class="jhk-root">${body}</div></div>`;
}

export function renderJsonToElement(value: unknown, element: Element, options: JsonHtmlRenderOptions = {}): void {
  const includeStyles = options.includeStyles ?? options.includeThemeCss ?? true;
  const settings = resolveRenderOptions({ ...options, includeStyles });
  const theme = getThemePreset(options.theme);

  if (settings.includeStyles) {
    injectThemeCss(element.ownerDocument, {
      theme,
      scopeClass: settings.scopeClass,
      styleId: options.styleId
    });
  }

  element.innerHTML = renderJsonToHtml(value, {
    ...options,
    includeStyles: false,
    includeThemeCss: false
  });
}

export function createJsonHtmlRenderer(defaultOptions: JsonHtmlRenderOptions = {}): JsonHtmlRenderer {
  return {
    render(value, options) {
      return renderJsonToHtml(value, { ...defaultOptions, ...options });
    },
    renderToElement(value, element, options) {
      renderJsonToElement(value, element, { ...defaultOptions, ...options });
    }
  };
}

function resolveRenderOptions(options: JsonHtmlRenderOptions): ResolvedRenderOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    includeStyles: options.includeStyles ?? options.includeThemeCss ?? DEFAULT_OPTIONS.includeStyles
  };
}

function renderValue(
  value: JsonValue,
  options: ResolvedRenderOptions,
  depth: number,
  label: string
): string {
  if (depth > options.maxDepth) {
    return `<span class="jhk-empty">${escapeHtml(options.emptyValueLabel)}</span>`;
  }

  if (value === null) {
    return '<span class="jhk-primitive jhk-null">null</span>';
  }

  if (Array.isArray(value)) {
    return renderArray(value, options, depth, label);
  }

  if (typeof value === 'object') {
    return renderObject(value, options, depth, label);
  }

  const className = `jhk-primitive jhk-${typeof value}`;
  return `<span class="${className}">${safeText(formatPrimitive(value), options.allowHtml)}</span>`;
}

function renderArray(
  values: JsonValue[],
  options: ResolvedRenderOptions,
  depth: number,
  label: string
): string {
  if (values.length === 0) {
    return `<span class="jhk-empty">${escapeHtml(options.emptyValueLabel)} array</span>`;
  }

  if (shouldRenderTable(values, options.tableMode)) {
    return renderArrayTable(values as Array<Record<string, JsonValue>>, options, depth);
  }

  const rows = values.map((item, index) => `
    <tr>
      <td class="jhk-key">${index}</td>
      <td class="jhk-value">${renderValue(item, options, depth + 1, `${label}.${index}`)}</td>
    </tr>
  `).join('');

  return wrapNested(`Array(${values.length})`, `<table><tbody>${rows}</tbody></table>`, options, depth);
}

function renderObject(
  value: Record<string, JsonValue>,
  options: ResolvedRenderOptions,
  depth: number,
  label: string
): string {
  const keys = Object.keys(value);

  if (keys.length === 0) {
    return `<span class="jhk-empty">${escapeHtml(options.emptyValueLabel)} object</span>`;
  }

  const orderedKeys = options.sortKeys ? keys.sort((a, b) => a.localeCompare(b)) : keys;
  const rows = orderedKeys.map((key) => `
    <tr>
      <td class="jhk-key">${escapeHtml(key)}</td>
      <td class="jhk-value">${renderValue(value[key], options, depth + 1, `${label}.${key}`)}</td>
    </tr>
  `).join('');

  return wrapNested(`Object(${keys.length})`, `<table><tbody>${rows}</tbody></table>`, options, depth);
}

function renderArrayTable(
  rows: Array<Record<string, JsonValue>>,
  options: ResolvedRenderOptions,
  depth: number
): string {
  const headers = collectHeaders(rows, options.sortKeys);
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows.map((row) => {
    const cells = headers.map((header) => {
      const cell = Object.hasOwn(row, header) ? row[header] : null;
      return `<td class="jhk-value">${renderValue(cell, options, depth + 1, header)}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('');

  return wrapNested(`Table(${rows.length} rows)`, `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`, options, depth);
}

function wrapNested(
  summary: string,
  content: string,
  options: ResolvedRenderOptions,
  depth: number
): string {
  const open = depth < options.collapseDepth ? ' open' : '';

  return `<details${open}><summary>${escapeHtml(summary)}</summary><div class="jhk-nested">${content}</div></details>`;
}

function shouldRenderTable(values: JsonValue[], mode: string): boolean {
  if (mode === 'never') {
    return false;
  }

  if (!values.every(isPlainObject)) {
    return false;
  }

  if (mode === 'always') {
    return true;
  }

  const rows = values as Array<Record<string, JsonValue>>;
  const scalarCells = rows.flatMap((row) => Object.values(row)).filter(isScalar).length;
  const totalCells = rows.reduce((count, row) => count + Object.keys(row).length, 0);

  return totalCells > 0 && scalarCells / totalCells >= 0.6;
}

function collectHeaders(rows: Array<Record<string, JsonValue>>, sortKeys: boolean): string[] {
  const headers = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headers.add(key);
    }
  }

  const list = [...headers];
  return sortKeys ? list.sort((a, b) => a.localeCompare(b)) : list;
}

function formatPrimitive(value: string | number | boolean): string {
  return typeof value === 'string' ? value : String(value);
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as JsonValue;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, toJsonValue(nested)]);
    return Object.fromEntries(entries) as JsonValue;
  }

  return String(value);
}

function isPlainObject(value: JsonValue): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isScalar(value: JsonValue): boolean {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}
