import { escapeHtml, safeText } from './escape.js';
import { getThemePreset, getThemeStyleTag, injectThemeCss } from './themes.js';
import type { JsonHtmlRenderer, JsonHtmlRenderOptions } from './types.js';

type ResolvedRenderOptions = Required<Omit<JsonHtmlRenderOptions, 'className' | 'theme' | 'styleId' | 'includeThemeCss' | 'includeStyles'>> & {
  includeStyles: boolean;
};

const DEFAULT_OPTIONS: ResolvedRenderOptions = {
  includeStyles: false,
  scopeClass: 'jhk',
  tableMode: 'auto',
  collapseDepth: 2,
  maxDepth: 12,
  maxArrayItems: Number.POSITIVE_INFINITY,
  maxObjectKeys: Number.POSITIVE_INFINITY,
  maxStringLength: Number.POSITIVE_INFINITY,
  tablePageSize: Number.POSITIVE_INFINITY,
  sortKeys: false,
  allowHtml: false,
  emptyValueLabel: 'Empty',
  omittedItemsLabel: 'omitted'
};

export function renderJsonToHtml(value: unknown, options: JsonHtmlRenderOptions = {}): string {
  const settings = resolveRenderOptions(options);
  const theme = getThemePreset(options.theme);
  const classes = [
    settings.scopeClass,
    `jhk-theme-${theme.name}`,
    options.className
  ].filter(Boolean).join(' ');

  const body = renderValue(value, settings, 0, 'root');
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
    maxArrayItems: normalizeLimit(options.maxArrayItems, DEFAULT_OPTIONS.maxArrayItems),
    maxObjectKeys: normalizeLimit(options.maxObjectKeys, DEFAULT_OPTIONS.maxObjectKeys),
    maxStringLength: normalizeLimit(options.maxStringLength, DEFAULT_OPTIONS.maxStringLength),
    tablePageSize: normalizeLimit(options.tablePageSize, DEFAULT_OPTIONS.tablePageSize),
    includeStyles: options.includeStyles ?? options.includeThemeCss ?? DEFAULT_OPTIONS.includeStyles
  };
}

function renderValue(
  value: unknown,
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
  return `<span class="${className}">${safeText(formatPrimitive(value, options), options.allowHtml)}</span>`;
}

function renderArray(
  values: unknown[],
  options: ResolvedRenderOptions,
  depth: number,
  label: string
): string {
  if (values.length === 0) {
    return `<span class="jhk-empty">${escapeHtml(options.emptyValueLabel)} array</span>`;
  }

  if (shouldRenderTable(values, options)) {
    return renderArrayTable(values as Array<Record<string, unknown>>, options, depth);
  }

  const visibleItems = values.slice(0, options.maxArrayItems);
  const rows = visibleItems.map((item, index) => `
    <tr>
      <td class="jhk-key">${index}</td>
      <td class="jhk-value">${renderValue(item, options, depth + 1, `${label}.${index}`)}</td>
    </tr>
  `).join('');
  const more = renderMoreRow(values.length - visibleItems.length, options, 2);

  return wrapNested(`Array(${values.length})`, `<table><tbody>${rows}${more}</tbody></table>`, options, depth);
}

function renderObject(
  value: object,
  options: ResolvedRenderOptions,
  depth: number,
  label: string
): string {
  const keys = Object.keys(value);

  if (keys.length === 0) {
    return `<span class="jhk-empty">${escapeHtml(options.emptyValueLabel)} object</span>`;
  }

  const orderedKeys = options.sortKeys ? keys.sort((a, b) => a.localeCompare(b)) : keys;
  const visibleKeys = orderedKeys.slice(0, options.maxObjectKeys);
  const record = value as Record<string, unknown>;
  const rows = visibleKeys.map((key) => `
    <tr>
      <td class="jhk-key">${escapeHtml(key)}</td>
      <td class="jhk-value">${renderValue(record[key], options, depth + 1, `${label}.${key}`)}</td>
    </tr>
  `).join('');
  const more = renderMoreRow(keys.length - visibleKeys.length, options, 2);

  return wrapNested(`Object(${keys.length})`, `<table><tbody>${rows}${more}</tbody></table>`, options, depth);
}

function renderArrayTable(
  rows: Array<Record<string, unknown>>,
  options: ResolvedRenderOptions,
  depth: number
): string {
  const rowLimit = Math.min(options.maxArrayItems, options.tablePageSize);
  const visibleRows = rows.slice(0, rowLimit);
  const headers = collectHeaders(visibleRows, options.sortKeys);
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = visibleRows.map((row) => {
    const cells = headers.map((header) => {
      const cell = Object.hasOwn(row, header) ? row[header] : null;
      return `<td class="jhk-value">${renderValue(cell, options, depth + 1, header)}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('');
  const more = renderMoreRow(rows.length - visibleRows.length, options, Math.max(headers.length, 1));

  return wrapNested(`Table(${rows.length} rows)`, `<table><thead><tr>${head}</tr></thead><tbody>${body}${more}</tbody></table>`, options, depth);
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

function shouldRenderTable(values: unknown[], options: ResolvedRenderOptions): boolean {
  if (options.tableMode === 'never') {
    return false;
  }

  const sampleLimit = Math.min(values.length, options.maxArrayItems, options.tablePageSize, 50);
  const sample = values.slice(0, sampleLimit);

  if (sample.length === 0 || !sample.every(isPlainObject)) {
    return false;
  }

  if (options.tableMode === 'always') {
    return true;
  }

  const rows = sample as Array<Record<string, unknown>>;
  const scalarCells = rows.flatMap((row) => Object.values(row)).filter(isScalar).length;
  const totalCells = rows.reduce((count, row) => count + Object.keys(row).length, 0);

  return totalCells > 0 && scalarCells / totalCells >= 0.6;
}

function collectHeaders(rows: Array<Record<string, unknown>>, sortKeys: boolean): string[] {
  const headers = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headers.add(key);
    }
  }

  const list = [...headers];
  return sortKeys ? list.sort((a, b) => a.localeCompare(b)) : list;
}

function formatPrimitive(value: unknown, options: ResolvedRenderOptions): string {
  if (typeof value !== 'string') {
    return String(value);
  }

  if (value.length <= options.maxStringLength) {
    return value;
  }

  const visible = value.slice(0, options.maxStringLength);
  const omitted = value.length - visible.length;

  return `${visible}… (${omitted} characters ${options.omittedItemsLabel})`;
}

function renderMoreRow(count: number, options: ResolvedRenderOptions, colspan: number): string {
  if (count <= 0) {
    return '';
  }

  return `
    <tr class="jhk-more">
      <td colspan="${colspan}">
        ${count} ${count === 1 ? 'item' : 'items'} ${escapeHtml(options.omittedItemsLabel)}
      </td>
    </tr>
  `;
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isFinite(value)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.floor(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isScalar(value: unknown): boolean {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}
