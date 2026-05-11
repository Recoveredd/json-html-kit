export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonHtmlTableMode = 'auto' | 'always' | 'never';
export type JsonHtmlThemeName = 'clean' | 'slate' | 'paper' | 'terminal';

export interface JsonHtmlTheme {
  name: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  code: string;
  radius: string;
  shadow: string;
  fontFamily: string;
  monoFontFamily: string;
}

export type JsonHtmlThemeOverrides = Partial<Omit<JsonHtmlTheme, 'name'>> & {
  name?: string;
};

export interface JsonHtmlRenderOptions {
  className?: string;
  theme?: JsonHtmlThemeName | JsonHtmlTheme;
  includeThemeCss?: boolean;
  scopeClass?: string;
  tableMode?: JsonHtmlTableMode;
  collapseDepth?: number;
  maxDepth?: number;
  sortKeys?: boolean;
  allowHtml?: boolean;
  emptyValueLabel?: string;
}

export interface JsonHtmlRenderer {
  render(value: unknown, options?: JsonHtmlRenderOptions): string;
  renderToElement(value: unknown, element: Element, options?: JsonHtmlRenderOptions): void;
}
