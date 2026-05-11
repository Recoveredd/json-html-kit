const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_LOOKUP[char] ?? char);
}

export function safeText(value: unknown, allowHtml = false): string {
  return allowHtml ? String(value) : escapeHtml(value);
}
