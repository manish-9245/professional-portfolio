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
        ]);
        highlighted = result.value;
        detectedLang = result.language;
      }
      return `<pre><code class="hljs language-${detectedLang || "text"}" data-lang="${detectedLang || ""}">${highlighted}</code></pre>`;
    },
  },
});

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
    </div>`;

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
              <h3 class="related-title"><a href="./${encodeURIComponent(p.slug)}.html">${p.title}</a></h3>
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
        <a class="blog-share-link" aria-label="Share on LinkedIn" title="Share on LinkedIn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}"><svg class="blog-share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3C4.14 3 3.2 3.94 3.2 5.05c0 1.1.9 2.05 2.01 2.05h.02c1.12 0 2.02-.95 2.02-2.05C7.25 3.94 6.36 3 5.25 3zM20.8 13.4c0-3.13-1.67-5.15-4.66-5.15-2.15 0-3.11 1.2-3.65 2.03V8.5H9.1c.04 1.17 0 11.5 0 11.5h3.38v-6.42c0-.34.03-.68.12-.92.27-.68.88-1.4 1.9-1.4 1.34 0 1.88 1.05 1.88 2.58V20h3.38v-6.6z"/></svg></a>
        <a class="blog-share-link" aria-label="Share on X" title="Share on X" target="_blank" rel="noopener noreferrer" href="https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}"><svg class="blog-share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.24L6.66 22H3.55l7.24-8.27L1 2h6.25l4.32 5.7L18.9 2zm-1.07 18h1.69L6.33 3.9H4.52L17.83 20z"/></svg></a>
        <button type="button" class="blog-share-copy" aria-label="Copy link" title="Copy link" data-share-copy data-url="${pageUrl}"><svg class="blog-share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-1v-1.5h1A1.5 1.5 0 0 0 19.5 15V7A1.5 1.5 0 0 0 18 5.5h-7A1.5 1.5 0 0 0 9.5 7v1H8V7zm-2 3A3 3 0 0 1 9 7h7a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8zm3-1.5A1.5 1.5 0 0 0 7.5 10v8A1.5 1.5 0 0 0 9 19.5h7a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 16 8.5H9z"/></svg></button>
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
