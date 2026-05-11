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

export interface JsonHtmlStyleOptions {
  theme?: JsonHtmlThemeName | JsonHtmlTheme;
  scopeClass?: string;
  styleId?: string;
}

export interface JsonHtmlRenderOptions extends JsonHtmlStyleOptions {
  className?: string;
  includeStyles?: boolean;
  /**
   * @deprecated Use `includeStyles` instead.
   */
  includeThemeCss?: boolean;
  tableMode?: JsonHtmlTableMode;
  collapseDepth?: number;
  maxDepth?: number;
  maxArrayItems?: number;
  maxObjectKeys?: number;
  maxStringLength?: number;
  tablePageSize?: number;
  sortKeys?: boolean;
  allowHtml?: boolean;
  emptyValueLabel?: string;
  omittedItemsLabel?: string;
}

export interface JsonHtmlRenderer {
  render(value: unknown, options?: JsonHtmlRenderOptions): string;
  renderToElement(value: unknown, element: Element, options?: JsonHtmlRenderOptions): void;
}
