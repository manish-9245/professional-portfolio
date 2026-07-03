import { marked } from 'marked';
import hljs from 'highlight.js';

marked.use({
  renderer: {
    code(token) {
      const code = token.text;
      const lang = (token.lang || "").match(/\S*/)[0];

      if (lang === "mermaid") {
        return `<pre class="mermaid">${code}</pre>`;
      }
      return false; // Fallback
    }
  }
});

const md = '```mermaid\nsequenceDiagram\n```';
console.log(marked.parse(md));
