#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASE_URL,
  parseFrontmatter,
  firstMarkdownImage,
  toAbsoluteUrl,
  escapeHtml,
  titleFromSlug,
  formatDisplayDate,
  renderContentWithToc,
} from "./lib/markdown.mjs";
import { writeSitemap, readSlugsFrom } from "./lib/sitemap.mjs";
import { buildShareBlocks } from "./lib/share.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const POSTS_INDEX_PATH = path.join(POSTS_DIR, "index.json");
const PROJECTS_INDEX_PATH = path.join(ROOT, "projects", "index.json");
const BLOG_TEMPLATE_PATH = path.join(ROOT, "blog.html");

const DEFAULT_IMAGE = `${BASE_URL}/image/optimized/aiblogs-20260314-175545.webp`;

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

    const { contentHtml, tocHtml } = renderContentWithToc(body);

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
    const { shareActionsHtml, floatingShareHtml } = buildShareBlocks({ pageUrl, title, noun: "post" });

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

  writePostsIndex(indexEntries);
  writeSitemap(SITEMAP_PATH, {
    postSlugs: generatedSlugs,
    projectSlugs: readSlugsFrom(PROJECTS_INDEX_PATH),
  });
  console.log(
    `Generated ${generatedSlugs.length} full static blog pages with TOC and related posts, updated posts/index.json, and updated sitemap.xml`,
  );
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
