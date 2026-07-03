#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import hljs from "highlight.js";

import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const POSTS_INDEX_PATH = path.join(POSTS_DIR, "index.json");
const BLOG_TEMPLATE_PATH = path.join(ROOT, "blog.html");

const BASE_URL = "https://buildwithmanish.com";
const DEFAULT_IMAGE = `${BASE_URL}/image/optimized/aiblogs-20260314-175545.webp`;

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/m;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

// Configure marked with highlight.js for modern marked v12+
marked.use({
  renderer: {
    code(token) {
      const code = token.text;
      const lang = (token.lang || "").match(/\S*/)[0];
      let highlighted;
      let detectedLang = lang;

      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(code, { language: lang }).value;
      } else {
        const result = hljs.highlightAuto(code, [
          "javascript",
          "python",
          "java",
          "sql",
          "bash",
          "yaml",
          "json",
          "html",
          "css",
          "typescript",
          "go",
          "rust",
          "cpp",
          "c",
          "csharp",
          "php",
          "ruby",
          "swift",
          "kotlin",
          "dockerfile",
        ]);
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

function getLanguageIcon(lang) {
  const l = (lang || "").toLowerCase();
  const icons = {
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
  return icons[l] || `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
}

function parseFrontmatter(text) {
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

function firstMarkdownImage(markdownBody = "") {
  const match = markdownBody.match(MARKDOWN_IMAGE_PATTERN);
  return match ? match[1].trim() : "";
}

function toAbsoluteUrl(value) {
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${BASE_URL}/${value.replace(/^\.\//, "")}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleFromSlug(slug = "") {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDisplayDate(isoDate = "") {
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

function getPostTags(post) {
  const content = `${post.title || ""} ${post.description || ""} ${post.slug || ""}`.toLowerCase();
  const tags = new Set();
  if (/ai|agentic|llm|mcp|rag|power\s*bi/.test(content)) tags.add("AI");
  if (/cloud|aws|terraform|kubernetes|docker|microservices|distributed/.test(content)) tags.add("Cloud");
  if (/database|sql|excel|analytics|data/.test(content)) tags.add("Data");
  if (/react|flutter|frontend|ui|ux|web/.test(content)) tags.add("Frontend");
  if (/java|node|backend|rbac|abac|webhooks|concurrency|payments/.test(content)) tags.add("Backend");
  if (tags.size === 0) tags.add("Engineering");
  return [...tags];
}

function getRelatedPosts(currentPost, allPosts, limit = 3) {
  const currentTags = getPostTags(currentPost);
  return allPosts
    .filter((p) => p.slug !== currentPost.slug)
    .map((p) => {
      const tags = getPostTags(p);
      const common = tags.filter((t) => currentTags.includes(t)).length;
      return { ...p, score: common };
    })
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
    .slice(0, limit);
}

function renderPostHtml(template, {
  slug,
  title,
  description,
  socialTitle,
  socialDescription,
  pageImage,
  publishedDate,
  contentHtml,
  tocHtml,
  relatedPostsHtml,
  shareActionsHtml,
  floatingShareHtml,
}) {
  const encodedSlug = encodeURIComponent(slug);
  const pageUrl = `${BASE_URL}/posts/${encodedSlug}.html`;
  const fmtDate = formatDisplayDate(publishedDate);

  // Update meta tags and title
  let html = template
    .replace(/<title[^>]*?>.*?<\/title>/si, `<title>${escapeHtml(title)} · Manish Tiwari</title>`)
    .replace(/<meta[^>]*?name="description"[^>]*?>/si, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link[^>]*?rel="canonical"[^>]*?>/si, `<link rel="canonical" href="${pageUrl}" />`)
    .replace(/<meta[^>]*?property="og:title"[^>]*?>/si, `<meta property="og:title" content="${escapeHtml(socialTitle)}" />`)
    .replace(/<meta[^>]*?property="og:description"[^>]*?>/si, `<meta property="og:description" content="${escapeHtml(socialDescription)}" />`)
    .replace(/<meta[^>]*?property="og:url"[^>]*?>/si, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(/<meta[^>]*?property="og:image"[^>]*?>/si, `<meta property="og:image" content="${escapeHtml(pageImage)}" />`)
    .replace(/<meta[^>]*?name="twitter:title"[^>]*?>/si, `<meta name="twitter:title" content="${escapeHtml(socialTitle)}" />`)
    .replace(/<meta[^>]*?name="twitter:description"[^>]*?>/si, `<meta name="twitter:description" content="${escapeHtml(socialDescription)}" />`)
    .replace(/<meta[^>]*?name="twitter:image"[^>]*?>/si, `<meta name="twitter:image" content="${escapeHtml(pageImage)}" />`);

  // Update Schema.org
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "datePublished": publishedDate || undefined,
    "author": {
      "@type": "Person",
      "name": "Manish Tiwari",
      "url": "https://buildwithmanish.com/about.html"
    },
    "publisher": {
      "@type": "Person",
      "name": "Manish Tiwari"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": pageUrl
    },
    "image": pageImage
  };
  html = html.replace(/<script id="post-schema".*?>.*?<\/script>/s, `<script id="post-schema" type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`);

  // Inject Content into <main data-router-view>
  const mainContent = `
    <header class="blog-post-header">
      <p class="muted kicker">Blog</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="muted">${escapeHtml(fmtDate)}</p>
    </header>
    <div class="blog-post-layout">
      <nav class="blog-toc" id="blog-toc" aria-label="Table of contents">${tocHtml}</nav>
      <article class="blog-prose" id="blog-prose">${contentHtml}</article>
      <aside class="blog-meta-col">
        <section class="blog-meta-card" aria-label="Author details">
          <p class="blog-meta-label">Author</p>
          <p class="blog-meta-value">Manish Tiwari</p>
        </section>
        <section class="blog-meta-card" aria-label="Publication date">
          <p class="blog-meta-label">Published</p>
          <p class="blog-meta-value">${escapeHtml(fmtDate)}</p>
        </section>
        <section class="blog-meta-card" aria-label="Blog views">
          <p class="blog-meta-label">Views</p>
          <div class="blog-view-counter">
            <img src="https://komarev.com/ghpvc/?username=manish-9245&label=VIEWS&color=0e75b6&style=flat" alt="Blog views counter" loading="lazy" decoding="async" />
          </div>
        </section>
        <section class="blog-meta-card" aria-label="Blog navigation">
          <p class="blog-meta-label">Navigate</p>
          <a class="blog-meta-link" href="./blogs.html">← All posts</a>
        </section>
      </aside>
    </div>
    <section class="surface related-posts" id="related-posts" aria-label="Related blog posts">${relatedPostsHtml}</section>
    <section class="surface blog-share" id="blog-share" aria-label="Share this post">${shareActionsHtml}</section>
    <div class="surface" style="padding-top:0">
      <a href="./blogs.html">← Back to all blogs</a>
    </div>
    ${floatingShareHtml}`;

  html = html.replace(/<main[^>]*?data-router-view[^>]*?>.*?<\/main>/s, `<main data-router-view>${mainContent}</main>`);

  // Update paths for sub-directory (must happen after injecting contentHtml)
  // We use root-relative paths (/) for maximum SPA robustness
  html = html.replaceAll('src="./', 'src="/');
  html = html.replaceAll('srcset="./', 'srcset="/');
  html = html.replaceAll('href="./', 'href="/');

  // Disable client-side loader
  html = html.replace('loadPost();', '// Static Page: loadPost() disabled');

  return html;
}

function run() {
  const blogTemplate = fs.readFileSync(BLOG_TEMPLATE_PATH, "utf8");
  const postFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  const generatedPosts = [];
  postFiles.forEach((filename) => {
    const sourcePath = path.join(POSTS_DIR, filename);
    const raw = fs.readFileSync(sourcePath, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = (meta.slug || path.basename(filename, ".md")).trim();
    generatedPosts.push({ meta, body, slug, filename });
  });

  const indexEntries = generatedPosts.map((p) => ({
    slug: p.slug,
    title: (p.meta.title || titleFromSlug(p.slug)).trim(),
    date: (p.meta.date || "").trim(),
    displayDate: formatDisplayDate((p.meta.date || "").trim()),
    description: (p.meta.description || "Technical blog post by Manish Tiwari").trim(),
  }));

  generatedPosts.forEach((postData, index) => {
    const { meta, body, slug } = postData;
    const title = indexEntries[index].title;
    const description = indexEntries[index].description;
    const date = indexEntries[index].date;

    const socialTitle = (
      meta.og_title || meta.ogTitle || meta["og:title"] ||
      meta.twitter_title || meta.twitterTitle || meta["twitter:title"] ||
      title
    ).trim();

    const socialDescription = (
      meta.og_description || meta.ogDescription || meta["og:description"] ||
      meta.twitter_description || meta.twitterDescription || meta["twitter:description"] ||
      description
    ).trim();

    const pageImage =
      toAbsoluteUrl(meta.image || meta.ogImage || meta["og:image"]) ||
      toAbsoluteUrl(firstMarkdownImage(body)) ||
      DEFAULT_IMAGE;

    const rawContentHtml = marked.parse(body);

    // Use JSDOM to process HTML
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content">${rawContentHtml}</div></body>`);
    const doc = dom.window.document;
    const contentDiv = doc.getElementById("content");

    // Add IDs to headings and build TOC
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

    const contentHtml = contentDiv.innerHTML;

    // Render Related Posts
    const relatedPosts = getRelatedPosts({ slug, title, description, date }, indexEntries, 3);
    let relatedPostsHtml = "";
    if (relatedPosts.length > 0) {
      relatedPostsHtml = `
        <h2>Related Posts</h2>
        <div class="related-posts-grid">
          ${relatedPosts.map((p) => `
            <article class="related-card">
              <p class="related-meta">
                <span>${p.displayDate}</span>
                <span class="blog-card-dot">•</span>
                <span>${getPostTags(p)[0] || "Engineering"}</span>
              </p>
              <h3 class="related-title"><a href="/posts/${encodeURIComponent(p.slug)}.html">${p.title}</a></h3>
              <p class="related-desc">${p.description}</p>
            </article>
          `).join("")}
        </div>`;
    }

    // Render Share Actions
    const pageUrl = `${BASE_URL}/posts/${encodeURIComponent(slug)}.html`;
    const shareActionsHtml = `
      <h2>Share this post</h2>
      <div class="blog-share-actions">
        <a class="blog-share-link share-linkedin" aria-label="Share on LinkedIn" title="Share on LinkedIn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          <span>LinkedIn</span>
        </a>
        <a class="blog-share-link share-x" aria-label="Share on X" title="Share on X" target="_blank" rel="noopener noreferrer" href="https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.24L6.66 22H3.55l7.24-8.27L1 2h6.25l4.32 5.7L18.9 2zm-1.07 18h1.69L6.33 3.9H4.52L17.83 20z"/></svg>
          <span>X</span>
        </a>
        <a class="blog-share-link share-whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp" target="_blank" rel="noopener noreferrer" href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + pageUrl)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.187-1.622c1.763.961 3.746 1.469 5.758 1.471h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <span>WhatsApp</span>
        </a>
        <a class="blog-share-link share-reddit" aria-label="Share on Reddit" title="Share on Reddit" target="_blank" rel="noopener noreferrer" href="https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(title)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M24 11.5c0-1.65-1.35-3-3-3-.41 0-.79.08-1.14.24-1.64-1.14-3.85-1.88-6.28-1.97l1.08-5.08 3.53.75c.05.83.74 1.5 1.57 1.5 0.86 0 1.56-.7 1.56-1.56s-.7-1.56-1.56-1.56c-.63 0-1.18.38-1.42.92l-3.92-.83c-.19-.04-.38.07-.44.26l-1.21 5.7c-2.43.09-4.64.83-6.28 1.97-.35-.16-.73-.24-1.14-.24-1.65 0-3 1.35-3 3 0 1.25.77 2.32 1.86 2.77-.04.24-.06.48-.06.73 0 3.31 3.58 6 8 6s8-2.69 8-6c0-.25-.02-.49-.06-.73 1.09-.45 1.86-1.52 1.86-2.77zm-18 0c0-.83.67-1.5 1.5-1.5.31 0 .59.1.82.26-1.04.77-1.74 1.83-2.02 3.01-.18-.08-.3-.26-.3-.45v-1.32zm10 5.5c-1.3 1.3-3.7 1.3-5 0-.15-.15-.15-.39 0-.54s.39-.15.54 0c1 1 3.2 1 4.2 0 .15-.15.39-.15.54 0s.15.39 0 .54zm.32-2.23c-.28-1.18-.98-2.24-2.02-3.01.23-.16.51-.26.82-.26 0.83 0 1.5.67 1.5 1.5 0 .19-.12.37-.3.45v1.32zm3.32-3.27c0 .19-.12.37-.3.45v-1.32c0-.83.67-1.5 1.5-1.5.83 0 1.5.67 1.5 1.5s-1.35 3-3 3c-.41 0-.79-.08-1.14-.24z"/></svg>
          <span>Reddit</span>
        </a>
        <button type="button" class="blog-share-copy share-copy" aria-label="Copy link" title="Copy link" data-share-copy data-url="${pageUrl}">
          <svg class="blog-share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span>Copy Link</span>
        </button>
      </div>`;
      
      // Floating Share Button
      const floatingShareHtml = `
      <div class="floating-share" id="floating-share">
        <div class="floating-share-menu">
          <a class="floating-share-item share-linkedin" title="LinkedIn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
          <a class="floating-share-item share-x" title="X" target="_blank" rel="noopener noreferrer" href="https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.24L6.66 22H3.55l7.24-8.27L1 2h6.25l4.32 5.7L18.9 2zm-1.07 18h1.69L6.33 3.9H4.52L17.83 20z"/></svg>
          </a>
          <a class="floating-share-item share-whatsapp" title="WhatsApp" target="_blank" rel="noopener noreferrer" href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + pageUrl)}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.187-1.622c1.763.961 3.746 1.469 5.758 1.471h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
          <button type="button" class="floating-share-item share-copy" title="Copy Link" data-share-copy data-url="${pageUrl}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
        </div>
        <button type="button" class="floating-share-trigger" aria-label="Share post">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>`;

    const html = renderPostHtml(blogTemplate, {
      slug,
      title,
      description,
      socialTitle,
      socialDescription,
      pageImage,
      publishedDate: date,
      contentHtml,
      tocHtml,
      relatedPostsHtml,
      shareActionsHtml,
      floatingShareHtml,
    });

    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.html`), html, "utf8");
  });

  const generatedSlugs = indexEntries.map((e) => e.slug);
  fs.readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".html"))
    .forEach((name) => {
      const slug = path.basename(name, ".html");
      if (!generatedSlugs.includes(slug)) {
        fs.rmSync(path.join(POSTS_DIR, name), { force: true });
      }
    });

  writeSitemap(generatedSlugs);
  writePostsIndex(indexEntries);
  console.log(
    `Generated ${generatedSlugs.length} full static blog pages with TOC and related posts, updated posts/index.json, and updated sitemap.xml`,
  );
}

function baseSitemapEntries() {
  return [
    { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${BASE_URL}/about.html`, changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/projects.html`, changefreq: "weekly", priority: "0.9" },
    { loc: `${BASE_URL}/blogs.html`, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/contact.html`, changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/blog.html`, changefreq: "daily", priority: "0.7" },
  ];
}

function writeSitemap(postSlugs) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  baseSitemapEntries().forEach((entry) => {
    lines.push("  <url>");
    lines.push(`    <loc>${entry.loc}</loc>`);
    lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    lines.push(`    <priority>${entry.priority}</priority>`);
    lines.push("  </url>");
  });

  [...new Set(postSlugs)].sort().forEach((slug) => {
    lines.push("  <url>");
    lines.push(`    <loc>${BASE_URL}/posts/${encodeURIComponent(slug)}.html</loc>`);
    lines.push("    <changefreq>monthly</changefreq>");
    lines.push("    <priority>0.7</priority>");
    lines.push("  </url>");
  });

  lines.push("</urlset>", "");
  fs.writeFileSync(SITEMAP_PATH, lines.join("\n"), "utf8");
}

function writePostsIndex(items) {
  const sorted = [...items].sort((left, right) => {
    const rightDate = right.date || "";
    const leftDate = left.date || "";
    if (rightDate !== leftDate) {
      return rightDate.localeCompare(leftDate);
    }
    return (left.slug || "").localeCompare(right.slug || "");
  });

  const normalized = sorted.map((item) => ({
    slug: item.slug,
    title: item.title,
    date: item.date,
    displayDate: item.displayDate,
    description: item.description,
  }));

  fs.writeFileSync(POSTS_INDEX_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

run();
