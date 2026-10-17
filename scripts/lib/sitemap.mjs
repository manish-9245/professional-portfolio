import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { BASE_URL } from "./markdown.mjs";

const PAGES = [
  { path: "/", file: "index.html", changefreq: "weekly", priority: "1.0" },
  { path: "/about.html", file: "about.html", changefreq: "monthly", priority: "0.8" },
  { path: "/projects.html", file: "projects.html", changefreq: "weekly", priority: "0.9" },
  { path: "/open-source.html", file: "open-source.html", changefreq: "daily", priority: "0.8" },
  { path: "/blogs.html", file: "blogs.html", changefreq: "daily", priority: "0.9" },
  { path: "/contact.html", file: "contact.html", changefreq: "monthly", priority: "0.6" },
];

/** Last change of a file: git commit date, else mtime (Vercel clones can be shallow). */
function lastModified(root, file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- ${file}`, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (out) return out.slice(0, 10);
  } catch {
    // fall through to mtime
  }
  try {
    return fs.statSync(path.join(root, file)).mtime.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function readIndex(indexPath) {
  try {
    const data = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function urlBlock(loc, lastmod, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ];
}

/**
 * Single source of truth for sitemap.xml. Both the blog generator and the
 * project generator call this after writing their own index.json, so
 * whichever runs last always produces the full, combined sitemap instead of
 * clobbering the other's URLs.
 */
export function writeSitemap(sitemapPath, { postSlugs = [], projectSlugs = [] } = {}) {
  const root = path.dirname(sitemapPath);
  const postDates = Object.fromEntries(readIndex(path.join(root, "posts/index.json")).map((p) => [p.slug, p.date]));
  const projectDates = Object.fromEntries(readIndex(path.join(root, "projects/index.json")).map((p) => [p.slug, p.date]));

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  PAGES.forEach((p) => lines.push(...urlBlock(`${BASE_URL}${p.path}`, lastModified(root, p.file), p.changefreq, p.priority)));

  [...new Set(projectSlugs)].sort().forEach((slug) => {
    lines.push(...urlBlock(`${BASE_URL}/projects/${encodeURIComponent(slug)}.html`, projectDates[slug], "monthly", slug === "ai-blogs" ? "0.8" : "0.7"));
  });

  [...new Set(postSlugs)].sort().forEach((slug) => {
    lines.push(...urlBlock(`${BASE_URL}/posts/${encodeURIComponent(slug)}.html`, postDates[slug], "monthly", "0.7"));
  });

  lines.push("</urlset>", "");
  fs.writeFileSync(sitemapPath, lines.join("\n"), "utf8");
  writeLlms(root);
  writeFeed(root);
}

const xmlEscape = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Atom feed of blog posts, newest first. */
function writeFeed(root) {
  const posts = readIndex(path.join(root, "posts/index.json"));
  if (!posts.length) return;
  const updated = `${posts[0].date}T00:00:00Z`;
  const entries = posts.map((p) => {
    const url = `${BASE_URL}/posts/${p.slug}.html`;
    return `  <entry>
    <title>${xmlEscape(p.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <published>${p.date}T00:00:00Z</published>
    <updated>${p.date}T00:00:00Z</updated>
    <summary>${xmlEscape(p.description)}</summary>
  </entry>`;
  });
  fs.writeFileSync(
    path.join(root, "feed.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Manish Tiwari · Engineering Notes</title>
  <subtitle>Distributed systems, cloud, AI and backend deep dives.</subtitle>
  <link href="${BASE_URL}/feed.xml" rel="self" />
  <link href="${BASE_URL}/blogs.html" />
  <id>${BASE_URL}/</id>
  <updated>${updated}</updated>
  <author><name>Manish Tiwari</name><uri>${BASE_URL}/about.html</uri></author>
${entries.join("\n")}
</feed>
`,
    "utf8",
  );
}

/** llms.txt (index) and llms-full.txt (index plus summaries) for AI answer engines. */
function writeLlms(root) {
  const posts = readIndex(path.join(root, "posts/index.json"));
  const projects = readIndex(path.join(root, "projects/index.json"));
  const link = (title, url, desc) => `- [${title}](${url})${desc ? `: ${desc}` : ""}`;

  const head = [
    "# Manish Tiwari",
    "",
    "> Manish Tiwari is a Software Engineer-2 at JPMorgan Chase (CIB Markets) in Bangalore, India. He builds resilient high-scale backend systems (Java, Spring Boot), cloud modernization on AWS and Terraform, and AI agent tooling (MCP servers, LangChain, n8n). He also contributes bug fixes and docs to open source projects and writes engineering deep dives.",
    "",
    "Contact: manishdoestech@gmail.com. Profiles: https://github.com/manish-9245 and https://www.linkedin.com/in/manishtiwari13/",
    "",
    "## Pages",
    link("About", `${BASE_URL}/about.html`, "experience, awards, certifications (AWS Developer Associate, Terraform Associate, FinOps Practitioner), education and skills"),
    link("Projects", `${BASE_URL}/projects.html`, "full-stack, AI and cloud products shipped"),
    link("Open Source", `${BASE_URL}/open-source.html`, "live log of pull requests sent to other open source projects and their outcomes"),
    link("Blogs", `${BASE_URL}/blogs.html`, "engineering notes on distributed systems, cloud, AI and backend"),
    link("Contact", `${BASE_URL}/contact.html`),
    "",
    "## Projects",
    ...projects.map((p) => link(p.title, `${BASE_URL}/projects/${p.slug}.html`, p.description)),
    "",
    "## Blog posts",
  ];
  const tail = (full) => posts.map((p) => link(p.title, `${BASE_URL}/posts/${p.slug}.html`, full ? `${p.displayDate}. ${p.description}` : ""));
  fs.writeFileSync(path.join(root, "llms.txt"), [...head, ...tail(false), ""].join("\n"), "utf8");
  fs.writeFileSync(path.join(root, "llms-full.txt"), [...head, ...tail(true), ""].join("\n"), "utf8");
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
