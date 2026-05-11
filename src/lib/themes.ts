import { escapeHtml } from './escape';
import type { JsonHtmlStyleOptions, JsonHtmlTheme, JsonHtmlThemeName, JsonHtmlThemeOverrides } from './types';

const DEFAULT_SCOPE_CLASS = 'jhk';

export const themes: Record<JsonHtmlThemeName, JsonHtmlTheme> = {
  clean: {
    name: 'clean',
    background: '#ffffff',
    surface: '#ffffff',
    surfaceAlt: '#f7f8fa',
    text: '#172033',
    muted: '#687083',
    border: '#d9dde7',
    accent: '#2563eb',
    code: '#0f766e',
    radius: '8px',
    shadow: '0 10px 28px rgba(23, 32, 51, 0.10)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
  },
  slate: {
    name: 'slate',
    background: '#111827',
    surface: '#182235',
    surfaceAlt: '#202b41',
    text: '#eef2ff',
    muted: '#aab5cf',
    border: '#33415f',
    accent: '#38bdf8',
    code: '#86efac',
    radius: '8px',
    shadow: '0 16px 36px rgba(0, 0, 0, 0.24)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
  },
  paper: {
    name: 'paper',
    background: '#fbfaf7',
    surface: '#ffffff',
    surfaceAlt: '#f2efe8',
    text: '#2a2118',
    muted: '#766c61',
    border: '#ded6c8',
    accent: '#b45309',
    code: '#166534',
    radius: '6px',
    shadow: '0 12px 26px rgba(65, 47, 29, 0.11)',
    fontFamily: 'Georgia, "Times New Roman", serif',
    monoFontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
  },
  terminal: {
    name: 'terminal',
    background: '#07130f',
    surface: '#0b1f17',
    surfaceAlt: '#102a20',
    text: '#d8ffe9',
    muted: '#8fc6a5',
    border: '#1f5d45',
    accent: '#34d399',
    code: '#bef264',
    radius: '4px',
    shadow: '0 14px 30px rgba(0, 0, 0, 0.35)',
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    monoFontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
  }
};

export function getThemePreset(theme: JsonHtmlThemeName | JsonHtmlTheme = 'clean'): JsonHtmlTheme {
  if (typeof theme !== 'string') {
    return theme;
  }

  const preset = themes[theme];

  if (!preset) {
    throw new Error(`Unknown json-html-kit theme "${theme}".`);
  }

  return preset;
}

export function createTheme(
  overrides: JsonHtmlThemeOverrides,
  base: JsonHtmlThemeName | JsonHtmlTheme = 'clean'
): JsonHtmlTheme {
  return {
    ...getThemePreset(base),
    ...overrides,
    name: overrides.name ?? 'custom'
  };
}

export function getThemeCss(theme: JsonHtmlThemeName | JsonHtmlTheme = 'clean', scopeClass = DEFAULT_SCOPE_CLASS): string {
  assertValidScopeClass(scopeClass);

  const preset = getThemePreset(theme);
  const scope = `.${scopeClass}`;

  return `
${scope} {
  --jhk-background: ${preset.background};
  --jhk-surface: ${preset.surface};
  --jhk-surface-alt: ${preset.surfaceAlt};
  --jhk-text: ${preset.text};
  --jhk-muted: ${preset.muted};
  --jhk-border: ${preset.border};
  --jhk-accent: ${preset.accent};
  --jhk-code: ${preset.code};
  --jhk-radius: ${preset.radius};
  --jhk-shadow: ${preset.shadow};
  --jhk-font: ${preset.fontFamily};
  --jhk-mono: ${preset.monoFontFamily};
  color: var(--jhk-text);
  background: var(--jhk-background);
  border: 1px solid var(--jhk-border);
  border-radius: var(--jhk-radius);
  box-shadow: var(--jhk-shadow);
  font-family: var(--jhk-font);
  line-height: 1.5;
  overflow: auto;
}
${scope}, ${scope} * {
  box-sizing: border-box;
}
${scope} .jhk-root {
  padding: 16px;
}
${scope} table {
  width: 100%;
  border-collapse: collapse;
  background: var(--jhk-surface);
}
${scope} th,
${scope} td {
  border: 1px solid var(--jhk-border);
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}
${scope} th {
  background: var(--jhk-surface-alt);
  color: var(--jhk-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
${scope} .jhk-key {
  color: var(--jhk-accent);
  font-weight: 700;
  white-space: nowrap;
}
${scope} .jhk-value {
  color: var(--jhk-text);
}
${scope} .jhk-primitive {
  font-family: var(--jhk-mono);
  color: var(--jhk-code);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
${scope} .jhk-null,
${scope} .jhk-empty {
  color: var(--jhk-muted);
  font-style: italic;
}
${scope} details {
  border: 1px solid var(--jhk-border);
  border-radius: var(--jhk-radius);
  background: var(--jhk-surface);
}
${scope} summary {
  cursor: pointer;
  padding: 8px 10px;
  color: var(--jhk-accent);
  font-weight: 700;
}
${scope} .jhk-nested {
  padding: 0 10px 10px;
}
`.trim();
}

export function getThemeStyleTag(theme: JsonHtmlThemeName | JsonHtmlTheme = 'clean', scopeClass = DEFAULT_SCOPE_CLASS): string {
  return `<style>${getThemeCss(theme, scopeClass)}</style>`;
}

export function injectThemeCss(target: Document | Element, options: JsonHtmlStyleOptions = {}): HTMLStyleElement {
  const scopeClass = options.scopeClass ?? DEFAULT_SCOPE_CLASS;
  assertValidScopeClass(scopeClass);

  const doc = 'head' in target ? target : target.ownerDocument;
  const styleId = options.styleId ?? `json-html-kit-${scopeClass}`;
  let style = doc.getElementById(styleId) as HTMLStyleElement | null;

  if (!style) {
    style = doc.createElement('style');
    style.id = styleId;
    style.dataset.jsonHtmlKit = scopeClass;
    doc.head.append(style);
  }

  style.textContent = getThemeCss(options.theme, scopeClass);
  return style;
}

function assertValidScopeClass(scopeClass: string): void {
  if (!/^[_a-zA-Z][_a-zA-Z0-9-]*$/.test(scopeClass)) {
    throw new Error(`Invalid json-html-kit scope class "${escapeHtml(scopeClass)}". Use a single CSS class name.`);
  }
}
