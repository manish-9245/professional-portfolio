#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const POSTS_INDEX_PATH = path.join(POSTS_DIR, "index.json");

const BASE_URL = "https://buildwithmanish.com";
const DEFAULT_IMAGE = `${BASE_URL}/image/optimized/aiblogs-20260314-175545.webp`;

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/m;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;

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

function renderPostHtml({
  slug,
  title,
  description,
  socialTitle,
  socialDescription,
  pageImage,
  publishedDate,
}) {
  const encodedSlug = encodeURIComponent(slug);
  const pageUrl = `${BASE_URL}/posts/${encodedSlug}.html`;
  const targetUrl = `${BASE_URL}/blog.html?post=${encodedSlug}`;
  const publishedMeta = publishedDate
    ? `    <meta property="article:published_time" content="${escapeHtml(publishedDate)}" />\n`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} · Manish Tiwari</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${pageUrl}" />
    <meta property="og:site_name" content="Manish Tiwari" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(socialTitle)}" />
    <meta property="og:description" content="${escapeHtml(socialDescription)}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${escapeHtml(pageImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(pageImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(socialTitle)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(socialTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(socialDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(pageImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(socialTitle)}" />
${publishedMeta}    <meta http-equiv="refresh" content="0; url=${targetUrl}" />
    <script>window.location.replace('${targetUrl}');</script>
  </head>
  <body>
    <p>Redirecting to <a href="${targetUrl}">the article</a>…</p>
  </body>
</html>
`;
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

function run() {
  const postFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  const generatedSlugs = [];
  const indexEntries = [];

  postFiles.forEach((filename) => {
    const sourcePath = path.join(POSTS_DIR, filename);
    const raw = fs.readFileSync(sourcePath, "utf8");
    const { meta, body } = parseFrontmatter(raw);

    const slug = (meta.slug || path.basename(filename, ".md")).trim();
    const title = (meta.title || titleFromSlug(slug)).trim();
    const description = (meta.description || "Technical blog post by Manish Tiwari").trim();
    const date = (meta.date || "").trim();

    const socialTitle = (
      meta.og_title ||
      meta.ogTitle ||
      meta["og:title"] ||
      meta.twitter_title ||
      meta.twitterTitle ||
      meta["twitter:title"] ||
      title
    ).trim();

    const socialDescription = (
      meta.og_description ||
      meta.ogDescription ||
      meta["og:description"] ||
      meta.twitter_description ||
      meta.twitterDescription ||
      meta["twitter:description"] ||
      description
    ).trim();

    const pageImage =
      toAbsoluteUrl(meta.image || meta.ogImage || meta["og:image"]) ||
      toAbsoluteUrl(firstMarkdownImage(body)) ||
      DEFAULT_IMAGE;

    const html = renderPostHtml({
      slug,
      title,
      description,
      socialTitle,
      socialDescription,
      pageImage,
      publishedDate: date,
    });

    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.html`), html, "utf8");
    generatedSlugs.push(slug);
    indexEntries.push({
      slug,
      title,
      date,
      displayDate: formatDisplayDate(date),
      description,
    });
  });

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
    `Generated ${generatedSlugs.length} post share pages, updated posts/index.json, and updated sitemap.xml`,
  );
}

run();
