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

  const response = await fetch("./posts/index.json");
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

  return `
    <article class="panel blog-card">
      <p class="blog-card-meta">
        <span>${post.displayDate}</span>
        <span class="blog-card-dot" aria-hidden="true">•</span>
        <span class="blog-chip">${tag}</span>
      </p>
      <h2 class="blog-card-title"><a href="./blog.html?post=${slug}">${post.title}</a></h2>
      <p class="blog-card-desc">${post.description}</p>
      <div class="actions-row">
        <a href="./blog.html?post=${slug}">Read article →</a>
      </div>
    </article>`;
}

function createFeaturedBlogCard(post) {
  const slug = encodeURIComponent(post.slug);
  const tag = getBlogTag(post.title);

  return `
    <article class="panel blog-card blog-card--featured">
      <p class="blog-card-meta">
        <span>Latest</span>
        <span class="blog-card-dot" aria-hidden="true">•</span>
        <span>${post.displayDate}</span>
        <span class="blog-card-dot" aria-hidden="true">•</span>
        <span class="blog-chip">${tag}</span>
      </p>
      <h2 class="blog-card-title"><a href="./blog.html?post=${slug}">${post.title}</a></h2>
      <p class="blog-card-desc">${post.description}</p>
      <div class="actions-row">
        <a href="./blog.html?post=${slug}">Read full article →</a>
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

function initializePageFeatures() {
  initializeThemeToggle();
  initializeMobileNavigation();
  initializeBlogsPage();
  initializeProjectCarousels();
}

function isInternalNavigableLink(link) {
  if (!link || !link.href) {
    return false;
  }

  try {
    const target = new URL(link.href, window.location.href);
    if (normalizePath(target.pathname) === "blog.html" && target.searchParams.get("post")) {
      return false;
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

    document.title = nextDocument.title || document.title;

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