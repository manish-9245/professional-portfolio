#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASE_URL,
  parseFrontmatter,
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
const PROJECTS_DIR = path.join(ROOT, "projects");
const IMAGE_DIR = path.join(ROOT, "image", "optimized");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const PROJECTS_INDEX_PATH = path.join(PROJECTS_DIR, "index.json");
const POSTS_INDEX_PATH = path.join(ROOT, "posts", "index.json");
const TEMPLATE_PATH = path.join(__dirname, "project-template.html");
const PROJECTS_LISTING_PATH = path.join(ROOT, "projects.html");

const GRID_START = "<!--PROJECTS_GRID_START-->";
const GRID_END = "<!--PROJECTS_GRID_END-->";

// ── small frontmatter mini-languages (kept flat, no yaml dependency) ────

function parseTags(value = "") {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseGallery(value = "") {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

/** "Label|URL; Label2|URL2" -> [{label, url}] */
function parseLinks(value = "") {
  return value
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [label, url] = chunk.split("|").map((s) => s.trim());
      return { label, url };
    })
    .filter((link) => link.label && link.url);
}

/** "Frontend|React,TypeScript; Backend|Node.js" -> [{label, items:[...]}] */
function parseTechGroups(value = "") {
  return value
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [label, itemsStr] = chunk.split("|");
      return {
        label: (label || "").trim(),
        items: (itemsStr || "").split(",").map((s) => s.trim()).filter(Boolean),
      };
    })
    .filter((group) => group.label && group.items.length);
}

// ── image helpers ────────────────────────────────────────────────────

function localImageVariants(imagePath) {
  if (!imagePath || !imagePath.startsWith("/image/optimized/")) {
    return null;
  }
  const base = imagePath.replace("/image/optimized/", "").replace(/\.webp$/, "");
  const variant320 = `/image/optimized/${base}-320.webp`;
  const variant700 = `/image/optimized/${base}-700.webp`;
  const has320 = fs.existsSync(path.join(IMAGE_DIR, `${base}-320.webp`));
  const has700 = fs.existsSync(path.join(IMAGE_DIR, `${base}-700.webp`));
  if (!has320 && !has700) {
    return null;
  }
  const srcset = [
    has320 ? `${variant320} 320w` : "",
    has700 ? `${variant700} 700w` : "",
    `${imagePath} 960w`,
  ].filter(Boolean).join(", ");
  return { srcset, sizes: "(max-width: 860px) 92vw, 760px" };
}

function imageTag({ src, alt, className, active, eager }) {
  const variants = localImageVariants(src);
  const attrs = [
    `class="${className}${active ? " is-active" : ""}"`,
    `src="${src}"`,
    variants ? `srcset="${variants.srcset}"` : "",
    variants ? `sizes="${variants.sizes}"` : "",
    `width="960"`,
    `height="536"`,
    `alt="${escapeHtml(alt)}"`,
    `loading="${eager ? "eager" : "lazy"}"`,
    `decoding="async"`,
  ].filter(Boolean);
  return `<img ${attrs.join(" ")} />`;
}

function carouselMarkup(gallery, title) {
  const slides = gallery.map((src, i) =>
    imageTag({
      src,
      alt: `${title} screenshot ${i + 1}`,
      className: "project-carousel-image",
      active: i === 0,
      eager: i === 0,
    })
  ).join("\n              ");

  return `
            <div class="project-carousel" data-carousel aria-label="${escapeHtml(title)} project screenshots">
              ${slides}
              <div class="project-carousel-controls">
                <button type="button" class="project-carousel-btn" data-carousel-prev aria-label="Previous screenshot">
                  <svg class="icon-sketch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M15 5.5 8.5 12l6.5 6.5" /></svg>
                </button>
                <button type="button" class="project-carousel-btn" data-carousel-next aria-label="Next screenshot">
                  <svg class="icon-sketch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 5.5 15.5 12 9 18.5" /></svg>
                </button>
              </div>
            </div>`;
}

function renderMediaSection(meta, title) {
  const gallery = parseGallery(meta.gallery || "");
  const image = (meta.image || "").trim();

  if (gallery.length > 1) {
    return `
      <section class="surface" aria-label="Screenshots">
        <div style="max-width: 760px; margin: 0 auto">
          <article class="project-card project-card--hero">
            ${carouselMarkup(gallery, title)}
          </article>
        </div>
      </section>`;
  }

  const singleSrc = gallery[0] || image;
  if (!singleSrc) {
    return "";
  }

  const isExternal = /^https?:\/\//i.test(singleSrc);
  const attrs = isExternal
    ? `class="project-thumb" src="${singleSrc}" alt="${escapeHtml(title)} project visual" loading="eager" width="960" height="536"`
    : null;

  const imgHtml = attrs
    ? `<img ${attrs} />`
    : imageTag({ src: singleSrc, alt: `${title} project screenshot`, className: "project-thumb", active: false, eager: true });

  return `
      <section class="surface" aria-label="Screenshot">
        <div style="max-width: 640px; margin: 0 auto">
          <figure class="project-card">
            ${imgHtml}
          </figure>
        </div>
      </section>`;
}

function renderHero({ meta, title, slug }) {
  const metaBits = [meta.role, meta.status, meta.type].filter(Boolean);
  const metaRow = metaBits.length
    ? `<div class="contact-meta-row">${metaBits
        .map((bit, i) => `${i > 0 ? '<span aria-hidden="true">•</span>' : ""}<span>${escapeHtml(bit)}</span>`)
        .join("")}</div>`
    : "";

  const links = parseLinks(meta.links || "");
  const ctas = [];
  if (links.length) {
    ctas.push(
      `<a href="${links[0].url}" target="_blank" rel="noreferrer">${escapeHtml(links[0].label)}</a>`
    );
    links.slice(1).forEach((link) => {
      ctas.push(`<a href="${link.url}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`);
    });
  }
  if (meta.repo) {
    ctas.push(`<a href="${meta.repo}" target="_blank" rel="noreferrer">View repo</a>`);
  }

  return `
      <section class="surface">
        <p class="muted kicker">${escapeHtml(meta.kicker || "Project")}</p>
        <h1 class="hero-title">${title}</h1>
        <p class="hero-subtitle">${escapeHtml(meta.tagline || "")}</p>
        ${metaRow}
        <div class="cta-row">
          ${ctas.join("\n          ")}
        </div>
      </section>`;
}

function renderStackSection(meta) {
  const groups = parseTechGroups(meta.tech || "");
  if (!groups.length) {
    return "";
  }

  const groupHtml = (group) => `
          <div class="panel stack-group">
            <h3 class="stack-group-label">${escapeHtml(group.label)}</h3>
            <div class="stack">
              ${group.items.map((item) => `<span role="status">${escapeHtml(item)}</span>`).join("\n              ")}
            </div>
          </div>`;

  const inner = groups.length > 1
    ? `<div class="grid grid-2">${groups.map(groupHtml).join("")}</div>`
    : groupHtml(groups[0]);

  return `
      <section class="surface" aria-label="Tech stack">
        <p class="muted kicker">Under the hood</p>
        <h2 class="section-title">Tech stack</h2>
        ${inner}
      </section>`;
}

function scoreRelated(current, candidate) {
  const currentTags = new Set(current.tags);
  const shared = candidate.tags.filter((t) => currentTags.has(t)).length;
  return shared;
}

function renderRelatedSection(current, allEntries, limit = 3) {
  const related = allEntries
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({ ...p, score: scoreRelated(current, p) }))
    .sort((a, b) => b.score - a.score || (b.date || "").localeCompare(a.date || ""))
    .slice(0, limit);

  if (!related.length) {
    return "";
  }

  return `
      <section class="surface related-posts" aria-label="More projects">
        <h2>More projects</h2>
        <div class="related-posts-grid">
          ${related.map((p) => `
            <article class="panel related-card">
              <p class="related-meta">${p.tags.slice(0, 2).map(escapeHtml).join(" · ")}</p>
              <p class="related-title"><a href="/projects/${encodeURIComponent(p.slug)}.html">${escapeHtml(p.title)}</a></p>
              <p class="related-desc muted">${escapeHtml(p.tagline)}</p>
            </article>`).join("")}
        </div>
      </section>`;
}

function renderBackLink() {
  return `
      <div class="surface" style="padding-top:0">
        <a href="/projects.html">← Back to all projects</a>
      </div>`;
}

function renderBottomCta() {
  return `
      <section class="surface bottom-cta" aria-label="Hire me">
        <div class="panel bottom-cta-card">
          <div class="availability-badge" style="justify-content: center; margin-bottom: 1rem">
            <span class="availability-dot" aria-hidden="true"></span>
            Open to new projects
          </div>
          <h2 class="section-title" style="margin-top: 0">Want something like this built?</h2>
          <p class="muted" style="max-width: 56ch; margin: 0 auto 1.6rem">
            I build full-stack products and AI tooling end-to-end - from the first line of
            code to a production deployment.
          </p>
          <div class="cta-row" style="justify-content: center">
            <a role="button" href="https://cal.com/manishtiwari/" data-schedule-open target="_blank" rel="noreferrer">Book a free intro call</a>
            <a href="/projects.html">See more projects</a>
          </div>
        </div>
      </section>`;
}

function renderShareSection(shareActionsHtml) {
  return `
      <section class="surface blog-share" id="blog-share" aria-label="Share this project">${shareActionsHtml}</section>`;
}

function renderDeepDive({ meta, tocHtml, contentHtml }) {
  const metaCards = [];
  if (meta.role) metaCards.push(`<section class="blog-meta-card" aria-label="Role"><p class="blog-meta-label">Role</p><p class="blog-meta-value">${escapeHtml(meta.role)}</p></section>`);
  if (meta.status) metaCards.push(`<section class="blog-meta-card" aria-label="Status"><p class="blog-meta-label">Status</p><p class="blog-meta-value">${escapeHtml(meta.status)}</p></section>`);
  if (meta.repo) metaCards.push(`<section class="blog-meta-card" aria-label="Source code"><p class="blog-meta-label">Source</p><a class="blog-meta-link" href="${meta.repo}" target="_blank" rel="noreferrer">View on GitHub</a></section>`);
  metaCards.push(`<section class="blog-meta-card" aria-label="Project navigation"><p class="blog-meta-label">Navigate</p><a class="blog-meta-link" href="/projects.html">← All projects</a></section>`);

  return `
      <section class="surface" style="padding-bottom:0">
        <p class="muted kicker">Deep dive</p>
        <h2 class="section-title">How it's built</h2>
      </section>
      <div class="blog-post-layout">
        <nav class="blog-toc" id="blog-toc" aria-label="Table of contents">${tocHtml}</nav>
        <article class="blog-prose" id="blog-prose">${contentHtml}</article>
        <aside class="blog-meta-col">${metaCards.join("")}</aside>
      </div>`;
}

function plainTitle(meta, slug) {
  return (meta.title || titleFromSlug(slug)).trim();
}

/**
 * Wraps the accent substring (e.g. "Code" inside "CollabCode", or
 * "Recognition" inside "Facial Emotion Recognition") in a script-accent
 * span. Operating on the one intact title string - rather than
 * concatenating separately-trimmed prefix/suffix fields - keeps whatever
 * spacing (or lack of it) the real title has.
 */
function titleHtml(meta, slug) {
  const title = plainTitle(meta, slug);
  const accent = (meta.title_accent || "").trim();
  if (!accent) {
    return escapeHtml(title);
  }
  const idx = title.lastIndexOf(accent);
  if (idx === -1) {
    return escapeHtml(title);
  }
  const before = title.slice(0, idx);
  const after = title.slice(idx + accent.length);
  return `${escapeHtml(before)}<span class="script-accent">${escapeHtml(accent)}</span>${escapeHtml(after)}`;
}

function renderProjectPage(template, { meta, slug, title, contentHtml, tocHtml, allEntries }) {
  const pageUrl = `${BASE_URL}/projects/${encodeURIComponent(slug)}.html`;
  const description = (meta.description || meta.tagline || `${title} - a project by Manish Tiwari`).trim();
  const links = parseLinks(meta.links || "");
  const primaryUrl = links[0]?.url || meta.repo || pageUrl;
  const pageImage = toAbsoluteUrl(parseGallery(meta.gallery || "")[0] || meta.image || "") || `${BASE_URL}/image/optimized/brand-logo.webp`;

  let html = template
    .replace(/<title[^>]*?>.*?<\/title>/si, `<title>${escapeHtml(title)} · Project · Manish Tiwari</title>`)
    .replace(/<meta[^>]*?name="description"[^>]*?>/si, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link[^>]*?rel="canonical"[^>]*?>/si, `<link rel="canonical" href="${pageUrl}" />`)
    .replace(/<meta[^>]*?property="og:title"[^>]*?>/si, `<meta property="og:title" content="${escapeHtml(title)} · Manish Tiwari" />`)
    .replace(/<meta[^>]*?property="og:description"[^>]*?>/si, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta[^>]*?property="og:url"[^>]*?>/si, `<meta property="og:url" content="${pageUrl}" />`)
    .replace(/<meta[^>]*?property="og:image"[^>]*?>/si, `<meta property="og:image" content="${escapeHtml(pageImage)}" />`)
    .replace(/<meta[^>]*?name="twitter:title"[^>]*?>/si, `<meta name="twitter:title" content="${escapeHtml(title)} · Manish Tiwari" />`)
    .replace(/<meta[^>]*?name="twitter:description"[^>]*?>/si, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta[^>]*?name="twitter:image"[^>]*?>/si, `<meta name="twitter:image" content="${escapeHtml(pageImage)}" />`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description,
    applicationCategory: meta.application_category || "DeveloperApplication",
    operatingSystem: "Web",
    url: primaryUrl,
    author: { "@type": "Person", name: "Manish Tiwari", url: "https://buildwithmanish.com/about.html" },
  };
  html = html.replace(/<script id="project-schema".*?>.*?<\/script>/s, `<script id="project-schema" type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`);

  const { shareActionsHtml, floatingShareHtml } = buildShareBlocks({ pageUrl, title, noun: "project" });

  const mainContent = [
    renderHero({ meta, title: titleHtml(meta, slug), slug }),
    renderMediaSection(meta, title),
    renderDeepDive({ meta, tocHtml, contentHtml }),
    renderStackSection(meta),
    renderRelatedSection({ slug, tags: parseTags(meta.tags || "") }, allEntries),
    renderShareSection(shareActionsHtml),
    renderBackLink(),
    renderBottomCta(),
  ].filter(Boolean).join("\n      <hr class=\"divider\" aria-hidden=\"true\" />\n") + floatingShareHtml;

  return html.replace("<!--PROJECT_MAIN-->", mainContent);
}

function renderListingCard(entry, index) {
  const { meta, slug, title } = entry;
  const gallery = parseGallery(meta.gallery || "");
  const image = gallery[0] || meta.image || "";
  const isHero = index === 0;
  const links = parseLinks(meta.links || "");
  const techFlat = parseTechGroups(meta.tech || "").flatMap((g) => g.items).join(", ");

  const actions = [`<a href="/projects/${encodeURIComponent(slug)}.html">View project</a>`];
  links.forEach((link) => actions.push(`<a href="${link.url}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`));
  if (meta.repo) actions.push(`<a href="${meta.repo}" target="_blank" rel="noreferrer">View repo</a>`);

  const media = gallery.length > 1
    ? carouselMarkup(gallery, title)
    : image
      ? (localImageVariants(image)
        ? `<img class="project-thumb" src="${image}" srcset="${localImageVariants(image).srcset}" sizes="${localImageVariants(image).sizes}" width="960" height="536" alt="${escapeHtml(title)} project screenshot" loading="lazy" decoding="async" />`
        : `<img class="project-thumb" src="${image}" alt="${escapeHtml(title)} project screenshot" loading="lazy" width="960" height="536" />`)
      : "";

  return `
        <article class="project-card${isHero ? " project-card--hero" : ""}">
          ${media}
          <div class="project-body">
            <h2>${titleHtml(meta, slug)}</h2>
            <p>${escapeHtml(meta.tagline || "")}</p>
            <ul class="stack">
              <li>Tech: ${escapeHtml(techFlat)}</li>
            </ul>
            <div class="actions-row">
              ${actions.join("\n              ")}
            </div>
          </div>
        </article>`;
}

function updateProjectsListing(entries) {
  if (!fs.existsSync(PROJECTS_LISTING_PATH)) {
    return;
  }
  const html = fs.readFileSync(PROJECTS_LISTING_PATH, "utf8");
  const startIdx = html.indexOf(GRID_START);
  const endIdx = html.indexOf(GRID_END);
  if (startIdx === -1 || endIdx === -1) {
    return;
  }

  const grid = entries.map(renderListingCard).join("\n");
  const next = `${html.slice(0, startIdx + GRID_START.length)}\n${grid}\n      ${html.slice(endIdx)}`;
  fs.writeFileSync(PROJECTS_LISTING_PATH, next, "utf8");
}

function run() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return;
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const files = fs.readdirSync(PROJECTS_DIR).filter((name) => name.endsWith(".md")).sort();

  const entries = files.map((filename) => {
    const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = (meta.slug || path.basename(filename, ".md")).trim();
    const title = plainTitle(meta, slug);
    return {
      slug,
      meta,
      body,
      title,
      tagline: (meta.tagline || "").trim(),
      date: (meta.date || "").trim(),
      tags: parseTags(meta.tags || ""),
    };
  });

  // sort listing/index by date, newest first, matching the blog convention
  entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  entries.forEach((entry) => {
    const { contentHtml, tocHtml } = renderContentWithToc(entry.body);
    const html = renderProjectPage(template, {
      meta: entry.meta,
      slug: entry.slug,
      title: entry.title,
      contentHtml,
      tocHtml,
      allEntries: entries,
    });
    fs.writeFileSync(path.join(PROJECTS_DIR, `${entry.slug}.html`), html, "utf8");
  });

  const generatedSlugs = entries.map((e) => e.slug);
  fs.readdirSync(PROJECTS_DIR)
    .filter((name) => name.endsWith(".html"))
    .forEach((name) => {
      const slug = path.basename(name, ".html");
      if (!generatedSlugs.includes(slug)) {
        fs.rmSync(path.join(PROJECTS_DIR, name), { force: true });
      }
    });

  const indexEntries = entries.map((e) => ({
    slug: e.slug,
    title: e.title,
    date: e.date,
    displayDate: formatDisplayDate(e.date),
    description: e.tagline,
    tags: e.tags,
  }));
  fs.writeFileSync(PROJECTS_INDEX_PATH, `${JSON.stringify(indexEntries, null, 2)}\n`, "utf8");

  updateProjectsListing(entries);

  writeSitemap(SITEMAP_PATH, {
    postSlugs: readSlugsFrom(POSTS_INDEX_PATH),
    projectSlugs: generatedSlugs,
  });

  console.log(`Generated ${generatedSlugs.length} project pages, updated projects.html grid, projects/index.json, and sitemap.xml`);
}

run();
