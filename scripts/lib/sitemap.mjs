import fs from "node:fs";
import { BASE_URL } from "./markdown.mjs";

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

/**
 * Single source of truth for sitemap.xml. Both the blog generator and the
 * project generator call this after writing their own index.json, so
 * whichever runs last always produces the full, combined sitemap instead of
 * clobbering the other's URLs.
 */
export function writeSitemap(sitemapPath, { postSlugs = [], projectSlugs = [] } = {}) {
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

  [...new Set(projectSlugs)].sort().forEach((slug) => {
    lines.push("  <url>");
    lines.push(`    <loc>${BASE_URL}/projects/${encodeURIComponent(slug)}.html</loc>`);
    lines.push("    <changefreq>monthly</changefreq>");
    lines.push(`    <priority>${slug === "ai-blogs" ? "0.8" : "0.7"}</priority>`);
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
  fs.writeFileSync(sitemapPath, lines.join("\n"), "utf8");
}

/** Reads a previously-written index.json (if present) and returns its slugs. */
export function readSlugsFrom(indexPath) {
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    return Array.isArray(data) ? data.map((item) => item.slug).filter(Boolean) : [];
  } catch {
    return [];
  }
}
