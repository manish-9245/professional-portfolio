---
title: "ProgrammerSkool"
title_accent: "Skool"
kicker: "Project · Learning"
tagline: "A focused learning platform that puts a coding playlist and a live C++ editor side by side, compiling against a real online judge instead of just displaying code."
description: "A split-screen playlist-plus-editor tool for following C++ tutorials without tab-switching - and the parallel React rewrite sitting unfinished next to the original static version."
role: "Solo builder"
status: "Live demo"
type: "Learning platform"
tags: "Frontend, Education"
date: "2025-06-07"
image: "/image/optimized/project-programmerskool.webp"
repo: "https://github.com/manish-9245/Programmerskool.io"
links: "Live demo|https://programmerskool-io.vercel.app/"
tech: "Static version|HTML, jQuery, CodeMirror 5; React rewrite (in progress)|Vite, React 19, CodeMirror 6, Tailwind CSS 4"
application_category: "EducationApplication"
---
Following a coding tutorial usually means two windows and constant alt-tabbing: the video in one, the editor in the other, losing your place in both every time you switch. ProgrammerSkool's whole premise is refusing that trade - a YouTube playlist and a real, compiling C++ editor live in the same view, and neither one is a toy.

## The compile step is real

The editor isn't just a syntax-highlighted textarea - "Compile and Run" actually sends your code to [Wandbox](https://wandbox.org), a free public compilation API, and prints back whatever the compiler actually says:

```js
// script.js (static version, via jQuery)
$.ajax({
  url: "https://wandbox.org/api/compile.json",
  method: "POST",
  data: JSON.stringify({
    code, compiler: "gcc-head", stdin: "",
    options: "-O2 -Wall -std=c++17 -pedantic-errors",
  }),
});
```

That's a genuine limitation worth naming plainly: there's no backend of its own here, no sandboxed execution owned by this project - if Wandbox is down or rate-limits the request, compiling stops working, and neither version of the app has retry logic or a timeout beyond a generic `catch`. For a learning tool that's a reasonable trade against standing up and securing your own code-execution sandbox, but it's a real dependency, not an implementation detail.

## Two implementations of the same idea

The repository is really two separate builds of the same concept sitting side by side, and it's worth being upfront about that rather than describing only the polished half. The root `index.html` is a plain static site - no bundler, no `package.json` - built on jQuery 3.6.0 and CodeMirror 5, with a hand-rolled draggable split panel:

```js
// script.js
const bar = document.querySelector(".split__bar");
const left = document.querySelector(".split__left");
let mouse_is_down = false;
bar.addEventListener("mousedown", () => { mouse_is_down = true; });
document.addEventListener("mousemove", (e) => {
  if (!mouse_is_down) return;
  left.style.width = `${e.clientX}px`;
});
document.addEventListener("mouseup", () => { mouse_is_down = false; });
```

Sitting in `programmerskool-vite/` is a from-scratch React rewrite: Vite, React 19, CodeMirror 6 via `@uiw/react-codemirror`, Tailwind 4, shadcn-style Radix components. It goes further than the original - a resizable, draggable video window with viewport-boundary clamping, a `requestAnimationFrame`-throttled divider between editor and output with touch support for mobile, `fetch` instead of jQuery for the same Wandbox call. But it isn't wired into the root site at all; there's no build step that produces or links to it. It's an unfinished parallel version, not a refactor-in-progress with a clear migration path yet - the kind of honest, half-done state a lot of side projects actually live in.

## Extracting a playlist ID two different ways

Both versions solve the same small problem - pull a playlist ID out of a pasted YouTube URL - and solve it with two different regexes, which is itself a small tell that the React version was written independently rather than ported line-by-line from the original:

```js
// static version - lookbehind
const id = url.match(/(?<=list=)[^&/?]+/)[0];

// React version - capture group
const id = url.match(/[?&]list=([^&]+)/)[1];
```

Same result, different style - a reminder that "rewrite this in React" rarely means "translate the same logic," it usually means someone re-derives the logic from scratch against the same requirement.

## Running it

The root site needs nothing beyond opening `index.html` - no build step, no dependencies to install. The in-progress rewrite has its own `package.json` and a standard Vite `dev` / `build` / `preview` set, runnable independently from `programmerskool-vite/`.
