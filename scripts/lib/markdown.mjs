import { marked } from "marked";
import hljs from "highlight.js";
import { JSDOM } from "jsdom";

export const BASE_URL = "https://buildwithmanish.com";

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/m;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

const LANGUAGE_ICONS = {
  javascript: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#F7DF1E" d="M0 0h24v24H0V0z"/><path d="M12.14 12.63c0 .54.12.98.37 1.34.25.35.6.63 1.05.82.44.19.98.29 1.62.29.61 0 1.14-.1 1.58-.29.43-.19.78-.45 1.04-.79.26-.34.39-.74.39-1.2h-2.1c0 .28-.08.5-.23.67-.15.17-.38.25-.69.25-.32 0-.54-.08-.68-.24-.14-.16-.21-.39-.21-.69 0-.25.08-.45.23-.6.15-.15.39-.26.74-.34l1.09-.25c.78-.18 1.38-.46 1.8-.83.42-.37.63-.88.63-1.53 0-.51-.12-.95-.37-1.32-.25-.37-.61-.66-1.07-.86-.46-.21-1.02-.31-1.68-.31-.62 0-1.15.1-1.59.31-.44.21-.79.5-1.05.88-.26.38-.39.84-.39 1.39h2.1c0-.29.07-.51.21-.66.14-.15.35-.22.64-.22.28 0 .49.07.63.22.14.15.21.36.21.63 0 .23-.08.41-.23.55-.15.14-.38.24-.7.31l-1.09.25c-.8.19-1.39.48-1.78.86-.39.38-.59.9-.59 1.56zM6.97 12.63c0 .54.12.98.37 1.34.25.35.6.63 1.05.82.44.19.98.29 1.62.29.61 0 1.14-.1 1.58-.29.43-.19.78-.45 1.04-.79.26-.34.39-.74.39-1.2h-2.1c0 .28-.08.5-.23.67-.15.17-.38.25-.69.25-.32 0-.54-.08-.68-.24-.14-.16-.21-.39-.21-.69 0-.25.08-.45.23-.6.15-.15.39-.26.74-.34l1.09-.25c.78-.18 1.38-.46 1.8-.83.42-.37.63-.88.63-1.53 0-.51-.12-.95-.37-1.32-.25-.37-.61-.66-1.07-.86-.46-.21-1.02-.31-1.68-.31-.62 0-1.15.1-1.59.31-.44.21-.79.5-1.05.88-.26.38-.39.84-.39 1.39h2.1c0-.29.07-.51.21-.66.14-.15.35-.22.64-.22.28 0 .49.07.63.22.14.15.21.36.21.63 0 .23-.08.41-.23.55-.15.14-.38.24-.7.31l-1.09.25c-.8.19-1.39.48-1.78.86-.39.38-.59.9-.59 1.56z" fill="#000"/><path d="M21.6 22.12c-.2.2-.47.28-.8.28H3.2c-.33 0-.6-.08-.8-.28-.2-.2-.32-.47-.32-.8V3.2c0-.33.12-.6.32-.8.2-.2.47-.32.8-.32h17.6c.33 0 .6.12.8.32.2.2.32.47.32.8v18.12c0 .33-.12.6-.32.8z" fill="none"/></svg>`,
  js: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#F7DF1E" d="M0 0h24v24H0z"/><path d="M7.89 19c-.66 0-1.18-.2-1.55-.61-.37-.41-.56-1-.56-1.78h2.02c0 .28.08.5.23.67.15.17.38.25.68.25.32 0 .54-.08.68-.24.14-.16.21-.39.21-.69 0-.25-.08-.45-.23-.6-.15-.15-.39-.26-.74-.34l-1.09-.25c-.78-.18-1.38-.46-1.8-.83s-.63-.88-.63-1.53c0-.51.12-.95.37-1.32.25-.37.61-.66 1.07-.86.46-.21 1.02-.31 1.68-.31.62 0 1.15.1 1.59.31.44.21.79.5 1.05.88.26.38.39.84.39 1.39h-2.02c0-.29-.07-.51-.21-.66-.14-.15-.35-.22-.64-.22-.28 0-.49.07-.63.22-.14.15-.21.36-.21.63 0 .23.08.41.23.55.15.14.38.24.7.31l1.09.25c.8.19 1.39.48 1.78.86.39.38.59.9.59 1.56 0 .64-.2 1.16-.6 1.56-.4.4-.92.6-1.56.6zm7.25 0c-.82 0-1.47-.2-1.95-.6-.48-.4-.72-1.02-.72-1.85V11.2h2.02v5.3c0 .51.2.76.61.76.4 0 .61-.25.61-.76V11.2h2.02v5.35c0 .83-.24 1.45-.72 1.85-.48.4-1.13.6-1.95.6z"/></svg>`,
  typescript: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#3178C6" d="M0 0h24v24H0z"/><path d="M21.6 2.4v19.2H2.4V2.4h19.2zM8.8 17.6c.4 0 .7-.1.9-.3.2-.2.3-.5.3-.9v-5.2H7.4v1.6h1.2v3.6c0 .2 0 .3-.1.4-.1.1-.2.1-.4.1-.2 0-.3 0-.4-.1l-.2-.2-.9 1.2c.2.2.4.3.7.4.3.1.5.1.8.1zm6.2 0c.6 0 1.1-.1 1.5-.4.4-.3.7-.7.9-1.2.2-.5.3-1 .3-1.6 0-.6-.1-1.1-.3-1.6-.2-.5-.5-.9-.9-1.2-.4-.3-.9-.4-1.5-.4s-1.1.1-1.5.4c-.4.3-.7.7-.9 1.2-.2.5-.3 1-.3 1.6 0 .6.1 1.1.3 1.6.2.5.5.9.9 1.2.4.3.9.4 1.5.4zm0-1.6c-.3 0-.5-.1-.7-.2-.2-.1-.3-.3-.4-.6-.1-.3-.1-.6-.1-1s0-.7.1-1c.1-.3.2-.5.4-.6.2-.1.4-.2.7-.2s.5.1.7.2c.2.1.3.3.4.6.1.3.1.6.1 1s0 .7-.1 1c-.1.3-.2.5-.4.6-.2.1-.4.2-.7.2z" fill="#FFF"/></svg>`,
  ts: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#3178C6" d="M0 0h24v24H0z"/><path d="M21.6 2.4v19.2H2.4V2.4h19.2zM8.8 17.6c.4 0 .7-.1.9-.3.2-.2.3-.5.3-.9v-5.2H7.4v1.6h1.2v3.6c0 .2 0 .3-.1.4-.1.1-.2.1-.4.1-.2 0-.3 0-.4-.1l-.2-.2-.9 1.2c.2.2.4.3.7.4.3.1.5.1.8.1zm6.2 0c.6 0 1.1-.1 1.5-.4.4-.3.7-.7.9-1.2.2-.5.3-1 .3-1.6 0-.6-.1-1.1-.3-1.6-.2-.5-.5-.9-.9-1.2-.4-.3-.9-.4-1.5-.4s-1.1.1-1.5.4c-.4.3-.7.7-.9 1.2-.2.5-.3 1-.3 1.6 0 .6.1 1.1.3 1.6.2.5.5.9.9 1.2.4.3.9.4 1.5.4zm0-1.6c-.3 0-.5-.1-.7-.2-.2-.1-.3-.3-.4-.6-.1-.3-.1-.6-.1-1s0-.7.1-1c.1-.3.2-.5.4-.6.2-.1.4-.2.7-.2s.5.1.7.2c.2.1.3.3.4.6.1.3.1.6.1 1s0 .7-.1 1c-.1.3-.2.5-.4.6-.2.1-.4.2-.7.2z" fill="#FFF"/></svg>`,
  python: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#3776AB" d="M11.9 0C8.9 0 7 1.3 7 3.8v2.5h5v.7H5V3.3C5 .8 6.9 0 9.4 0h2.5zm5.1 24c3 0 4.9-1.3 4.9-3.8v-2.5h-5v-.7h7v3.7c0 2.5-1.9 3.3-4.4 3.3H17z"/><path fill="#FFD43B" d="M12.1 10.3v-.7H19v3.7c0 2.5-1.9 3.3-4.4 3.3H12.1v-2.5h5v-.7h-5v-3.1zm-5.1 3.4c-3 0-4.9 1.3-4.9 3.8v2.5h5v.7H5v-3.7C5 14.5 6.9 13.7 9.4 13.7h2.6v2.5h-5v.7h5v-3.2z"/></svg>`,
  java: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#007396" d="M14.5 18c-2.5 0-4.5-1-4.5-2.5s2-2.5 4.5-2.5 4.5 1 4.5 2.5-2 2.5-4.5 2.5zm-5-8c-1.5 0-2.5-1-2.5-2s1-2 2.5-2 2.5 1 2.5 2-1 2-2.5 2z"/><path fill="#ED8B00" d="M6 21c-3.3 0-6-1.3-6-3s2.7-3 6-3 6 1.3 6 3-2.7 3-6 3z"/></svg>`,
  go: `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#00ADD8" d="M1.8 11.2c0-3.3 2.7-6 6-6h12.4c.5 0 1 .4 1 1s-.4 1-1 1H7.8c-2.2 0-4 1.8-4 4s1.8 4 4 4h9.4c2.2 0 4-1.8 4-4v-.5c0-.5.4-1 1-1s1 .4 1 1v.5c0 3.3-2.7 6-6 6H7.8c-3.3 0-6-2.7-6-6z"/></svg>`,
  rust: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#000" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/><circle cx="12" cy="12" r="4"/></svg>`,
  cpp: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#00599C" d="M22.5 12L12 1.5 1.5 12 12 22.5 22.5 12z"/><path fill="#FFF" d="M10.5 8.5v2h-2v1h2v2h1v-2h2v-1h-2v-2h-1z"/></svg>`,
  php: `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#777BB4" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-3 13h-2v-6h2v6zm5 0h-2v-6h2v6z"/></svg>`,
  html: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#E34F26" d="M1.5 0h21l-1.9 21.4L12 24l-8.6-2.6L1.5 0z"/><path fill="#EF652A" d="M12 22.2l6.8-2L20.4 2h-8.4v20.2z"/><path fill="#EBEBEB" d="M12 10.7H8.5l-.2-2.7H12V5.2H5.4l.7 8.2H12v-2.7z"/><path fill="#FFF" d="M12 16.3l-2.7-.7-.2-2h-2.8l.4 4.1 5.3 1.5v-2.9z"/><path fill="#EBEBEB" d="M12 10.7h6.1l-.6 6.3-5.5 1.5v-2.9l2.7-.7.3-3.2H12v-1z"/><path fill="#FFF" d="M12 5.2v2.8h5.8l.3-2.8H12z"/></svg>`,
  css: `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1572B6" d="M1.5 0h21l-1.9 21.4L12 24l-8.6-2.6L1.5 0z"/><path fill="#33A9DC" d="M12 22.2l6.8-2L20.4 2h-8.4v20.2z"/><path fill="#EBEBEB" d="M12 10.7H8.5l-.2-2.7H12V5.2H5.4l.7 8.2H12v-2.7z"/><path fill="#FFF" d="M12 16.3l-2.7-.7-.2-2h-2.8l.4 4.1 5.3 1.5v-2.9z"/><path fill="#EBEBEB" d="M12 10.7h6.1l-.6 6.3-5.5 1.5v-2.9l2.7-.7.3-3.2H12v-1z"/><path fill="#FFF" d="M12 5.2v2.8h5.8l.3-2.8H12z"/></svg>`,
  json: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
  shell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  bash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  sql: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 4.02 2 6.5s4.48 4.5 10 4.5 10-2.02 10-4.5S17.52 2 12 2zm0 13c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4zm0 5c-4.42 0-8-1.79-8-4v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4z"/></svg>`,
  yaml: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
};
LANGUAGE_ICONS.jsx = LANGUAGE_ICONS.javascript;
LANGUAGE_ICONS.tsx = LANGUAGE_ICONS.ts;

export function getLanguageIcon(lang) {
  const key = (lang || "").toLowerCase();
  return (
    LANGUAGE_ICONS[key] ||
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
  );
}

const HIGHLIGHT_LANGS = [
  "javascript", "python", "java", "sql", "bash", "yaml", "json", "html",
  "css", "typescript", "go", "rust", "cpp", "c", "csharp", "php", "ruby",
  "swift", "kotlin", "dockerfile", "jsx", "tsx",
];

marked.use({
  renderer: {
    code(token) {
      const code = token.text;
      const lang = (token.lang || "").match(/\S*/)[0];

      if (lang === "mermaid") {
        return `<pre class="mermaid">${code}</pre>`;
      }

      let highlighted;
      let detectedLang = lang;

      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        const result = hljs.highlightAuto(code, HIGHLIGHT_LANGS);
        highlighted = result.value;
        detectedLang = result.language;
      }

      const displayLang = detectedLang || "text";
      const langIcon = getLanguageIcon(displayLang);

      return `
        <div class="code-block-shell">
          <div class="code-window-bar">
            <div class="code-window-controls">
              <span class="code-window-dot close" aria-hidden="true"></span>
              <span class="code-window-dot minimize" aria-hidden="true"></span>
              <span class="code-window-dot maximize" aria-hidden="true"></span>
            </div>
            <div class="code-window-center">
              ${langIcon ? `<span class="code-lang-icon">${langIcon}</span>` : ""}
              <span class="code-window-lang">${displayLang}</span>
            </div>
            <button type="button" class="code-copy-button" onclick="copyCode(this)" aria-label="Copy code">
              <svg class="icon-copy" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code class="hljs language-${displayLang}" data-lang="${displayLang}">${highlighted}</code></pre>
        </div>
      `;
    },
  },
});

export function parseFrontmatter(text) {
  const match = text.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { meta: {}, body: text };
  }

  const meta = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) {
      return;
    }

    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/^'|'$/g, "");

    meta[key] = value;
  });

  return { meta, body: match[2] };
}

export function firstMarkdownImage(markdownBody = "") {
  const match = markdownBody.match(MARKDOWN_IMAGE_PATTERN);
  return match ? match[1].trim() : "";
}

export function toAbsoluteUrl(value) {
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const cleaned = value.replace(/^\.\//, "").replace(/^\//, "");
  return `${BASE_URL}/${cleaned}`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function titleFromSlug(slug = "") {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDisplayDate(isoDate = "") {
  if (!isoDate) {
    return "";
  }
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Renders a markdown body to HTML, assigns ids to h2/h3 headings, and
 * builds a matching table-of-contents fragment - shared by blog posts and
 * project deep-dives so both get identical heading/TOC behavior.
 */
export function renderContentWithToc(body) {
  const rawContentHtml = marked.parse(body);
  const dom = new JSDOM(`<!DOCTYPE html><body><div id="content">${rawContentHtml}</div></body>`);
  const doc = dom.window.document;
  const contentDiv = doc.getElementById("content");

  const headings = [...contentDiv.querySelectorAll("h2, h3")];
  let tocHtml = "";
  if (headings.length >= 2) {
    const tocItems = headings.map((h) => {
      const id = h.id || h.textContent.trim().toLowerCase().replace(/[^\w]+/g, "-");
      h.id = id;
      const cls = h.tagName === "H3" ? ' class="toc-h3"' : "";
      return `<li${cls}><a href="#${id}">${h.textContent}</a></li>`;
    });
    tocHtml = `<p class="blog-toc-title">Contents</p><ol>${tocItems.join("")}</ol>`;
  }

  return { contentHtml: contentDiv.innerHTML, tocHtml };
}
