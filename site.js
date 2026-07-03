function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "index.html";
  }

  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const lastSegment = trimmed.split("/").pop() || "index.html";
  return lastSegment || "index.html";
}

const THEME_STORAGE_KEY = "site-theme";

function readStoredTheme() {
  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === "light" || theme === "dark") {
      return theme;
    }
  } catch {
    // ignore storage failures
  }
  return null;
}

function getSystemPreferredTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getActiveTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  if (current === "light" || current === "dark") {
    return current;
  }
  return readStoredTheme() || getSystemPreferredTheme();
}

function persistTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures
  }
}

function updateThemeToggleUI() {
  const theme = getActiveTheme();
  const isDark = theme === "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.textContent = isDark ? "☀ Light" : "☾ Dark";
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
  });
}

function applyTheme(theme, options = {}) {
  const { persist = false } = options;
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalizedTheme);
  document.documentElement.setAttribute("data-o-theme", normalizedTheme);

  if (persist) {
    persistTheme(normalizedTheme);
  }

  updateThemeToggleUI();
  syncHljs();
}

function syncHljs() {
  const isDark = getActiveTheme() === "dark";
  const lightTheme = document.getElementById("hljs-theme-light");
  const darkTheme = document.getElementById("hljs-theme-dark");

  if (lightTheme) {
    lightTheme.disabled = isDark;
    if (isDark) {
      lightTheme.setAttribute("disabled", "true");
    } else {
      lightTheme.removeAttribute("disabled");
    }
  }
  if (darkTheme) {
    darkTheme.disabled = !isDark;
    if (!isDark) {
      darkTheme.setAttribute("disabled", "true");
    } else {
      darkTheme.removeAttribute("disabled");
    }
  }
}

function initializeTheme() {
  applyTheme(readStoredTheme() || getSystemPreferredTheme());

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (mediaQuery && !mediaQuery._themeBound) {
    const onSystemThemeChange = () => {
      if (!readStoredTheme()) {
        applyTheme(getSystemPreferredTheme());
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onSystemThemeChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(onSystemThemeChange);
    }
    mediaQuery._themeBound = true;
  }

  // Watch for manual data-theme changes
  new MutationObserver(() => syncHljs()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-o-theme"],
  });
}

function getSchedulerUrl() {
  return `https://cal.com/manishtiwari/?embed=true&theme=${getActiveTheme()}`;
}

function getSchedulerModal() {
  return document.getElementById("scheduler-modal");
}

function ensureSchedulerFrame() {
  const frame = document.querySelector("[data-scheduler-frame]");
  if (frame) {
    const nextSrc = getSchedulerUrl();
    if (frame.getAttribute("src") !== nextSrc) {
      frame.setAttribute("src", nextSrc);
    }
  }
  return frame;
}

function openSchedulerModal() {
  const modal = getSchedulerModal();
  if (!modal || typeof modal.showModal !== "function") {
    window.open("https://cal.com/manishtiwari/", "_blank", "noopener,noreferrer");
    return;
  }

  ensureSchedulerFrame();
  if (!modal.open) {
    modal.showModal();
  }
  document.body.classList.add("modal-open");
}

function closeSchedulerModal() {
  const modal = getSchedulerModal();
  if (!modal) {
    return;
  }

  if (modal.open) {
    modal.close();
  }
  document.body.classList.remove("modal-open");
}

function setActivePage(pathname = window.location.pathname) {
  const activePage = normalizePath(pathname);
  document.querySelectorAll("nav a[data-page]").forEach((anchor) => {
    if (anchor.dataset.page === activePage) {
      anchor.setAttribute("aria-current", "page");
    } else {
      anchor.removeAttribute("aria-current");
    }
  });
}

function initializeMobileNavigation() {
  const headerRow = document.querySelector(".header-row");
  const nav = document.querySelector("header nav");
  const navList = nav ? nav.querySelector("ul") : null;

  if (!headerRow || !nav || !navList) {
    return;
  }

  if (!navList.id) {
    navList.id = "primary-nav-list";
  }

  let toggle = headerRow.querySelector("[data-nav-toggle]");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("data-nav-toggle", "");
    toggle.setAttribute("aria-controls", navList.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Toggle navigation menu");
    toggle.innerHTML = '<span></span><span></span><span></span>';
    headerRow.insertBefore(toggle, nav);
  }

  if (toggle.dataset.bound === "true") {
    return;
  }

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("nav-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) {
      return;
    }
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeMenu();
    }
  });

  toggle.dataset.bound = "true";
}

function initializeThemeToggle() {
  const headerRow = document.querySelector(".header-row");
  const navList = document.querySelector("header nav ul");
  if (!headerRow || !navList) {
    return;
  }

  let navToggle = navList.querySelector(".theme-toggle-nav[data-theme-toggle]");
  if (!navToggle) {
    const item = document.createElement("li");
    navToggle = document.createElement("button");
    navToggle.type = "button";
    navToggle.className = "theme-toggle theme-toggle-nav";
    navToggle.setAttribute("data-theme-toggle", "");
    item.appendChild(navToggle);
    navList.appendChild(item);
  }

  let mobileToggle = headerRow.querySelector(
    ".theme-toggle-mobile[data-theme-toggle]",
  );
  if (!mobileToggle) {
    mobileToggle = document.createElement("button");
    mobileToggle.type = "button";
    mobileToggle.className = "theme-toggle theme-toggle-mobile";
    mobileToggle.setAttribute("data-theme-toggle", "");
    mobileToggle.setAttribute("aria-label", "Toggle dark mode");
    headerRow.insertBefore(mobileToggle, document.querySelector("header nav"));
  }

  const bindToggle = (toggle) => {
    if (!toggle || toggle.dataset.bound === "true") {
      return;
    }

    toggle.addEventListener("click", () => {
      const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
      applyTheme(nextTheme, { persist: true });
      ensureSchedulerFrame();
    });
    toggle.dataset.bound = "true";
  };

  bindToggle(navToggle);
  bindToggle(mobileToggle);

  updateThemeToggleUI();
}

const BLOG_INDEX_CACHE_KEY = "blog-index-cache-v2";
const BLOG_INDEX_CACHE_TTL_MS = 5 * 60 * 1000;

function readSessionJson(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSessionJson(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures (private mode/quota)
  }
}

async function getBlogIndex() {
  const cached = readSessionJson(BLOG_INDEX_CACHE_KEY);
  const now = Date.now();

  if (cached && Array.isArray(cached.data) && now - cached.timestamp < BLOG_INDEX_CACHE_TTL_MS) {
    return cached.data;
  }

  // Add cache buster to ensure fresh data if cache is missing or stale
  const response = await fetch(`/posts/index.json?v=${now}`);
  if (!response.ok) {
    console.error("Failed to fetch blog index:", response.status, response.statusText);
    throw new Error(`Failed to load blog index: ${response.status}`);
  }

  const posts = await response.json();
  if (!Array.isArray(posts)) {
    throw new Error("Blog index is not an array");
  }
  
  writeSessionJson(BLOG_INDEX_CACHE_KEY, { timestamp: now, data: posts });
  return posts;
}

function createBlogCard(post) {
  const slug = encodeURIComponent(post.slug);
  const tag = getBlogTag(post.title);
  const href = `./posts/${slug}.html`;

  return `
    <article class="panel blog-card">
      <p class="blog-card-meta">
        <span class="muted">${post.displayDate}</span>
        <span class="blog-card-dot" aria-hidden="true">•</span>
        <span class="blog-chip">${tag}</span>
      </p>
      <h2 class="blog-card-title"><a href="${href}" class="blog-card-link">${post.title}</a></h2>
      <p class="blog-card-desc muted">${post.description}</p>
      <div class="actions-row">
        <a href="${href}" class="blog-read-more">Read article <svg class="icon-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
      </div>
    </article>`;
}

function createFeaturedBlogCard(post) {
  const slug = encodeURIComponent(post.slug);
  const tag = getBlogTag(post.title);
  const href = `./posts/${slug}.html`;

  return `
    <article class="panel blog-card blog-card--featured">
      <div class="blog-card-content">
        <p class="blog-card-meta">
          <span class="kicker kicker--small">Latest Article</span>
          <span class="blog-card-dot" aria-hidden="true">•</span>
          <span class="muted">${post.displayDate}</span>
          <span class="blog-card-dot" aria-hidden="true">•</span>
          <span class="blog-chip">${tag}</span>
        </p>
        <h2 class="blog-card-title"><a href="${href}" class="blog-card-link">${post.title}</a></h2>
        <p class="blog-card-desc">${post.description}</p>
        <div class="actions-row">
          <a href="${href}" class="blog-read-more">Read full article <svg class="icon-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
        </div>
      </div>
    </article>`;
}

function matchesBlogQuery(post, query) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchable = [
    post.title,
    post.description,
    post.displayDate,
    getBlogTag(post.title),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

function getAllBlogTags(posts = []) {
  return Array.from(new Set(posts.map((post) => getBlogTag(post.title)))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function renderBlogTagOptions(container, allTags, selectedTags) {
  if (!container) {
    return;
  }

  container.innerHTML = allTags
    .map(
      (tag) =>
        `<button type="button" class="blog-tag-option${selectedTags.has(tag) ? " is-selected" : ""}" data-blog-tag="${tag}" aria-pressed="${selectedTags.has(tag) ? "true" : "false"}">${tag}</button>`
    )
    .join("");
}

function matchesBlogTagSelection(post, selectedTags) {
  if (!selectedTags || selectedTags.size === 0) {
    return true;
  }

  return selectedTags.has(getBlogTag(post.title));
}

function renderBlogGrid(grid, posts, query = "", selectedTags = new Set()) {
  const filteredPosts = posts.filter(
    (post) => matchesBlogQuery(post, query) && matchesBlogTagSelection(post, selectedTags)
  );

  if (!filteredPosts.length) {
    const safeQuery = (query || "").trim();
    const tagText = selectedTags.size ? ` in ${Array.from(selectedTags).join(", ")}` : "";
    grid.innerHTML = `<article class="panel"><p class="muted">No posts found${safeQuery ? ` for “${safeQuery}”` : ""}${tagText}. Try another keyword or tag.</p></article>`;
    return;
  }

  const [latest, ...rest] = filteredPosts;
  grid.innerHTML = `${createFeaturedBlogCard(latest)}${rest.map(createBlogCard).join("")}`;
}

function getBlogTag(title = "") {
  const value = title.toLowerCase();
  if (value.includes("ai") || value.includes("agentic")) return "AI";
  if (value.includes("cloud") || value.includes("terraform") || value.includes("microservices")) return "Cloud";
  if (value.includes("database") || value.includes("sql") || value.includes("excel")) return "Data";
  if (value.includes("flutter") || value.includes("frontend") || value.includes("react")) return "Frontend";
  if (value.includes("java") || value.includes("node") || value.includes("rbac") || value.includes("webhooks")) return "Backend";
  return "Engineering";
}

function createBlogLoadingCards(count = 3) {
  const featured = `
    <article class="panel blog-card blog-card--featured blog-card--loading" aria-hidden="true">
      <span class="blog-skeleton blog-skeleton--meta"></span>
      <span class="blog-skeleton blog-skeleton--title"></span>
      <span class="blog-skeleton blog-skeleton--line"></span>
      <span class="blog-skeleton blog-skeleton--line"></span>
    </article>`;

  const cards = Array.from({ length: count }, () => `
    <article class="panel blog-card blog-card--loading" aria-hidden="true">
      <span class="blog-skeleton blog-skeleton--meta"></span>
      <span class="blog-skeleton blog-skeleton--title"></span>
      <span class="blog-skeleton blog-skeleton--line"></span>
      <span class="blog-skeleton blog-skeleton--line blog-skeleton--line-short"></span>
    </article>`).join("");

  return `${featured}${cards}`;
}

function prefetchBlogPost(slug) {
  const key = `blog-post-cache-v2:${slug}`;
  const cached = readSessionJson(key);
  if (cached && typeof cached.body === "string") {
    return;
  }

  fetch(`./posts/${encodeURIComponent(slug)}.md`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to prefetch blog post");
      }
      return response.text();
    })
    .then((body) => {
      writeSessionJson(key, { timestamp: Date.now(), body });
    })
    .catch(() => {
      // ignore prefetch failures
    });
}

function createHomepageBlogCard(post) {
  const slug = encodeURIComponent(post.slug);
  const tag = getBlogTag(post.title);
  const href = `./posts/${slug}.html`;

  return `
    <a class="panel blog-card blog-card--compact" href="${href}">
      <span class="blog-tag">${tag}</span>
      <h3 class="blog-title">${post.title}</h3>
      <span class="muted blog-read">Read article <svg class="icon-arrow" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></span>
    </a>`;
}

async function initializeHomepageRecentBlogs() {
  const container = document.getElementById("home-recent-blogs");
  if (!container || container.dataset.loaded === "true") {
    return;
  }

  try {
    const posts = await getBlogIndex();
    const latestPosts = posts.slice(0, 3);

    if (!latestPosts.length) {
      container.innerHTML = '<article class="panel"><p class="muted">No posts available yet.</p></article>';
      container.dataset.loaded = "true";
      return;
    }

    container.innerHTML = latestPosts.map(createHomepageBlogCard).join("");
    container.dataset.loaded = "true";
  } catch {
    container.innerHTML = '<article class="panel"><p class="muted">Could not load latest posts right now.</p></article>';
  }
}

async function initializeBlogsPage() {
  const grid = document.getElementById("blog-grid");
  const searchInput = document.getElementById("blog-search-input");
  const tagOptions = document.getElementById("blog-tag-options");
  if (!grid || grid.dataset.loaded === "true") {
    return;
  }

  try {
    const posts = await getBlogIndex();
    if (!posts.length) {
      grid.innerHTML = '<article class="panel"><p class="muted">No posts available yet.</p></article>';
      return;
    }

    const selectedTags = new Set();
    const allTags = getAllBlogTags(posts);
    renderBlogTagOptions(tagOptions, allTags, selectedTags);

    const applySearch = () => {
      const query = searchInput ? searchInput.value : "";
      renderBlogGrid(grid, posts, query, selectedTags);
      renderBlogTagOptions(tagOptions, allTags, selectedTags);
    };

    applySearch();

    if (searchInput && searchInput.dataset.bound !== "true") {
      searchInput.addEventListener("input", applySearch);
      searchInput.dataset.bound = "true";
    }

    if (tagOptions && tagOptions.dataset.bound !== "true") {
      tagOptions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-blog-tag]");
        if (!button) {
          return;
        }

        const tag = button.getAttribute("data-blog-tag");
        if (!tag) {
          return;
        }

        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }

        applySearch();
      });
      tagOptions.dataset.bound = "true";
    }

    grid.dataset.loaded = "true";
  } catch {
    grid.innerHTML = '<article class="panel"><p class="muted">Could not load posts right now. Please refresh and try again.</p></article>';
  }
}

const carouselIntervals = new Set();

function clearProjectCarouselIntervals() {
  carouselIntervals.forEach((id) => {
    window.clearInterval(id);
  });
  carouselIntervals.clear();
}

function initializeProjectCarousels() {
  clearProjectCarouselIntervals();

  const carousels = document.querySelectorAll("[data-carousel]");
  carousels.forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll(".project-carousel-image"));
    if (images.length < 2) {
      return;
    }

    let currentIndex = Math.max(
      images.findIndex((image) => image.classList.contains("is-active")),
      0
    );

    const setActiveSlide = (nextIndex) => {
      currentIndex = (nextIndex + images.length) % images.length;
      images.forEach((image, index) => {
        image.classList.toggle("is-active", index === currentIndex);
      });
    };

    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        setActiveSlide(currentIndex - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        setActiveSlide(currentIndex + 1);
      });
    }

    let intervalId = window.setInterval(() => {
      setActiveSlide(currentIndex + 1);
    }, 3200);
    carouselIntervals.add(intervalId);

    const pause = () => {
      window.clearInterval(intervalId);
      carouselIntervals.delete(intervalId);
    };

    const resume = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        carouselIntervals.delete(intervalId);
      }
      intervalId = window.setInterval(() => {
        setActiveSlide(currentIndex + 1);
      }, 3200);
      carouselIntervals.add(intervalId);
    };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
  });
}

function initializeBlogPostFeatures() {
  const prose = document.getElementById("blog-prose");
  const toc = document.getElementById("blog-toc");

  if (prose) {
    if (window.hljs) {
      prose.querySelectorAll("pre code").forEach((block) => {
        window.hljs.highlightElement(block);
      });
    }
    initializeCodeCopy(prose);
    initializeImageModal(prose);
    initializeMermaidModal(prose);
    initializeBlogReader();
    initializeShareActions();
  }

  if (toc && prose) {
    initTocScroll(toc);
  }

  // Related posts and share actions initialization if needed
  // For static pages, we can check if these sections are empty and fill them if they are
  const relatedSection = document.getElementById("related-posts");
  if (relatedSection && !relatedSection.innerHTML.trim()) {
    // This could fetch index.json and render related posts
  }
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function getLanguageIcon(lang) {
  const l = lang.toLowerCase();
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

function initializeCodeCopy(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement && (pre.parentElement.classList.contains("code-block-shell") || pre.parentElement.classList.contains("code-block-wrapper"))) {
      return;
    }

    const code = pre.querySelector("code");
    if (!code) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-block-shell";
    pre.parentNode.insertBefore(wrapper, pre);

    const toolbar = document.createElement("div");
    toolbar.className = "code-window-bar";

    const controls = document.createElement("div");
    controls.className = "code-window-controls";
    controls.innerHTML = `
      <span class="code-window-dot close" aria-hidden="true"></span>
      <span class="code-window-dot minimize" aria-hidden="true"></span>
      <span class="code-window-dot maximize" aria-hidden="true"></span>`;

    let langName = code.getAttribute("data-lang") || "";
    if (!langName) {
      const classes = Array.from(code.classList);
      const langClass = classes.find((c) => c.startsWith("language-"));
      if (langClass) {
        langName = langClass.replace("language-", "");
      }
    }

    const langDisplay = document.createElement("div");
    langDisplay.className = "code-window-center";
    langDisplay.innerHTML = `
      ${getLanguageIcon(langName)}
      <span class="code-window-lang">${langName.length < 4 ? langName.toUpperCase() : langName.charAt(0).toUpperCase() + langName.slice(1)}</span>
    `;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-button";
    button.innerHTML = `
      <svg class="icon-copy" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span>Copy</span>`;
    button.setAttribute("aria-label", "Copy code to clipboard");

    toolbar.appendChild(controls);
    toolbar.appendChild(langDisplay);
    toolbar.appendChild(button);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);

    button.addEventListener("click", async () => {
      const label = button.querySelector("span");
      const originalHtml = button.innerHTML;
      try {
        await copyText(code.innerText);
        button.innerHTML = `
          <svg class="icon-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Copied</span>`;
        button.classList.add("is-copied");
        window.setTimeout(() => {
          button.innerHTML = originalHtml;
          button.classList.remove("is-copied");
        }, 2000);
      } catch {
        if (label) label.textContent = "Failed";
        window.setTimeout(() => {
          button.innerHTML = originalHtml;
        }, 2000);
      }
    });
  });
}

function initializeBlogReader() {
  const header = document.querySelector(".blog-post-header");
  const prose = document.getElementById("blog-prose");
  if (!header || !prose || !window.speechSynthesis) return;

  if (header.querySelector(".blog-reader-bar")) return;

  // Icons as constants
  const iconPlay = `<svg class="icon-play" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  const iconPause = `<svg class="icon-pause" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
  const iconStop = `<svg class="icon-stop" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;

  // Extract clean text
  const tempDiv = prose.cloneNode(true);
  // Remove technical/visual elements that shouldn't be read
  tempDiv.querySelectorAll("pre, .code-block-shell, .blog-toc, script, style, .blog-reader-bar, aside, .katex-html").forEach(el => el.remove());
  const textContent = tempDiv.innerText.trim().replace(/\s+/g, " ");
  
  if (!textContent || textContent.length < 5) return;

  const wordCount = textContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  const readerBar = document.createElement("div");
  readerBar.className = "blog-reader-bar";
  readerBar.innerHTML = `
    <div class="blog-reader-info">
      <div class="blog-reader-icon-wrapper">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
      </div>
      <div class="blog-reader-label">Listen</div>
    </div>
    <div class="blog-reader-controls">
      <button type="button" class="blog-reader-btn" id="reader-play" title="Play">
        ${iconPlay}${iconPause}
      </button>
      <button type="button" class="blog-reader-btn" id="reader-speed" title="Speed">
        <span class="blog-reader-speed">1x</span>
      </button>
      <button type="button" class="blog-reader-btn" id="reader-stop" title="Stop">
        ${iconStop}
      </button>
    </div>
    <div class="blog-reader-status" id="reader-status">${readTime} min</div>
  `;

  header.appendChild(readerBar);

  const playBtn = readerBar.querySelector("#reader-play");
  const stopBtn = readerBar.querySelector("#reader-stop");
  const speedBtn = readerBar.querySelector("#reader-speed");
  const speedText = speedBtn.querySelector(".blog-reader-speed");
  const statusText = readerBar.querySelector("#reader-status");

  let isPlaying = false;
  let isPaused = false;
  let speedIdx = 0;
  const speeds = [1.0, 1.25, 1.5, 2.0];
  let currentUtterance = null;
  let chunks = [];
  let currentChunkIdx = 0;
  let heartbeatInterval = null;

  function updateUI() {
    if (isPlaying) {
      playBtn.classList.add("is-playing");
      statusText.textContent = "Playing";
    } else {
      playBtn.classList.remove("is-playing");
      statusText.textContent = isPaused ? "Paused" : `${readTime} min`;
    }
    speedText.textContent = `${speeds[speedIdx]}x`;
  }

  function stopReading() {
    window.speechSynthesis.cancel();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    isPlaying = false;
    isPaused = false;
    currentChunkIdx = 0;
    updateUI();
  }

  function startReading() {
    console.log("Blog Reader: Preparing chunks...");
    
    // Split text into meaningful chunks (sentences)
    chunks = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
    currentChunkIdx = 0;
    
    playNextChunk();
  }

  function playNextChunk() {
    if (currentChunkIdx >= chunks.length) {
      stopReading();
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIdx].trim());
    utterance.rate = speeds[speedIdx];
    utterance.lang = "en-US";
    
    const voices = window.speechSynthesis.getVoices();
    const getBestVoice = () => {
      const preferences = [
        v => v.name.includes("Natural"),
        v => v.name.includes("Neural"),
        v => v.name.includes("Google") && v.lang.includes("en-US"),
        v => v.name.includes("Siri"),
        v => v.name.includes("Enhanced"),
        v => v.lang.startsWith("en-US") && !["Zarvox", "Organ", "Cellos", "Bad News", "Bells", "Bubbles"].some(n => v.name.includes(n)),
        v => v.lang.startsWith("en-GB")
      ];
      for (const check of preferences) {
        const found = voices.find(check);
        if (found) return found;
      }
      return voices[0];
    };

    const voice = getBestVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      isPlaying = true;
      isPaused = false;
      updateUI();
    };

    utterance.onend = () => {
      currentChunkIdx++;
      if (isPlaying) playNextChunk();
    };

    utterance.onerror = (e) => {
      console.error("Blog Reader Error:", e);
      // Try to recover by moving to next chunk
      currentChunkIdx++;
      if (currentChunkIdx < chunks.length && isPlaying) {
        playNextChunk();
      } else {
        stopReading();
      }
    };

    // Chrome macOS Kickstart
    if (currentChunkIdx === 0) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }
    
    window.speechSynthesis.speak(utterance);
  }

  playBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (isPlaying) {
      window.speechSynthesis.pause();
      isPlaying = false;
      isPaused = true;
      updateUI();
    } else if (isPaused) {
      window.speechSynthesis.resume();
      isPlaying = true;
      isPaused = false;
      updateUI();
    } else {
      startReading();
    }
  });

  speedBtn.addEventListener("click", (e) => {
    e.preventDefault();
    speedIdx = (speedIdx + 1) % speeds.length;
    if (isPlaying || isPaused) {
      startReading();
      if (isPaused) window.speechSynthesis.pause();
    } else {
      updateUI();
    }
  });

  stopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    stopReading();
  });

  window.addEventListener("beforeunload", () => {
    window.speechSynthesis.cancel();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  });

  // Pre-fetch voices
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

function renderShareActions({ url, title, description } = {}) {
  const section = document.getElementById("blog-share");
  if (!section) return;

  const pageUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title || document.title || "");
  const encodedDescription = encodeURIComponent(description || "");

  const icons = {
    linkedin: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
    x: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M18.901 2.001H22.01l-6.772 7.74 7.961 10.26H16.1l-4.782-6.241-5.462 6.241H2.74l7.243-8.272L2.24 2.001h6.257l4.316 5.7L18.901 2.001zM17.81 18.232h1.725L6.442 3.633H4.59L17.81 18.232z"/></svg>',
    facebook: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.74h-2.94v-3.403h2.94v-2.511c0-2.91 1.777-4.496 4.375-4.496 1.243 0 2.312.093 2.623.134v3.042l-1.799.001c-1.412 0-1.687.672-1.687 1.654v2.176h3.368l-.438 3.403h-2.93v8.74h6.052c.73 0 1.323-.593 1.323-1.324v-21.351c0-.732-.593-1.325-1.325-1.325z"/></svg>',
    whatsapp: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.064-4.516 10.066-10.066.002-5.546-4.512-10.064-10.061-10.064-2.689 0-5.212 1.048-7.103 2.942-1.892 1.893-2.938 4.417-2.94 7.104 0 2.115.654 4.043 1.767 5.717l-.543 1.981 2.053-.538zm11.332-7.606c-.341-.17-2.022-1.001-2.333-1.115-.312-.113-.54-.169-.767.17-.227.34-.879 1.115-1.077 1.341-.199.227-.398.254-.74.085-.34-.17-1.437-.534-2.735-1.693-1.01-.902-1.692-2.016-1.891-2.356-.199-.34-.022-.524.148-.693.154-.151.341-.4.511-.6.17-.199.227-.34.341-.568.113-.227.056-.425-.028-.595-.085-.17-.767-1.851-.105-2.651-.235-.572-.465-.494-.666-.504-.171-.008-.369-.01-.567-.01-.199 0-.522.074-.795.372-.273.298-1.041 1.021-1.041 2.492 0 1.47 1.07 2.887 1.219 3.085.148.199 2.103 3.21 5.1 4.505.714.307 1.272.49 1.706.629.715.227 1.366.195 1.88.118.573-.085 1.767-.723 2.016-1.42.25-.697.25-1.294.175-1.42-.074-.126-.271-.199-.611-.369z"/></svg>',
    telegram: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.146l-2.103 9.917c-.159.704-.577.878-1.167.548l-3.21-2.365-1.549 1.49c-.171.171-.315.315-.644.315l.23-3.267 5.945-5.371c.259-.229-.056-.356-.403-.122l-7.346 4.625-3.166-.991c-.689-.215-.703-.689.143-.991l12.378-4.771c.573-.207 1.074.135.89 1.011z"/></svg>',
    reddit: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.285-1.84.746-2.031-1.454-4.82-2.39-7.896-2.484l1.352-6.353 4.429.933c.007.741.613 1.34 1.364 1.34 1.459 0 2.646-1.187 2.646-2.646 0-1.459-1.187-2.645-2.646-2.645-.961 0-1.801.516-2.27 1.29l-4.965-1.046c-.244-.052-.486.107-.54.348l-1.554 7.303c-3.134.053-5.986.997-8.061 2.476-.475-.453-1.121-.734-1.831-.734-1.464 0-2.657 1.193-2.657 2.657 0 1.026.587 1.916 1.442 2.365-.067.381-.103.77-.103 1.164 0 4.13 4.857 7.491 10.831 7.491 5.974 0 10.831-3.361 10.831-7.491 0-.387-.035-.769-.1-1.141.879-.444 1.482-1.352 1.482-2.399zm-16.711 3.125c0-1.054.858-1.912 1.912-1.912s1.912.858 1.912 1.912-.858 1.912-1.912 1.912-1.912-.858-1.912-1.912zm9.155 4.393c-.927.927-2.673 1.002-3.444 1.002-.771 0-2.518-.075-3.444-1.002-.131-.131-.131-.345 0-.476.131-.131.344-.131.475 0 .708.708 2.067.818 2.969.818s2.261-.11 2.969-.818c.131-.131.344-.131.475 0 .131.131.131.344 0 .476zm-.124-2.481c-1.054 0-1.912-.858-1.912-1.912s.858-1.912 1.912-1.912 1.912.858 1.912 1.912-.858 1.912-1.912 1.912z"/></svg>',
    email: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/></svg>',
    copy: '<svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M14.851 11.923c-.179-.18-.469-.18-.649 0l-2.41 2.41c-.179.18-.179.469 0 .649.18.179.469.179.649 0l1.625-1.625v4.545c0 .254.206.46.46.46s.46-.206.46-.46v-4.545l1.625 1.625c.18.179.469.179.649 0 .179-.18.179-.469 0-.649l-2.41-2.41zm6.918-6.19c-.18-.179-.469-.179-.649 0l-2.41 2.41c-.179.18-.179.469 0 .649.18.179.469.179.649 0l1.625-1.625v4.545c0 .254.206.46.46.46s.46-.206.46-.46v-4.545l1.625 1.625c.18.179.469.179.649 0 .179-.18.179-.469 0-.649l-2.41-2.41z"/></svg>',
  };

  section.innerHTML = `
    <h2>Share this post</h2>
    <div class="blog-share-actions">
      <a class="blog-share-link share-linkedin" aria-label="Share on LinkedIn" title="Share on LinkedIn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}">${icons.linkedin}</a>
      <a class="blog-share-link share-x" aria-label="Share on X" title="Share on X" target="_blank" rel="noopener noreferrer" href="https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}">${icons.x}</a>
      <a class="blog-share-link share-facebook" aria-label="Share on Facebook" title="Share on Facebook" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}">${icons.facebook}</a>
      <a class="blog-share-link share-whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp" target="_blank" rel="noopener noreferrer" href="https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}">${icons.whatsapp}</a>
      <a class="blog-share-link share-telegram" aria-label="Share on Telegram" title="Share on Telegram" target="_blank" rel="noopener noreferrer" href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}">${icons.telegram}</a>
      <a class="blog-share-link share-reddit" aria-label="Share on Reddit" title="Share on Reddit" target="_blank" rel="noopener noreferrer" href="https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}">${icons.reddit}</a>
      <a class="blog-share-link share-email" aria-label="Share by email" title="Share by email" href="mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}">${icons.email}</a>
      <button type="button" class="blog-share-copy share-copy" aria-label="Copy link" title="Copy link" data-share-copy data-url="${pageUrl}">
        <svg class="blog-share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </button>
    </div>`;
  section.dataset.rendered = "true";

  const copyButton = section.querySelector("[data-share-copy]");
  if (copyButton) {
    copyButton.onclick = async () => {
      try {
        await copyText(pageUrl);
        const originalContent = copyButton.innerHTML;
        copyButton.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        copyButton.classList.add("is-copied");
        setTimeout(() => {
          copyButton.innerHTML = originalContent;
          copyButton.classList.remove("is-copied");
        }, 2000);
      } catch (err) {
        console.error("Copy failed", err);
      }
    };
  }
}

function initializeShareActions() {
  const shareContainer = document.getElementById("blog-share");
  const floatingShare = document.querySelector(".floating-share");
  
  if (shareContainer && !shareContainer.dataset.rendered) {
    renderShareActions();
  }

  if (floatingShare) {
    const trigger = floatingShare.querySelector(".floating-share-trigger");
    const menu = floatingShare.querySelector(".floating-share-menu");

    if (trigger && !trigger.dataset.bound) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        
        if (navigator.share && window.innerWidth < 768) {
          navigator.share({
            title: document.title,
            text: document.querySelector('meta[name="description"]')?.content || "",
            url: window.location.href
          }).catch(err => console.log("Share failed", err));
          return;
        }

        floatingShare.classList.toggle("is-active");
      });
      trigger.dataset.bound = "true";
    }

    if (!floatingShare.dataset.docBound) {
      document.addEventListener("click", () => {
        floatingShare.classList.remove("is-active");
      });
      floatingShare.dataset.docBound = "true";
    }

    if (menu && !menu.dataset.bound) {
      menu.addEventListener("click", (e) => e.stopPropagation());
      menu.dataset.bound = "true";
    }
  }

  // Handle the copy buttons that might be in the floating menu
  document.querySelectorAll("[data-share-copy]").forEach(btn => {
    if (btn.dataset.bound) return;
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url") || window.location.href;
      try {
        await copyText(url);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied!</span>`;
        btn.style.color = "#27c93f";
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.style.color = "";
        }, 2000);
      } catch (err) {
        console.error("Copy failed", err);
      }
    });
    btn.dataset.bound = "true";
  });
}
window.renderShareActions = renderShareActions;

function initializeImageModal(container) {
  const modal = document.getElementById("blog-image-modal");
  if (!modal) return;

  const modalImg = modal.querySelector("img");
  const modalCaption = modal.querySelector(".blog-image-caption");
  const modalLoader = modal.querySelector(".blog-image-loader");
  const modalBody = modal.querySelector(".blog-image-modal-body");

  container.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", () => {
      modalImg.onload = null;
      modalImg.onerror = null;

      modalImg.classList.remove("is-ready");
      modalCaption.classList.remove("is-visible");

      // Calculate size
      const naturalW = img.naturalWidth || 800;
      const naturalH = img.naturalHeight || 600;
      const aspect = naturalW / naturalH;
      const winW = window.innerWidth * 0.9;
      const winH = window.innerHeight * 0.8;

      let renderW = naturalW;
      let renderH = naturalH;

      if (renderW > winW) {
        renderW = winW;
        renderH = renderW / aspect;
      }
      if (renderH > winH) {
        renderH = winH;
        renderW = renderH * aspect;
      }

      modalBody.style.setProperty("--media-w", `${renderW}px`);
      modalBody.style.setProperty("--media-h", `${renderH}px`);

      modalLoader.classList.add("is-active");

      modalImg.onload = () => {
        modalImg.classList.add("is-ready");
        modalLoader.classList.remove("is-active");
        if (modalCaption.textContent.trim()) {
          modalCaption.classList.add("is-visible");
        }
      };

      modalImg.src = img.src;
      modalCaption.textContent = img.alt || "";
      modal.showModal();
    });
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-blog-image-close]")) {
      if (modal.dataset.closing === "true") return;

      modal.dataset.closing = "true";
      modal.classList.add("is-closing");

      setTimeout(() => {
        modal.close();
        modal.classList.remove("is-closing");
        modal.dataset.closing = "false";
      }, 190);
    }
  });
}

function initializeMermaidModal(container) {
  const modal = document.getElementById("blog-mermaid-modal");
  const modalContainer = document.getElementById("blog-mermaid-modal-container");
  if (!modal || !modalContainer) return;

  container.querySelectorAll(".mermaid").forEach((mermaidDiv) => {
    // Make the diagram feel interactive
    mermaidDiv.style.cursor = "zoom-in";
    mermaidDiv.title = "Click to view high-accessibility diagram";

    mermaidDiv.addEventListener("click", () => {
      // Clear previous content
      modalContainer.innerHTML = "";

      // Clone the SVG
      const svg = mermaidDiv.querySelector("svg");
      if (!svg) return;

      const clonedSvg = svg.cloneNode(true);
      
      // Ensure the cloned SVG is responsive within the modal
      clonedSvg.setAttribute("width", "100%");
      clonedSvg.setAttribute("height", "auto");
      clonedSvg.style.maxWidth = "100%";
      clonedSvg.style.height = "auto";
      
      // Accessibility: Ensure it's read-only and has proper labels
      clonedSvg.setAttribute("role", "img");
      clonedSvg.setAttribute("aria-label", "High-contrast diagram view");
      
      modalContainer.appendChild(clonedSvg);
      modal.showModal();
    });
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-blog-mermaid-close]")) {
      if (modal.dataset.closing === "true") return;

      modal.dataset.closing = "true";
      modal.classList.add("is-closing");

      setTimeout(() => {
        modal.close();
        modal.classList.remove("is-closing");
        modal.dataset.closing = "false";
      }, 190);
    }
  });
}

function initTocScroll(toc) {
  const links = [...toc.querySelectorAll("a")];
  if (!links.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          const active = links.find((l) => l.getAttribute("href") === "#" + e.target.id);
          if (active) active.classList.add("active");
        }
      });
    },
    { rootMargin: "-60px 0px -70% 0px" }
  );

  document.querySelectorAll("h2[id], h3[id]").forEach((h) => obs.observe(h));
}

function initializePageFeatures() {
  initializeThemeToggle();
  initializeMobileNavigation();
  initializeHomepageRecentBlogs();
  initializeBlogsPage();
  initializeProjectCarousels();
  initializePredictivePrefetch();
  initializeBlogPostFeatures();
}

const PREFETCH_CACHE = new Set();

function prefetchPage(url) {
  try {
    const destination = new URL(url, window.location.href);
    const path = normalizePath(destination.pathname);
    if (PREFETCH_CACHE.has(path)) {
      return;
    }

    PREFETCH_CACHE.add(path);
    fetch(destination.href, {
      headers: {
        "X-Requested-With": "spa-navigation",
      },
    }).catch(() => {
      PREFETCH_CACHE.delete(path);
    });
  } catch {
    // ignore
  }
}

function initializePredictivePrefetch() {
  document.querySelectorAll("a").forEach((link) => {
    if (link.dataset.prefetchBound === "true" || !isInternalNavigableLink(link)) {
      return;
    }

    link.addEventListener(
      "mouseenter",
      () => {
        prefetchPage(link.href);
      },
      { once: true }
    );
    link.dataset.prefetchBound = "true";
  });
}

function syncHead(nextDocument) {
  // Update title
  document.title = nextDocument.title || document.title;

  // Update meta tags and links (canonical, etc.)
  const currentHead = document.head;

  // Tags we want to synchronize
  const syncSelectors = [
    'meta[name="description"]',
    'meta[name="keywords"]',
    'meta[name="robots"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'link[rel="canonical"]',
    'script[id="post-schema"]',
    'link[id^="hljs-theme-"]'
  ];

  syncSelectors.forEach((selector) => {
    const nextEl = nextDocument.head.querySelector(selector);
    const currentEl = currentHead.querySelector(selector);

    if (nextEl) {
      if (currentEl) {
        // Only replace if content/href changed to avoid flicker or unnecessary DOM ops
        if (
          nextEl.tagName === "META" &&
          currentEl.getAttribute("content") !== nextEl.getAttribute("content")
        ) {
          currentEl.setAttribute("content", nextEl.getAttribute("content"));
        } else if (
          nextEl.tagName === "LINK" &&
          (currentEl.getAttribute("href") !== nextEl.getAttribute("href") ||
           currentEl.hasAttribute("disabled") !== nextEl.hasAttribute("disabled"))
        ) {
          currentEl.setAttribute("href", nextEl.getAttribute("href"));
          // Handle disabled state for hljs themes
          if (nextEl.hasAttribute("disabled")) {
            currentEl.disabled = true;
            currentEl.setAttribute("disabled", "");
          } else {
            currentEl.disabled = false;
            currentEl.removeAttribute("disabled");
          }
        } else if (nextEl.tagName === "SCRIPT") {
          currentEl.replaceWith(nextEl.cloneNode(true));
        }
      } else {
        currentHead.appendChild(nextEl.cloneNode(true));
      }
    }
  });

  // Handle new scripts (like highlight.js if not present)
  nextDocument.head.querySelectorAll("script[src]").forEach((nextScript) => {
    const src = nextScript.getAttribute("src");
    if (!currentHead.querySelector(`script[src="${src}"]`)) {
      const newScript = document.createElement("script");
      Array.from(nextScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value),
      );
      currentHead.appendChild(newScript);
    }
  });
}

function isInternalNavigableLink(link) {
  if (!link || !link.href) {
    return false;
  }

  try {
    const target = new URL(link.href, window.location.href);
    const normalizedPath = normalizePath(target.pathname);
    if (normalizedPath === "blog.html" && target.searchParams.get("post")) {
      return false;
    }
    // Allow posts/*.html but ensure it's handled as an internal link
    if (normalizedPath.startsWith("posts/") && normalizedPath.endsWith(".html")) {
      return true;
    }
  } catch {
    // fall through for non-standard href values
  }

  if (link.hash && link.pathname === window.location.pathname && link.search === window.location.search) {
    return false;
  }

  if (link.target === "_blank" || link.hasAttribute("download")) {
    return false;
  }

  if (link.origin !== window.location.origin) {
    return false;
  }

  if (link.protocol !== "http:" && link.protocol !== "https:") {
    return false;
  }

  return normalizePath(link.pathname).endsWith(".html");
}

async function navigateTo(url, options = {}) {
  const { replace = false } = options;
  const destination = new URL(url, window.location.href);

  if (destination.pathname === window.location.pathname && destination.search === window.location.search) {
    setActivePage(destination.pathname);
    return;
  }

  document.body.classList.add("is-navigating");

  try {
    const response = await fetch(destination.href, {
      headers: {
        "X-Requested-With": "spa-navigation",
      },
    });

    if (!response.ok) {
      window.location.href = destination.href;
      return;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const nextDocument = parser.parseFromString(html, "text/html");
    const nextMain = nextDocument.querySelector("main[data-router-view]");

    if (!nextMain) {
      window.location.href = destination.href;
      return;
    }

    const currentMain = document.querySelector("main[data-router-view]");
    if (!currentMain) {
      window.location.href = destination.href;
      return;
    }

    if (document.startViewTransition) {
      await document.startViewTransition(() => {
        currentMain.replaceWith(nextMain);
      }).finished;
    } else {
      currentMain.replaceWith(nextMain);
    }

    syncHead(nextDocument);

    if (replace) {
      history.replaceState({}, "", destination.href);
    } else {
      history.pushState({}, "", destination.href);
    }

    setActivePage(destination.pathname);
    initializePageFeatures();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    window.location.href = destination.href;
  } finally {
    document.body.classList.remove("is-navigating");
  }
}

document.addEventListener("click", (event) => {
  const scheduleTrigger = event.target.closest("[data-schedule-open]");
  if (scheduleTrigger) {
    event.preventDefault();
    openSchedulerModal();
    return;
  }

  const scheduleCloseTrigger = event.target.closest("[data-schedule-close]");
  if (scheduleCloseTrigger) {
    event.preventDefault();
    closeSchedulerModal();
    return;
  }

  if (event.defaultPrevented || event.button !== 0) {
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const link = event.target.closest("a");
  if (!link || !isInternalNavigableLink(link)) {
    return;
  }

  event.preventDefault();
  navigateTo(link.href);
});

const schedulerModal = getSchedulerModal();
if (schedulerModal) {
  schedulerModal.addEventListener("click", (event) => {
    if (event.target === schedulerModal) {
      closeSchedulerModal();
    }
  });

  schedulerModal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });
}

window.addEventListener("popstate", () => {
  navigateTo(window.location.href, { replace: true });
});

setActivePage();
initializeTheme();
initializePageFeatures();

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

/**
 * Copy code to clipboard from the premium code blocks
 */
function copyCode(button) {
  const wrapper = button.closest(".code-block-shell") || button.closest(".code-block-wrapper");
  if (!wrapper) return;
  
  const codeEl = wrapper.querySelector("code");
  if (!codeEl) return;
  
  const text = codeEl.innerText;
  const originalContent = button.innerHTML;

  copyText(text).then(() => {
    button.classList.add("is-copied");
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>Copied!</span>
    `;
    
    setTimeout(() => {
      button.classList.remove("is-copied");
      button.innerHTML = originalContent;
      if (window.lucide) window.lucide.createIcons();
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy code: ", err);
  });
}
window.copyCode = copyCode;