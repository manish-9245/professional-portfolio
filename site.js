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
    lightTheme.setAttribute("disabled", isDark);
  }
  if (darkTheme) {
    darkTheme.disabled = !isDark;
    darkTheme.setAttribute("disabled", !isDark);
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

  const response = await fetch("/posts/index.json");
  if (!response.ok) {
    throw new Error("Failed to load blog index");
  }

  const posts = await response.json();
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
    javascript: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm12.525 10.931c-.131-.412-.422-.722-.843-.881l-.816-.312c-.29-.112-.45-.216-.45-.403 0-.15.113-.3.394-.3.216 0 .393.075.543.216l.46-.47c-.188-.178-.45-.3-.76-.3-.572 0-.965.347-.965.862 0 .544.337.816.852.994l.816.319c.272.094.403.225.403.422 0 .197-.16.347-.46.347-.28 0-.524-.131-.693-.31l-.488.45c.234.28.618.45 1.05.45.694 0 1.125-.384 1.125-1.022v-.063zM10.82 11.23h-.638v3.45c0 .76-.328 1.171-.994 1.171-.356 0-.6-.103-.768-.262l-.375.46c.216.206.581.356 1.05.356.966 0 1.416-.544 1.416-1.575V11.23h.309z"/></svg>`,
    js: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm12.525 10.931c-.131-.412-.422-.722-.843-.881l-.816-.312c-.29-.112-.45-.216-.45-.403 0-.15.113-.3.394-.3.216 0 .393.075.543.216l.46-.47c-.188-.178-.45-.3-.76-.3-.572 0-.965.347-.965.862 0 .544.337.816.852.994l.816.319c.272.094.403.225.403.422 0 .197-.16.347-.46.347-.28 0-.524-.131-.693-.31l-.488.45c.234.28.618.45 1.05.45.694 0 1.125-.384 1.125-1.022v-.063zM10.82 11.23h-.638v3.45c0 .76-.328 1.171-.994 1.171-.356 0-.6-.103-.768-.262l-.375.46c.216.206.581.356 1.05.356.966 0 1.416-.544 1.416-1.575V11.23h.309z"/></svg>`,
    python: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.758 0c-2.486 0-2.333 1.077-2.333 1.077l.006 1.12h4.636V3.82c0 0 .092 1.066-1.048 1.066h-4.66s-2.32-.016-2.32 2.275v1.657h2.245V6.756s.016-1.033 1.067-1.033h4.631s1.078-.027 1.078-1.038v-3.6s.035-1.085-2.34-1.085h-1.012zM7.55 1.554a.65.65 0 110 1.3.65.65 0 010-1.3zm4.686 7.697c2.486 0 2.333-1.077 2.333-1.077l-.006-1.12H9.927V5.429s-.092-1.066 1.048-1.066h4.66s2.32.016 2.32-2.275V.431H15.71v2.062s-.016 1.033-1.067 1.033H10.012s-1.078.027-1.078 1.038v3.6s-.035 1.085 2.34 1.085h1.012zM16.45 7.146a.65.65 0 110-1.3.65.65 0 010 1.3z"/></svg>`,
    java: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.38 18.23s-.73-.13-.73-.56c0-.36.32-.56.32-.56.63-.35 1.95-.53 3.01-.62.33-.03.66-.05 1-.07-.3-.15-.59-.3-.89-.47-.46-.26-1-.57-1.44-.95-1.22-1.08-1.4-2.44-.81-3.52 0 0 .15-.26.41-.53-.29-.15-.5-.33-.67-.53-.45-.52-.39-1.13-.15-1.57.17-.32.47-.63.92-.93.38-.25.84-.48 1.39-.7C3.96 8.52 3.1 9.4 3.1 10.43c0 1.52 1.41 2.45 2.76 3.17.65.34 1.34.64 2 .88-.34-.47-.64-.98-.89-1.52-.45-1-.58-2.06-.37-3.08l.05-.22c-.41.13-.77.29-1.07.48-.6.38-.89.84-.89 1.4 0 .78.58 1.48 1.57 1.99.3.16.63.3.99.43.34-.14.67-.32.99-.54 1.14-.79 1.77-1.87 1.77-3.03 0-.61-.16-1.18-.47-1.7-.17-.28-.39-.53-.65-.75-.3-.26-.64-.46-1.02-.6 1.74.22 3.17 1.25 3.17 3.32 0 .96-.34 1.88-1.01 2.7l-.37.45c.87.18 1.63.45 2.22.84 1.07.71 1.09 1.63.58 2.26-.26.31-.63.56-1.11.75-.48.18-1.06.31-1.72.37.66.1 1.25.26 1.75.48.56.24.96.56 1.2.95.28.45.24.95-.12 1.34-.35.38-.88.63-1.55.75-.68.12-1.51.15-2.45.08-.94-.07-1.84-.22-2.58-.45-1.54-.48-2.07-1.29-2.07-2.07 0-.41.14-.77.41-1.07.28-.31.67-.56 1.15-.75.47-.19.98-.31 1.5-.37-.58-.09-1.1-.25-1.55-.47zm6.75-2.34c-.66-.23-1.34-.52-1.99-.86-1.08-.58-2.21-1.33-2.21-2.59 0-.81.67-1.52 1.59-1.89.5-.2 1.05-.29 1.57-.29.61 0 1.18.12 1.66.36.4.2.73.47.95.8.27.42.4.91.4 1.43 0 1.2-.69 2.14-1.97 3.04z"/></svg>`,
    html: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>`,
    css: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>`,
    shell: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
    bash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
    json: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline><line x1="12" y1="2" x2="12" y2="22"></line></svg>`,
  };
  return icons[l] || `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
}

function initializeCodeCopy(container) {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement && pre.parentElement.classList.contains("code-block-shell")) {
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
      <span class="code-window-dot close" title="Close" aria-hidden="true"></span>
      <span class="code-window-dot minimize" title="Minimize" aria-hidden="true"></span>
      <span class="code-window-dot maximize" title="Maximize" aria-hidden="true"></span>`;

    const langName = code.getAttribute("data-lang") || "";
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
      modal.close();
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