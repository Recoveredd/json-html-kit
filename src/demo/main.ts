import {
  getThemeCss,
  renderJsonToHtml,
  themes,
  type JsonHtmlThemeName
} from '../index';
import './styles.css';

const sample = {
  report: 'API usage',
  generatedAt: '2026-05-11T17:35:00.000Z',
  customer: {
    name: 'Northwind Labs',
    plan: 'Scale',
    region: 'EU'
  },
  endpoints: [
    { path: '/v1/search', p95: 184, requests: 12904, healthy: true },
    { path: '/v1/export', p95: 421, requests: 870, healthy: true },
    { path: '/v1/import', p95: 890, requests: 312, healthy: false }
  ],
  notes: ['Nested JSON stays readable', 'Tables are detected automatically', 'Theme CSS is scoped']
};

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing app root');
}

const root = app;

root.innerHTML = `
  <main class="demo-shell">
    <section class="demo-intro">
      <div>
        <h1>json-html-kit</h1>
        <p>Paste JSON, choose a theme, and export safe HTML that stays readable in reports, docs and admin tools.</p>
      </div>
      <div class="demo-actions">
        <button class="button button-primary" data-copy-html>Copy HTML</button>
        <button class="button" data-load-sample>Sample</button>
      </div>
    </section>

    <section class="workspace">
      <div class="editor-panel">
        <div class="panel-header">
          <h2>Input</h2>
          <span data-status>Ready</span>
        </div>
        <textarea spellcheck="false" data-json-input></textarea>
        <div class="controls">
          <label>
            Theme
            <select data-theme>
              ${Object.keys(themes).map((theme) => `<option value="${theme}">${theme}</option>`).join('')}
            </select>
          </label>
          <label>
            Collapse depth
            <input type="range" min="0" max="5" value="2" data-collapse-depth />
          </label>
          <label class="checkbox-row">
            <input type="checkbox" data-sort-keys />
            Sort keys
          </label>
        </div>
      </div>

      <div class="preview-panel">
        <div class="panel-header">
          <h2>Preview</h2>
          <span data-theme-name>clean</span>
        </div>
        <div class="preview-stage" data-preview></div>
      </div>
    </section>
  </main>
`;

function queryRequired<T extends Element>(selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing demo control: ${selector}`);
  }

  return element;
}

const input = queryRequired<HTMLTextAreaElement>('[data-json-input]');
const preview = queryRequired<HTMLDivElement>('[data-preview]');
const status = queryRequired<HTMLSpanElement>('[data-status]');
const themeSelect = queryRequired<HTMLSelectElement>('[data-theme]');
const themeName = queryRequired<HTMLSpanElement>('[data-theme-name]');
const collapseDepth = queryRequired<HTMLInputElement>('[data-collapse-depth]');
const sortKeys = queryRequired<HTMLInputElement>('[data-sort-keys]');
const copyButton = queryRequired<HTMLButtonElement>('[data-copy-html]');
const sampleButton = queryRequired<HTMLButtonElement>('[data-load-sample]');

input.value = JSON.stringify(sample, null, 2);

function render(): string | null {
  try {
    const parsed = JSON.parse(input.value);
    const theme = themeSelect.value as JsonHtmlThemeName;
    const html = renderJsonToHtml(parsed, {
      theme,
      includeThemeCss: true,
      collapseDepth: Number(collapseDepth.value),
      sortKeys: sortKeys.checked
    });

    preview.innerHTML = html;
    status.textContent = 'Valid JSON';
    status.dataset.state = 'ok';
    themeName.textContent = theme;
    return html;
  } catch (error) {
    preview.innerHTML = `<pre class="error-box">${error instanceof Error ? error.message : 'Invalid JSON'}</pre>`;
    status.textContent = 'Invalid JSON';
    status.dataset.state = 'error';
    return null;
  }
}

input.addEventListener('input', render);
themeSelect.addEventListener('change', render);
collapseDepth.addEventListener('input', render);
sortKeys.addEventListener('change', render);

sampleButton.addEventListener('click', () => {
  input.value = JSON.stringify(sample, null, 2);
  render();
});

copyButton.addEventListener('click', async () => {
  const html = render();

  if (!html) {
    return;
  }

  const theme = themeSelect.value as JsonHtmlThemeName;
  const standalone = `<style>${getThemeCss(theme)}</style>\n${renderJsonToHtml(JSON.parse(input.value), {
    theme,
    collapseDepth: Number(collapseDepth.value),
    sortKeys: sortKeys.checked
  })}`;

  await navigator.clipboard.writeText(standalone);
  status.textContent = 'HTML copied';
  status.dataset.state = 'ok';
});

render();
